"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiddingController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const notificationService_1 = __importDefault(require("../services/notificationService"));
class BiddingController {
    async listPublic(req, res) {
        const { page = 1, limit = 10, search, city, state, type, status, categoryId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {
            isPublic: true,
            status: {
                in: ['PUBLISHED', 'OPEN', 'CLOSED', 'AWARDED'],
            },
        };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { biddingNumber: { contains: search } },
            ];
        }
        if (type) {
            where.type = type;
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
        if (city || state) {
            where.publicEntity = {};
            if (city) {
                where.publicEntity.city = { contains: city, mode: 'insensitive' };
            }
            if (state) {
                where.publicEntity.state = state;
            }
        }
        const startTime = Date.now();
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
                    openingDate: 'desc',
                },
            }),
            database_1.prisma.bidding.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'biddings_public', Date.now() - startTime);
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
    async getPublicById(req, res) {
        const { id } = req.params;
        const bidding = await database_1.prisma.bidding.findFirst({
            where: {
                id,
                isPublic: true,
                status: {
                    in: ['PUBLISHED', 'OPEN', 'CLOSED', 'AWARDED'],
                },
            },
            include: {
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        entityType: true,
                        phone: true,
                        website: true,
                    },
                },
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                description: true,
                            },
                        },
                    },
                },
                documents: {
                    where: {
                        isPublic: true,
                    },
                    select: {
                        id: true,
                        filename: true,
                        originalName: true,
                        type: true,
                        description: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        proposals: true,
                    },
                },
            },
        });
        if (!bidding) {
            throw new errorHandler_1.NotFoundError('Licitação não encontrada ou não é pública');
        }
        res.json({
            success: true,
            data: { bidding },
        });
    }
    async list(req, res) {
        const { page = 1, limit = 10, search, status, type, categoryId } = req.query;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (userRole === client_1.UserRole.PUBLIC_ENTITY) {
            const publicEntity = await database_1.prisma.publicEntity.findUnique({
                where: { userId },
            });
            if (publicEntity) {
                where.publicEntityId = publicEntity.id;
            }
            else {
                return res.json({
                    success: true,
                    data: {
                        biddings: [],
                        pagination: {
                            page: Number(page),
                            limit: Number(limit),
                            total: 0,
                            totalPages: 0,
                            hasNext: false,
                            hasPrev: false,
                        },
                    },
                });
            }
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { biddingNumber: { contains: search } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (type) {
            where.type = type;
        }
        if (categoryId) {
            where.categories = {
                some: {
                    categoryId: categoryId,
                },
            };
        }
        const startTime = Date.now();
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
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.bidding.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'biddings', Date.now() - startTime);
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
    async getById(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const bidding = await database_1.prisma.bidding.findUnique({
            where: { id },
            include: {
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                        entityType: true,
                        phone: true,
                        website: true,
                        userId: true,
                    },
                },
                categories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                description: true,
                            },
                        },
                    },
                },
                documents: {
                    select: {
                        id: true,
                        filename: true,
                        originalName: true,
                        type: true,
                        description: true,
                        isPublic: true,
                        createdAt: true,
                    },
                },
                proposals: {
                    select: {
                        id: true,
                        status: true,
                        totalValue: true,
                        submittedAt: true,
                        supplier: {
                            select: {
                                id: true,
                                companyName: true,
                            },
                        },
                    },
                    orderBy: {
                        totalValue: 'asc',
                    },
                },
                contract: {
                    select: {
                        id: true,
                        contractNumber: true,
                        status: true,
                        totalValue: true,
                        supplier: {
                            select: {
                                id: true,
                                companyName: true,
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
        });
        if (!bidding) {
            throw new errorHandler_1.NotFoundError('Licitação não encontrada');
        }
        const canViewPrivate = userRole === client_1.UserRole.ADMIN ||
            (userRole === client_1.UserRole.PUBLIC_ENTITY && bidding.publicEntity.userId === userId);
        if (!canViewPrivate) {
            bidding.documents = bidding.documents.filter(doc => doc.isPublic);
        }
        res.json({
            success: true,
            data: { bidding },
        });
    }
    async create(req, res) {
        const userId = req.user.userId;
        const { title, description, biddingNumber, type, estimatedValue, openingDate, closingDate, deliveryLocation, deliveryDeadline, requirements, evaluationCriteria, isPublic = true, categoryIds = [], } = req.body;
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { userId },
        });
        if (!publicEntity) {
            throw new errorHandler_1.ValidationError('Usuário não possui perfil de órgão público');
        }
        const existingBidding = await database_1.prisma.bidding.findUnique({
            where: { biddingNumber },
        });
        if (existingBidding) {
            throw new errorHandler_1.ConflictError('Número de licitação já existe');
        }
        const openingDateTime = new Date(openingDate);
        const closingDateTime = new Date(closingDate);
        const deliveryDateTime = new Date(deliveryDeadline);
        if (openingDateTime >= closingDateTime) {
            throw new errorHandler_1.ValidationError('Data de abertura deve ser anterior à data de fechamento');
        }
        if (closingDateTime >= deliveryDateTime) {
            throw new errorHandler_1.ValidationError('Data de fechamento deve ser anterior ao prazo de entrega');
        }
        const bidding = await database_1.prisma.bidding.create({
            data: {
                publicEntityId: publicEntity.id,
                title,
                description,
                biddingNumber,
                type,
                estimatedValue,
                openingDate: openingDateTime,
                closingDate: closingDateTime,
                deliveryLocation,
                deliveryDeadline: deliveryDateTime,
                requirements,
                evaluationCriteria,
                isPublic,
                status: 'DRAFT',
            },
            include: {
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        state: true,
                    },
                },
            },
        });
        if (categoryIds.length > 0) {
            await database_1.prisma.biddingCategory.createMany({
                data: categoryIds.map((categoryId) => ({
                    biddingId: bidding.id,
                    categoryId,
                })),
            });
        }
        (0, logger_1.logUserActivity)(userId, 'BIDDING_CREATED', {
            biddingId: bidding.id,
            biddingNumber: bidding.biddingNumber,
        });
        res.status(201).json({
            success: true,
            message: 'Licitação criada com sucesso',
            data: { bidding },
        });
    }
    async update(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { title, description, type, estimatedValue, openingDate, closingDate, deliveryLocation, deliveryDeadline, requirements, evaluationCriteria, isPublic, categoryIds, } = req.body;
        const bidding = await database_1.prisma.bidding.findUnique({
            where: { id },
            include: {
                publicEntity: true,
                proposals: { select: { id: true } },
            },
        });
        if (!bidding) {
            throw new errorHandler_1.NotFoundError('Licitação não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && bidding.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para editar esta licitação');
        }
        if (bidding.status !== client_1.BiddingStatus.DRAFT && bidding.status !== client_1.BiddingStatus.PUBLISHED) {
            throw new errorHandler_1.ValidationError('Licitação não pode ser editada neste status');
        }
        if (bidding.proposals.length > 0) {
            throw new errorHandler_1.ValidationError('Não é possível editar licitação com propostas já submetidas');
        }
        let openingDateTime, closingDateTime, deliveryDateTime;
        if (openingDate)
            openingDateTime = new Date(openingDate);
        if (closingDate)
            closingDateTime = new Date(closingDate);
        if (deliveryDeadline)
            deliveryDateTime = new Date(deliveryDeadline);
        if (openingDateTime && closingDateTime && openingDateTime >= closingDateTime) {
            throw new errorHandler_1.ValidationError('Data de abertura deve ser anterior à data de fechamento');
        }
        if (closingDateTime && deliveryDateTime && closingDateTime >= deliveryDateTime) {
            throw new errorHandler_1.ValidationError('Data de fechamento deve ser anterior ao prazo de entrega');
        }
        const updatedBidding = await database_1.prisma.bidding.update({
            where: { id },
            data: {
                title,
                description,
                type,
                estimatedValue,
                openingDate: openingDateTime,
                closingDate: closingDateTime,
                deliveryLocation,
                deliveryDeadline: deliveryDateTime,
                requirements,
                evaluationCriteria,
                isPublic,
            },
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
            },
        });
        if (categoryIds && Array.isArray(categoryIds)) {
            await database_1.prisma.biddingCategory.deleteMany({
                where: { biddingId: id },
            });
            if (categoryIds.length > 0) {
                await database_1.prisma.biddingCategory.createMany({
                    data: categoryIds.map((categoryId) => ({
                        biddingId: id,
                        categoryId,
                    })),
                });
            }
        }
        (0, logger_1.logUserActivity)(userId, 'BIDDING_UPDATED', {
            biddingId: id,
            updatedBy: userRole === client_1.UserRole.ADMIN ? 'admin' : 'owner',
        });
        res.json({
            success: true,
            message: 'Licitação atualizada com sucesso',
            data: { bidding: updatedBidding },
        });
    }
    async publish(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const bidding = await database_1.prisma.bidding.findUnique({
            where: { id },
            include: {
                publicEntity: true,
            },
        });
        if (!bidding) {
            throw new errorHandler_1.NotFoundError('Licitação não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && bidding.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para publicar esta licitação');
        }
        if (bidding.status !== client_1.BiddingStatus.DRAFT) {
            throw new errorHandler_1.ValidationError('Apenas licitações em rascunho podem ser publicadas');
        }
        const now = new Date();
        if (bidding.openingDate <= now) {
            throw new errorHandler_1.ValidationError('Data de abertura deve ser futura');
        }
        const updatedBidding = await database_1.prisma.bidding.update({
            where: { id },
            data: {
                status: client_1.BiddingStatus.PUBLISHED,
                publishedAt: new Date(),
            },
            include: {
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'BIDDING_PUBLISHED', {
            biddingId: id,
            biddingNumber: bidding.biddingNumber,
        });
        const notificationService = notificationService_1.default.getInstance();
        await notificationService.notifyNewBidding(id, bidding.title);
        res.json({
            success: true,
            message: 'Licitação publicada com sucesso',
            data: { bidding: updatedBidding },
        });
    }
    async cancel(req, res) {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const bidding = await database_1.prisma.bidding.findUnique({
            where: { id },
            include: {
                publicEntity: true,
                proposals: { select: { id: true } },
            },
        });
        if (!bidding) {
            throw new errorHandler_1.NotFoundError('Licitação não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && bidding.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para cancelar esta licitação');
        }
        if (bidding.status === client_1.BiddingStatus.CANCELLED || bidding.status === client_1.BiddingStatus.AWARDED) {
            throw new errorHandler_1.ValidationError('Licitação não pode ser cancelada neste status');
        }
        const updatedBidding = await database_1.prisma.bidding.update({
            where: { id },
            data: {
                status: client_1.BiddingStatus.CANCELLED,
            },
            include: {
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'BIDDING_CANCELLED', {
            biddingId: id,
            biddingNumber: bidding.biddingNumber,
            reason,
        });
        res.json({
            success: true,
            message: 'Licitação cancelada com sucesso',
            data: { bidding: updatedBidding },
        });
    }
    async delete(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const bidding = await database_1.prisma.bidding.findUnique({
            where: { id },
            include: {
                publicEntity: true,
                proposals: { select: { id: true } },
                contract: { select: { id: true } },
            },
        });
        if (!bidding) {
            throw new errorHandler_1.NotFoundError('Licitação não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && bidding.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para excluir esta licitação');
        }
        if (bidding.status !== client_1.BiddingStatus.DRAFT) {
            throw new errorHandler_1.ValidationError('Apenas licitações em rascunho podem ser excluídas');
        }
        if (bidding.proposals.length > 0 || bidding.contract) {
            throw new errorHandler_1.ValidationError('Não é possível excluir licitação com propostas ou contratos associados');
        }
        await database_1.prisma.bidding.delete({
            where: { id },
        });
        (0, logger_1.logUserActivity)(userId, 'BIDDING_DELETED', {
            biddingId: id,
            biddingNumber: bidding.biddingNumber,
        });
        res.json({
            success: true,
            message: 'Licitação excluída com sucesso',
        });
    }
    async openBidding(biddingId) {
        const bidding = await database_1.prisma.bidding.findUnique({
            where: { id: biddingId },
        });
        if (!bidding || bidding.status !== client_1.BiddingStatus.PUBLISHED) {
            return;
        }
        const now = new Date();
        if (bidding.openingDate <= now) {
            await database_1.prisma.bidding.update({
                where: { id: biddingId },
                data: {
                    status: client_1.BiddingStatus.OPEN,
                },
            });
        }
    }
    async closeBidding(biddingId) {
        const bidding = await database_1.prisma.bidding.findUnique({
            where: { id: biddingId },
        });
        if (!bidding || bidding.status !== client_1.BiddingStatus.OPEN) {
            return;
        }
        const now = new Date();
        if (bidding.closingDate <= now) {
            await database_1.prisma.bidding.update({
                where: { id: biddingId },
                data: {
                    status: client_1.BiddingStatus.CLOSED,
                },
            });
        }
    }
}
exports.BiddingController = BiddingController;
//# sourceMappingURL=BiddingController.js.map