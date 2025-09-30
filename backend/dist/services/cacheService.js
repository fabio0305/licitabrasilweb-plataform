"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = require("../utils/logger");
class CacheService {
    constructor() {
        this.defaultTTL = 3600;
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    async set(key, value, options = {}) {
        try {
            const ttl = options.ttl || this.defaultTTL;
            let serializedValue = JSON.stringify(value);
            await redis_1.default.set(key, serializedValue, ttl);
            logger_1.logger.debug('Cache set:', { key, ttl });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Erro ao definir cache:', { key, error: error.message });
            return false;
        }
    }
    async get(key) {
        try {
            let value = await redis_1.default.get(key);
            if (value === null) {
                logger_1.logger.debug('Cache miss:', { key });
                return null;
            }
            let parsedValue;
            try {
                parsedValue = JSON.parse(value);
            }
            catch {
                parsedValue = value;
            }
            logger_1.logger.debug('Cache hit:', { key });
            return parsedValue;
        }
        catch (error) {
            logger_1.logger.error('Erro ao obter cache:', { key, error: error.message });
            return null;
        }
    }
    async delete(key) {
        try {
            await redis_1.default.del(key);
            logger_1.logger.debug('Cache deleted:', { key });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Erro ao deletar cache:', { key, error: error.message });
            return false;
        }
    }
    async exists(key) {
        try {
            const result = await redis_1.default.exists(key);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Erro ao verificar existência no cache:', { key, error: error.message });
            return false;
        }
    }
    async flush() {
        try {
            await redis_1.default.flushAll();
            logger_1.logger.info('Cache completamente limpo');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Erro ao limpar cache:', error);
            return false;
        }
    }
    async getStats() {
        try {
            const hits = parseInt(await redis_1.default.get('cache:hits') || '0');
            const misses = parseInt(await redis_1.default.get('cache:misses') || '0');
            const total = hits + misses;
            const hitRate = total > 0 ? (hits / total) * 100 : 0;
            return {
                hits,
                misses,
                hitRate: Math.round(hitRate * 100) / 100,
                totalKeys: 0,
                memoryUsage: 0
            };
        }
        catch (error) {
            logger_1.logger.error('Erro ao obter estatísticas do cache:', error);
            return {
                hits: 0,
                misses: 0,
                hitRate: 0,
                totalKeys: 0,
                memoryUsage: 0
            };
        }
    }
}
exports.CacheService = CacheService;
const cacheService = CacheService.getInstance();
exports.cacheService = cacheService;
exports.default = cacheService;
//# sourceMappingURL=cacheService.js.map