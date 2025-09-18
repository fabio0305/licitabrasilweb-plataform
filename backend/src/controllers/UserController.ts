import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  AuthorizationError 
} from '@/middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '@/utils/logger';
import { UserRole, UserStatus } from '@prisma/client';

export class UserController {
  // Listar usuários (apenas admin)
  async list(req: Request, res: Response) {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as string;
    }

    if (status) {
      where.status = status as string;
    }

    const startTime = Date.now();

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          supplier: {
            select: {
              id: true,
              companyName: true,
              cnpj: true,
              isActive: true,
              verifiedAt: true,
            },
          },
          publicEntity: {
            select: {
              id: true,
              name: true,
              cnpj: true,
              entityType: true,
              isActive: true,
              verifiedAt: true,
            },
          },
          _count: {
            select: {
              auditLogs: true,
              sessions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    logDatabaseOperation('SELECT', 'users', Date.now() - startTime);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        users,
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

  // Obter usuário por ID (apenas admin)
  async getById(req: Request, res: Response) {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        supplier: {
          include: {
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
            _count: {
              select: {
                proposals: true,
                contracts: true,
              },
            },
          },
        },
        publicEntity: {
          include: {
            _count: {
              select: {
                biddings: true,
                contracts: true,
              },
            },
          },
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            resource: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        sessions: {
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
            expiresAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            auditLogs: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    res.json({
      success: true,
      data: { user },
    });
  }

  // Alterar status do usuário (apenas admin)
  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    const adminUserId = req.user!.userId;

    // Validar status
    if (!Object.values(UserStatus).includes(status)) {
      throw new ValidationError('Status inválido');
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Não permitir alterar status de outros admins
    if (user.role === UserRole.ADMIN && user.id !== adminUserId) {
      throw new AuthorizationError('Não é possível alterar status de outros administradores');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    logUserActivity(adminUserId, 'USER_STATUS_UPDATED', { 
      targetUserId: id,
      oldStatus: user.status,
      newStatus: status,
    });

    res.json({
      success: true,
      message: 'Status do usuário atualizado com sucesso',
      data: { user: updatedUser },
    });
  }

  // Alterar role do usuário (apenas admin)
  async updateRole(req: Request, res: Response) {
    const { id } = req.params;
    const { role } = req.body;
    const adminUserId = req.user!.userId;

    // Validar role
    if (!Object.values(UserRole).includes(role)) {
      throw new ValidationError('Role inválido');
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        supplier: { select: { id: true } },
        publicEntity: { select: { id: true } },
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Não permitir alterar role de outros admins
    if (user.role === UserRole.ADMIN && user.id !== adminUserId) {
      throw new AuthorizationError('Não é possível alterar role de outros administradores');
    }

    // Verificar se a mudança de role é compatível com perfis existentes
    if (role === UserRole.SUPPLIER && user.publicEntity) {
      throw new ValidationError('Usuário possui perfil de órgão público e não pode ser fornecedor');
    }

    if (role === UserRole.PUBLIC_ENTITY && user.supplier) {
      throw new ValidationError('Usuário possui perfil de fornecedor e não pode ser órgão público');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    logUserActivity(adminUserId, 'USER_ROLE_UPDATED', { 
      targetUserId: id,
      oldRole: user.role,
      newRole: role,
    });

    res.json({
      success: true,
      message: 'Role do usuário atualizado com sucesso',
      data: { user: updatedUser },
    });
  }

  // Excluir usuário (apenas admin)
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const adminUserId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        supplier: {
          include: {
            proposals: { select: { id: true } },
            contracts: { select: { id: true } },
          },
        },
        publicEntity: {
          include: {
            biddings: { select: { id: true } },
            contracts: { select: { id: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Não permitir excluir outros admins
    if (user.role === UserRole.ADMIN && user.id !== adminUserId) {
      throw new AuthorizationError('Não é possível excluir outros administradores');
    }

    // Verificar se o usuário tem dados associados que impedem a exclusão
    const hasAssociatedData = 
      (user.supplier && (user.supplier.proposals.length > 0 || user.supplier.contracts.length > 0)) ||
      (user.publicEntity && (user.publicEntity.biddings.length > 0 || user.publicEntity.contracts.length > 0));

    if (hasAssociatedData) {
      throw new ValidationError('Não é possível excluir usuário com propostas, licitações ou contratos associados');
    }

    await prisma.user.delete({
      where: { id },
    });

    logUserActivity(adminUserId, 'USER_DELETED', { 
      targetUserId: id,
      targetUserEmail: user.email,
      targetUserRole: user.role,
    });

    res.json({
      success: true,
      message: 'Usuário excluído com sucesso',
    });
  }

  // Obter estatísticas de usuários (apenas admin)
  async getStatistics(req: Request, res: Response) {
    const [
      totalUsers,
      usersByRole,
      usersByStatus,
      recentUsers,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true,
        },
      }),
      prisma.user.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // últimos 30 dias
          },
        },
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // últimos 30 dias
          },
        },
      }),
    ]);

    const statistics = {
      total: totalUsers,
      recent: recentUsers,
      active: activeUsers,
      byRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
      byStatus: usersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      success: true,
      data: { statistics },
    });
  }
}
