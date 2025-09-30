import { EventEmitter } from 'events';
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
    duration: number;
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
export declare class MonitoringService extends EventEmitter {
    private static instance;
    private emailService;
    private metrics;
    private alertRules;
    private alertStates;
    private readonly maxMetricsPerType;
    private readonly cleanupInterval;
    private constructor();
    static getInstance(): MonitoringService;
    recordMetric(name: string, value: number, tags?: Record<string, string>): void;
    getMetrics(name: string, since?: Date): MetricData[];
    getMetricStats(name: string, since?: Date): {
        count: number;
        min: number;
        max: number;
        avg: number;
        sum: number;
    };
    measureExecutionTime<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T>;
    getSystemHealth(): Promise<SystemHealth>;
    addAlertRule(rule: AlertRule): void;
    removeAlertRule(ruleId: string): void;
    private checkAlertRules;
    private evaluateCondition;
    private triggerAlert;
    private resolveAlert;
    private getCPUUsage;
    private getDatabaseConnections;
    private getAPIMetrics;
    private startCleanupTimer;
    private loadAlertRules;
}
export {};
//# sourceMappingURL=monitoringService.d.ts.map