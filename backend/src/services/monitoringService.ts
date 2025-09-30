import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { prisma } from '../config/database';
import redisClient from '../config/redis';
import { logger } from '../utils/logger';
import emailService from './emailService';

interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // em segundos
  isActive: boolean;
  notificationChannels: string[];
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
    activeConnections: number;
  };
  redis: {
    status: 'connected' | 'disconnected';
    responseTime: number;
    memoryUsage: number;
  };
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

export class MonitoringService extends EventEmitter {
  private static instance: MonitoringService;
  private emailService: any;
  private metrics: Map<string, MetricData[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alertStates: Map<string, { triggered: boolean; since: Date }> = new Map();
  private readonly maxMetricsPerType = 1000;
  private readonly cleanupInterval = 60000; // 1 minuto

  private constructor() {
    super();
    this.emailService = emailService;
    this.startCleanupTimer();
    this.loadAlertRules();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Registrar métrica
  public recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: new Date(),
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Manter apenas as últimas N métricas
    if (metricArray.length > this.maxMetricsPerType) {
      metricArray.shift();
    }

    // Verificar regras de alerta
    this.checkAlertRules(name, value);

    // Emitir evento
    this.emit('metric', metric);

    logger.debug('Métrica registrada:', { name, value, tags });
  }

  // Obter métricas
  public getMetrics(name: string, since?: Date): MetricData[] {
    const metrics = this.metrics.get(name) || [];
    
    if (since) {
      return metrics.filter(m => m.timestamp >= since);
    }
    
    return metrics;
  }

  // Obter estatísticas de uma métrica
  public getMetricStats(name: string, since?: Date): {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
  } {
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

  // Medir tempo de execução
  public async measureExecutionTime<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(`${name}.duration`, duration, tags);
      this.recordMetric(`${name}.success`, 1, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}.duration`, duration, tags);
      this.recordMetric(`${name}.error`, 1, tags);
      throw error;
    }
  }

  // Verificar saúde do sistema
  public async getSystemHealth(): Promise<SystemHealth> {
    const startTime = performance.now();

    try {
      // Verificar banco de dados
      const dbStart = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = performance.now() - dbStart;

      // Verificar Redis
      const redisStart = performance.now();
      await redisClient.checkHealth();
      const redisResponseTime = performance.now() - redisStart;

      // Obter informações do sistema
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Obter métricas da API
      const apiMetrics = this.getAPIMetrics();

      // Obter informações do Redis (simplificado)
      const redisMemoryUsage = 0; // Simplificado para evitar erro

      const health: SystemHealth = {
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

      // Determinar status geral
      if (health.memory.percentage > 90 || health.cpu.usage > 90 || health.api.errorRate > 10) {
        health.status = 'critical';
      } else if (health.memory.percentage > 80 || health.cpu.usage > 80 || health.api.errorRate > 5) {
        health.status = 'warning';
      }

      // Registrar métricas
      this.recordMetric('system.memory.percentage', health.memory.percentage);
      this.recordMetric('system.cpu.usage', health.cpu.usage);
      this.recordMetric('database.response_time', health.database.responseTime);
      this.recordMetric('redis.response_time', health.redis.responseTime);
      this.recordMetric('api.error_rate', health.api.errorRate);

      return health;
    } catch (error) {
      logger.error('Erro ao verificar saúde do sistema:', error);
      
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

  // Adicionar regra de alerta
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.alertStates.set(rule.id, { triggered: false, since: new Date() });
    logger.info('Regra de alerta adicionada:', rule);
  }

  // Remover regra de alerta
  public removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    this.alertStates.delete(ruleId);
    logger.info('Regra de alerta removida:', { ruleId });
  }

  // Verificar regras de alerta
  private checkAlertRules(metricName: string, value: number): void {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.isActive || rule.metric !== metricName) {
        continue;
      }

      const shouldTrigger = this.evaluateCondition(value, rule.condition, rule.threshold);
      const alertState = this.alertStates.get(ruleId)!;

      if (shouldTrigger && !alertState.triggered) {
        // Verificar duração
        const now = new Date();
        const timeSinceLastCheck = (now.getTime() - alertState.since.getTime()) / 1000;

        if (timeSinceLastCheck >= rule.duration) {
          this.triggerAlert(rule, value);
          alertState.triggered = true;
        }
      } else if (!shouldTrigger && alertState.triggered) {
        this.resolveAlert(rule, value);
        alertState.triggered = false;
        alertState.since = new Date();
      }
    }
  }

  // Avaliar condição de alerta
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  // Disparar alerta
  private async triggerAlert(rule: AlertRule, value: number): Promise<void> {
    const alertMessage = `Alerta: ${rule.name}\nMétrica: ${rule.metric}\nValor atual: ${value}\nLimite: ${rule.threshold}`;
    
    logger.warn('Alerta disparado:', { rule: rule.name, metric: rule.metric, value, threshold: rule.threshold });

    // Enviar notificações
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

  // Resolver alerta
  private async resolveAlert(rule: AlertRule, value: number): Promise<void> {
    logger.info('Alerta resolvido:', { rule: rule.name, metric: rule.metric, value });
    this.emit('alert', { rule, value, type: 'resolved' });
  }

  // Métodos auxiliares
  private async getCPUUsage(): Promise<number> {
    // Implementação simplificada - em produção usar biblioteca específica
    return Math.random() * 100; // Placeholder
  }

  private async getDatabaseConnections(): Promise<number> {
    try {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
      `;
      return Number(result[0].count);
    } catch (error) {
      return 0;
    }
  }

  private getAPIMetrics(): { requestsPerMinute: number; averageResponseTime: number; errorRate: number } {
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

  private startCleanupTimer(): void {
    setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
      
      for (const [name, metrics] of this.metrics) {
        const filtered = metrics.filter(m => m.timestamp > cutoff);
        this.metrics.set(name, filtered);
      }
    }, this.cleanupInterval);
  }

  private async loadAlertRules(): Promise<void> {
    // Regras padrão do sistema
    const defaultRules: AlertRule[] = [
      {
        id: 'high-memory',
        name: 'Alto uso de memória',
        metric: 'system.memory.percentage',
        condition: 'gt',
        threshold: 85,
        duration: 300, // 5 minutos
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
