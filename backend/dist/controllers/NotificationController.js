"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
class NotificationController {
    async list(req, res) {
        const { page = 1, limit = 20, unreadOnly = false, type } = req.query;
        const userId = req.user.userId;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {
            userId,
        };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }
        if (type) {
            where.type = type;
        }
        const startTime = Date.now();
        const [notifications, total, unreadCount] = await Promise.all([
            database_1.prisma.notification.findMany({
                where,
                skip: offset,
                take: Number(limit),
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.notification.count({ where }),
            database_1.prisma.notification.count({
                where: {
                    userId,
                    isRead: false,
                },
            }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'notifications', Date.now() - startTime);
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
    async getById(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const notification = await database_1.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification) {
            throw new errorHandler_1.NotFoundError('Notificação não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && notification.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para acessar esta notificação');
        }
        res.json({
            success: true,
            data: { notification },
        });
    }
    async markAsRead(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const notification = await database_1.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification) {
            throw new errorHandler_1.NotFoundError('Notificação não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && notification.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para marcar esta notificação como lida');
        }
        if (notification.isRead) {
            return res.json({
                success: true,
                message: 'Notificação já estava marcada como lida',
                data: { notification },
            });
        }
        const updatedNotification = await database_1.prisma.notification.update({
            where: { id },
            data: {
                isRead: true,
            },
        });
        (0, logger_1.logUserActivity)(userId, 'NOTIFICATION_READ', {
            notificationId: id,
            notificationType: notification.type,
        });
        res.json({
            success: true,
            message: 'Notificação marcada como lida',
            data: { notification: updatedNotification },
        });
    }
    async markAllAsRead(req, res) {
        const userId = req.user.userId;
        const result = await database_1.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        (0, logger_1.logUserActivity)(userId, 'ALL_NOTIFICATIONS_READ', {
            count: result.count,
        });
        res.json({
            success: true,
            message: `${result.count} notificações marcadas como lidas`,
            data: { count: result.count },
        });
    }
    async delete(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const notification = await database_1.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification) {
            throw new errorHandler_1.NotFoundError('Notificação não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && notification.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para excluir esta notificação');
        }
        await database_1.prisma.notification.delete({
            where: { id },
        });
        (0, logger_1.logUserActivity)(userId, 'NOTIFICATION_DELETED', {
            notificationId: id,
            notificationType: notification.type,
        });
        res.json({
            success: true,
            message: 'Notificação excluída com sucesso',
        });
    }
    async deleteAllRead(req, res) {
        const userId = req.user.userId;
        const result = await database_1.prisma.notification.deleteMany({
            where: {
                userId,
                isRead: true,
            },
        });
        (0, logger_1.logUserActivity)(userId, 'ALL_READ_NOTIFICATIONS_DELETED', {
            count: result.count,
        });
        res.json({
            success: true,
            message: `${result.count} notificações lidas foram excluídas`,
            data: { count: result.count },
        });
    }
    async create(req, res) {
        const { userId: targetUserId, type, title, message, data, } = req.body;
        const adminUserId = req.user.userId;
        const targetUser = await database_1.prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, email: true },
        });
        if (!targetUser) {
            throw new errorHandler_1.NotFoundError('Usuário não encontrado');
        }
        const notification = await database_1.prisma.notification.create({
            data: {
                userId: targetUserId,
                type,
                title,
                message,
                data: data || null,
            },
        });
        (0, logger_1.logUserActivity)(adminUserId, 'NOTIFICATION_CREATED', {
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
    async getStatistics(req, res) {
        const [totalNotifications, unreadNotifications, notificationsByType, recentNotifications,] = await Promise.all([
            database_1.prisma.notification.count(),
            database_1.prisma.notification.count({
                where: { isRead: false },
            }),
            database_1.prisma.notification.groupBy({
                by: ['type'],
                _count: { type: true },
            }),
            database_1.prisma.notification.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
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
            }, {}),
        };
        res.json({
            success: true,
            data: { statistics },
        });
    }
    async sendBulk(req, res) {
        const { userIds, type, title, message, data, } = req.body;
        const adminUserId = req.user.userId;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new errorHandler_1.ValidationError('Lista de usuários é obrigatória');
        }
        const users = await database_1.prisma.user.findMany({
            where: {
                id: { in: userIds },
            },
            select: { id: true },
        });
        if (users.length !== userIds.length) {
            throw new errorHandler_1.ValidationError('Alguns usuários não foram encontrados');
        }
        const notifications = userIds.map(userId => ({
            userId,
            type,
            title,
            message,
            data: data ? JSON.stringify(data) : null,
        }));
        const result = await database_1.prisma.notification.createMany({
            data: notifications,
        });
        (0, logger_1.logUserActivity)(adminUserId, 'BULK_NOTIFICATIONS_SENT', {
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
exports.NotificationController = NotificationController;
//# sourceMappingURL=NotificationController.js.map