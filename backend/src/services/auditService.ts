/**
 * Serviço de Auditoria para logging de ações sensíveis
 */

import { logger } from '../utils/logger';
import { maskCpfForLog } from '../utils/cpfValidation';
import { Request } from 'express';
import { prisma } from '../config/database';

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

export class AuditService {
  private static instance: AuditService;

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Extrai informações do request para auditoria
   */
  private extractRequestInfo(req: Request) {
    return {
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      userId: (req.user as any)?.userId,
      userEmail: (req.user as any)?.email,
    };
  }

  /**
   * Salva log de auditoria no banco de dados
   */
  private async saveToDatabase(auditEntry: AuditLogEntry): Promise<void> {
    if (!auditEntry.userId) {
      return; // Não salva se não há usuário
    }

    try {
      await prisma.auditLog.create({
        data: {
          userId: auditEntry.userId,
          action: auditEntry.action,
          resource: auditEntry.action, // Usando action como resource por compatibilidade
          resourceId: null,
          oldValues: null,
          newValues: auditEntry.details ? JSON.stringify(auditEntry.details) : null,
          ipAddress: auditEntry.ip,
          userAgent: auditEntry.userAgent,
        },
      });
    } catch (error) {
      logger.error('Erro ao salvar audit log no banco:', error);
      throw error;
    }
  }

  /**
   * Log genérico de auditoria
   */
  public async logAction(
    action: string,
    req: Request,
    result: 'SUCCESS' | 'FAILURE' | 'ERROR',
    details: Record<string, any> = {},
    errorMessage?: string
  ): Promise<void> {
    const requestInfo = this.extractRequestInfo(req);

    const auditEntry: AuditLogEntry = {
      action,
      ...requestInfo,
      timestamp: new Date(),
      details,
      result,
      errorMessage,
    };

    // Log estruturado para auditoria
    logger.info('AUDIT_LOG', {
      audit: auditEntry,
      level: 'audit',
      category: 'security'
    });

    // Salvar no banco de dados se há userId
    if (requestInfo.userId) {
      try {
        await this.saveToDatabase(auditEntry);
      } catch (error) {
        logger.error('Erro ao salvar log de auditoria no banco:', error);
      }
    }

    // Log adicional para casos de falha/erro
    if (result !== 'SUCCESS') {
      logger.warn(`Audit: ${action} failed`, {
        ip: requestInfo.ip,
        userId: requestInfo.userId,
        result,
        errorMessage
      });
    }
  }

  /**
   * Log específico para validação de CPF
   */
  public async logCpfValidation(
    req: Request,
    cpf: string,
    result: 'SUCCESS' | 'FAILURE' | 'ERROR',
    isRegistered?: boolean,
    errorMessage?: string
  ): Promise<void> {
    const maskedCpf = maskCpfForLog(cpf);
    
    await this.logAction(
      'CPF_VALIDATION',
      req,
      result,
      {
        cpf: maskedCpf,
        isRegistered: isRegistered || false,
        validationType: 'algorithm_check'
      },
      errorMessage
    );
  }

  /**
   * Log para tentativas de registro com CPF
   */
  public async logCpfRegistration(
    req: Request,
    cpf: string,
    email: string,
    result: 'SUCCESS' | 'FAILURE' | 'ERROR',
    errorMessage?: string
  ): Promise<void> {
    const maskedCpf = maskCpfForLog(cpf);
    
    await this.logAction(
      'CPF_REGISTRATION',
      req,
      result,
      {
        cpf: maskedCpf,
        email,
        registrationType: 'new_user'
      },
      errorMessage
    );
  }

  /**
   * Log para tentativas de login
   */
  public async logLoginAttempt(
    req: Request,
    email: string,
    result: 'SUCCESS' | 'FAILURE' | 'ERROR',
    errorMessage?: string,
    userId?: string
  ): Promise<void> {
    // Para login, criamos o log manualmente pois req.user pode não estar disponível
    const requestInfo = {
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      userId: userId, // Usar o userId fornecido
      userEmail: email,
    };

    const auditEntry: AuditLogEntry = {
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



    // Log estruturado para auditoria
    logger.info('AUDIT_LOG', {
      audit: auditEntry,
      level: 'audit',
      category: 'security'
    });

    // Salvar no banco de dados se há userId
    if (userId) {
      try {
        await this.saveToDatabase(auditEntry);
      } catch (error) {
        logger.error('Erro ao salvar log de auditoria no banco:', error);
      }
    }

    // Log adicional para casos de falha/erro
    if (result !== 'SUCCESS') {
      logger.warn(`Audit: LOGIN_ATTEMPT failed`, {
        ip: requestInfo.ip,
        userId: userId,
        result,
        errorMessage
      });
    }
  }

  /**
   * Log para ações administrativas
   */
  public async logAdminAction(
    req: Request,
    action: string,
    targetUserId?: string,
    details: Record<string, any> = {},
    result: 'SUCCESS' | 'FAILURE' | 'ERROR' = 'SUCCESS',
    errorMessage?: string
  ): Promise<void> {
    await this.logAction(
      `ADMIN_${action.toUpperCase()}`,
      req,
      result,
      {
        ...details,
        targetUserId,
        adminAction: true
      },
      errorMessage
    );
  }

  /**
   * Log para rate limiting
   */
  public async logRateLimit(
    req: Request,
    action: string,
    limit: number,
    windowMs: number
  ): Promise<void> {
    await this.logAction(
      'RATE_LIMIT_EXCEEDED',
      req,
      'FAILURE',
      {
        action,
        limit,
        windowMs,
        rateLimitType: 'ip_based'
      },
      `Rate limit exceeded for action: ${action}`
    );
  }

  /**
   * Log para tentativas suspeitas
   */
  public async logSuspiciousActivity(
    req: Request,
    activity: string,
    details: Record<string, any> = {},
    severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  ): Promise<void> {
    const requestInfo = this.extractRequestInfo(req);
    
    logger.warn('SUSPICIOUS_ACTIVITY', {
      activity,
      severity,
      ...requestInfo,
      details,
      timestamp: new Date(),
      category: 'security_alert'
    });

    await this.logAction(
      'SUSPICIOUS_ACTIVITY',
      req,
      'FAILURE',
      {
        activity,
        severity,
        ...details
      },
      `Suspicious activity detected: ${activity}`
    );
  }

  /**
   * Busca logs de auditoria (para interface administrativa)
   */
  public async getAuditLogs(
    filters: {
      action?: string;
      userId?: string;
      ip?: string;
      startDate?: Date;
      endDate?: Date;
      result?: 'SUCCESS' | 'FAILURE' | 'ERROR';
    } = {},
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    // Esta implementação seria conectada a um banco de dados ou sistema de logs
    // Por enquanto, retorna array vazio como placeholder
    logger.info('Audit logs requested', { filters, limit, offset });
    return [];
  }

  /**
   * Estatísticas de auditoria
   */
  public async getAuditStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    errorActions: number;
    topActions: Array<{ action: string; count: number }>;
    topIPs: Array<{ ip: string; count: number }>;
  }> {
    // Placeholder para estatísticas
    logger.info('Audit stats requested', { startDate, endDate });
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

export default AuditService;
