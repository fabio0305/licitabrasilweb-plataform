import { Request } from 'express';
export interface AuditLogEntry {
    action: string;
    userId?: string;
    userEmail?: string;
    ip: string;
    userAgent?: string;
    timestamp: Date;
    details: Record<string, any>;
    result: 'SUCCESS' | 'FAILURE' | 'ERROR';
    errorMessage?: string;
}
export declare class AuditService {
    private static instance;
    static getInstance(): AuditService;
    private extractRequestInfo;
    private saveToDatabase;
    logAction(action: string, req: Request, result: 'SUCCESS' | 'FAILURE' | 'ERROR', details?: Record<string, any>, errorMessage?: string): Promise<void>;
    logCpfValidation(req: Request, cpf: string, result: 'SUCCESS' | 'FAILURE' | 'ERROR', isRegistered?: boolean, errorMessage?: string): Promise<void>;
    logCpfRegistration(req: Request, cpf: string, email: string, result: 'SUCCESS' | 'FAILURE' | 'ERROR', errorMessage?: string): Promise<void>;
    logLoginAttempt(req: Request, email: string, result: 'SUCCESS' | 'FAILURE' | 'ERROR', errorMessage?: string, userId?: string): Promise<void>;
    logAdminAction(req: Request, action: string, targetUserId?: string, details?: Record<string, any>, result?: 'SUCCESS' | 'FAILURE' | 'ERROR', errorMessage?: string): Promise<void>;
    logRateLimit(req: Request, action: string, limit: number, windowMs: number): Promise<void>;
    logSuspiciousActivity(req: Request, activity: string, details?: Record<string, any>, severity?: 'LOW' | 'MEDIUM' | 'HIGH'): Promise<void>;
    getAuditLogs(filters?: {
        action?: string;
        userId?: string;
        ip?: string;
        startDate?: Date;
        endDate?: Date;
        result?: 'SUCCESS' | 'FAILURE' | 'ERROR';
    }, limit?: number, offset?: number): Promise<AuditLogEntry[]>;
    getAuditStats(startDate?: Date, endDate?: Date): Promise<{
        totalActions: number;
        successfulActions: number;
        failedActions: number;
        errorActions: number;
        topActions: Array<{
            action: string;
            count: number;
        }>;
        topIPs: Array<{
            ip: string;
            count: number;
        }>;
    }>;
}
export default AuditService;
//# sourceMappingURL=auditService.d.ts.map