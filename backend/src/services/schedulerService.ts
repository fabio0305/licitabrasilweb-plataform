import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { BiddingStatus } from '@prisma/client';
import NotificationService from './notificationService';
import BackupService from './backupService';

class SchedulerService {
  private static instance: SchedulerService;
  private notificationService: NotificationService;
  private backupService: BackupService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
    this.backupService = BackupService.getInstance();
  }

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  public startScheduledTasks() {
    logger.info('🕐 Iniciando tarefas agendadas');

    // Verificar licitações fechando em 24 horas - executa a cada hora
    cron.schedule('0 * * * *', async () => {
      await this.checkBiddingsClosingSoon(24);
    });

    // Verificar licitações fechando em 2 horas - executa a cada 30 minutos
    cron.schedule('*/30 * * * *', async () => {
      await this.checkBiddingsClosingSoon(2);
    });

    // Fechar licitações automaticamente - executa a cada 5 minutos
    cron.schedule('*/5 * * * *', async () => {
      await this.autoCloseBiddings();
    });

    // Abrir licitações automaticamente - executa a cada 5 minutos
    cron.schedule('*/5 * * * *', async () => {
      await this.autoOpenBiddings();
    });

    // Limpeza de notificações antigas - executa diariamente às 2h
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldNotifications();
    });

    // Relatório diário de estatísticas - executa diariamente às 8h
    cron.schedule('0 8 * * *', async () => {
      await this.sendDailyStats();
    });

    // Backup automático - executa diariamente às 2h (configurável via env)
    const backupSchedule = process.env.BACKUP_SCHEDULE || '0 2 * * *';
    cron.schedule(backupSchedule, async () => {
      await this.performAutomaticBackup();
    });

    logger.info('✅ Tarefas agendadas iniciadas com sucesso');
  }

  private async checkBiddingsClosingSoon(hoursLeft: number) {
    try {
      const now = new Date();
      const targetTime = new Date(now.getTime() + hoursLeft * 60 * 60 * 1000);
      const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000); // 30 min antes
      const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000); // 30 min depois

      const biddings = await prisma.bidding.findMany({
        where: {
          status: BiddingStatus.OPEN,
          closingDate: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
        select: {
          id: true,
          title: true,
          closingDate: true,
        },
      });

      for (const bidding of biddings) {
        await this.notificationService.notifyBiddingClosingSoon(
          bidding.id,
          bidding.title,
          hoursLeft
        );
      }

      if (biddings.length > 0) {
        logger.info(`Notificações enviadas para ${biddings.length} licitações fechando em ${hoursLeft}h`);
      }
    } catch (error) {
      logger.error(`Erro ao verificar licitações fechando em ${hoursLeft}h:`, error);
    }
  }

  private async autoCloseBiddings() {
    try {
      const now = new Date();

      const biddingsToClose = await prisma.bidding.findMany({
        where: {
          status: BiddingStatus.OPEN,
          closingDate: {
            lte: now,
          },
        },
        select: {
          id: true,
          title: true,
          biddingNumber: true,
        },
      });

      for (const bidding of biddingsToClose) {
        await prisma.bidding.update({
          where: { id: bidding.id },
          data: {
            status: BiddingStatus.CLOSED,
          },
        });

        // Notificar administradores
        await this.notificationService.notifyAdmins(
          'Licitação Fechada Automaticamente',
          `A licitação "${bidding.title}" (${bidding.biddingNumber}) foi fechada automaticamente.`,
          'BIDDING_CLOSED',
          { biddingId: bidding.id, biddingTitle: bidding.title }
        );

        logger.info(`Licitação ${bidding.id} fechada automaticamente`);
      }

      if (biddingsToClose.length > 0) {
        logger.info(`${biddingsToClose.length} licitações fechadas automaticamente`);
      }
    } catch (error) {
      logger.error('Erro ao fechar licitações automaticamente:', error);
    }
  }

  private async autoOpenBiddings() {
    try {
      const now = new Date();

      const biddingsToOpen = await prisma.bidding.findMany({
        where: {
          status: BiddingStatus.PUBLISHED,
          openingDate: {
            lte: now,
          },
        },
        select: {
          id: true,
          title: true,
          biddingNumber: true,
        },
      });

      for (const bidding of biddingsToOpen) {
        await prisma.bidding.update({
          where: { id: bidding.id },
          data: {
            status: BiddingStatus.OPEN,
          },
        });

        // Notificar administradores
        await this.notificationService.notifyAdmins(
          'Licitação Aberta Automaticamente',
          `A licitação "${bidding.title}" (${bidding.biddingNumber}) foi aberta automaticamente para recebimento de propostas.`,
          'BIDDING_OPENED',
          { biddingId: bidding.id, biddingTitle: bidding.title }
        );

        logger.info(`Licitação ${bidding.id} aberta automaticamente`);
      }

      if (biddingsToOpen.length > 0) {
        logger.info(`${biddingsToOpen.length} licitações abertas automaticamente`);
      }
    } catch (error) {
      logger.error('Erro ao abrir licitações automaticamente:', error);
    }
  }

  private async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          isRead: true,
        },
      });

      logger.info(`${result.count} notificações antigas removidas`);
    } catch (error) {
      logger.error('Erro ao limpar notificações antigas:', error);
    }
  }

  private async sendDailyStats() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Estatísticas do dia anterior
      const [
        newBiddings,
        newProposals,
        newUsers,
        closedBiddings,
      ] = await Promise.all([
        prisma.bidding.count({
          where: {
            createdAt: {
              gte: yesterday,
              lt: today,
            },
          },
        }),
        prisma.proposal.count({
          where: {
            createdAt: {
              gte: yesterday,
              lt: today,
            },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: yesterday,
              lt: today,
            },
          },
        }),
        prisma.bidding.count({
          where: {
            status: BiddingStatus.CLOSED,
            updatedAt: {
              gte: yesterday,
              lt: today,
            },
          },
        }),
      ]);

      const statsMessage = `
Estatísticas de ${yesterday.toLocaleDateString('pt-BR')}:
• ${newBiddings} nova(s) licitação(ões)
• ${newProposals} nova(s) proposta(s)
• ${newUsers} novo(s) usuário(s)
• ${closedBiddings} licitação(ões) fechada(s)
      `.trim();

      await this.notificationService.notifyAdmins(
        'Relatório Diário',
        statsMessage,
        'DAILY_REPORT',
        {
          date: yesterday.toISOString(),
          stats: {
            newBiddings,
            newProposals,
            newUsers,
            closedBiddings,
          },
        }
      );

      logger.info('Relatório diário enviado aos administradores');
    } catch (error) {
      logger.error('Erro ao enviar estatísticas diárias:', error);
    }
  }

  private async performAutomaticBackup() {
    try {
      logger.info('Iniciando backup automático...');

      const result = await this.backupService.createFullBackup({
        includeDatabase: true,
        includeUploads: true,
      });

      if (result.success) {
        logger.info(`Backup automático concluído com sucesso em ${result.duration}ms`);
      } else {
        logger.error('Backup automático falhou');
      }
    } catch (error) {
      logger.error('Erro no backup automático:', error);
    }
  }

  // Método para parar todas as tarefas agendadas
  public stopScheduledTasks() {
    cron.getTasks().forEach((task) => {
      task.stop();
    });
    logger.info('🛑 Tarefas agendadas interrompidas');
  }

  // Método para obter status das tarefas
  public getTasksStatus() {
    const tasks = cron.getTasks();
    return {
      totalTasks: tasks.size,
      runningTasks: Array.from(tasks.values()).filter(task => task.getStatus() === 'scheduled').length,
    };
  }
}

export default SchedulerService;
