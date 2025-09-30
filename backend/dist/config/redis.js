"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.connectRedis = connectRedis;
exports.disconnectRedis = disconnectRedis;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
class RedisClient {
    constructor() {
        this.isConnected = false;
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.client = (0, redis_1.createClient)({
            url: redisUrl,
            password: process.env.REDIS_PASSWORD || undefined,
            socket: {
                connectTimeout: 60000,
            },
        });
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.client.on('connect', () => {
            logger_1.logger.info('🔗 Conectando ao Redis...');
        });
        this.client.on('ready', () => {
            logger_1.logger.info('✅ Redis conectado e pronto para uso');
            this.isConnected = true;
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('❌ Erro no Redis:', error);
            this.isConnected = false;
        });
        this.client.on('end', () => {
            logger_1.logger.info('🔌 Conexão com Redis encerrada');
            this.isConnected = false;
        });
        this.client.on('reconnecting', () => {
            logger_1.logger.info('🔄 Reconectando ao Redis...');
        });
    }
    async connect() {
        try {
            if (!this.isConnected) {
                await this.client.connect();
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao conectar com Redis:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.isConnected) {
                await this.client.disconnect();
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao desconectar do Redis:', error);
            throw error;
        }
    }
    async set(key, value, expireInSeconds) {
        try {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
            if (expireInSeconds) {
                await this.client.setEx(key, expireInSeconds, stringValue);
            }
            else {
                await this.client.set(key, stringValue);
            }
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao definir cache para chave ${key}:`, error);
            throw error;
        }
    }
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao obter cache para chave ${key}:`, error);
            return null;
        }
    }
    async getObject(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao obter objeto do cache para chave ${key}:`, error);
            return null;
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao deletar cache para chave ${key}:`, error);
            throw error;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao verificar existência da chave ${key}:`, error);
            return false;
        }
    }
    async expire(key, seconds) {
        try {
            await this.client.expire(key, seconds);
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao definir expiração para chave ${key}:`, error);
            throw error;
        }
    }
    async flushAll() {
        try {
            await this.client.flushAll();
            logger_1.logger.info('🗑️ Cache Redis limpo completamente');
        }
        catch (error) {
            logger_1.logger.error('❌ Erro ao limpar cache Redis:', error);
            throw error;
        }
    }
    async setSession(sessionId, sessionData, expireInSeconds = 86400) {
        const key = `session:${sessionId}`;
        await this.set(key, sessionData, expireInSeconds);
    }
    async getSession(sessionId) {
        const key = `session:${sessionId}`;
        return await this.getObject(key);
    }
    async deleteSession(sessionId) {
        const key = `session:${sessionId}`;
        await this.del(key);
    }
    async checkHealth() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('❌ Falha no health check do Redis:', error);
            return false;
        }
    }
    getClient() {
        return this.client;
    }
    isClientConnected() {
        return this.isConnected;
    }
}
const redisClient = new RedisClient();
exports.redisClient = redisClient;
async function connectRedis() {
    await redisClient.connect();
}
async function disconnectRedis() {
    await redisClient.disconnect();
}
exports.default = redisClient;
//# sourceMappingURL=redis.js.map