"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimit = exports.clearLoginFailures = exports.incrementLoginFailure = exports.publicApiRateLimit = exports.adminActionRateLimit = exports.loginFailureRateLimit = exports.loginRateLimit = exports.registrationRateLimit = exports.cpfValidationRateLimit = exports.RateLimiter = void 0;
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const auditService_1 = __importDefault(require("../services/auditService"));
class RateLimiter {
    constructor(config) {
        this.config = {
            keyGenerator: (req) => req.ip || 'unknown',
            message: 'Muitas tentativas. Tente novamente mais tarde.',
            ...config
        };
        this.auditService = auditService_1.default.getInstance();
    }
    middleware() {
        return async (req, res, next) => {
            try {
                const key = this.generateKey(req);
                const current = await this.getCurrentCount(key);
                if (current >= this.config.maxRequests) {
                    await this.auditService.logRateLimit(req, req.route?.path || req.path, this.config.maxRequests, this.config.windowMs);
                    logger_1.logger.warn('Rate limit exceeded', {
                        ip: req.ip,
                        key,
                        current,
                        limit: this.config.maxRequests,
                        windowMs: this.config.windowMs,
                        path: req.path
                    });
                    return res.status(429).json({
                        success: false,
                        error: {
                            code: 'RATE_LIMIT_EXCEEDED',
                            message: this.config.message,
                            type: 'RateLimitError'
                        },
                        retryAfter: Math.ceil(this.config.windowMs / 1000),
                        timestamp: new Date().toISOString(),
                        path: req.path,
                        method: req.method
                    });
                }
                await this.incrementCounter(key);
                res.set({
                    'X-RateLimit-Limit': this.config.maxRequests.toString(),
                    'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - current - 1).toString(),
                    'X-RateLimit-Reset': new Date(Date.now() + this.config.windowMs).toISOString()
                });
                next();
            }
            catch (error) {
                logger_1.logger.error('Rate limiting error', error);
                next();
            }
        };
    }
    generateKey(req) {
        const baseKey = this.config.keyGenerator(req);
        const route = req.route?.path || req.path;
        return `rate_limit:${route}:${baseKey}`;
    }
    async getCurrentCount(key) {
        try {
            const count = await redis_1.redisClient.get(key);
            return count ? parseInt(count, 10) : 0;
        }
        catch (error) {
            logger_1.logger.error('Error getting rate limit count', error);
            return 0;
        }
    }
    async incrementCounter(key) {
        try {
            await redis_1.redisClient.incr(key);
            await redis_1.redisClient.expire(key, Math.ceil(this.config.windowMs / 1000));
        }
        catch (error) {
            logger_1.logger.error('Error incrementing rate limit counter', error);
        }
    }
    async resetCounter(identifier, route) {
        try {
            if (route) {
                const key = `rate_limit:${route}:${identifier}`;
                await redis_1.redisClient.del(key);
            }
            else {
                logger_1.logger.warn('Reset without route not implemented for security reasons');
            }
            logger_1.logger.info('Rate limit counter reset', { identifier, route });
        }
        catch (error) {
            logger_1.logger.error('Error resetting rate limit counter', error);
        }
    }
}
exports.RateLimiter = RateLimiter;
exports.cpfValidationRateLimit = new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    message: 'Muitas tentativas de validação de CPF. Tente novamente em 15 minutos.',
    keyGenerator: (req) => req.ip || 'unknown'
});
exports.registrationRateLimit = new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
    keyGenerator: (req) => req.ip || 'unknown'
});
exports.loginRateLimit = new RateLimiter({
    windowMs: 5 * 60 * 1000,
    maxRequests: 50,
    message: 'Muitas tentativas de login. Tente novamente em 5 minutos.',
    keyGenerator: (req) => req.ip || 'unknown'
});
exports.loginFailureRateLimit = new RateLimiter({
    windowMs: 10 * 60 * 1000,
    maxRequests: 3,
    message: 'Muitas tentativas de login com credenciais inválidas. Tente novamente em 10 minutos.',
    keyGenerator: (req) => `login_failures:${req.ip || 'unknown'}`
});
exports.adminActionRateLimit = new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 100,
    message: 'Muitas ações administrativas. Tente novamente em 1 hora.',
    keyGenerator: (req) => req.user?.id || req.ip || 'unknown'
});
exports.publicApiRateLimit = new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
    message: 'Limite de API excedido. Tente novamente em 1 hora.',
    keyGenerator: (req) => req.ip || 'unknown'
});
const incrementLoginFailure = async (ip) => {
    const key = `login_failures:${ip}`;
    try {
        const current = await redis_1.redisClient.get(key);
        const count = current ? parseInt(current) + 1 : 1;
        await redis_1.redisClient.set(key, count.toString(), 10 * 60);
    }
    catch (error) {
        console.warn('Erro ao incrementar contador de falhas de login:', error);
    }
};
exports.incrementLoginFailure = incrementLoginFailure;
const clearLoginFailures = async (ip) => {
    const key = `login_failures:${ip}`;
    try {
        await redis_1.redisClient.del(key);
    }
    catch (error) {
        console.warn('Erro ao limpar contador de falhas de login:', error);
    }
};
exports.clearLoginFailures = clearLoginFailures;
const createRateLimit = (config) => {
    const limiter = new RateLimiter(config);
    return limiter.middleware();
};
exports.createRateLimit = createRateLimit;
exports.default = RateLimiter;
//# sourceMappingURL=rateLimiting.js.map