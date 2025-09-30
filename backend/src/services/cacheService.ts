import redisClient from '../config/redis';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number; // Time to live em segundos
}

export class CacheService {
  private static instance: CacheService;
  private readonly defaultTTL = 3600; // 1 hora

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Definir valor no cache
  public async set(
    key: string, 
    value: any, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const ttl = options.ttl || this.defaultTTL;
      let serializedValue = JSON.stringify(value);

      // Definir valor com TTL
      await redisClient.set(key, serializedValue, ttl);

      logger.debug('Cache set:', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Erro ao definir cache:', { key, error: error.message });
      return false;
    }
  }

  // Obter valor do cache
  public async get<T = any>(key: string): Promise<T | null> {
    try {
      let value = await redisClient.get(key);
      
      if (value === null) {
        logger.debug('Cache miss:', { key });
        return null;
      }

      // Deserializar valor
      let parsedValue: T;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // Se não conseguir fazer parse, retornar como string
        parsedValue = value as T;
      }

      logger.debug('Cache hit:', { key });
      return parsedValue;
    } catch (error) {
      logger.error('Erro ao obter cache:', { key, error: error.message });
      return null;
    }
  }

  // Deletar chave do cache
  public async delete(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      logger.debug('Cache deleted:', { key });
      return true;
    } catch (error) {
      logger.error('Erro ao deletar cache:', { key, error: error.message });
      return false;
    }
  }

  // Verificar se chave existe
  public async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result;
    } catch (error) {
      logger.error('Erro ao verificar existência no cache:', { key, error: error.message });
      return false;
    }
  }

  // Limpar todo o cache
  public async flush(): Promise<boolean> {
    try {
      await redisClient.flushAll();
      logger.info('Cache completamente limpo');
      return true;
    } catch (error) {
      logger.error('Erro ao limpar cache:', error);
      return false;
    }
  }

  // Obter estatísticas do cache
  public async getStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
    memoryUsage: number;
  }> {
    try {
      const hits = parseInt(await redisClient.get('cache:hits') || '0');
      const misses = parseInt(await redisClient.get('cache:misses') || '0');
      const total = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      return {
        hits,
        misses,
        hitRate: Math.round(hitRate * 100) / 100,
        totalKeys: 0, // Simplificado
        memoryUsage: 0 // Simplificado
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas do cache:', error);
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

// Instância singleton
const cacheService = CacheService.getInstance();
export default cacheService;
export { cacheService };
