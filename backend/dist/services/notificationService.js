"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@/config/database");
const logger_1 = require("@/utils/logger");
const client_1 = require("@prisma/client");
class NotificationService {
    constructor() { }
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    setWebSocketService(websocketService) {
        this.websocketService = websocketService;
    }
    async createNotification(data) {
        try {
            if (!data.userId) {
                throw new Error('userId é obrigatório para notificação individual');
            }
            const notification = await database_1.prisma.notification.create({
                data: {
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    userId: data.userId,
                    data: data.metadata ? JSON.stringify(data.metadata) : null,
                },
            });
            if (this.websocketService) {
                this.websocketService.notifyUser(data.userId, 'new-notification', {
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    createdAt: notification.createdAt,
                    metadata: data.metadata,
                });
            }
            logger_1.logger.info(`Notificação criada para usuário ${data.userId}: ${data.title}`);
        }
        catch (error) {
            logger_1.logger.error('Erro ao criar notificação:', error);
            throw error;
        }
    }
    async createBulkNotifications(data) {
        try {
            const notifications = data.userIds.map(userId => ({
                title: data.title,
                message: data.message,
                type: data.type,
                userId,
                relatedId: data.relatedId,
                relatedType: data.relatedType,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            }));
            await database_1.prisma.notification.createMany({
                data: notifications,
            });
            if (this.websocketService) {
                data.userIds.forEach(userId => {
                    this.websocketService.notifyUser(userId, 'new-notification', {
                        title: data.title,
                        message: data.message,
                        type: data.type,
                        createdAt: new Date(),
                        metadata: data.metadata,
                    });
                });
            }
            logger_1.logger.info(`${notifications.length} notificações criadas em lote: ${data.title}`);
        }
        catch (error) {
            logger_1.logger.error('Erro ao criar notificações em lote:', error);
            throw error;
        }
    }
    async notifyNewBidding(biddingId, biddingTitle) {
        try {
            const suppliers = await database_1.prisma.user.findMany({
                where: {
                    role: client_1.UserRole.SUPPLIER,
                    status: 'ACTIVE',
                },
                select: { id: true },
            });
            const supplierIds = suppliers.map(s => s.id);
            await this.createBulkNotifications({
                title: 'Nova Licitação Disponível',
                message: `Uma nova licitação foi publicada: ${biddingTitle}`,
                type: 'BIDDING_PUBLISHED',
                userIds: supplierIds,
                relatedId: biddingId,
                relatedType: 'bidding',
                metadata: { biddingId, biddingTitle },
            });
            if (this.websocketService) {
                this.websocketService.notifyRole(client_1.UserRole.SUPPLIER, 'new-bidding', {
                    biddingId,
                    title: biddingTitle,
                    message: `Nova licitação disponível: ${biddingTitle}`,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Erro ao notificar nova licitação:', error);
        }
    }
    async notifyProposalReceived(publicEntityUserId, biddingTitle, supplierName, proposalId) {
        try {
            await this.createNotification({
                title: 'Nova Proposta Recebida',
                message: `${supplierName} enviou uma proposta para a licitação "${biddingTitle}"`,
                type: 'PROPOSAL_SUBMITTED',
                userId: publicEntityUserId,
                relatedId: proposalId,
                relatedType: 'proposal',
                metadata: { proposalId, supplierName, biddingTitle },
            });
        }
        catch (error) {
            logger_1.logger.error('Erro ao notificar proposta recebida:', error);
        }
    }
    async notifyProposalStatusChange(supplierUserId, biddingTitle, status, proposalId) {
        try {
            const statusMessages = {
                ACCEPTED: 'Sua proposta foi aceita!',
                REJECTED: 'Sua proposta foi rejeitada.',
                UNDER_REVIEW: 'Sua proposta está em análise.',
            };
            const message = statusMessages[status] ||
                `Status da sua proposta foi alterado para: ${status}`;
            await this.createNotification({
                title: 'Status da Proposta Atualizado',
                message: `${message} Licitação: "${biddingTitle}"`,
                type: 'PROPOSAL_STATUS_CHANGED',
                userId: supplierUserId,
                relatedId: proposalId,
                relatedType: 'proposal',
                metadata: { proposalId, status, biddingTitle },
            });
        }
        catch (error) {
            logger_1.logger.error('Erro ao notificar mudança de status da proposta:', error);
        }
    }
    async notifyBiddingClosingSoon(biddingId, biddingTitle, hoursLeft) {
        try {
            const proposals = await database_1.prisma.proposal.findMany({
                where: { biddingId },
                include: {
                    supplier: {
                        include: { user: true },
                    },
                },
            });
            const participantIds = proposals.map(p => p.supplier.userId);
            if (participantIds.length > 0) {
                await this.createBulkNotifications({
                    title: 'Licitação Fechando em Breve',
                    message: `A licitação "${biddingTitle}" fecha em ${hoursLeft} horas`,
                    type: 'BIDDING_CLOSING_SOON',
                    userIds: participantIds,
                    relatedId: biddingId,
                    relatedType: 'bidding',
                    metadata: { biddingId, biddingTitle, hoursLeft },
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Erro ao notificar licitação fechando:', error);
        }
    }
    async notifyAdmins(title, message, type, metadata) {
        try {
            const admins = await database_1.prisma.user.findMany({
                where: {
                    role: client_1.UserRole.ADMIN,
                    status: 'ACTIVE',
                },
                select: { id: true },
            });
            const adminIds = admins.map(a => a.id);
            await this.createBulkNotifications({
                title,
                message,
                type,
                userIds: adminIds,
                metadata,
            });
            if (this.websocketService) {
                this.websocketService.notifyAdmins('admin-notification', {
                    title,
                    message,
                    type,
                    metadata,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Erro ao notificar administradores:', error);
        }
    }
    async markAsRead(notificationId, userId) {
        try {
            await database_1.prisma.notification.updateMany({
                where: {
                    id: notificationId,
                    userId,
                },
                data: {
                    isRead: true,
                },
            });
            logger_1.logger.info(`Notificação ${notificationId} marcada como lida pelo usuário ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Erro ao marcar notificação como lida:', error);
            throw error;
        }
    }
    async markAllAsRead(userId) {
        try {
            await database_1.prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            });
            logger_1.logger.info(`Todas as notificações marcadas como lidas para usuário ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Erro ao marcar todas as notificações como lidas:', error);
            throw error;
        }
    }
    async getNotificationStats(userId) {
        try {
            const [total, unread, byType] = await Promise.all([
                database_1.prisma.notification.count({
                    where: { userId },
                }),
                database_1.prisma.notification.count({
                    where: { userId, isRead: false },
                }),
                database_1.prisma.notification.groupBy({
                    by: ['type'],
                    where: { userId },
                    _count: { type: true },
                }),
            ]);
            return {
                total,
                unread,
                byType: byType.reduce((acc, item) => {
                    acc[item.type] = item._count.type;
                    return acc;
                }, {}),
            };
        }
        catch (error) {
            logger_1.logger.error('Erro ao obter estatísticas de notificações:', error);
            throw error;
        }
    }
}
exports.default = NotificationService;
//# sourceMappingURL=notificationService.js.map