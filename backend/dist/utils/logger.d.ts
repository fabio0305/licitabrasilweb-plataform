import winston from 'winston';
declare const logger: winston.Logger;
export declare const logRequest: (req: any, res: any, responseTime: number) => void;
export declare const logError: (error: Error, context?: string) => void;
export declare const logUserActivity: (userId: string, action: string, details?: any) => void;
export declare const logDatabaseOperation: (operation: string, table: string, duration?: number) => void;
export declare const logCacheOperation: (operation: string, key: string, hit?: boolean) => void;
export declare const logAuth: (event: string, userId?: string, ip?: string) => void;
export declare const logSecurity: (event: string, details: any, level?: "warn" | "error") => void;
export declare const morganStream: {
    write: (message: string) => void;
};
export { logger };
export default logger;
//# sourceMappingURL=logger.d.ts.map