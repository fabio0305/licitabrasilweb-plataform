import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '@/middleware/errorHandler';
import { logUserActivity, logDatabaseOperation } from '@/utils/logger';
import { UserRole } from '@prisma/client';

export class NotificationController {
  // Listar notificações do usuário
  async list(req: Request, res: Response) {
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;
    const userId = req.user!.userId;
    const offset = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {
      userId,
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    if (type) {
      where.type = type as string;
    }

    const startTime = Date.now();

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: offset,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    logDatabaseOperation('SELECT', 'notifications', Date.now() - startTime);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
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

  // Obter notificação por ID
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError('Notificação não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && notification.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para acessar esta notificação');
    }

    res.json({
      success: true,
      data: { notification },
    });
  }

  // Marcar notificação como lida
  async markAsRead(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError('Notificação não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && notification.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para marcar esta notificação como lida');
    }

    // Se já foi lida, não fazer nada
    if (notification.isRead) {
      return res.json({
        success: true,
        message: 'Notificação já estava marcada como lida',
        data: { notification },
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
      },
    });

    logUserActivity(userId, 'NOTIFICATION_READ', { 
      notificationId: id,
      notificationType: notification.type,
    });

    res.json({
      success: true,
      message: 'Notificação marcada como lida',
      data: { notification: updatedNotification },
    });
  }

  // Marcar todas as notificações como lidas
  async markAllAsRead(req: Request, res: Response) {
    const userId = req.user!.userId;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    logUserActivity(userId, 'ALL_NOTIFICATIONS_READ', { 
      count: result.count,
    });

    res.json({
      success: true,
      message: `${result.count} notificações marcadas como lidas`,
      data: { count: result.count },
    });
  }

  // Excluir notificação
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError('Notificação não encontrada');
    }

    // Verificar permissões
    if (userRole !== UserRole.ADMIN && notification.userId !== userId) {
      throw new AuthorizationError('Você não tem permissão para excluir esta notificação');
    }

    await prisma.notification.delete({
      where: { id },
    });

    logUserActivity(userId, 'NOTIFICATION_DELETED', { 
      notificationId: id,
      notificationType: notification.type,
    });

    res.json({
      success: true,
      message: 'Notificação excluída com sucesso',
    });
  }

  // Excluir todas as notificações lidas
  async deleteAllRead(req: Request, res: Response) {
    const userId = req.user!.userId;

    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    logUserActivity(userId, 'ALL_READ_NOTIFICATIONS_DELETED', { 
      count: result.count,
    });

    res.json({
      success: true,
      message: `${result.count} notificações lidas foram excluídas`,
      data: { count: result.count },
    });
  }

  // Criar notificação (apenas admin ou sistema)
  async create(req: Request, res: Response) {
    const {
      userId: targetUserId,
      type,
      title,
      message,
      data,
    } = req.body;
    const adminUserId = req.user!.userId;

    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      throw new NotFoundError('Usuário não encontrado');
    }

    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        type,
        title,
        message,
        data: data || null,
      },
    });

    logUserActivity(adminUserId, 'NOTIFICATION_CREATED', { 
      notificationId: notification.id,
      targetUserId,
      type,
    });

    res.status(201).json({
      success: true,
      message: 'Notificação criada com sucesso',
      data: { notification },
    });
  }

  // Obter estatísticas de notificações (apenas admin)
  async getStatistics(req: Request, res: Response) {
    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      recentNotifications,
    ] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({
        where: { isRead: false },
      }),
      prisma.notification.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      prisma.notification.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24 horas
          },
        },
      }),
    ]);

    const statistics = {
      total: totalNotifications,
      unread: unreadNotifications,
      recent: recentNotifications,
      byType: notificationsByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      success: true,
      data: { statistics },
    });
  }

  // Enviar notificação em massa (apenas admin)
  async sendBulk(req: Request, res: Response) {
    const {
      userIds,
      type,
      title,
      message,
      data,
    } = req.body;
    const adminUserId = req.user!.userId;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new ValidationError('Lista de usuários é obrigatória');
    }

    // Verificar se todos os usuários existem
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: { id: true },
    });

    if (users.length !== userIds.length) {
      throw new ValidationError('Alguns usuários não foram encontrados');
    }

    // Criar notificações em lote
    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
    }));

    const result = await prisma.notification.createMany({
      data: notifications,
    });

    logUserActivity(adminUserId, 'BULK_NOTIFICATIONS_SENT', { 
      count: result.count,
      type,
      userIds,
    });

    res.status(201).json({
      success: true,
      message: `${result.count} notificações enviadas com sucesso`,
      data: { count: result.count },
    });
  }
}
