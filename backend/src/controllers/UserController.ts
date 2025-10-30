import { Request, Response } from 'express';
import { prisma } from '../config/database';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError
} from '../middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '../utils/logger';
import { UserRole, UserStatus, Permission } from '@prisma/client';
import bcrypt from 'bcryptjs';
import EmailService from '../services/emailService';

export class UserController {
  // Todas as permissões que um administrador deve ter
  private readonly ADMIN_PERMISSIONS: Permission[] = [
    Permission.READ_PUBLIC_DATA,
    Permission.READ_PRIVATE_DATA,
    Permission.WRITE_DATA,
    Permission.DELETE_DATA,
    Permission.CREATE_BIDDING,
    Permission.EDIT_BIDDING,
    Permission.DELETE_BIDDING,
    Permission.PUBLISH_BIDDING,
    Permission.CANCEL_BIDDING,
    Permission.CREATE_PROPOSAL,
    Permission.EDIT_PROPOSAL,
    Permission.DELETE_PROPOSAL,
    Permission.SUBMIT_PROPOSAL,
    Permission.CREATE_CONTRACT,
    Permission.EDIT_CONTRACT,
    Permission.SIGN_CONTRACT,
    Permission.TERMINATE_CONTRACT,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_CATEGORIES,
    Permission.GENERATE_REPORTS,
    Permission.EXPORT_DATA,
  ];

  /**
   * Concede todas as permissões de administrador para um usuário
   */
  private async grantAdminPermissions(userId: string): Promise<void> {
    for (const permission of this.ADMIN_PERMISSIONS) {
      await prisma.userPermission.upsert({
        where: {
          userId_permission: {
            userId,
            permission,
          },
        },
        update: {
          isActive: true,
          grantedAt: new Date(),
        },
        create: {
          userId,
          permission,
          grantedBy: userId, // Auto-concedido
          isActive: true,
        },
      });
    }
  }
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

    // Permitir que admins alterem status de outros usuários, incluindo outros admins
    // (Removida a restrição anterior para maior flexibilidade administrativa)

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

    // Enviar email de boas-vindas se o usuário foi ativado
    if (user.status !== UserStatus.ACTIVE && status === UserStatus.ACTIVE) {
      const emailService = EmailService.getInstance();
      await emailService.sendWelcomeEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        user.role
      );
    }

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

    // Se o usuário foi promovido a administrador, conceder todas as permissões
    if (role === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
      try {
        await this.grantAdminPermissions(id);
        logUserActivity(adminUserId, 'ADMIN_PERMISSIONS_GRANTED', {
          targetUserId: id,
          permissionsCount: this.ADMIN_PERMISSIONS.length,
        });
      } catch (error) {
        console.error('Erro ao conceder permissões de administrador:', error);
        // Não falhar a operação por causa das permissões
      }
    }

    logUserActivity(adminUserId, 'USER_ROLE_UPDATED', {
      targetUserId: id,
      oldRole: user.role,
      newRole: role,
    });

    res.json({
      success: true,
      message: role === UserRole.ADMIN && user.role !== UserRole.ADMIN
        ? 'Role do usuário atualizado com sucesso e permissões de administrador concedidas'
        : 'Role do usuário atualizado com sucesso',
      data: { user: updatedUser },
    });
  }

  // Atualizar dados básicos do usuário (apenas admin)
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { firstName, lastName, phone, email } = req.body;
    const adminUserId = req.user!.userId;

    // Validações básicas
    if (!firstName || !lastName || !email) {
      throw new ValidationError('Nome, sobrenome e email são obrigatórios');
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Verificar se o email já está em uso por outro usuário
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });

      if (emailExists) {
        throw new ValidationError('Este email já está sendo usado por outro usuário');
      }
    }

    // Atualizar dados do usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        email: email.trim().toLowerCase(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Log da atividade
    logUserActivity(adminUserId, 'USER_UPDATED', {
      targetUserId: id,
      changes: {
        firstName: existingUser.firstName !== firstName ? { old: existingUser.firstName, new: firstName } : undefined,
        lastName: existingUser.lastName !== lastName ? { old: existingUser.lastName, new: lastName } : undefined,
        phone: existingUser.phone !== phone ? { old: existingUser.phone, new: phone } : undefined,
        email: existingUser.email !== email ? { old: existingUser.email, new: email } : undefined,
      },
    });

    res.json({
      success: true,
      message: 'Dados do usuário atualizados com sucesso',
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

    // Permitir que admins excluam outros usuários, incluindo outros admins
    // (Removida a restrição anterior para maior flexibilidade administrativa)
    // Apenas impedir que um admin exclua a si mesmo para evitar lockout
    if (user.id === adminUserId) {
      throw new AuthorizationError('Não é possível excluir sua própria conta');
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

  // Reset de senha (apenas admin)
  async resetPassword(req: Request, res: Response) {
    const { id } = req.params;
    const { newPassword } = req.body; // Nova funcionalidade: aceitar senha personalizada
    const adminUserId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Permitir que admins resetem senhas de outros usuários, incluindo outros admins
    // (Removida a restrição anterior para maior flexibilidade administrativa)

    let passwordToUse: string;

    if (newPassword) {
      // Usar senha personalizada fornecida pelo admin
      if (newPassword.length < 8) {
        throw new ValidationError('A senha deve ter pelo menos 8 caracteres');
      }
      passwordToUse = newPassword;
    } else {
      // Gerar nova senha temporária se não foi fornecida
      passwordToUse = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    }

    const hashedPassword = await bcrypt.hash(passwordToUse, 12);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword
      },
    });

    logUserActivity(adminUserId, 'USER_PASSWORD_RESET', {
      targetUserId: id,
      targetUserEmail: user.email,
      customPassword: !!newPassword
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso.',
      data: newPassword ? {} : { tempPassword: passwordToUse } // Só retorna senha se foi gerada automaticamente
    });
  }

  // Criar novo usuário (apenas admin)
  async createUser(req: Request, res: Response) {
    const { email, firstName, lastName, phone, cpf, password, role } = req.body;
    const adminUserId = req.user!.userId;

    // Validar role
    if (!Object.values(UserRole).includes(role)) {
      throw new ValidationError('Role inválido');
    }

    // Validar campos obrigatórios
    if (!email || !firstName || !lastName || !phone || !role) {
      throw new ValidationError('Todos os campos são obrigatórios');
    }

    // Verificar se email já existe
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ConflictError('Email já está em uso');
    }

    // Verificar se CPF já existe (se fornecido)
    if (cpf) {
      const existingUserByCpf = await prisma.user.findUnique({
        where: { cpf },
      });

      if (existingUserByCpf) {
        throw new ConflictError('CPF já cadastrado');
      }
    }

    let passwordToUse: string;

    if (password) {
      // Usar senha fornecida pelo admin
      if (password.length < 8) {
        throw new ValidationError('A senha deve ter pelo menos 8 caracteres');
      }
      passwordToUse = password;
    } else {
      // Gerar senha temporária se não foi fornecida
      passwordToUse = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    }

    const hashedPassword = await bcrypt.hash(passwordToUse, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        cpf: cpf || null,
        role,
        password: hashedPassword,
        status: UserStatus.ACTIVE
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        cpf: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Se o usuário criado é administrador, conceder todas as permissões
    if (role === UserRole.ADMIN) {
      try {
        await this.grantAdminPermissions(newUser.id);
        logUserActivity(adminUserId, 'ADMIN_PERMISSIONS_GRANTED', {
          targetUserId: newUser.id,
          permissionsCount: this.ADMIN_PERMISSIONS.length,
        });
      } catch (error) {
        console.error('Erro ao conceder permissões de administrador:', error);
        // Não falhar a operação por causa das permissões
      }
    }

    logUserActivity(adminUserId, 'USER_CREATED', {
      targetUserId: newUser.id,
      targetUserEmail: newUser.email,
      targetUserRole: newUser.role,
      hasCpf: !!cpf,
      customPassword: !!password
    });

    res.status(201).json({
      success: true,
      message: role === UserRole.ADMIN
        ? 'Usuário administrador criado com sucesso e permissões concedidas.'
        : 'Usuário criado com sucesso.',
      data: {
        user: newUser,
        ...(password ? {} : { tempPassword: passwordToUse }) // Só retorna senha se foi gerada automaticamente
      },
    });
  }

  // Verificar permissões de um usuário (apenas admin)
  async getUserPermissions(req: Request, res: Response) {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        permissions: {
          where: { isActive: true },
          select: {
            permission: true,
            grantedAt: true,
            grantedBy: true,
          },
          orderBy: { permission: 'asc' }
        }
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    res.json({
      success: true,
      message: 'Permissões do usuário obtidas com sucesso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
        },
        permissions: user.permissions,
        permissionsCount: user.permissions.length,
        hasAllAdminPermissions: user.role === UserRole.ADMIN && user.permissions.length === this.ADMIN_PERMISSIONS.length,
      },
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
