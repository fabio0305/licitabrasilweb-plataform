import { Request, Response, NextFunction } from 'express';
interface RequestMetrics {
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    userAgent?: string;
    ip: string;
    userId?: string;
    timestamp: Date;
}
export declare const monitoringMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const getMetrics: () => {
    summary: {
        totalRequests: number;
        recentRequests: number;
        dailyRequests: number;
        avgResponseTime: number;
        recentAvgResponseTime: number;
    };
    statusCodes: Record<number, number>;
    topEndpoints: {
        endpoint: string;
        count: number;
    }[];
    hourlyRequests: {
        hour: number;
        count: number;
    }[];
    errors: RequestMetrics[];
    slowRequests: RequestMetrics[];
};
export declare const cleanupMetrics: () => void;
export {};
//# sourceMappingURL=monitoring.d.ts.map