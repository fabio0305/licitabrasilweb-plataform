import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError 
} from '../middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '../utils/logger';

export class AdminController {
  // Obter configurações do sistema
  async getConfig(req: Request, res: Response) {
    const configs = await prisma.systemConfig.findMany({
      where: {
        isPublic: true,
      },
      orderBy: {
        key: 'asc',
      },
    });

    // Converter array em objeto para facilitar o uso
    const configObject = configs.reduce((acc, config) => {
      let value: any = config.value;
      
      // Converter valores baseado no tipo
      switch (config.type) {
        case 'number':
          value = Number(config.value);
          break;
        case 'boolean':
          value = config.value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(config.value);
          } catch {
            value = config.value;
          }
          break;
        default:
          value = config.value;
      }

      acc[config.key] = {
        value,
        type: config.type,
        description: config.description,
      };
      return acc;
    }, {} as Record<string, any>);

    res.json({
      success: true,
      data: { config: configObject },
    });
  }

  // Atualizar configurações do sistema
  async updateConfig(req: Request, res: Response) {
    const { configs } = req.body;
    const userId = req.user!.userId;

    if (!configs || typeof configs !== 'object') {
      throw new ValidationError('Configurações inválidas');
    }

    const updates = [];

    for (const [key, configData] of Object.entries(configs as Record<string, any>)) {
      const { value, type = 'string', description } = configData;

      // Validar tipo
      let stringValue: string;
      switch (type) {
        case 'number':
          if (isNaN(Number(value))) {
            throw new ValidationError(`Valor inválido para configuração ${key}: deve ser um número`);
          }
          stringValue = String(value);
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new ValidationError(`Valor inválido para configuração ${key}: deve ser um boolean`);
          }
          stringValue = String(value);
          break;
        case 'json':
          try {
            JSON.stringify(value);
            stringValue = JSON.stringify(value);
          } catch {
            throw new ValidationError(`Valor inválido para configuração ${key}: deve ser um JSON válido`);
          }
          break;
        default:
          stringValue = String(value);
      }

      updates.push(
        prisma.systemConfig.upsert({
          where: { key },
          update: {
            value: stringValue,
            type,
            description,
          },
          create: {
            key,
            value: stringValue,
            type,
            description,
            isPublic: true,
          },
        })
      );
    }

    await Promise.all(updates);

    logUserActivity(userId, 'SYSTEM_CONFIG_UPDATED', { 
      configKeys: Object.keys(configs),
    });

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
    });
  }

  // Obter logs de auditoria
  async getAuditLogs(req: Request, res: Response) {
    const { 
      page = 1, 
      limit = 50, 
      userId, 
      action, 
      resource, 
      startDate, 
      endDate 
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (action) {
      where.action = { contains: action as string, mode: 'insensitive' };
    }

    if (resource) {
      where.resource = { contains: resource as string, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const startTime = Date.now();

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: offset,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'audit_logs', Date.now() - startTime);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  }

  // Obter estatísticas administrativas
  async getStatistics(req: Request, res: Response) {
    const [
      userStats,
      supplierStats,
      publicEntityStats,
      biddingStats,
      proposalStats,
      contractStats,
      recentActivity,
    ] = await Promise.all([
      // Estatísticas de usuários
      Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { status: 'PENDING' } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true },
        }),
      ]),
      // Estatísticas de fornecedores
      Promise.all([
        prisma.supplier.count(),
        prisma.supplier.count({ where: { isActive: true } }),
        prisma.supplier.count({ where: { verifiedAt: { not: null } } }),
      ]),
      // Estatísticas de órgãos públicos
      Promise.all([
        prisma.publicEntity.count(),
        prisma.publicEntity.count({ where: { isActive: true } }),
        prisma.publicEntity.count({ where: { verifiedAt: { not: null } } }),
      ]),
      // Estatísticas de licitações
      Promise.all([
        prisma.bidding.count(),
        prisma.bidding.count({ where: { status: 'OPEN' } }),
        prisma.bidding.count({ where: { status: 'CLOSED' } }),
        prisma.bidding.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
      ]),
      // Estatísticas de propostas
      Promise.all([
        prisma.proposal.count(),
        prisma.proposal.count({ where: { status: 'SUBMITTED' } }),
        prisma.proposal.count({ where: { status: 'ACCEPTED' } }),
        prisma.proposal.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
      ]),
      // Estatísticas de contratos
      Promise.all([
        prisma.contract.count(),
        prisma.contract.count({ where: { status: 'ACTIVE' } }),
        prisma.contract.count({ where: { status: 'COMPLETED' } }),
        prisma.contract.aggregate({
          _sum: { totalValue: true },
        }),
      ]),
      // Atividade recente (últimos 30 dias)
      Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.bidding.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.proposal.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.contract.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]),
    ]);

    const statistics = {
      users: {
        total: userStats[0],
        active: userStats[1],
        pending: userStats[2],
        byRole: userStats[3].reduce((acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        }, {} as Record<string, number>),
      },
      suppliers: {
        total: supplierStats[0],
        active: supplierStats[1],
        verified: supplierStats[2],
      },
      publicEntities: {
        total: publicEntityStats[0],
        active: publicEntityStats[1],
        verified: publicEntityStats[2],
      },
      biddings: {
        total: biddingStats[0],
        open: biddingStats[1],
        closed: biddingStats[2],
        byStatus: biddingStats[3].reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
      },
      proposals: {
        total: proposalStats[0],
        submitted: proposalStats[1],
        accepted: proposalStats[2],
        byStatus: proposalStats[3].reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
      },
      contracts: {
        total: contractStats[0],
        active: contractStats[1],
        completed: contractStats[2],
        totalValue: contractStats[3]._sum.totalValue || 0,
      },
      recentActivity: {
        newUsers: recentActivity[0],
        newBiddings: recentActivity[1],
        newProposals: recentActivity[2],
        newContracts: recentActivity[3],
      },
    };

    res.json({
      success: true,
      data: { statistics },
    });
  }

  // Iniciar backup do sistema
  async createBackup(req: Request, res: Response) {
    const userId = req.user!.userId;

    // Em um sistema real, isso iniciaria um processo de backup assíncrono
    // Por enquanto, vamos simular o processo
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date().toISOString();

    logUserActivity(userId, 'BACKUP_INITIATED', {
      backupId,
      timestamp,
    });

    // Simular criação de backup
    // Em produção, isso seria um job assíncrono que:
    // 1. Faria dump do banco de dados
    // 2. Compactaria arquivos de upload
    // 3. Armazenaria em local seguro
    // 4. Atualizaria status do backup

    res.json({
      success: true,
      message: 'Backup iniciado com sucesso',
      data: {
        backupId,
        status: 'INITIATED',
        timestamp,
        estimatedDuration: '15-30 minutes',
      },
    });
  }

  // Obter status do backup
  async getBackupStatus(req: Request, res: Response) {
    // Em um sistema real, isso consultaria o status real do backup
    // Por enquanto, vamos simular diferentes status
    const mockBackups = [
      {
        id: 'backup_1703123456789',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        size: '2.5 GB',
        duration: '18 minutes',
      },
      {
        id: 'backup_1703037056789',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        size: '2.4 GB',
        duration: '16 minutes',
      },
      {
        id: 'backup_1702950656789',
        status: 'FAILED',
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        error: 'Insufficient disk space',
      },
    ];

    res.json({
      success: true,
      data: {
        backups: mockBackups,
        lastBackup: mockBackups[0],
        nextScheduledBackup: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  // Moderar licitação
  async moderateBidding(req: Request, res: Response) {
    const { id } = req.params;
    const { action, reason } = req.body;
    const userId = req.user!.userId;

    if (!['approve', 'reject', 'suspend'].includes(action)) {
      throw new ValidationError('Ação inválida');
    }

    const bidding = await prisma.bidding.findUnique({
      where: { id },
      include: {
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!bidding) {
      throw new NotFoundError('Licitação não encontrada');
    }

    let newStatus;
    let message;

    switch (action) {
      case 'approve':
        newStatus = 'PUBLISHED';
        message = 'Licitação aprovada com sucesso';
        break;
      case 'reject':
        newStatus = 'CANCELLED';
        message = 'Licitação rejeitada com sucesso';
        break;
      case 'suspend':
        newStatus = 'CANCELLED';
        message = 'Licitação suspensa com sucesso';
        break;
    }

    const updatedBidding = await prisma.bidding.update({
      where: { id },
      data: { status: newStatus },
      include: {
        publicEntity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logUserActivity(userId, 'BIDDING_MODERATED', {
      biddingId: id,
      action,
      reason,
      oldStatus: bidding.status,
      newStatus,
    });

    res.json({
      success: true,
      message,
      data: { bidding: updatedBidding },
    });
  }

  // Obter dashboard de moderação
  async getModerationDashboard(req: Request, res: Response) {
    const [
      pendingBiddings,
      recentReports,
      suspendedUsers,
      flaggedContent,
    ] = await Promise.all([
      prisma.bidding.count({
        where: { status: 'DRAFT' },
      }),
      // Em um sistema real, haveria uma tabela de reports/denúncias
      Promise.resolve(0),
      prisma.user.count({
        where: { status: 'SUSPENDED' },
      }),
      // Em um sistema real, haveria conteúdo flagged
      Promise.resolve(0),
    ]);

    const dashboard = {
      pendingBiddings,
      recentReports,
      suspendedUsers,
      flaggedContent,
      totalPendingActions: pendingBiddings + recentReports + flaggedContent,
    };

    res.json({
      success: true,
      data: { dashboard },
    });
  }
}
