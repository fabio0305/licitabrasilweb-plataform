/**
 * Middleware de Rate Limiting usando Redis
 */

import { Request, Response, NextFunction } from 'express';
import { redisClient as redis } from '../config/redis';
import { logger } from '../utils/logger';
import AuditService from '../services/auditService';

export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Máximo de requests na janela
  keyGenerator?: (req: Request) => string; // Função para gerar chave única
  skipSuccessfulRequests?: boolean; // Se deve pular requests bem-sucedidos
  skipFailedRequests?: boolean; // Se deve pular requests que falharam
  message?: string; // Mensagem de erro customizada
}

export class RateLimiter {
  private config: RateLimitConfig;
  private auditService: AuditService;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => req.ip || 'unknown',
      message: 'Muitas tentativas. Tente novamente mais tarde.',
      ...config
    };
    this.auditService = AuditService.getInstance();
  }

  /**
   * Middleware de rate limiting
   */
  public middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.generateKey(req);
        const current = await this.getCurrentCount(key);
        
        if (current >= this.config.maxRequests) {
          // Log da violação de rate limit
          await this.auditService.logRateLimit(
            req,
            req.route?.path || req.path,
            this.config.maxRequests,
            this.config.windowMs
          );

          logger.warn('Rate limit exceeded', {
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

        // Incrementa o contador
        await this.incrementCounter(key);
        
        // Adiciona headers informativos
        res.set({
          'X-RateLimit-Limit': this.config.maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - current - 1).toString(),
          'X-RateLimit-Reset': new Date(Date.now() + this.config.windowMs).toISOString()
        });

        next();
      } catch (error) {
        logger.error('Rate limiting error', error);
        // Em caso de erro no rate limiting, permite a requisição
        next();
      }
    };
  }

  /**
   * Gera chave única para o rate limiting
   */
  private generateKey(req: Request): string {
    const baseKey = this.config.keyGenerator!(req);
    const route = req.route?.path || req.path;
    return `rate_limit:${route}:${baseKey}`;
  }

  /**
   * Obtém contagem atual de requests
   */
  private async getCurrentCount(key: string): Promise<number> {
    try {
      const count = await redis.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      logger.error('Error getting rate limit count', error);
      return 0;
    }
  }

  /**
   * Incrementa contador de requests
   */
  private async incrementCounter(key: string): Promise<void> {
    try {
      await redis.incr(key);
      await redis.expire(key, Math.ceil(this.config.windowMs / 1000));
    } catch (error) {
      logger.error('Error incrementing rate limit counter', error);
    }
  }

  /**
   * Reset manual do contador (para uso administrativo)
   */
  public async resetCounter(identifier: string, route?: string): Promise<void> {
    try {
      if (route) {
        const key = `rate_limit:${route}:${identifier}`;
        await redis.del(key);
      } else {
        // Para reset completo, seria necessário implementar busca de chaves
        // Por simplicidade, vamos resetar apenas se a rota for especificada
        logger.warn('Reset without route not implemented for security reasons');
      }

      logger.info('Rate limit counter reset', { identifier, route });
    } catch (error) {
      logger.error('Error resetting rate limit counter', error);
    }
  }
}

/**
 * Rate limiter específico para validação de CPF
 * Permite 10 tentativas por IP a cada 15 minutos
 */
export const cpfValidationRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 10,
  message: 'Muitas tentativas de validação de CPF. Tente novamente em 15 minutos.',
  keyGenerator: (req) => req.ip || 'unknown'
});

/**
 * Rate limiter para registro de usuários
 * Permite 5 registros por IP a cada hora
 */
export const registrationRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 5,
  message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
  keyGenerator: (req) => req.ip || 'unknown'
});

/**
 * Rate limiter geral para login (mais permissivo)
 * Permite 50 tentativas por IP a cada 5 minutos
 */
export const loginRateLimit = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutos
  maxRequests: 50,
  message: 'Muitas tentativas de login. Tente novamente em 5 minutos.',
  keyGenerator: (req) => req.ip || 'unknown'
});

/**
 * Rate limiter específico para falhas de login
 * Permite apenas 3 falhas consecutivas por IP a cada 10 minutos
 */
export const loginFailureRateLimit = new RateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutos
  maxRequests: 3, // Máximo 3 tentativas de login com falha
  message: 'Muitas tentativas de login com credenciais inválidas. Tente novamente em 10 minutos.',
  keyGenerator: (req) => `login_failures:${req.ip || 'unknown'}`
});

/**
 * Rate limiter mais restritivo para ações administrativas
 * Permite 100 ações por usuário a cada hora
 */
export const adminActionRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 100,
  message: 'Muitas ações administrativas. Tente novamente em 1 hora.',
  keyGenerator: (req) => (req.user as any)?.id || req.ip || 'unknown'
});

/**
 * Rate limiter para APIs públicas
 * Permite 1000 requests por IP a cada hora
 */
export const publicApiRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 1000,
  message: 'Limite de API excedido. Tente novamente em 1 hora.',
  keyGenerator: (req) => req.ip || 'unknown'
});

/**
 * Função para incrementar contador de falhas de login
 */
export const incrementLoginFailure = async (ip: string): Promise<void> => {
  const key = `login_failures:${ip}`;
  try {
    const current = await redis.get(key);
    const count = current ? parseInt(current) + 1 : 1;
    await redis.set(key, count.toString(), 10 * 60); // 10 minutos
  } catch (error) {
    console.warn('Erro ao incrementar contador de falhas de login:', error);
  }
};

/**
 * Função para limpar contador de falhas de login após sucesso
 */
export const clearLoginFailures = async (ip: string): Promise<void> => {
  const key = `login_failures:${ip}`;
  try {
    await redis.del(key);
  } catch (error) {
    console.warn('Erro ao limpar contador de falhas de login:', error);
  }
};

/**
 * Middleware para rate limiting baseado em configuração dinâmica
 */
export const createRateLimit = (config: RateLimitConfig) => {
  const limiter = new RateLimiter(config);
  return limiter.middleware();
};

export default RateLimiter;
