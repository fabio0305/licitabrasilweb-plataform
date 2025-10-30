import { Request, Response, NextFunction } from 'express';
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    message?: string;
}
export declare class RateLimiter {
    private config;
    private auditService;
    constructor(config: RateLimitConfig);
    middleware(): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    private generateKey;
    private getCurrentCount;
    private incrementCounter;
    resetCounter(identifier: string, route?: string): Promise<void>;
}
export declare const cpfValidationRateLimit: RateLimiter;
export declare const registrationRateLimit: RateLimiter;
export declare const loginRateLimit: RateLimiter;
export declare const loginFailureRateLimit: RateLimiter;
export declare const adminActionRateLimit: RateLimiter;
export declare const publicApiRateLimit: RateLimiter;
export declare const incrementLoginFailure: (ip: string) => Promise<void>;
export declare const clearLoginFailures: (ip: string) => Promise<void>;
export declare const createRateLimit: (config: RateLimitConfig) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export default RateLimiter;
//# sourceMappingURL=rateLimiting.d.ts.map