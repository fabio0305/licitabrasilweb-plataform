"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.developmentDebug = exports.userRateLimit = exports.validateFrontendOrigin = exports.userContextMiddleware = exports.frontendErrorHandler = exports.frontendLogger = exports.paginationHeaders = exports.frontendIntegration = void 0;
const logger_1 = require("../utils/logger");
const frontendIntegration = (req, res, next) => {
    res.setHeader('X-API-Version', process.env.API_VERSION || 'v1');
    res.setHeader('X-Powered-By', 'LicitaBrasil-API');
    if (req.method === 'GET' && req.path.includes('/transparency/')) {
        res.setHeader('Cache-Control', 'public, max-age=300');
    }
    else if (req.method === 'GET' && req.path.includes('/dashboard')) {
        res.setHeader('Cache-Control', 'private, max-age=60');
    }
    else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page-Count, X-Current-Page');
    next();
};
exports.frontendIntegration = frontendIntegration;
const paginationHeaders = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && data.data && data.data.pagination) {
            const { total, totalPages, page } = data.data.pagination;
            res.setHeader('X-Total-Count', total.toString());
            res.setHeader('X-Page-Count', totalPages.toString());
            res.setHeader('X-Current-Page', page.toString());
        }
        return originalJson.call(this, data);
    };
    next();
};
exports.paginationHeaders = paginationHeaders;
const frontendLogger = (req, res, next) => {
    const startTime = Date.now();
    const userAgent = req.get('User-Agent') || 'Unknown';
    const origin = req.get('Origin') || req.get('Referer') || 'Unknown';
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent,
            origin,
            userId: req.user?.id || 'anonymous',
            userRole: req.user?.role || 'none'
        };
        if (res.statusCode >= 400) {
            logger_1.logger.warn('Frontend request error', logData);
        }
        else {
            logger_1.logger.info('Frontend request', logData);
        }
    });
    next();
};
exports.frontendLogger = frontendLogger;
const frontendErrorHandler = (err, req, res, next) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    logger_1.logger.error('Frontend error:', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
        userRole: req.user?.role
    });
    const errorResponse = {
        success: false,
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: err.message || 'Erro interno do servidor',
            type: err.constructor.name,
            ...(isDevelopment && { stack: err.stack, details: err })
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };
    let statusCode = 500;
    if (err.name === 'ValidationError' || err.code === 'VALIDATION_ERROR') {
        statusCode = 400;
    }
    else if (err.name === 'AuthenticationError' || err.code === 'AUTHENTICATION_ERROR') {
        statusCode = 401;
    }
    else if (err.name === 'AuthorizationError' || err.code === 'AUTHORIZATION_ERROR') {
        statusCode = 403;
    }
    else if (err.name === 'NotFoundError' || err.code === 'NOT_FOUND') {
        statusCode = 404;
    }
    else if (err.name === 'ConflictError' || err.code === 'CONFLICT') {
        statusCode = 409;
    }
    else if (err.code === 'RATE_LIMIT_EXCEEDED') {
        statusCode = 429;
    }
    res.status(statusCode).json(errorResponse);
};
exports.frontendErrorHandler = frontendErrorHandler;
const userContextMiddleware = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (req.user && data && data.success) {
            data.userContext = {
                id: req.user.id,
                role: req.user.role,
                permissions: req.user.permissions || [],
                timestamp: new Date().toISOString()
            };
        }
        return originalJson.call(this, data);
    };
    next();
};
exports.userContextMiddleware = userContextMiddleware;
const validateFrontendOrigin = (req, res, next) => {
    const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim());
    const origin = req.get('Origin');
    if (process.env.NODE_ENV === 'development') {
        if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            return next();
        }
    }
    if (!origin || !allowedOrigins.includes(origin)) {
        logger_1.logger.warn('Invalid frontend origin', { origin, allowedOrigins });
        return res.status(403).json({
            success: false,
            error: {
                code: 'INVALID_ORIGIN',
                message: 'Origem não autorizada'
            }
        });
    }
    next();
};
exports.validateFrontendOrigin = validateFrontendOrigin;
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    return (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const now = Date.now();
        for (const [key, value] of requests.entries()) {
            if (now > value.resetTime) {
                requests.delete(key);
            }
        }
        const userRequests = requests.get(userId);
        if (!userRequests) {
            requests.set(userId, { count: 1, resetTime: now + windowMs });
            return next();
        }
        if (userRequests.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Muitas requisições. Tente novamente em alguns minutos.',
                    retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
                }
            });
        }
        userRequests.count++;
        next();
    };
};
exports.userRateLimit = userRateLimit;
const developmentDebug = (req, res, next) => {
    if (process.env.NODE_ENV !== 'development') {
        return next();
    }
    const originalJson = res.json;
    res.json = function (data) {
        if (data && data.success) {
            data.debug = {
                timestamp: new Date().toISOString(),
                executionTime: Date.now() - req.startTime,
                memoryUsage: process.memoryUsage(),
                nodeVersion: process.version,
                environment: process.env.NODE_ENV
            };
        }
        return originalJson.call(this, data);
    };
    req.startTime = Date.now();
    next();
};
exports.developmentDebug = developmentDebug;
//# sourceMappingURL=frontend.js.map