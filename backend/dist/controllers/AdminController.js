"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const database_1 = require("@/config/database");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
class AdminController {
    async getConfig(req, res) {
        const configs = await database_1.prisma.systemConfig.findMany({
            where: {
                isPublic: true,
            },
            orderBy: {
                key: 'asc',
            },
        });
        const configObject = configs.reduce((acc, config) => {
            let value = config.value;
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
                    }
                    catch {
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
        }, {});
        res.json({
            success: true,
            data: { config: configObject },
        });
    }
    async updateConfig(req, res) {
        const { configs } = req.body;
        const userId = req.user.userId;
        if (!configs || typeof configs !== 'object') {
            throw new errorHandler_1.ValidationError('Configurações inválidas');
        }
        const updates = [];
        for (const [key, configData] of Object.entries(configs)) {
            const { value, type = 'string', description } = configData;
            let stringValue;
            switch (type) {
                case 'number':
                    if (isNaN(Number(value))) {
                        throw new errorHandler_1.ValidationError(`Valor inválido para configuração ${key}: deve ser um número`);
                    }
                    stringValue = String(value);
                    break;
                case 'boolean':
                    if (typeof value !== 'boolean') {
                        throw new errorHandler_1.ValidationError(`Valor inválido para configuração ${key}: deve ser um boolean`);
                    }
                    stringValue = String(value);
                    break;
                case 'json':
                    try {
                        JSON.stringify(value);
                        stringValue = JSON.stringify(value);
                    }
                    catch {
                        throw new errorHandler_1.ValidationError(`Valor inválido para configuração ${key}: deve ser um JSON válido`);
                    }
                    break;
                default:
                    stringValue = String(value);
            }
            updates.push(database_1.prisma.systemConfig.upsert({
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
            }));
        }
        await Promise.all(updates);
        (0, logger_1.logUserActivity)(userId, 'SYSTEM_CONFIG_UPDATED', {
            configKeys: Object.keys(configs),
        });
        res.json({
            success: true,
            message: 'Configurações atualizadas com sucesso',
        });
    }
    async getAuditLogs(req, res) {
        const { page = 1, limit = 50, userId, action, resource, startDate, endDate } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (userId) {
            where.userId = userId;
        }
        if (action) {
            where.action = { contains: action, mode: 'insensitive' };
        }
        if (resource) {
            where.resource = { contains: resource, mode: 'insensitive' };
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        const startTime = Date.now();
        const [auditLogs, total] = await Promise.all([
            database_1.prisma.auditLog.findMany({
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
            database_1.prisma.auditLog.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'audit_logs', Date.now() - startTime);
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
    async getStatistics(req, res) {
        const [userStats, supplierStats, publicEntityStats, biddingStats, proposalStats, contractStats, recentActivity,] = await Promise.all([
            Promise.all([
                database_1.prisma.user.count(),
                database_1.prisma.user.count({ where: { status: 'ACTIVE' } }),
                database_1.prisma.user.count({ where: { status: 'PENDING' } }),
                database_1.prisma.user.groupBy({
                    by: ['role'],
                    _count: { role: true },
                }),
            ]),
            Promise.all([
                database_1.prisma.supplier.count(),
                database_1.prisma.supplier.count({ where: { isActive: true } }),
                database_1.prisma.supplier.count({ where: { verifiedAt: { not: null } } }),
            ]),
            Promise.all([
                database_1.prisma.publicEntity.count(),
                database_1.prisma.publicEntity.count({ where: { isActive: true } }),
                database_1.prisma.publicEntity.count({ where: { verifiedAt: { not: null } } }),
            ]),
            Promise.all([
                database_1.prisma.bidding.count(),
                database_1.prisma.bidding.count({ where: { status: 'OPEN' } }),
                database_1.prisma.bidding.count({ where: { status: 'CLOSED' } }),
                database_1.prisma.bidding.groupBy({
                    by: ['status'],
                    _count: { status: true },
                }),
            ]),
            Promise.all([
                database_1.prisma.proposal.count(),
                database_1.prisma.proposal.count({ where: { status: 'SUBMITTED' } }),
                database_1.prisma.proposal.count({ where: { status: 'ACCEPTED' } }),
                database_1.prisma.proposal.groupBy({
                    by: ['status'],
                    _count: { status: true },
                }),
            ]),
            Promise.all([
                database_1.prisma.contract.count(),
                database_1.prisma.contract.count({ where: { status: 'ACTIVE' } }),
                database_1.prisma.contract.count({ where: { status: 'COMPLETED' } }),
                database_1.prisma.contract.aggregate({
                    _sum: { totalValue: true },
                }),
            ]),
            Promise.all([
                database_1.prisma.user.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                }),
                database_1.prisma.bidding.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                }),
                database_1.prisma.proposal.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        },
                    },
                }),
                database_1.prisma.contract.count({
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
                }, {}),
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
                }, {}),
            },
            proposals: {
                total: proposalStats[0],
                submitted: proposalStats[1],
                accepted: proposalStats[2],
                byStatus: proposalStats[3].reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {}),
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
    async createBackup(req, res) {
        const userId = req.user.userId;
        const backupId = `backup_${Date.now()}`;
        const timestamp = new Date().toISOString();
        (0, logger_1.logUserActivity)(userId, 'BACKUP_INITIATED', {
            backupId,
            timestamp,
        });
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
    async getBackupStatus(req, res) {
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
    async moderateBidding(req, res) {
        const { id } = req.params;
        const { action, reason } = req.body;
        const userId = req.user.userId;
        if (!['approve', 'reject', 'suspend'].includes(action)) {
            throw new errorHandler_1.ValidationError('Ação inválida');
        }
        const bidding = await database_1.prisma.bidding.findUnique({
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
            throw new errorHandler_1.NotFoundError('Licitação não encontrada');
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
        const updatedBidding = await database_1.prisma.bidding.update({
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
        (0, logger_1.logUserActivity)(userId, 'BIDDING_MODERATED', {
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
    async getModerationDashboard(req, res) {
        const [pendingBiddings, recentReports, suspendedUsers, flaggedContent,] = await Promise.all([
            database_1.prisma.bidding.count({
                where: { status: 'DRAFT' },
            }),
            Promise.resolve(0),
            database_1.prisma.user.count({
                where: { status: 'SUSPENDED' },
            }),
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
exports.AdminController = AdminController;
//# sourceMappingURL=AdminController.js.map