import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';
import WebSocketService from './websocket';
import EmailService from './emailService';

interface NotificationData {
  title: string;
  message: string;
  type: string;
  userId?: string;
  relatedId?: string;
  relatedType?: string;
  metadata?: any;
}

interface BulkNotificationData {
  title: string;
  message: string;
  type: string;
  userIds: string[];
  relatedId?: string;
  relatedType?: string;
  metadata?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private websocketService?: WebSocketService;
  private emailService: EmailService;

  private constructor() {
    this.emailService = EmailService.getInstance();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public setWebSocketService(websocketService: WebSocketService) {
    this.websocketService = websocketService;
  }

  // Criar notificação individual
  public async createNotification(data: NotificationData): Promise<void> {
    try {
      if (!data.userId) {
        throw new Error('userId é obrigatório para notificação individual');
      }

      const notification = await prisma.notification.create({
        data: {
          title: data.title,
          message: data.message,
          type: data.type,
          userId: data.userId,
          data: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      // Enviar via WebSocket se disponível
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

      logger.info(`Notificação criada para usuário ${data.userId}: ${data.title}`);
    } catch (error) {
      logger.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  // Criar notificações em lote
  public async createBulkNotifications(data: BulkNotificationData): Promise<void> {
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

      await prisma.notification.createMany({
        data: notifications,
      });

      // Enviar via WebSocket para cada usuário
      if (this.websocketService) {
        data.userIds.forEach(userId => {
          this.websocketService!.notifyUser(userId, 'new-notification', {
            title: data.title,
            message: data.message,
            type: data.type,
            createdAt: new Date(),
            metadata: data.metadata,
          });
        });
      }

      logger.info(`${notifications.length} notificações criadas em lote: ${data.title}`);
    } catch (error) {
      logger.error('Erro ao criar notificações em lote:', error);
      throw error;
    }
  }

  // Notificar sobre nova licitação
  public async notifyNewBidding(biddingId: string, biddingTitle: string): Promise<void> {
    try {
      // Buscar todos os fornecedores ativos com emails
      const suppliers = await prisma.user.findMany({
        where: {
          role: UserRole.SUPPLIER,
          status: 'ACTIVE',
        },
        select: { id: true, email: true },
      });

      const supplierIds = suppliers.map(s => s.id);
      const supplierEmails = suppliers.map(s => s.email);

      await this.createBulkNotifications({
        title: 'Nova Licitação Disponível',
        message: `Uma nova licitação foi publicada: ${biddingTitle}`,
        type: 'BIDDING_PUBLISHED',
        userIds: supplierIds,
        relatedId: biddingId,
        relatedType: 'bidding',
        metadata: { biddingId, biddingTitle },
      });

      // Notificar via WebSocket para role SUPPLIER
      if (this.websocketService) {
        this.websocketService.notifyRole(UserRole.SUPPLIER, 'new-bidding', {
          biddingId,
          title: biddingTitle,
          message: `Nova licitação disponível: ${biddingTitle}`,
        });
      }

      // Buscar dados completos da licitação para email
      const bidding = await prisma.bidding.findUnique({
        where: { id: biddingId },
        include: {
          publicEntity: {
            select: { name: true },
          },
        },
      });

      if (bidding && supplierEmails.length > 0) {
        // Enviar email para fornecedores
        await this.emailService.sendNewBiddingEmail(supplierEmails, {
          biddingTitle: bidding.title,
          biddingNumber: bidding.biddingNumber,
          openingDate: bidding.openingDate,
          closingDate: bidding.closingDate,
          estimatedValue: Number(bidding.estimatedValue),
          publicEntityName: bidding.publicEntity.name,
          biddingUrl: `${process.env.FRONTEND_URL}/biddings/${biddingId}`,
        });
      }
    } catch (error) {
      logger.error('Erro ao notificar nova licitação:', error);
    }
  }

  // Notificar sobre proposta recebida
  public async notifyProposalReceived(
    publicEntityUserId: string,
    biddingTitle: string,
    supplierName: string,
    proposalId: string
  ): Promise<void> {
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

      // Buscar email do usuário do órgão público e dados da proposta
      const [user, proposal] = await Promise.all([
        prisma.user.findUnique({
          where: { id: publicEntityUserId },
          select: { email: true },
        }),
        prisma.proposal.findUnique({
          where: { id: proposalId },
          select: { totalValue: true, submittedAt: true },
        }),
      ]);

      if (user && proposal) {
        // Enviar email para o órgão público
        await this.emailService.sendProposalReceivedEmail(user.email, {
          biddingTitle,
          supplierName,
          proposalValue: Number(proposal.totalValue),
          submissionDate: proposal.submittedAt || new Date(),
          proposalUrl: `${process.env.FRONTEND_URL}/proposals/${proposalId}`,
        });
      }
    } catch (error) {
      logger.error('Erro ao notificar proposta recebida:', error);
    }
  }

  // Notificar sobre status da proposta
  public async notifyProposalStatusChange(
    supplierUserId: string,
    biddingTitle: string,
    status: string,
    proposalId: string
  ): Promise<void> {
    try {
      const statusMessages = {
        ACCEPTED: 'Sua proposta foi aceita!',
        REJECTED: 'Sua proposta foi rejeitada.',
        UNDER_REVIEW: 'Sua proposta está em análise.',
      };

      const message = statusMessages[status as keyof typeof statusMessages] || 
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
    } catch (error) {
      logger.error('Erro ao notificar mudança de status da proposta:', error);
    }
  }

  // Notificar sobre licitação fechando
  public async notifyBiddingClosingSoon(biddingId: string, biddingTitle: string, hoursLeft: number): Promise<void> {
    try {
      // Buscar propostas da licitação para notificar apenas participantes
      const proposals = await prisma.proposal.findMany({
        where: { biddingId },
        include: {
          supplier: {
            include: { user: true },
          },
        },
      });

      const participantIds = proposals.map(p => p.supplier.userId);
      const participantEmails = proposals.map(p => p.supplier.user.email);

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

        // Enviar email para participantes
        if (participantEmails.length > 0) {
          await this.emailService.sendBiddingClosingSoonEmail(
            participantEmails,
            biddingTitle,
            hoursLeft,
            `${process.env.FRONTEND_URL}/biddings/${biddingId}`
          );
        }
      }
    } catch (error) {
      logger.error('Erro ao notificar licitação fechando:', error);
    }
  }

  // Notificar administradores sobre eventos importantes
  public async notifyAdmins(title: string, message: string, type: string, metadata?: any): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: UserRole.ADMIN,
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

      // Notificar via WebSocket
      if (this.websocketService) {
        this.websocketService.notifyAdmins('admin-notification', {
          title,
          message,
          type,
          metadata,
        });
      }
    } catch (error) {
      logger.error('Erro ao notificar administradores:', error);
    }
  }

  // Marcar notificação como lida
  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
        },
      });

      logger.info(`Notificação ${notificationId} marcada como lida pelo usuário ${userId}`);
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  // Marcar todas as notificações como lidas
  public async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      logger.info(`Todas as notificações marcadas como lidas para usuário ${userId}`);
    } catch (error) {
      logger.error('Erro ao marcar todas as notificações como lidas:', error);
      throw error;
    }
  }

  // Obter estatísticas de notificações
  public async getNotificationStats(userId: string) {
    try {
      const [total, unread, byType] = await Promise.all([
        prisma.notification.count({
          where: { userId },
        }),
        prisma.notification.count({
          where: { userId, isRead: false },
        }),
        prisma.notification.groupBy({
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
        }, {} as Record<string, number>),
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas de notificações:', error);
      throw error;
    }
  }
}

export default NotificationService;
