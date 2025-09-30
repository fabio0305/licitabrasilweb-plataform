"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
class ContractController {
    async list(req, res) {
        const { page = 1, limit = 10, search, status } = req.query;
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
                        contracts: [],
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
                where.publicEntityId = publicEntity.id;
            }
            else {
                return res.json({
                    success: true,
                    data: {
                        contracts: [],
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
                { contractNumber: { contains: search } },
            ];
        }
        if (status) {
            where.status = status;
        }
        const startTime = Date.now();
        const [contracts, total] = await Promise.all([
            database_1.prisma.contract.findMany({
                where,
                skip: offset,
                take: Number(limit),
                include: {
                    bidding: {
                        select: {
                            id: true,
                            title: true,
                            biddingNumber: true,
                        },
                    },
                    publicEntity: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            state: true,
                        },
                    },
                    supplier: {
                        select: {
                            id: true,
                            companyName: true,
                            tradeName: true,
                        },
                    },
                    proposal: {
                        select: {
                            id: true,
                            totalValue: true,
                        },
                    },
                    _count: {
                        select: {
                            documents: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.contract.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'contracts', Date.now() - startTime);
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
    async getById(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const contract = await database_1.prisma.contract.findUnique({
            where: { id },
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
                publicEntity: {
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
                proposal: {
                    include: {
                        items: true,
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
        if (!contract) {
            throw new errorHandler_1.NotFoundError('Contrato não encontrado');
        }
        const canView = userRole === client_1.UserRole.ADMIN ||
            (userRole === client_1.UserRole.SUPPLIER && contract.supplier.userId === userId) ||
            (userRole === client_1.UserRole.PUBLIC_ENTITY && contract.publicEntity.userId === userId);
        if (!canView) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para ver este contrato');
        }
        res.json({
            success: true,
            data: { contract },
        });
    }
    async create(req, res) {
        const userId = req.user.userId;
        const { proposalId, contractNumber, title, description, startDate, endDate, } = req.body;
        const publicEntity = await database_1.prisma.publicEntity.findUnique({
            where: { userId },
        });
        if (!publicEntity) {
            throw new errorHandler_1.ValidationError('Usuário não possui perfil de órgão público');
        }
        const proposal = await database_1.prisma.proposal.findUnique({
            where: { id: proposalId },
            include: {
                bidding: true,
                supplier: true,
            },
        });
        if (!proposal) {
            throw new errorHandler_1.NotFoundError('Proposta não encontrada');
        }
        if (proposal.status !== 'ACCEPTED') {
            throw new errorHandler_1.ValidationError('Apenas propostas aceitas podem gerar contratos');
        }
        if (proposal.bidding.publicEntityId !== publicEntity.id) {
            throw new errorHandler_1.AuthorizationError('Proposta não pertence a uma licitação deste órgão público');
        }
        const existingContract = await database_1.prisma.contract.findUnique({
            where: { proposalId },
        });
        if (existingContract) {
            throw new errorHandler_1.ConflictError('Já existe um contrato para esta proposta');
        }
        const existingContractNumber = await database_1.prisma.contract.findUnique({
            where: { contractNumber },
        });
        if (existingContractNumber) {
            throw new errorHandler_1.ConflictError('Número de contrato já existe');
        }
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        if (startDateTime >= endDateTime) {
            throw new errorHandler_1.ValidationError('Data de início deve ser anterior à data de fim');
        }
        const contract = await database_1.prisma.contract.create({
            data: {
                biddingId: proposal.biddingId,
                proposalId,
                publicEntityId: publicEntity.id,
                supplierId: proposal.supplierId,
                contractNumber,
                title,
                description,
                totalValue: proposal.totalValue,
                startDate: startDateTime,
                endDate: endDateTime,
                status: client_1.ContractStatus.DRAFT,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
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
        (0, logger_1.logUserActivity)(userId, 'CONTRACT_CREATED', {
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            proposalId,
        });
        res.status(201).json({
            success: true,
            message: 'Contrato criado com sucesso',
            data: { contract },
        });
    }
    async update(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { title, description, startDate, endDate, } = req.body;
        const contract = await database_1.prisma.contract.findUnique({
            where: { id },
            include: {
                publicEntity: true,
            },
        });
        if (!contract) {
            throw new errorHandler_1.NotFoundError('Contrato não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && contract.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para editar este contrato');
        }
        if (contract.status !== client_1.ContractStatus.DRAFT) {
            throw new errorHandler_1.ValidationError('Apenas contratos em rascunho podem ser editados');
        }
        let startDateTime, endDateTime;
        if (startDate)
            startDateTime = new Date(startDate);
        if (endDate)
            endDateTime = new Date(endDate);
        if (startDateTime && endDateTime && startDateTime >= endDateTime) {
            throw new errorHandler_1.ValidationError('Data de início deve ser anterior à data de fim');
        }
        const updatedContract = await database_1.prisma.contract.update({
            where: { id },
            data: {
                title,
                description,
                startDate: startDateTime,
                endDate: endDateTime,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
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
        (0, logger_1.logUserActivity)(userId, 'CONTRACT_UPDATED', {
            contractId: id,
            updatedBy: userRole === client_1.UserRole.ADMIN ? 'admin' : 'owner',
        });
        res.json({
            success: true,
            message: 'Contrato atualizado com sucesso',
            data: { contract: updatedContract },
        });
    }
    async activate(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const contract = await database_1.prisma.contract.findUnique({
            where: { id },
            include: {
                publicEntity: true,
                supplier: true,
            },
        });
        if (!contract) {
            throw new errorHandler_1.NotFoundError('Contrato não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && contract.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para ativar este contrato');
        }
        if (contract.status !== client_1.ContractStatus.DRAFT) {
            throw new errorHandler_1.ValidationError('Apenas contratos em rascunho podem ser ativados');
        }
        if (!contract.signedAt) {
            throw new errorHandler_1.ValidationError('Contrato deve ser assinado antes de ser ativado');
        }
        const updatedContract = await database_1.prisma.contract.update({
            where: { id },
            data: {
                status: client_1.ContractStatus.ACTIVE,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
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
        (0, logger_1.logUserActivity)(userId, 'CONTRACT_ACTIVATED', {
            contractId: id,
            contractNumber: contract.contractNumber,
        });
        res.json({
            success: true,
            message: 'Contrato ativado com sucesso',
            data: { contract: updatedContract },
        });
    }
    async suspend(req, res) {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const contract = await database_1.prisma.contract.findUnique({
            where: { id },
            include: {
                publicEntity: true,
            },
        });
        if (!contract) {
            throw new errorHandler_1.NotFoundError('Contrato não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && contract.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para suspender este contrato');
        }
        if (contract.status !== client_1.ContractStatus.ACTIVE) {
            throw new errorHandler_1.ValidationError('Apenas contratos ativos podem ser suspensos');
        }
        const updatedContract = await database_1.prisma.contract.update({
            where: { id },
            data: {
                status: client_1.ContractStatus.SUSPENDED,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
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
        (0, logger_1.logUserActivity)(userId, 'CONTRACT_SUSPENDED', {
            contractId: id,
            contractNumber: contract.contractNumber,
            reason,
        });
        res.json({
            success: true,
            message: 'Contrato suspenso com sucesso',
            data: { contract: updatedContract },
        });
    }
    async terminate(req, res) {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const contract = await database_1.prisma.contract.findUnique({
            where: { id },
            include: {
                publicEntity: true,
            },
        });
        if (!contract) {
            throw new errorHandler_1.NotFoundError('Contrato não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && contract.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para rescindir este contrato');
        }
        if (contract.status === client_1.ContractStatus.TERMINATED || contract.status === client_1.ContractStatus.COMPLETED) {
            throw new errorHandler_1.ValidationError('Contrato já foi finalizado');
        }
        const updatedContract = await database_1.prisma.contract.update({
            where: { id },
            data: {
                status: client_1.ContractStatus.TERMINATED,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
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
        (0, logger_1.logUserActivity)(userId, 'CONTRACT_TERMINATED', {
            contractId: id,
            contractNumber: contract.contractNumber,
            reason,
        });
        res.json({
            success: true,
            message: 'Contrato rescindido com sucesso',
            data: { contract: updatedContract },
        });
    }
    async sign(req, res) {
        const { id } = req.params;
        const { digitalSignature } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const contract = await database_1.prisma.contract.findUnique({
            where: { id },
            include: {
                publicEntity: true,
                supplier: true,
            },
        });
        if (!contract) {
            throw new errorHandler_1.NotFoundError('Contrato não encontrado');
        }
        const canSign = (userRole === client_1.UserRole.PUBLIC_ENTITY && contract.publicEntity.userId === userId) ||
            (userRole === client_1.UserRole.SUPPLIER && contract.supplier.userId === userId) ||
            userRole === client_1.UserRole.ADMIN;
        if (!canSign) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para assinar este contrato');
        }
        if (contract.status !== client_1.ContractStatus.DRAFT) {
            throw new errorHandler_1.ValidationError('Apenas contratos em rascunho podem ser assinados');
        }
        const updatedContract = await database_1.prisma.contract.update({
            where: { id },
            data: {
                signedAt: new Date(),
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
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
        (0, logger_1.logUserActivity)(userId, 'CONTRACT_SIGNED', {
            contractId: id,
            contractNumber: contract.contractNumber,
            signerRole: userRole,
        });
        res.json({
            success: true,
            message: 'Contrato assinado com sucesso',
            data: { contract: updatedContract },
        });
    }
    async complete(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const contract = await database_1.prisma.contract.findUnique({
            where: { id },
            include: {
                publicEntity: true,
            },
        });
        if (!contract) {
            throw new errorHandler_1.NotFoundError('Contrato não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && contract.publicEntity.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para completar este contrato');
        }
        if (contract.status !== client_1.ContractStatus.ACTIVE) {
            throw new errorHandler_1.ValidationError('Apenas contratos ativos podem ser completados');
        }
        const updatedContract = await database_1.prisma.contract.update({
            where: { id },
            data: {
                status: client_1.ContractStatus.COMPLETED,
            },
            include: {
                bidding: {
                    select: {
                        id: true,
                        title: true,
                        biddingNumber: true,
                    },
                },
                publicEntity: {
                    select: {
                        id: true,
                        name: true,
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
        (0, logger_1.logUserActivity)(userId, 'CONTRACT_COMPLETED', {
            contractId: id,
            contractNumber: contract.contractNumber,
        });
        res.json({
            success: true,
            message: 'Contrato completado com sucesso',
            data: { contract: updatedContract },
        });
    }
}
exports.ContractController = ContractController;
//# sourceMappingURL=ContractController.js.map