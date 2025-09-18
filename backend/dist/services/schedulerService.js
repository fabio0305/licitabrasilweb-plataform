"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("@/config/database");
const logger_1 = require("@/utils/logger");
const client_1 = require("@prisma/client");
const notificationService_1 = __importDefault(require("./notificationService"));
class SchedulerService {
    constructor() {
        this.notificationService = notificationService_1.default.getInstance();
    }
    static getInstance() {
        if (!SchedulerService.instance) {
            SchedulerService.instance = new SchedulerService();
        }
        return SchedulerService.instance;
    }
    startScheduledTasks() {
        logger_1.logger.info('🕐 Iniciando tarefas agendadas');
        node_cron_1.default.schedule('0 * * * *', async () => {
            await this.checkBiddingsClosingSoon(24);
        });
        node_cron_1.default.schedule('*/30 * * * *', async () => {
            await this.checkBiddingsClosingSoon(2);
        });
        node_cron_1.default.schedule('*/5 * * * *', async () => {
            await this.autoCloseBiddings();
        });
        node_cron_1.default.schedule('*/5 * * * *', async () => {
            await this.autoOpenBiddings();
        });
        node_cron_1.default.schedule('0 2 * * *', async () => {
            await this.cleanupOldNotifications();
        });
        node_cron_1.default.schedule('0 8 * * *', async () => {
            await this.sendDailyStats();
        });
        logger_1.logger.info('✅ Tarefas agendadas iniciadas com sucesso');
    }
    async checkBiddingsClosingSoon(hoursLeft) {
        try {
            const now = new Date();
            const targetTime = new Date(now.getTime() + hoursLeft * 60 * 60 * 1000);
            const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000);
            const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);
            const biddings = await database_1.prisma.bidding.findMany({
                where: {
                    status: client_1.BiddingStatus.OPEN,
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
                await this.notificationService.notifyBiddingClosingSoon(bidding.id, bidding.title, hoursLeft);
            }
            if (biddings.length > 0) {
                logger_1.logger.info(`Notificações enviadas para ${biddings.length} licitações fechando em ${hoursLeft}h`);
            }
        }
        catch (error) {
            logger_1.logger.error(`Erro ao verificar licitações fechando em ${hoursLeft}h:`, error);
        }
    }
    async autoCloseBiddings() {
        try {
            const now = new Date();
            const biddingsToClose = await database_1.prisma.bidding.findMany({
                where: {
                    status: client_1.BiddingStatus.OPEN,
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
                await database_1.prisma.bidding.update({
                    where: { id: bidding.id },
                    data: {
                        status: client_1.BiddingStatus.CLOSED,
                    },
                });
                await this.notificationService.notifyAdmins('Licitação Fechada Automaticamente', `A licitação "${bidding.title}" (${bidding.biddingNumber}) foi fechada automaticamente.`, 'BIDDING_CLOSED', { biddingId: bidding.id, biddingTitle: bidding.title });
                logger_1.logger.info(`Licitação ${bidding.id} fechada automaticamente`);
            }
            if (biddingsToClose.length > 0) {
                logger_1.logger.info(`${biddingsToClose.length} licitações fechadas automaticamente`);
            }
        }
        catch (error) {
            logger_1.logger.error('Erro ao fechar licitações automaticamente:', error);
        }
    }
    async autoOpenBiddings() {
        try {
            const now = new Date();
            const biddingsToOpen = await database_1.prisma.bidding.findMany({
                where: {
                    status: client_1.BiddingStatus.PUBLISHED,
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
                await database_1.prisma.bidding.update({
                    where: { id: bidding.id },
                    data: {
                        status: client_1.BiddingStatus.OPEN,
                    },
                });
                await this.notificationService.notifyAdmins('Licitação Aberta Automaticamente', `A licitação "${bidding.title}" (${bidding.biddingNumber}) foi aberta automaticamente para recebimento de propostas.`, 'BIDDING_OPENED', { biddingId: bidding.id, biddingTitle: bidding.title });
                logger_1.logger.info(`Licitação ${bidding.id} aberta automaticamente`);
            }
            if (biddingsToOpen.length > 0) {
                logger_1.logger.info(`${biddingsToOpen.length} licitações abertas automaticamente`);
            }
        }
        catch (error) {
            logger_1.logger.error('Erro ao abrir licitações automaticamente:', error);
        }
    }
    async cleanupOldNotifications() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const result = await database_1.prisma.notification.deleteMany({
                where: {
                    createdAt: {
                        lt: thirtyDaysAgo,
                    },
                    isRead: true,
                },
            });
            logger_1.logger.info(`${result.count} notificações antigas removidas`);
        }
        catch (error) {
            logger_1.logger.error('Erro ao limpar notificações antigas:', error);
        }
    }
    async sendDailyStats() {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const [newBiddings, newProposals, newUsers, closedBiddings,] = await Promise.all([
                database_1.prisma.bidding.count({
                    where: {
                        createdAt: {
                            gte: yesterday,
                            lt: today,
                        },
                    },
                }),
                database_1.prisma.proposal.count({
                    where: {
                        createdAt: {
                            gte: yesterday,
                            lt: today,
                        },
                    },
                }),
                database_1.prisma.user.count({
                    where: {
                        createdAt: {
                            gte: yesterday,
                            lt: today,
                        },
                    },
                }),
                database_1.prisma.bidding.count({
                    where: {
                        status: client_1.BiddingStatus.CLOSED,
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
            await this.notificationService.notifyAdmins('Relatório Diário', statsMessage, 'DAILY_REPORT', {
                date: yesterday.toISOString(),
                stats: {
                    newBiddings,
                    newProposals,
                    newUsers,
                    closedBiddings,
                },
            });
            logger_1.logger.info('Relatório diário enviado aos administradores');
        }
        catch (error) {
            logger_1.logger.error('Erro ao enviar estatísticas diárias:', error);
        }
    }
    stopScheduledTasks() {
        node_cron_1.default.getTasks().forEach((task) => {
            task.stop();
        });
        logger_1.logger.info('🛑 Tarefas agendadas interrompidas');
    }
    getTasksStatus() {
        const tasks = node_cron_1.default.getTasks();
        return {
            totalTasks: tasks.size,
            runningTasks: Array.from(tasks.values()).filter(task => task.getStatus() === 'scheduled').length,
        };
    }
}
exports.default = SchedulerService;
//# sourceMappingURL=schedulerService.js.map