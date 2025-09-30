interface PerformanceConfig {
    cache: {
        enabled: boolean;
        defaultTTL: number;
        maxMemoryUsage: number;
    };
    database: {
        connectionPoolSize: number;
        queryTimeout: number;
        slowQueryThreshold: number;
    };
    api: {
        rateLimitWindow: number;
        rateLimitMax: number;
        requestTimeout: number;
        compressionThreshold: number;
    };
    monitoring: {
        enabled: boolean;
        metricsRetention: number;
        alertThresholds: {
            responseTime: number;
            errorRate: number;
            memoryUsage: number;
            cpuUsage: number;
        };
    };
}
export declare const performanceConfig: PerformanceConfig;
export declare class PerformanceOptimizer {
    private static instance;
    private cacheService;
    private monitoringService;
    private isInitialized;
    private constructor();
    static getInstance(): PerformanceOptimizer;
    initialize(): Promise<void>;
    private setupMonitoring;
    private setupCache;
    private setupCacheStrategies;
    private setupDatabaseOptimizations;
    private setupAPIOptimizations;
    private startPeriodicMetricsCollection;
    createPerformanceMiddleware(): (req: any, res: any, next: any) => void;
    optimizeQuery<T>(queryName: string, queryFn: () => Promise<T>, cacheKey?: string, cacheTTL?: number): Promise<T>;
    getPerformanceStats(): Promise<{
        cache: any;
        system: any;
        api: any;
    }>;
}
export {};
//# sourceMappingURL=performance.d.ts.map