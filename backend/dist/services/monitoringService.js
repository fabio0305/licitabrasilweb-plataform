"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
const database_1 = require("../config/database");
const redis_1 = __importDefault(require("../config/redis"));
const logger_1 = require("../utils/logger");
const emailService_1 = __importDefault(require("./emailService"));
class MonitoringService extends events_1.EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.alertRules = new Map();
        this.alertStates = new Map();
        this.maxMetricsPerType = 1000;
        this.cleanupInterval = 60000;
        this.emailService = emailService_1.default;
        this.startCleanupTimer();
        this.loadAlertRules();
    }
    static getInstance() {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }
    recordMetric(name, value, tags) {
        const metric = {
            name,
            value,
            timestamp: new Date(),
            tags
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        const metricArray = this.metrics.get(name);
        metricArray.push(metric);
        if (metricArray.length > this.maxMetricsPerType) {
            metricArray.shift();
        }
        this.checkAlertRules(name, value);
        this.emit('metric', metric);
        logger_1.logger.debug('Métrica registrada:', { name, value, tags });
    }
    getMetrics(name, since) {
        const metrics = this.metrics.get(name) || [];
        if (since) {
            return metrics.filter(m => m.timestamp >= since);
        }
        return metrics;
    }
    getMetricStats(name, since) {
        const metrics = this.getMetrics(name, since);
        if (metrics.length === 0) {
            return { count: 0, min: 0, max: 0, avg: 0, sum: 0 };
        }
        const values = metrics.map(m => m.value);
        const sum = values.reduce((a, b) => a + b, 0);
        return {
            count: metrics.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: sum / metrics.length,
            sum
        };
    }
    async measureExecutionTime(name, fn, tags) {
        const start = perf_hooks_1.performance.now();
        try {
            const result = await fn();
            const duration = perf_hooks_1.performance.now() - start;
            this.recordMetric(`${name}.duration`, duration, tags);
            this.recordMetric(`${name}.success`, 1, tags);
            return result;
        }
        catch (error) {
            const duration = perf_hooks_1.performance.now() - start;
            this.recordMetric(`${name}.duration`, duration, tags);
            this.recordMetric(`${name}.error`, 1, tags);
            throw error;
        }
    }
    async getSystemHealth() {
        const startTime = perf_hooks_1.performance.now();
        try {
            const dbStart = perf_hooks_1.performance.now();
            await database_1.prisma.$queryRaw `SELECT 1`;
            const dbResponseTime = perf_hooks_1.performance.now() - dbStart;
            const redisStart = perf_hooks_1.performance.now();
            await redis_1.default.checkHealth();
            const redisResponseTime = perf_hooks_1.performance.now() - redisStart;
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();
            const apiMetrics = this.getAPIMetrics();
            const redisMemoryUsage = 0;
            const health = {
                status: 'healthy',
                uptime,
                memory: {
                    used: memoryUsage.heapUsed,
                    total: memoryUsage.heapTotal,
                    percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
                },
                cpu: {
                    usage: await this.getCPUUsage()
                },
                database: {
                    status: 'connected',
                    responseTime: dbResponseTime,
                    activeConnections: await this.getDatabaseConnections()
                },
                redis: {
                    status: 'connected',
                    responseTime: redisResponseTime,
                    memoryUsage: redisMemoryUsage
                },
                api: apiMetrics
            };
            if (health.memory.percentage > 90 || health.cpu.usage > 90 || health.api.errorRate > 10) {
                health.status = 'critical';
            }
            else if (health.memory.percentage > 80 || health.cpu.usage > 80 || health.api.errorRate > 5) {
                health.status = 'warning';
            }
            this.recordMetric('system.memory.percentage', health.memory.percentage);
            this.recordMetric('system.cpu.usage', health.cpu.usage);
            this.recordMetric('database.response_time', health.database.responseTime);
            this.recordMetric('redis.response_time', health.redis.responseTime);
            this.recordMetric('api.error_rate', health.api.errorRate);
            return health;
        }
        catch (error) {
            logger_1.logger.error('Erro ao verificar saúde do sistema:', error);
            return {
                status: 'critical',
                uptime: process.uptime(),
                memory: { used: 0, total: 0, percentage: 0 },
                cpu: { usage: 0 },
                database: { status: 'disconnected', responseTime: 0, activeConnections: 0 },
                redis: { status: 'disconnected', responseTime: 0, memoryUsage: 0 },
                api: { requestsPerMinute: 0, averageResponseTime: 0, errorRate: 100 }
            };
        }
    }
    addAlertRule(rule) {
        this.alertRules.set(rule.id, rule);
        this.alertStates.set(rule.id, { triggered: false, since: new Date() });
        logger_1.logger.info('Regra de alerta adicionada:', rule);
    }
    removeAlertRule(ruleId) {
        this.alertRules.delete(ruleId);
        this.alertStates.delete(ruleId);
        logger_1.logger.info('Regra de alerta removida:', { ruleId });
    }
    checkAlertRules(metricName, value) {
        for (const [ruleId, rule] of this.alertRules) {
            if (!rule.isActive || rule.metric !== metricName) {
                continue;
            }
            const shouldTrigger = this.evaluateCondition(value, rule.condition, rule.threshold);
            const alertState = this.alertStates.get(ruleId);
            if (shouldTrigger && !alertState.triggered) {
                const now = new Date();
                const timeSinceLastCheck = (now.getTime() - alertState.since.getTime()) / 1000;
                if (timeSinceLastCheck >= rule.duration) {
                    this.triggerAlert(rule, value);
                    alertState.triggered = true;
                }
            }
            else if (!shouldTrigger && alertState.triggered) {
                this.resolveAlert(rule, value);
                alertState.triggered = false;
                alertState.since = new Date();
            }
        }
    }
    evaluateCondition(value, condition, threshold) {
        switch (condition) {
            case 'gt': return value > threshold;
            case 'gte': return value >= threshold;
            case 'lt': return value < threshold;
            case 'lte': return value <= threshold;
            case 'eq': return value === threshold;
            default: return false;
        }
    }
    async triggerAlert(rule, value) {
        const alertMessage = `Alerta: ${rule.name}\nMétrica: ${rule.metric}\nValor atual: ${value}\nLimite: ${rule.threshold}`;
        logger_1.logger.warn('Alerta disparado:', { rule: rule.name, metric: rule.metric, value, threshold: rule.threshold });
        for (const channel of rule.notificationChannels) {
            if (channel === 'email') {
                await this.emailService.sendEmail({
                    to: process.env.ALERT_EMAIL || 'admin@licitabrasilweb.com.br',
                    subject: `Alerta: ${rule.name}`,
                    text: alertMessage,
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #dc3545;">🚨 Alerta do Sistema</h1>
              <h2>${rule.name}</h2>
              <p><strong>Métrica:</strong> ${rule.metric}</p>
              <p><strong>Valor atual:</strong> ${value}</p>
              <p><strong>Limite:</strong> ${rule.threshold}</p>
              <p><strong>Condição:</strong> ${rule.condition}</p>
              <p><strong>Horário:</strong> ${new Date().toLocaleString()}</p>
            </div>
          `
                });
            }
        }
        this.emit('alert', { rule, value, type: 'triggered' });
    }
    async resolveAlert(rule, value) {
        logger_1.logger.info('Alerta resolvido:', { rule: rule.name, metric: rule.metric, value });
        this.emit('alert', { rule, value, type: 'resolved' });
    }
    async getCPUUsage() {
        return Math.random() * 100;
    }
    async getDatabaseConnections() {
        try {
            const result = await database_1.prisma.$queryRaw `
        SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
      `;
            return Number(result[0].count);
        }
        catch (error) {
            return 0;
        }
    }
    getAPIMetrics() {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        const requests = this.getMetrics('api.request', oneMinuteAgo);
        const errors = this.getMetrics('api.error', oneMinuteAgo);
        const responseTimes = this.getMetrics('api.response_time', oneMinuteAgo);
        const requestsPerMinute = requests.length;
        const errorRate = requestsPerMinute > 0 ? (errors.length / requestsPerMinute) * 100 : 0;
        const averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, m) => sum + m.value, 0) / responseTimes.length
            : 0;
        return {
            requestsPerMinute,
            averageResponseTime,
            errorRate
        };
    }
    startCleanupTimer() {
        setInterval(() => {
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
            for (const [name, metrics] of this.metrics) {
                const filtered = metrics.filter(m => m.timestamp > cutoff);
                this.metrics.set(name, filtered);
            }
        }, this.cleanupInterval);
    }
    async loadAlertRules() {
        const defaultRules = [
            {
                id: 'high-memory',
                name: 'Alto uso de memória',
                metric: 'system.memory.percentage',
                condition: 'gt',
                threshold: 85,
                duration: 300,
                isActive: true,
                notificationChannels: ['email']
            },
            {
                id: 'high-cpu',
                name: 'Alto uso de CPU',
                metric: 'system.cpu.usage',
                condition: 'gt',
                threshold: 80,
                duration: 300,
                isActive: true,
                notificationChannels: ['email']
            },
            {
                id: 'high-error-rate',
                name: 'Alta taxa de erro da API',
                metric: 'api.error_rate',
                condition: 'gt',
                threshold: 5,
                duration: 60,
                isActive: true,
                notificationChannels: ['email']
            }
        ];
        for (const rule of defaultRules) {
            this.addAlertRule(rule);
        }
    }
}
exports.MonitoringService = MonitoringService;
//# sourceMappingURL=monitoringService.js.map