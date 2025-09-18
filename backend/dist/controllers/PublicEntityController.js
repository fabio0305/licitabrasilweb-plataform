"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicEntityController = void 0;
const database_1 = require("@/config/database");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
const client_1 = require("@prisma/client");
class PublicEntityController {
    async list(req, res) {
        const { page = 1, limit = 10, search, city, state, entityType, isActive } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { cnpj: { contains: search } },
            ];
        }
        if (city) {
            where.city = { contains: city, mode: 'insensitive' };
        }
        if (state) {
            where.state = state;
        }
        if (entityType) {
            where.entityType = entityType;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const startTime = Date.now();
        const [publicEntities, total] = await Promise.all([
            database_1.prisma.publicEntity.findMany({
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
                            status: true,
                        },
                    },
                    _count: {
                        select: {
                            biddings: true,
                            contracts: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.publicEntity.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'public_entities', Date.now() - startTime);
        const totalPages = Math.ceil(total / Number(limit));
        res.json({
            success: true,
            data: {
                publicEntities,
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
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        status: true,
                        createdAt: true,
                    },
                },
                biddings: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                        status: true,
                        estimatedValue: true,
                        openingDate: true,
                        closingDate: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 10,
                },
                contracts: {
                    select: {
                        id: true,
                        contractNumber: true,
                        title: true,
                        status: true,
                        totalValue: true,
                        startDate: true,
                        endDate: true,
                        supplier: {
                            select: {
                                id: true,
                                companyName: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 10,
                },
                _count: {
                    select: {
                        biddings: true,
                        contracts: true,
                        documents: true,
                    },
                },
            },
        });
        if (!publicEntity) {
            throw new errorHandler_1.NotFoundError('Órgão público não encontrado');
        }
        res.json({
            success: true,
            data: { publicEntity },
        });
    }
    async create(req, res) {
        const userId = req.user.userId;
        const { name, cnpj, entityType, address, city, state, zipCode, phone, website, } = req.body;
        const existingPublicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { userId },
        });
        if (existingPublicEntity) {
            throw new errorHandler_1.ConflictError('Usuário já possui um perfil de órgão público');
        }
        const existingCnpj = await database_1.prisma.publicEntity.findUnique({
            where: { cnpj },
        });
        if (existingCnpj) {
            throw new errorHandler_1.ConflictError('CNPJ já está em uso por outro órgão público');
        }
        const publicEntity = await database_1.prisma.publicEntity.create({
            data: {
                userId,
                name,
                cnpj,
                entityType,
                address,
                city,
                state,
                zipCode,
                phone,
                website,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        status: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'PUBLIC_ENTITY_PROFILE_CREATED', { publicEntityId: publicEntity.id });
        res.status(201).json({
            success: true,
            message: 'Perfil de órgão público criado com sucesso',
            data: { publicEntity },
        });
    }
    async update(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { name, cnpj, entityType, address, city, state, zipCode, phone, website, } = req.body;
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!publicEntity) {
            throw new errorHandler_1.NotFoundError('Órgão público não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para editar este órgão público');
        }
        if (cnpj && cnpj !== publicEntity.cnpj) {
            const existingCnpj = await database_1.prisma.publicEntity.findUnique({
                where: { cnpj },
            });
            if (existingCnpj) {
                throw new errorHandler_1.ConflictError('CNPJ já está em uso por outro órgão público');
            }
        }
        const updatedPublicEntity = await database_1.prisma.publicEntity.update({
            where: { id },
            data: {
                name,
                cnpj,
                entityType,
                address,
                city,
                state,
                zipCode,
                phone,
                website,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        status: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'PUBLIC_ENTITY_PROFILE_UPDATED', {
            publicEntityId: id,
            updatedBy: userRole === client_1.UserRole.ADMIN ? 'admin' : 'owner',
        });
        res.json({
            success: true,
            message: 'Perfil de órgão público atualizado com sucesso',
            data: { publicEntity: updatedPublicEntity },
        });
    }
    async verify(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!publicEntity) {
            throw new errorHandler_1.NotFoundError('Órgão público não encontrado');
        }
        const updatedPublicEntity = await database_1.prisma.publicEntity.update({
            where: { id },
            data: {
                verifiedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        status: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'PUBLIC_ENTITY_VERIFIED', {
            publicEntityId: id,
            publicEntityUserId: publicEntity.userId,
        });
        res.json({
            success: true,
            message: 'Órgão público verificado com sucesso',
            data: { publicEntity: updatedPublicEntity },
        });
    }
    async delete(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { id },
            include: {
                biddings: { select: { id: true } },
                contracts: { select: { id: true } },
            },
        });
        if (!publicEntity) {
            throw new errorHandler_1.NotFoundError('Órgão público não encontrado');
        }
        if (publicEntity.biddings.length > 0 || publicEntity.contracts.length > 0) {
            throw new errorHandler_1.ValidationError('Não é possível excluir órgão público com licitações ou contratos associados');
        }
        await database_1.prisma.publicEntity.delete({
            where: { id },
        });
        (0, logger_1.logUserActivity)(userId, 'PUBLIC_ENTITY_DELETED', {
            publicEntityId: id,
            publicEntityUserId: publicEntity.userId,
        });
        res.json({
            success: true,
            message: 'Órgão público excluído com sucesso',
        });
    }
    async getStatistics(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { id },
        });
        if (!publicEntity) {
            throw new errorHandler_1.NotFoundError('Órgão público não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para ver estas estatísticas');
        }
        const [totalBiddings, openBiddings, closedBiddings, activeContracts, completedContracts, totalContractValue, biddingsByStatus,] = await Promise.all([
            database_1.prisma.bidding.count({
                where: { publicEntityId: id },
            }),
            database_1.prisma.bidding.count({
                where: {
                    publicEntityId: id,
                    status: 'OPEN',
                },
            }),
            database_1.prisma.bidding.count({
                where: {
                    publicEntityId: id,
                    status: 'CLOSED',
                },
            }),
            database_1.prisma.contract.count({
                where: {
                    publicEntityId: id,
                    status: 'ACTIVE',
                },
            }),
            database_1.prisma.contract.count({
                where: {
                    publicEntityId: id,
                    status: 'COMPLETED',
                },
            }),
            database_1.prisma.contract.aggregate({
                where: { publicEntityId: id },
                _sum: {
                    totalValue: true,
                },
            }),
            database_1.prisma.bidding.groupBy({
                by: ['status'],
                where: { publicEntityId: id },
                _count: {
                    status: true,
                },
            }),
        ]);
        const statistics = {
            biddings: {
                total: totalBiddings,
                open: openBiddings,
                closed: closedBiddings,
                byStatus: biddingsByStatus.reduce((acc, item) => {
                    acc[item.status] = item._count.status;
                    return acc;
                }, {}),
            },
            contracts: {
                active: activeContracts,
                completed: completedContracts,
                totalValue: totalContractValue._sum.totalValue || 0,
            },
        };
        res.json({
            success: true,
            data: { statistics },
        });
    }
}
exports.PublicEntityController = PublicEntityController;
//# sourceMappingURL=PublicEntityController.js.map