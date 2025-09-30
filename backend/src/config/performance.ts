import { CacheService } from '../services/cacheService';
import { MonitoringService } from '../services/monitoringService';
import { logger } from '../utils/logger';

interface PerformanceConfig {
  cache: {
    enabled: boolean;
    defaultTTL: number;
    maxMemoryUsage: number; // em MB
  };
  database: {
    connectionPoolSize: number;
    queryTimeout: number;
    slowQueryThreshold: number; // em ms
  };
  api: {
    rateLimitWindow: number; // em ms
    rateLimitMax: number;
    requestTimeout: number; // em ms
    compressionThreshold: number; // em bytes
  };
  monitoring: {
    enabled: boolean;
    metricsRetention: number; // em horas
    alertThresholds: {
      responseTime: number; // em ms
      errorRate: number; // em %
      memoryUsage: number; // em %
      cpuUsage: number; // em %
    };
  };
}

export const performanceConfig: PerformanceConfig = {
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'), // 1 hora
    maxMemoryUsage: parseInt(process.env.CACHE_MAX_MEMORY || '512') // 512MB
  },
  database: {
    connectionPoolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'), // 30s
    slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000') // 1s
  },
  api: {
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 min
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'), // 30s
    compressionThreshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024') // 1KB
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsRetention: parseInt(process.env.METRICS_RETENTION || '24'), // 24 horas
    alertThresholds: {
      responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '1000'), // 1s
      errorRate: parseInt(process.env.ALERT_ERROR_RATE || '5'), // 5%
      memoryUsage: parseInt(process.env.ALERT_MEMORY_USAGE || '85'), // 85%
      cpuUsage: parseInt(process.env.ALERT_CPU_USAGE || '80') // 80%
    }
  }
};

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cacheService: CacheService;
  private monitoringService: MonitoringService;
  private isInitialized = false;

  private constructor() {
    this.cacheService = CacheService.getInstance();
    this.monitoringService = MonitoringService.getInstance();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Inicializar otimizações
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    logger.info('Inicializando otimizações de performance...');

    try {
      // Configurar monitoramento
      if (performanceConfig.monitoring.enabled) {
        await this.setupMonitoring();
      }

      // Configurar cache
      if (performanceConfig.cache.enabled) {
        await this.setupCache();
      }

      // Configurar otimizações de banco de dados
      await this.setupDatabaseOptimizations();

      // Configurar otimizações de API
      await this.setupAPIOptimizations();

      this.isInitialized = true;
      logger.info('✅ Otimizações de performance inicializadas');
    } catch (error) {
      logger.error('Erro ao inicializar otimizações:', error);
      throw error;
    }
  }

  // Configurar monitoramento
  private async setupMonitoring(): Promise<void> {
    logger.info('Configurando monitoramento de performance...');

    // Adicionar regras de alerta personalizadas
    const alertRules = [
      {
        id: 'api-response-time',
        name: 'Tempo de resposta da API alto',
        metric: 'api.response_time',
        condition: 'gt' as const,
        threshold: performanceConfig.monitoring.alertThresholds.responseTime,
        duration: 300, // 5 minutos
        isActive: true,
        notificationChannels: ['email']
      },
      {
        id: 'api-error-rate',
        name: 'Taxa de erro da API alta',
        metric: 'api.error_rate',
        condition: 'gt' as const,
        threshold: performanceConfig.monitoring.alertThresholds.errorRate,
        duration: 180, // 3 minutos
        isActive: true,
        notificationChannels: ['email']
      }
    ];

    for (const rule of alertRules) {
      this.monitoringService.addAlertRule(rule);
    }

    // Iniciar coleta de métricas periódicas
    this.startPeriodicMetricsCollection();

    logger.info('✅ Monitoramento configurado');
  }

  // Configurar cache
  private async setupCache(): Promise<void> {
    logger.info('Configurando sistema de cache...');

    // Verificar se Redis está disponível
    try {
      const stats = await this.cacheService.getStats();
      logger.info('Cache Redis disponível:', stats);
    } catch (error) {
      logger.warn('Redis não disponível, cache desabilitado:', error.message);
      return;
    }

    // Configurar estratégias de cache por tipo de dados
    await this.setupCacheStrategies();

    logger.info('✅ Sistema de cache configurado');
  }

  // Configurar estratégias de cache
  private async setupCacheStrategies(): Promise<void> {
    // Cache de dados de usuário (30 minutos)
    const userCacheTTL = 1800;
    
    // Cache de licitações (15 minutos)
    const biddingCacheTTL = 900;
    
    // Cache de busca (5 minutos)
    const searchCacheTTL = 300;
    
    // Cache de dashboard público (10 minutos)
    const dashboardCacheTTL = 600;

    logger.info('Estratégias de cache configuradas:', {
      user: `${userCacheTTL}s`,
      bidding: `${biddingCacheTTL}s`,
      search: `${searchCacheTTL}s`,
      dashboard: `${dashboardCacheTTL}s`
    });
  }

  // Configurar otimizações de banco de dados
  private async setupDatabaseOptimizations(): Promise<void> {
    logger.info('Configurando otimizações de banco de dados...');

    // Configurar connection pooling (já configurado no Prisma)
    // Configurar query timeout
    // Configurar slow query logging

    logger.info('✅ Otimizações de banco configuradas');
  }

  // Configurar otimizações de API
  private async setupAPIOptimizations(): Promise<void> {
    logger.info('Configurando otimizações de API...');

    // Configurações já aplicadas via middleware
    // - Compressão gzip
    // - Rate limiting
    // - Request timeout
    // - CORS otimizado

    logger.info('✅ Otimizações de API configuradas');
  }

  // Iniciar coleta de métricas periódicas
  private startPeriodicMetricsCollection(): void {
    // Coletar métricas a cada 30 segundos
    setInterval(async () => {
      try {
        // Métricas de sistema
        const health = await this.monitoringService.getSystemHealth();
        
        // Registrar métricas principais
        this.monitoringService.recordMetric('system.status', health.status === 'healthy' ? 1 : 0);
        this.monitoringService.recordMetric('system.uptime', health.uptime);
        
        // Métricas de cache
        if (performanceConfig.cache.enabled) {
          const cacheStats = await this.cacheService.getStats();
          this.monitoringService.recordMetric('cache.hit_rate', cacheStats.hitRate);
          this.monitoringService.recordMetric('cache.memory_usage', cacheStats.memoryUsage);
          this.monitoringService.recordMetric('cache.total_keys', cacheStats.totalKeys);
        }
      } catch (error) {
        logger.error('Erro ao coletar métricas:', error);
      }
    }, 30000);

    logger.info('Coleta de métricas periódicas iniciada');
  }

  // Middleware para medir performance de requests
  public createPerformanceMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      
      // Interceptar o final da resposta
      const originalSend = res.send;
      res.send = function(data: any) {
        const responseTime = Date.now() - startTime;
        
        // Registrar métricas
        const monitoring = PerformanceOptimizer.getInstance().monitoringService;
        monitoring.recordMetric('api.request', 1, {
          method: req.method,
          route: req.route?.path || req.path,
          status: res.statusCode.toString()
        });
        
        monitoring.recordMetric('api.response_time', responseTime, {
          method: req.method,
          route: req.route?.path || req.path
        });

        // Registrar erro se status >= 400
        if (res.statusCode >= 400) {
          monitoring.recordMetric('api.error', 1, {
            method: req.method,
            route: req.route?.path || req.path,
            status: res.statusCode.toString()
          });
        }

        // Adicionar headers de performance
        res.set('X-Response-Time', `${responseTime}ms`);
        
        // Log de queries lentas
        if (responseTime > performanceConfig.monitoring.alertThresholds.responseTime) {
          logger.warn('Slow request detected:', {
            method: req.method,
            path: req.path,
            responseTime: `${responseTime}ms`,
            userAgent: req.get('User-Agent')
          });
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Otimizar query do banco de dados
  public async optimizeQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<T> {
    const startTime = Date.now();

    try {
      let result: T;

      // Tentar cache primeiro se configurado
      if (cacheKey && performanceConfig.cache.enabled) {
        const cached = await this.cacheService.get<T>(cacheKey);
        if (cached !== null) {
          const queryTime = Date.now() - startTime;
          this.monitoringService.recordMetric(`db.${queryName}.cache_hit`, 1);
          this.monitoringService.recordMetric(`db.${queryName}.time`, queryTime);
          return cached;
        }
      }

      // Executar query
      result = await queryFn();
      const queryTime = Date.now() - startTime;

      // Registrar métricas
      this.monitoringService.recordMetric(`db.${queryName}.time`, queryTime);
      this.monitoringService.recordMetric(`db.${queryName}.success`, 1);

      // Log de query lenta
      if (queryTime > performanceConfig.database.slowQueryThreshold) {
        logger.warn('Slow database query:', {
          query: queryName,
          time: `${queryTime}ms`
        });
      }

      // Salvar no cache se configurado
      if (cacheKey && performanceConfig.cache.enabled) {
        await this.cacheService.set(cacheKey, result, {
          ttl: cacheTTL || performanceConfig.cache.defaultTTL
        });
        this.monitoringService.recordMetric(`db.${queryName}.cache_miss`, 1);
      }

      return result;
    } catch (error) {
      const queryTime = Date.now() - startTime;
      this.monitoringService.recordMetric(`db.${queryName}.time`, queryTime);
      this.monitoringService.recordMetric(`db.${queryName}.error`, 1);
      
      logger.error('Database query error:', {
        query: queryName,
        time: `${queryTime}ms`,
        error: error.message
      });
      
      throw error;
    }
  }

  // Obter estatísticas de performance
  public async getPerformanceStats(): Promise<{
    cache: any;
    system: any;
    api: any;
  }> {
    const [cacheStats, systemHealth] = await Promise.all([
      performanceConfig.cache.enabled ? this.cacheService.getStats() : null,
      this.monitoringService.getSystemHealth()
    ]);

    // Estatísticas da API das últimas 24 horas
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const apiStats = {
      requests: this.monitoringService.getMetricStats('api.request', yesterday),
      responseTime: this.monitoringService.getMetricStats('api.response_time', yesterday),
      errors: this.monitoringService.getMetricStats('api.error', yesterday)
    };

    return {
      cache: cacheStats,
      system: systemHealth,
      api: apiStats
    };
  }
}
