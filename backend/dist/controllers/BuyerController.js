"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
class BuyerController {
    async getDashboard(req, res) {
        const userId = req.user.userId;
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!publicEntity) {
            throw new errorHandler_1.NotFoundError('Perfil de órgão público não encontrado');
        }
        const startTime = Date.now();
        const [totalBiddings, draftBiddings, openBiddings, closedBiddings, activeContracts, totalContractValue, recentBiddings, pendingProposals,] = await Promise.all([
            database_1.prisma.bidding.count({
                where: { publicEntityId: publicEntity.id },
            }),
            database_1.prisma.bidding.count({
                where: {
                    publicEntityId: publicEntity.id,
                    status: client_1.BiddingStatus.DRAFT,
                },
            }),
            database_1.prisma.bidding.count({
                where: {
                    publicEntityId: publicEntity.id,
                    status: client_1.BiddingStatus.OPEN,
                },
            }),
            database_1.prisma.bidding.count({
                where: {
                    publicEntityId: publicEntity.id,
                    status: client_1.BiddingStatus.CLOSED,
                },
            }),
            database_1.prisma.contract.count({
                where: {
                    publicEntityId: publicEntity.id,
                    status: 'ACTIVE',
                },
            }),
            database_1.prisma.contract.aggregate({
                where: { publicEntityId: publicEntity.id },
                _sum: {
                    totalValue: true,
                },
            }),
            database_1.prisma.bidding.findMany({
                where: { publicEntityId: publicEntity.id },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    biddingNumber: true,
                    status: true,
                    estimatedValue: true,
                    openingDate: true,
                    closingDate: true,
                    _count: {
                        select: {
                            proposals: true,
                        },
                    },
                },
            }),
            database_1.prisma.proposal.count({
                where: {
                    bidding: {
                        publicEntityId: publicEntity.id,
                    },
                    status: 'SUBMITTED',
                },
            }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'buyer_dashboard', Date.now() - startTime);
        res.json({
            success: true,
            data: {
                statistics: {
                    totalBiddings,
                    draftBiddings,
                    openBiddings,
                    closedBiddings,
                    activeContracts,
                    totalContractValue: totalContractValue._sum.totalValue || 0,
                    pendingProposals,
                },
                recentBiddings,
            },
        });
    }
    async getMyBiddings(req, res) {
        const userId = req.user.userId;
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!publicEntity) {
            throw new errorHandler_1.NotFoundError('Perfil de órgão público não encontrado');
        }
        const where = {
            publicEntityId: publicEntity.id,
        };
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { biddingNumber: { contains: search } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [biddings, total] = await Promise.all([
            database_1.prisma.bidding.findMany({
                where,
                skip: offset,
                take: Number(limit),
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
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.bidding.count({ where }),
        ]);
        const totalPages = Math.ceil(total / Number(limit));
        res.json({
            success: true,
            data: {
                biddings,
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
    async getReceivedProposals(req, res) {
        const userId = req.user.userId;
        const { page = 1, limit = 10, biddingId, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!publicEntity) {
            throw new errorHandler_1.NotFoundError('Perfil de órgão público não encontrado');
        }
        const where = {
            bidding: {
                publicEntityId: publicEntity.id,
            },
        };
        if (biddingId) {
            where.biddingId = biddingId;
        }
        if (status) {
            where.status = status;
        }
        const [proposals, total] = await Promise.all([
            database_1.prisma.proposal.findMany({
                where,
                skip: offset,
                take: Number(limit),
                include: {
                    bidding: {
                        select: {
                            id: true,
                            title: true,
                            biddingNumber: true,
                            status: true,
                        },
                    },
                    supplier: {
                        select: {
                            id: true,
                            companyName: true,
                            tradeName: true,
                            cnpj: true,
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    items: {
                        select: {
                            id: true,
                            description: true,
                            quantity: true,
                            unitPrice: true,
                            totalPrice: true,
                        },
                    },
                },
                orderBy: {
                    submittedAt: 'desc',
                },
            }),
            database_1.prisma.proposal.count({ where }),
        ]);
        const totalPages = Math.ceil(total / Number(limit));
        res.json({
            success: true,
            data: {
                proposals,
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
    async getMyContracts(req, res) {
        const userId = req.user.userId;
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!publicEntity) {
            throw new errorHandler_1.NotFoundError('Perfil de órgão público não encontrado');
        }
        const where = {
            publicEntityId: publicEntity.id,
        };
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { contractNumber: { contains: search } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [contracts, total] = await Promise.all([
            database_1.prisma.contract.findMany({
                where,
                skip: offset,
                take: Number(limit),
                include: {
                    supplier: {
                        select: {
                            id: true,
                            companyName: true,
                            tradeName: true,
                            cnpj: true,
                        },
                    },
                    bidding: {
                        select: {
                            id: true,
                            title: true,
                            biddingNumber: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.contract.count({ where }),
        ]);
        const totalPages = Math.ceil(total / Number(limit));
        res.json({
            success: true,
            data: {
                contracts,
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
    async getPurchaseReport(req, res) {
        const userId = req.user.userId;
        const { startDate, endDate, categoryId } = req.query;
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!publicEntity) {
            throw new errorHandler_1.NotFoundError('Perfil de órgão público não encontrado');
        }
        const where = {
            publicEntityId: publicEntity.id,
        };
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        if (categoryId) {
            where.categories = {
                some: {
                    categoryId: categoryId,
                },
            };
        }
        const [biddingsByStatus, contractsByStatus, totalSpent, averageBiddingValue, topCategories,] = await Promise.all([
            database_1.prisma.bidding.groupBy({
                by: ['status'],
                where,
                _count: {
                    status: true,
                },
                _sum: {
                    estimatedValue: true,
                },
            }),
            database_1.prisma.contract.groupBy({
                by: ['status'],
                where: {
                    publicEntityId: publicEntity.id,
                    ...(startDate && endDate && {
                        createdAt: {
                            gte: new Date(startDate),
                            lte: new Date(endDate),
                        },
                    }),
                },
                _count: {
                    status: true,
                },
                _sum: {
                    totalValue: true,
                },
            }),
            database_1.prisma.contract.aggregate({
                where: {
                    publicEntityId: publicEntity.id,
                    ...(startDate && endDate && {
                        createdAt: {
                            gte: new Date(startDate),
                            lte: new Date(endDate),
                        },
                    }),
                },
                _sum: {
                    totalValue: true,
                },
            }),
            database_1.prisma.bidding.aggregate({
                where,
                _avg: {
                    estimatedValue: true,
                },
            }),
            database_1.prisma.biddingCategory.groupBy({
                by: ['categoryId'],
                where: {
                    bidding: where,
                },
                _count: {
                    categoryId: true,
                },
                orderBy: {
                    _count: {
                        categoryId: 'desc',
                    },
                },
                take: 5,
            }),
        ]);
        res.json({
            success: true,
            data: {
                biddingsByStatus,
                contractsByStatus,
                totalSpent: totalSpent._sum.totalValue || 0,
                averageBiddingValue: averageBiddingValue._avg.estimatedValue || 0,
                topCategories,
            },
        });
    }
}
exports.BuyerController = BuyerController;
//# sourceMappingURL=BuyerController.js.map