"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProposalController = void 0;
const database_1 = require("@/config/database");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
const client_1 = require("@prisma/client");
const notificationService_1 = __importDefault(require("@/services/notificationService"));
class ProposalController {
    async list(req, res) {
        const { page = 1, limit = 10, search, status, biddingId } = req.query;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (userRole === client_1.UserRole.SUPPLIER) {
            const supplier = await database_1.prisma.supplier.findUnique({
                where: { userId },
            });
            if (supplier) {
                where.supplierId = supplier.id;
            }
            else {
                return res.json({
                    success: true,
                    data: {
                        proposals: [],
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
        else if (userRole === client_1.UserRole.PUBLIC_ENTITY) {
            const publicEntity = await database_1.prisma.publicEntity.findUnique({
                where: { userId },
            });
            if (publicEntity) {
                where.bidding = {
                    publicEntityId: publicEntity.id,
                };
            }
            else {
                return res.json({
                    success: true,
                    data: {
                        proposals: [],
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
                { description: { contains: search, mode: 'insensitive' } },
                { bidding: { title: { contains: search, mode: 'insensitive' } } },
                { supplier: { companyName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (biddingId) {
            where.biddingId = biddingId;
        }
        const startTime = Date.now();
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
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    supplier: {
                        select: {
                            id: true,
                            companyName: true,
                            tradeName: true,
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
                    _count: {
                        select: {
                            items: true,
                            documents: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.proposal.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'proposals', Date.now() - startTime);
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
    async getById(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                bidding: {
                    include: {
                        publicEntity: {
                            select: {
                                id: true,
                                name: true,
                                userId: true,
                            },
                        },
                    },
                },
                supplier: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                items: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                documents: {
                    select: {
                        id: true,
                        filename: true,
                        originalName: true,
                        type: true,
                        description: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!proposal) {
            throw new errorHandler_1.NotFoundError('Proposta não encontrada');
        }
        const canView = userRole === client_1.UserRole.ADMIN ||
            (userRole === client_1.UserRole.SUPPLIER && proposal.supplier.userId === userId) ||
            (userRole === client_1.UserRole.PUBLIC_ENTITY && proposal.bidding.publicEntity.userId === userId);
        if (!canView) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para ver esta proposta');
        }
        res.json({
            success: true,
            data: { proposal },
        });
    }
    async create(req, res) {
        const userId = req.user.userId;
        const { biddingId, description, validUntil, notes, items = [], } = req.body;
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { userId },
        });
        if (!supplier) {
            throw new errorHandler_1.ValidationError('Usuário não possui perfil de fornecedor');
        }
        const bidding = await database_1.prisma.bidding.findUnique({
            where: { id: biddingId },
        });
        if (!bidding) {
            throw new errorHandler_1.NotFoundError('Licitação não encontrada');
        }
        if (bidding.status !== client_1.BiddingStatus.OPEN) {
            throw new errorHandler_1.ValidationError('Licitação não está aberta para propostas');
        }
        const now = new Date();
        if (bidding.closingDate <= now) {
            throw new errorHandler_1.ValidationError('Prazo para submissão de propostas expirado');
        }
        const existingProposal = await database_1.prisma.proposal.findUnique({
            where: {
                biddingId_supplierId: {
                    biddingId,
                    supplierId: supplier.id,
                },
            },
        });
        if (existingProposal) {
            throw new errorHandler_1.ConflictError('Fornecedor já possui uma proposta para esta licitação');
        }
        let totalValue = 0;
        const validatedItems = items.map((item) => {
            const itemTotal = Number(item.quantity) * Number(item.unitPrice);
            totalValue += itemTotal;
            return {
                ...item,
                totalPrice: itemTotal,
            };
        });
        const validUntilDate = new Date(validUntil);
        if (validUntilDate <= now) {
            throw new errorHandler_1.ValidationError('Data de validade deve ser futura');
        }
        const proposal = await database_1.prisma.proposal.create({
            data: {
                biddingId,
                supplierId: supplier.id,
                totalValue,
                description,
                validUntil: validUntilDate,
                notes,
                status: client_1.ProposalStatus.DRAFT,
                items: {
                    create: validatedItems,
                },
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
                items: true,
            },
        });
        (0, logger_1.logUserActivity)(userId, 'PROPOSAL_CREATED', {
            proposalId: proposal.id,
            biddingId,
            totalValue,
        });
        res.status(201).json({
            success: true,
            message: 'Proposta criada com sucesso',
            data: { proposal },
        });
    }
    async update(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { description, validUntil, notes, items = [], } = req.body;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                supplier: true,
                bidding: true,
                items: true,
            },
        });
        if (!proposal) {
            throw new errorHandler_1.NotFoundError('Proposta não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && proposal.supplier.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para editar esta proposta');
        }
        if (proposal.status !== client_1.ProposalStatus.DRAFT) {
            throw new errorHandler_1.ValidationError('Apenas propostas em rascunho podem ser editadas');
        }
        const now = new Date();
        if (proposal.bidding.closingDate <= now) {
            throw new errorHandler_1.ValidationError('Prazo para edição de propostas expirado');
        }
        let totalValue = Number(proposal.totalValue);
        if (items.length > 0) {
            totalValue = 0;
            items.forEach((item) => {
                totalValue += Number(item.quantity) * Number(item.unitPrice);
            });
        }
        let validUntilDate;
        if (validUntil) {
            validUntilDate = new Date(validUntil);
            if (validUntilDate <= now) {
                throw new errorHandler_1.ValidationError('Data de validade deve ser futura');
            }
        }
        const updatedProposal = await database_1.prisma.proposal.update({
            where: { id },
            data: {
                totalValue,
                description,
                validUntil: validUntilDate,
                notes,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
                items: true,
            },
        });
        if (items.length > 0) {
            await database_1.prisma.proposalItem.deleteMany({
                where: { proposalId: id },
            });
            const validatedItems = items.map((item) => ({
                proposalId: id,
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.quantity) * Number(item.unitPrice),
                brand: item.brand,
                model: item.model,
            }));
            await database_1.prisma.proposalItem.createMany({
                data: validatedItems,
            });
        }
        (0, logger_1.logUserActivity)(userId, 'PROPOSAL_UPDATED', {
            proposalId: id,
            updatedBy: userRole === client_1.UserRole.ADMIN ? 'admin' : 'owner',
        });
        res.json({
            success: true,
            message: 'Proposta atualizada com sucesso',
            data: { proposal: updatedProposal },
        });
    }
    async submit(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                supplier: true,
                bidding: true,
                items: true,
            },
        });
        if (!proposal) {
            throw new errorHandler_1.NotFoundError('Proposta não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && proposal.supplier.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para submeter esta proposta');
        }
        if (proposal.status !== client_1.ProposalStatus.DRAFT) {
            throw new errorHandler_1.ValidationError('Apenas propostas em rascunho podem ser submetidas');
        }
        if (proposal.bidding.status !== client_1.BiddingStatus.OPEN) {
            throw new errorHandler_1.ValidationError('Licitação não está mais aberta para propostas');
        }
        const now = new Date();
        if (proposal.bidding.closingDate <= now) {
            throw new errorHandler_1.ValidationError('Prazo para submissão de propostas expirado');
        }
        if (proposal.items.length === 0) {
            throw new errorHandler_1.ValidationError('Proposta deve ter pelo menos um item');
        }
        const updatedProposal = await database_1.prisma.proposal.update({
            where: { id },
            data: {
                status: client_1.ProposalStatus.SUBMITTED,
                submittedAt: new Date(),
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'PROPOSAL_SUBMITTED', {
            proposalId: id,
            biddingId: proposal.biddingId,
        });
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { id: proposal.bidding.publicEntityId },
        });
        if (publicEntity) {
            const notificationService = notificationService_1.default.getInstance();
            await notificationService.notifyProposalReceived(publicEntity.userId, proposal.bidding.title, proposal.supplier.companyName, id);
        }
        res.json({
            success: true,
            message: 'Proposta submetida com sucesso',
            data: { proposal: updatedProposal },
        });
    }
    async withdraw(req, res) {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                supplier: true,
                bidding: true,
            },
        });
        if (!proposal) {
            throw new errorHandler_1.NotFoundError('Proposta não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && proposal.supplier.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para retirar esta proposta');
        }
        if (proposal.status !== client_1.ProposalStatus.SUBMITTED && proposal.status !== client_1.ProposalStatus.UNDER_REVIEW) {
            throw new errorHandler_1.ValidationError('Proposta não pode ser retirada neste status');
        }
        if (proposal.bidding.status === client_1.BiddingStatus.CLOSED || proposal.bidding.status === client_1.BiddingStatus.AWARDED) {
            throw new errorHandler_1.ValidationError('Não é possível retirar proposta após fechamento da licitação');
        }
        const updatedProposal = await database_1.prisma.proposal.update({
            where: { id },
            data: {
                status: client_1.ProposalStatus.WITHDRAWN,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'PROPOSAL_WITHDRAWN', {
            proposalId: id,
            reason,
        });
        res.json({
            success: true,
            message: 'Proposta retirada com sucesso',
            data: { proposal: updatedProposal },
        });
    }
    async delete(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                supplier: true,
                contract: { select: { id: true } },
            },
        });
        if (!proposal) {
            throw new errorHandler_1.NotFoundError('Proposta não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && proposal.supplier.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para excluir esta proposta');
        }
        if (proposal.status !== client_1.ProposalStatus.DRAFT) {
            throw new errorHandler_1.ValidationError('Apenas propostas em rascunho podem ser excluídas');
        }
        if (proposal.contract) {
            throw new errorHandler_1.ValidationError('Não é possível excluir proposta com contrato associado');
        }
        await database_1.prisma.proposal.delete({
            where: { id },
        });
        (0, logger_1.logUserActivity)(userId, 'PROPOSAL_DELETED', {
            proposalId: id,
        });
        res.json({
            success: true,
            message: 'Proposta excluída com sucesso',
        });
    }
    async evaluate(req, res) {
        const { id } = req.params;
        const { evaluation, score, notes } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                bidding: {
                    include: {
                        publicEntity: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        if (!proposal) {
            throw new errorHandler_1.NotFoundError('Proposta não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && proposal.bidding.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para avaliar esta proposta');
        }
        if (proposal.status !== client_1.ProposalStatus.SUBMITTED) {
            throw new errorHandler_1.ValidationError('Apenas propostas submetidas podem ser avaliadas');
        }
        if (proposal.bidding.status !== client_1.BiddingStatus.CLOSED) {
            throw new errorHandler_1.ValidationError('Propostas só podem ser avaliadas após fechamento da licitação');
        }
        const updatedProposal = await database_1.prisma.proposal.update({
            where: { id },
            data: {
                status: client_1.ProposalStatus.UNDER_REVIEW,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'PROPOSAL_EVALUATED', {
            proposalId: id,
            evaluation,
            score,
        });
        res.json({
            success: true,
            message: 'Proposta avaliada com sucesso',
            data: { proposal: updatedProposal },
        });
    }
    async accept(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                bidding: {
                    include: {
                        publicEntity: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        if (!proposal) {
            throw new errorHandler_1.NotFoundError('Proposta não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && proposal.bidding.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para aceitar esta proposta');
        }
        if (proposal.status !== client_1.ProposalStatus.UNDER_REVIEW) {
            throw new errorHandler_1.ValidationError('Apenas propostas em avaliação podem ser aceitas');
        }
        const updatedProposal = await database_1.prisma.proposal.update({
            where: { id },
            data: {
                status: client_1.ProposalStatus.ACCEPTED,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        await database_1.prisma.bidding.update({
            where: { id: proposal.biddingId },
            data: {
                status: client_1.BiddingStatus.AWARDED,
            },
        });
        (0, logger_1.logUserActivity)(userId, 'PROPOSAL_ACCEPTED', {
            proposalId: id,
            biddingId: proposal.biddingId,
        });
        res.json({
            success: true,
            message: 'Proposta aceita com sucesso',
            data: { proposal: updatedProposal },
        });
    }
    async reject(req, res) {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id },
            include: {
                bidding: {
                    include: {
                        publicEntity: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        if (!proposal) {
            throw new errorHandler_1.NotFoundError('Proposta não encontrada');
        }
        if (userRole !== client_1.UserRole.ADMIN && proposal.bidding.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para rejeitar esta proposta');
        }
        if (proposal.status !== client_1.ProposalStatus.UNDER_REVIEW) {
            throw new errorHandler_1.ValidationError('Apenas propostas em avaliação podem ser rejeitadas');
        }
        const updatedProposal = await database_1.prisma.proposal.update({
            where: { id },
            data: {
                status: client_1.ProposalStatus.REJECTED,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                supplier: {
                    select: {
                        id: true,
                        companyName: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'PROPOSAL_REJECTED', {
            proposalId: id,
            reason,
        });
        res.json({
            success: true,
            message: 'Proposta rejeitada com sucesso',
            data: { proposal: updatedProposal },
        });
    }
}
exports.ProposalController = ProposalController;
//# sourceMappingURL=ProposalController.js.map