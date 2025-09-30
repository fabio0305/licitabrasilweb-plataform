"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransparencyController = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
class TransparencyController {
    async getPublicDashboard(req, res) {
        const startTime = Date.now();
        const [totalBiddings, openBiddings, closedBiddings, totalContracts, activeContracts, totalContractValue, recentBiddings, topCategories, publicEntitiesStats,] = await Promise.all([
            database_1.prisma.bidding.count({
                where: { isPublic: true },
            }),
            database_1.prisma.bidding.count({
                where: {
                    isPublic: true,
                    status: client_1.BiddingStatus.OPEN,
                },
            }),
            database_1.prisma.bidding.count({
                where: {
                    isPublic: true,
                    status: client_1.BiddingStatus.CLOSED,
                },
            }),
            database_1.prisma.contract.count(),
            database_1.prisma.contract.count({
                where: { status: client_1.ContractStatus.ACTIVE },
            }),
            database_1.prisma.contract.aggregate({
                _sum: {
                    totalValue: true,
                },
            }),
            database_1.prisma.bidding.findMany({
                where: { isPublic: true },
                take: 10,
                orderBy: { publishedAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    biddingNumber: true,
                    status: true,
                    estimatedValue: true,
                    openingDate: true,
                    closingDate: true,
                    publicEntity: {
                        select: {
                            name: true,
                            city: true,
                            state: true,
                        },
                    },
                    _count: {
                        select: {
                            proposals: true,
                        },
                    },
                },
            }),
            database_1.prisma.biddingCategory.groupBy({
                by: ['categoryId'],
                where: {
                    bidding: {
                        isPublic: true,
                    },
                },
                _count: {
                    categoryId: true,
                },
                orderBy: {
                    _count: {
                        categoryId: 'desc',
                    },
                },
                take: 10,
            }),
            database_1.prisma.publicEntity.findMany({
                select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                    entityType: true,
                    _count: {
                        select: {
                            biddings: true,
                            contracts: true,
                        },
                    },
                },
                orderBy: {
                    biddings: {
                        _count: 'desc',
                    },
                },
                take: 10,
            }),
        ]);
        const categoryIds = topCategories.map(cat => cat.categoryId);
        const categories = await database_1.prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true, code: true },
        });
        const topCategoriesWithNames = topCategories.map(cat => ({
            ...cat,
            category: categories.find(c => c.id === cat.categoryId),
        }));
        (0, logger_1.logDatabaseOperation)('SELECT', 'transparency_dashboard', Date.now() - startTime);
        res.json({
            success: true,
            data: {
                statistics: {
                    totalBiddings,
                    openBiddings,
                    closedBiddings,
                    totalContracts,
                    activeContracts,
                    totalContractValue: totalContractValue._sum.totalValue || 0,
                },
                recentBiddings,
                topCategories: topCategoriesWithNames,
                publicEntitiesStats,
            },
        });
    }
    async getPublicBiddings(req, res) {
        const { page = 1, limit = 10, search, status, categoryId, city, state, entityType, minValue, maxValue, startDate, endDate } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {
            isPublic: true,
        };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { biddingNumber: { contains: search } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (categoryId) {
            where.categories = {
                some: {
                    categoryId: categoryId,
                },
            };
        }
        if (city || state || entityType) {
            where.publicEntity = {};
            if (city) {
                where.publicEntity.city = { contains: city, mode: 'insensitive' };
            }
            if (state) {
                where.publicEntity.state = state;
            }
            if (entityType) {
                where.publicEntity.entityType = entityType;
            }
        }
        if (minValue || maxValue) {
            where.estimatedValue = {};
            if (minValue) {
                where.estimatedValue.gte = Number(minValue);
            }
            if (maxValue) {
                where.estimatedValue.lte = Number(maxValue);
            }
        }
        if (startDate || endDate) {
            where.openingDate = {};
            if (startDate) {
                where.openingDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.openingDate.lte = new Date(endDate);
            }
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
                            entityType: true,
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
                    publishedAt: 'desc',
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
    async getPublicContracts(req, res) {
        const { page = 1, limit = 10, search, status, city, state, minValue, maxValue, startDate, endDate } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { contractNumber: { contains: search } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (city || state) {
            where.publicEntity = {};
            if (city) {
                where.publicEntity.city = { contains: city, mode: 'insensitive' };
            }
            if (state) {
                where.publicEntity.state = state;
            }
        }
        if (minValue || maxValue) {
            where.totalValue = {};
            if (minValue) {
                where.totalValue.gte = Number(minValue);
            }
            if (maxValue) {
                where.totalValue.lte = Number(maxValue);
            }
        }
        if (startDate || endDate) {
            where.startDate = {};
            if (startDate) {
                where.startDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.startDate.lte = new Date(endDate);
            }
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
                            entityType: true,
                        },
                    },
                    supplier: {
                        select: {
                            id: true,
                            companyName: true,
                            tradeName: true,
                            cnpj: true,
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
                    signedAt: 'desc',
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
    async getPublicSpendingReport(req, res) {
        const { startDate, endDate, groupBy = 'month' } = req.query;
        const dateFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.lte = new Date(endDate);
        }
        const where = Object.keys(dateFilter).length > 0 ? { signedAt: dateFilter } : {};
        const [contractsByStatus, spendingByEntity, spendingByCategory, totalSpending, averageContractValue,] = await Promise.all([
            database_1.prisma.contract.groupBy({
                by: ['status'],
                where,
                _count: {
                    status: true,
                },
                _sum: {
                    totalValue: true,
                },
            }),
            database_1.prisma.contract.groupBy({
                by: ['publicEntityId'],
                where,
                _sum: {
                    totalValue: true,
                },
                _count: {
                    publicEntityId: true,
                },
                orderBy: {
                    _sum: {
                        totalValue: 'desc',
                    },
                },
                take: 10,
            }),
            database_1.prisma.contract.findMany({
                where,
                include: {
                    bidding: {
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
                        },
                    },
                },
            }).then(contracts => {
                const categorySpending = {};
                contracts.forEach(contract => {
                    contract.bidding.categories.forEach(biddingCategory => {
                        const category = biddingCategory.category;
                        if (!categorySpending[category.id]) {
                            categorySpending[category.id] = {
                                name: category.name,
                                total: 0,
                                count: 0,
                            };
                        }
                        categorySpending[category.id].total += Number(contract.totalValue);
                        categorySpending[category.id].count += 1;
                    });
                });
                return Object.entries(categorySpending)
                    .map(([id, data]) => ({ categoryId: id, ...data }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 10);
            }),
            database_1.prisma.contract.aggregate({
                where,
                _sum: {
                    totalValue: true,
                },
            }),
            database_1.prisma.contract.aggregate({
                where,
                _avg: {
                    totalValue: true,
                },
            }),
        ]);
        const entityIds = spendingByEntity.map(item => item.publicEntityId);
        const entities = await database_1.prisma.publicEntity.findMany({
            where: { id: { in: entityIds } },
            select: { id: true, name: true, city: true, state: true },
        });
        const spendingByEntityWithNames = spendingByEntity.map(item => ({
            ...item,
            entity: entities.find(e => e.id === item.publicEntityId),
        }));
        res.json({
            success: true,
            data: {
                contractsByStatus,
                spendingByEntity: spendingByEntityWithNames,
                spendingByCategory,
                totalSpending: totalSpending._sum.totalValue || 0,
                averageContractValue: averageContractValue._avg.totalValue || 0,
            },
        });
    }
}
exports.TransparencyController = TransparencyController;
//# sourceMappingURL=TransparencyController.js.map