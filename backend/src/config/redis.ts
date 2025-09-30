import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class RedisClient {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        connectTimeout: 60000,
      },
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.on('connect', () => {
      logger.info('🔗 Conectando ao Redis...');
    });

    this.client.on('ready', () => {
      logger.info('✅ Redis conectado e pronto para uso');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('❌ Erro no Redis:', error);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.info('🔌 Conexão com Redis encerrada');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('🔄 Reconectando ao Redis...');
    });
  }

  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      logger.error('❌ Erro ao conectar com Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
      }
    } catch (error) {
      logger.error('❌ Erro ao desconectar do Redis:', error);
      throw error;
    }
  }

  // Métodos de cache
  async set(key: string, value: string | object, expireInSeconds?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      
      if (expireInSeconds) {
        await this.client.setEx(key, expireInSeconds, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      logger.error(`❌ Erro ao definir cache para chave ${key}:`, error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error(`❌ Erro ao obter cache para chave ${key}:`, error);
      return null;
    }
  }

  async getObject<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`❌ Erro ao obter objeto do cache para chave ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`❌ Erro ao deletar cache para chave ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Erro ao verificar existência da chave ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      logger.error(`❌ Erro ao definir expiração para chave ${key}:`, error);
      throw error;
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.client.flushAll();
      logger.info('🗑️ Cache Redis limpo completamente');
    } catch (error) {
      logger.error('❌ Erro ao limpar cache Redis:', error);
      throw error;
    }
  }

  // Métodos para sessões
  async setSession(sessionId: string, sessionData: object, expireInSeconds: number = 86400): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, sessionData, expireInSeconds);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return await this.getObject<T>(key);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  // Verificar saúde do Redis
  async checkHealth(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('❌ Falha no health check do Redis:', error);
      return false;
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}

// Instância singleton
const redisClient = new RedisClient();

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redisClient.disconnect();
}

export { redisClient };
export default redisClient;
