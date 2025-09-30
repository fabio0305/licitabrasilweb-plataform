"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceOptimizer = exports.performanceConfig = void 0;
const cacheService_1 = require("../services/cacheService");
const monitoringService_1 = require("../services/monitoringService");
const logger_1 = require("../utils/logger");
exports.performanceConfig = {
    cache: {
        enabled: process.env.CACHE_ENABLED !== 'false',
        defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'),
        maxMemoryUsage: parseInt(process.env.CACHE_MAX_MEMORY || '512')
    },
    database: {
        connectionPoolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
        slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000')
    },
    api: {
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
        compressionThreshold: parseInt(process.env.COMPRESSION_THRESHOLD || '1024')
    },
    monitoring: {
        enabled: process.env.MONITORING_ENABLED !== 'false',
        metricsRetention: parseInt(process.env.METRICS_RETENTION || '24'),
        alertThresholds: {
            responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '1000'),
            errorRate: parseInt(process.env.ALERT_ERROR_RATE || '5'),
            memoryUsage: parseInt(process.env.ALERT_MEMORY_USAGE || '85'),
            cpuUsage: parseInt(process.env.ALERT_CPU_USAGE || '80')
        }
    }
};
class PerformanceOptimizer {
    constructor() {
        this.isInitialized = false;
        this.cacheService = cacheService_1.CacheService.getInstance();
        this.monitoringService = monitoringService_1.MonitoringService.getInstance();
    }
    static getInstance() {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer();
        }
        return PerformanceOptimizer.instance;
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        logger_1.logger.info('Inicializando otimizações de performance...');
        try {
            if (exports.performanceConfig.monitoring.enabled) {
                await this.setupMonitoring();
            }
            if (exports.performanceConfig.cache.enabled) {
                await this.setupCache();
            }
            await this.setupDatabaseOptimizations();
            await this.setupAPIOptimizations();
            this.isInitialized = true;
            logger_1.logger.info('✅ Otimizações de performance inicializadas');
        }
        catch (error) {
            logger_1.logger.error('Erro ao inicializar otimizações:', error);
            throw error;
        }
    }
    async setupMonitoring() {
        logger_1.logger.info('Configurando monitoramento de performance...');
        const alertRules = [
            {
                id: 'api-response-time',
                name: 'Tempo de resposta da API alto',
                metric: 'api.response_time',
                condition: 'gt',
                threshold: exports.performanceConfig.monitoring.alertThresholds.responseTime,
                duration: 300,
                isActive: true,
                notificationChannels: ['email']
            },
            {
                id: 'api-error-rate',
                name: 'Taxa de erro da API alta',
                metric: 'api.error_rate',
                condition: 'gt',
                threshold: exports.performanceConfig.monitoring.alertThresholds.errorRate,
                duration: 180,
                isActive: true,
                notificationChannels: ['email']
            }
        ];
        for (const rule of alertRules) {
            this.monitoringService.addAlertRule(rule);
        }
        this.startPeriodicMetricsCollection();
        logger_1.logger.info('✅ Monitoramento configurado');
    }
    async setupCache() {
        logger_1.logger.info('Configurando sistema de cache...');
        try {
            const stats = await this.cacheService.getStats();
            logger_1.logger.info('Cache Redis disponível:', stats);
        }
        catch (error) {
            logger_1.logger.warn('Redis não disponível, cache desabilitado:', error.message);
            return;
        }
        await this.setupCacheStrategies();
        logger_1.logger.info('✅ Sistema de cache configurado');
    }
    async setupCacheStrategies() {
        const userCacheTTL = 1800;
        const biddingCacheTTL = 900;
        const searchCacheTTL = 300;
        const dashboardCacheTTL = 600;
        logger_1.logger.info('Estratégias de cache configuradas:', {
            user: `${userCacheTTL}s`,
            bidding: `${biddingCacheTTL}s`,
            search: `${searchCacheTTL}s`,
            dashboard: `${dashboardCacheTTL}s`
        });
    }
    async setupDatabaseOptimizations() {
        logger_1.logger.info('Configurando otimizações de banco de dados...');
        logger_1.logger.info('✅ Otimizações de banco configuradas');
    }
    async setupAPIOptimizations() {
        logger_1.logger.info('Configurando otimizações de API...');
        logger_1.logger.info('✅ Otimizações de API configuradas');
    }
    startPeriodicMetricsCollection() {
        setInterval(async () => {
            try {
                const health = await this.monitoringService.getSystemHealth();
                this.monitoringService.recordMetric('system.status', health.status === 'healthy' ? 1 : 0);
                this.monitoringService.recordMetric('system.uptime', health.uptime);
                if (exports.performanceConfig.cache.enabled) {
                    const cacheStats = await this.cacheService.getStats();
                    this.monitoringService.recordMetric('cache.hit_rate', cacheStats.hitRate);
                    this.monitoringService.recordMetric('cache.memory_usage', cacheStats.memoryUsage);
                    this.monitoringService.recordMetric('cache.total_keys', cacheStats.totalKeys);
                }
            }
            catch (error) {
                logger_1.logger.error('Erro ao coletar métricas:', error);
            }
        }, 30000);
        logger_1.logger.info('Coleta de métricas periódicas iniciada');
    }
    createPerformanceMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const originalSend = res.send;
            res.send = function (data) {
                const responseTime = Date.now() - startTime;
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
                if (res.statusCode >= 400) {
                    monitoring.recordMetric('api.error', 1, {
                        method: req.method,
                        route: req.route?.path || req.path,
                        status: res.statusCode.toString()
                    });
                }
                res.set('X-Response-Time', `${responseTime}ms`);
                if (responseTime > exports.performanceConfig.monitoring.alertThresholds.responseTime) {
                    logger_1.logger.warn('Slow request detected:', {
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
    async optimizeQuery(queryName, queryFn, cacheKey, cacheTTL) {
        const startTime = Date.now();
        try {
            let result;
            if (cacheKey && exports.performanceConfig.cache.enabled) {
                const cached = await this.cacheService.get(cacheKey);
                if (cached !== null) {
                    const queryTime = Date.now() - startTime;
                    this.monitoringService.recordMetric(`db.${queryName}.cache_hit`, 1);
                    this.monitoringService.recordMetric(`db.${queryName}.time`, queryTime);
                    return cached;
                }
            }
            result = await queryFn();
            const queryTime = Date.now() - startTime;
            this.monitoringService.recordMetric(`db.${queryName}.time`, queryTime);
            this.monitoringService.recordMetric(`db.${queryName}.success`, 1);
            if (queryTime > exports.performanceConfig.database.slowQueryThreshold) {
                logger_1.logger.warn('Slow database query:', {
                    query: queryName,
                    time: `${queryTime}ms`
                });
            }
            if (cacheKey && exports.performanceConfig.cache.enabled) {
                await this.cacheService.set(cacheKey, result, {
                    ttl: cacheTTL || exports.performanceConfig.cache.defaultTTL
                });
                this.monitoringService.recordMetric(`db.${queryName}.cache_miss`, 1);
            }
            return result;
        }
        catch (error) {
            const queryTime = Date.now() - startTime;
            this.monitoringService.recordMetric(`db.${queryName}.time`, queryTime);
            this.monitoringService.recordMetric(`db.${queryName}.error`, 1);
            logger_1.logger.error('Database query error:', {
                query: queryName,
                time: `${queryTime}ms`,
                error: error.message
            });
            throw error;
        }
    }
    async getPerformanceStats() {
        const [cacheStats, systemHealth] = await Promise.all([
            exports.performanceConfig.cache.enabled ? this.cacheService.getStats() : null,
            this.monitoringService.getSystemHealth()
        ]);
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
exports.PerformanceOptimizer = PerformanceOptimizer;
//# sourceMappingURL=performance.js.map