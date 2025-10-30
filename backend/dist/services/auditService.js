"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const logger_1 = require("../utils/logger");
const cpfValidation_1 = require("../utils/cpfValidation");
const database_1 = require("../config/database");
class AuditService {
    static getInstance() {
        if (!AuditService.instance) {
            AuditService.instance = new AuditService();
        }
        return AuditService.instance;
    }
    extractRequestInfo(req) {
        return {
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            userId: req.user?.userId,
            userEmail: req.user?.email,
        };
    }
    async saveToDatabase(auditEntry) {
        if (!auditEntry.userId) {
            return;
        }
        try {
            await database_1.prisma.auditLog.create({
                data: {
                    userId: auditEntry.userId,
                    action: auditEntry.action,
                    resource: auditEntry.action,
                    resourceId: null,
                    oldValues: null,
                    newValues: auditEntry.details ? JSON.stringify(auditEntry.details) : null,
                    ipAddress: auditEntry.ip,
                    userAgent: auditEntry.userAgent,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Erro ao salvar audit log no banco:', error);
            throw error;
        }
    }
    async logAction(action, req, result, details = {}, errorMessage) {
        const requestInfo = this.extractRequestInfo(req);
        const auditEntry = {
            action,
            ...requestInfo,
            timestamp: new Date(),
            details,
            result,
            errorMessage,
        };
        logger_1.logger.info('AUDIT_LOG', {
            audit: auditEntry,
            level: 'audit',
            category: 'security'
        });
        if (requestInfo.userId) {
            try {
                await this.saveToDatabase(auditEntry);
            }
            catch (error) {
                logger_1.logger.error('Erro ao salvar log de auditoria no banco:', error);
            }
        }
        if (result !== 'SUCCESS') {
            logger_1.logger.warn(`Audit: ${action} failed`, {
                ip: requestInfo.ip,
                userId: requestInfo.userId,
                result,
                errorMessage
            });
        }
    }
    async logCpfValidation(req, cpf, result, isRegistered, errorMessage) {
        const maskedCpf = (0, cpfValidation_1.maskCpfForLog)(cpf);
        await this.logAction('CPF_VALIDATION', req, result, {
            cpf: maskedCpf,
            isRegistered: isRegistered || false,
            validationType: 'algorithm_check'
        }, errorMessage);
    }
    async logCpfRegistration(req, cpf, email, result, errorMessage) {
        const maskedCpf = (0, cpfValidation_1.maskCpfForLog)(cpf);
        await this.logAction('CPF_REGISTRATION', req, result, {
            cpf: maskedCpf,
            email,
            registrationType: 'new_user'
        }, errorMessage);
    }
    async logLoginAttempt(req, email, result, errorMessage, userId) {
        const requestInfo = {
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            userId: userId,
            userEmail: email,
        };
        const auditEntry = {
            action: 'LOGIN_ATTEMPT',
            ...requestInfo,
            timestamp: new Date(),
            details: {
                email,
                loginMethod: 'email_password'
            },
            result,
            errorMessage,
        };
        logger_1.logger.info('AUDIT_LOG', {
            audit: auditEntry,
            level: 'audit',
            category: 'security'
        });
        if (userId) {
            try {
                await this.saveToDatabase(auditEntry);
            }
            catch (error) {
                logger_1.logger.error('Erro ao salvar log de auditoria no banco:', error);
            }
        }
        if (result !== 'SUCCESS') {
            logger_1.logger.warn(`Audit: LOGIN_ATTEMPT failed`, {
                ip: requestInfo.ip,
                userId: userId,
                result,
                errorMessage
            });
        }
    }
    async logAdminAction(req, action, targetUserId, details = {}, result = 'SUCCESS', errorMessage) {
        await this.logAction(`ADMIN_${action.toUpperCase()}`, req, result, {
            ...details,
            targetUserId,
            adminAction: true
        }, errorMessage);
    }
    async logRateLimit(req, action, limit, windowMs) {
        await this.logAction('RATE_LIMIT_EXCEEDED', req, 'FAILURE', {
            action,
            limit,
            windowMs,
            rateLimitType: 'ip_based'
        }, `Rate limit exceeded for action: ${action}`);
    }
    async logSuspiciousActivity(req, activity, details = {}, severity = 'MEDIUM') {
        const requestInfo = this.extractRequestInfo(req);
        logger_1.logger.warn('SUSPICIOUS_ACTIVITY', {
            activity,
            severity,
            ...requestInfo,
            details,
            timestamp: new Date(),
            category: 'security_alert'
        });
        await this.logAction('SUSPICIOUS_ACTIVITY', req, 'FAILURE', {
            activity,
            severity,
            ...details
        }, `Suspicious activity detected: ${activity}`);
    }
    async getAuditLogs(filters = {}, limit = 100, offset = 0) {
        logger_1.logger.info('Audit logs requested', { filters, limit, offset });
        return [];
    }
    async getAuditStats(startDate, endDate) {
        logger_1.logger.info('Audit stats requested', { startDate, endDate });
        return {
            totalActions: 0,
            successfulActions: 0,
            failedActions: 0,
            errorActions: 0,
            topActions: [],
            topIPs: []
        };
    }
}
exports.AuditService = AuditService;
exports.default = AuditService;
//# sourceMappingURL=auditService.js.map