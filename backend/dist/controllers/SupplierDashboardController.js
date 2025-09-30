"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierDashboardController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
class SupplierDashboardController {
    async getDashboard(req, res) {
        const userId = req.user.userId;
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Perfil de fornecedor não encontrado');
        }
        const startTime = Date.now();
        const [totalProposals, submittedProposals, acceptedProposals, rejectedProposals, activeContracts, completedContracts, totalContractValue, availableBiddings, recentProposals,] = await Promise.all([
            database_1.prisma.proposal.count({
                where: { supplierId: supplier.id },
            }),
            database_1.prisma.proposal.count({
                where: {
                    supplierId: supplier.id,
                    status: client_1.ProposalStatus.SUBMITTED,
                },
            }),
            database_1.prisma.proposal.count({
                where: {
                    supplierId: supplier.id,
                    status: client_1.ProposalStatus.ACCEPTED,
                },
            }),
            database_1.prisma.proposal.count({
                where: {
                    supplierId: supplier.id,
                    status: client_1.ProposalStatus.REJECTED,
                },
            }),
            database_1.prisma.contract.count({
                where: {
                    supplierId: supplier.id,
                    status: 'ACTIVE',
                },
            }),
            database_1.prisma.contract.count({
                where: {
                    supplierId: supplier.id,
                    status: 'COMPLETED',
                },
            }),
            database_1.prisma.contract.aggregate({
                where: { supplierId: supplier.id },
                _sum: {
                    totalValue: true,
                },
            }),
            database_1.prisma.bidding.count({
                where: {
                    status: client_1.BiddingStatus.OPEN,
                    isPublic: true,
                    closingDate: {
                        gt: new Date(),
                    },
                    proposals: {
                        none: {
                            supplierId: supplier.id,
                        },
                    },
                },
            }),
            database_1.prisma.proposal.findMany({
                where: { supplierId: supplier.id },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    status: true,
                    totalValue: true,
                    submittedAt: true,
                    bidding: {
                        select: {
                            id: true,
                            title: true,
                            biddingNumber: true,
                            status: true,
                            closingDate: true,
                        },
                    },
                },
            }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'supplier_dashboard', Date.now() - startTime);
        res.json({
            success: true,
            data: {
                statistics: {
                    totalProposals,
                    submittedProposals,
                    acceptedProposals,
                    rejectedProposals,
                    activeContracts,
                    completedContracts,
                    totalContractValue: totalContractValue._sum.totalValue || 0,
                    availableBiddings,
                },
                recentProposals,
            },
        });
    }
    async getAvailableBiddings(req, res) {
        const userId = req.user.userId;
        const { page = 1, limit = 10, categoryId, city, state, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { userId },
            select: {
                id: true,
                categories: {
                    select: {
                        categoryId: true,
                    },
                },
            },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Perfil de fornecedor não encontrado');
        }
        const where = {
            status: client_1.BiddingStatus.OPEN,
            isPublic: true,
            closingDate: {
                gt: new Date(),
            },
            proposals: {
                none: {
                    supplierId: supplier.id,
                },
            },
        };
        if (categoryId) {
            where.categories = {
                some: {
                    categoryId: categoryId,
                },
            };
        }
        else if (supplier.categories.length > 0) {
            where.categories = {
                some: {
                    categoryId: {
                        in: supplier.categories.map(c => c.categoryId),
                    },
                },
            };
        }
        if (city) {
            where.publicEntity = {
                city: { contains: city, mode: 'insensitive' },
            };
        }
        if (state) {
            where.publicEntity = {
                ...where.publicEntity,
                state: state,
            };
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
                    publicEntity: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            state: true,
                        },
                    },
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
                    closingDate: 'asc',
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
    async getMyProposals(req, res) {
        const userId = req.user.userId;
        const { page = 1, limit = 10, status, biddingId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Perfil de fornecedor não encontrado');
        }
        const where = {
            supplierId: supplier.id,
        };
        if (status) {
            where.status = status;
        }
        if (biddingId) {
            where.biddingId = biddingId;
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
                            closingDate: true,
                            publicEntity: {
                                select: {
                                    name: true,
                                    city: true,
                                    state: true,
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
                    createdAt: 'desc',
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
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Perfil de fornecedor não encontrado');
        }
        const where = {
            supplierId: supplier.id,
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
                    publicEntity: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            state: true,
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
    async getPerformanceReport(req, res) {
        const userId = req.user.userId;
        const { startDate, endDate } = req.query;
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Perfil de fornecedor não encontrado');
        }
        const dateFilter = startDate && endDate ? {
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        } : {};
        const [proposalsByStatus, contractsByStatus, totalEarned, averageProposalValue, winRate,] = await Promise.all([
            database_1.prisma.proposal.groupBy({
                by: ['status'],
                where: {
                    supplierId: supplier.id,
                    ...dateFilter,
                },
                _count: {
                    status: true,
                },
                _sum: {
                    totalValue: true,
                },
            }),
            database_1.prisma.contract.groupBy({
                by: ['status'],
                where: {
                    supplierId: supplier.id,
                    ...dateFilter,
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
                    supplierId: supplier.id,
                    ...dateFilter,
                },
                _sum: {
                    totalValue: true,
                },
            }),
            database_1.prisma.proposal.aggregate({
                where: {
                    supplierId: supplier.id,
                    ...dateFilter,
                },
                _avg: {
                    totalValue: true,
                },
            }),
            database_1.prisma.proposal.findMany({
                where: {
                    supplierId: supplier.id,
                    ...dateFilter,
                },
                select: {
                    status: true,
                },
            }).then(proposals => {
                const total = proposals.length;
                const accepted = proposals.filter(p => p.status === client_1.ProposalStatus.ACCEPTED).length;
                return total > 0 ? (accepted / total) * 100 : 0;
            }),
        ]);
        res.json({
            success: true,
            data: {
                proposalsByStatus,
                contractsByStatus,
                totalEarned: totalEarned._sum.totalValue || 0,
                averageProposalValue: averageProposalValue._avg.totalValue || 0,
                winRate,
            },
        });
    }
}
exports.SupplierDashboardController = SupplierDashboardController;
//# sourceMappingURL=SupplierDashboardController.js.map