"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierController = void 0;
const database_1 = require("@/config/database");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
const client_1 = require("@prisma/client");
class SupplierController {
    async list(req, res) {
        const { page = 1, limit = 10, search, city, state, isActive, categoryId } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { companyName: { contains: search, mode: 'insensitive' } },
                { tradeName: { contains: search, mode: 'insensitive' } },
                { cnpj: { contains: search } },
            ];
        }
        if (city) {
            where.city = { contains: city, mode: 'insensitive' };
        }
        if (state) {
            where.state = state;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        if (categoryId) {
            where.categories = {
                some: {
                    categoryId: categoryId,
                },
            };
        }
        const startTime = Date.now();
        const [suppliers, total] = await Promise.all([
            database_1.prisma.supplier.findMany({
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
                            contracts: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.supplier.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'suppliers', Date.now() - startTime);
        const totalPages = Math.ceil(total / Number(limit));
        res.json({
            success: true,
            data: {
                suppliers,
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
        const supplier = await database_1.prisma.supplier.findUnique({
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
                proposals: {
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
                            },
                        },
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
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 10,
                },
                _count: {
                    select: {
                        proposals: true,
                        contracts: true,
                        documents: true,
                    },
                },
            },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Fornecedor não encontrado');
        }
        res.json({
            success: true,
            data: { supplier },
        });
    }
    async create(req, res) {
        const userId = req.user.userId;
        const { companyName, tradeName, cnpj, stateRegistration, municipalRegistration, address, city, state, zipCode, website, description, } = req.body;
        const existingSupplier = await database_1.prisma.supplier.findUnique({
            where: { userId },
        });
        if (existingSupplier) {
            throw new errorHandler_1.ConflictError('Usuário já possui um perfil de fornecedor');
        }
        const existingCnpj = await database_1.prisma.supplier.findUnique({
            where: { cnpj },
        });
        if (existingCnpj) {
            throw new errorHandler_1.ConflictError('CNPJ já está em uso por outro fornecedor');
        }
        const supplier = await database_1.prisma.supplier.create({
            data: {
                userId,
                companyName,
                tradeName,
                cnpj,
                stateRegistration,
                municipalRegistration,
                address,
                city,
                state,
                zipCode,
                website,
                description,
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
        (0, logger_1.logUserActivity)(userId, 'SUPPLIER_PROFILE_CREATED', { supplierId: supplier.id });
        res.status(201).json({
            success: true,
            message: 'Perfil de fornecedor criado com sucesso',
            data: { supplier },
        });
    }
    async update(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { companyName, tradeName, cnpj, stateRegistration, municipalRegistration, address, city, state, zipCode, website, description, } = req.body;
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Fornecedor não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && supplier.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para editar este fornecedor');
        }
        if (cnpj && cnpj !== supplier.cnpj) {
            const existingCnpj = await database_1.prisma.supplier.findUnique({
                where: { cnpj },
            });
            if (existingCnpj) {
                throw new errorHandler_1.ConflictError('CNPJ já está em uso por outro fornecedor');
            }
        }
        const updatedSupplier = await database_1.prisma.supplier.update({
            where: { id },
            data: {
                companyName,
                tradeName,
                cnpj,
                stateRegistration,
                municipalRegistration,
                address,
                city,
                state,
                zipCode,
                website,
                description,
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
        (0, logger_1.logUserActivity)(userId, 'SUPPLIER_PROFILE_UPDATED', {
            supplierId: id,
            updatedBy: userRole === client_1.UserRole.ADMIN ? 'admin' : 'owner',
        });
        res.json({
            success: true,
            message: 'Perfil de fornecedor atualizado com sucesso',
            data: { supplier: updatedSupplier },
        });
    }
    async verify(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Fornecedor não encontrado');
        }
        const updatedSupplier = await database_1.prisma.supplier.update({
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
        (0, logger_1.logUserActivity)(userId, 'SUPPLIER_VERIFIED', {
            supplierId: id,
            supplierUserId: supplier.userId,
        });
        res.json({
            success: true,
            message: 'Fornecedor verificado com sucesso',
            data: { supplier: updatedSupplier },
        });
    }
    async delete(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { id },
            include: {
                proposals: { select: { id: true } },
                contracts: { select: { id: true } },
            },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Fornecedor não encontrado');
        }
        if (supplier.proposals.length > 0 || supplier.contracts.length > 0) {
            throw new errorHandler_1.ValidationError('Não é possível excluir fornecedor com propostas ou contratos associados');
        }
        await database_1.prisma.supplier.delete({
            where: { id },
        });
        (0, logger_1.logUserActivity)(userId, 'SUPPLIER_DELETED', {
            supplierId: id,
            supplierUserId: supplier.userId,
        });
        res.json({
            success: true,
            message: 'Fornecedor excluído com sucesso',
        });
    }
    async addCategory(req, res) {
        const { id } = req.params;
        const { categoryId } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { id },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Fornecedor não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && supplier.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para editar este fornecedor');
        }
        const category = await database_1.prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!category) {
            throw new errorHandler_1.NotFoundError('Categoria não encontrada');
        }
        const existingAssociation = await database_1.prisma.supplierCategory.findUnique({
            where: {
                supplierId_categoryId: {
                    supplierId: id,
                    categoryId,
                },
            },
        });
        if (existingAssociation) {
            throw new errorHandler_1.ConflictError('Fornecedor já está associado a esta categoria');
        }
        await database_1.prisma.supplierCategory.create({
            data: {
                supplierId: id,
                categoryId,
            },
        });
        (0, logger_1.logUserActivity)(userId, 'SUPPLIER_CATEGORY_ADDED', {
            supplierId: id,
            categoryId,
        });
        res.json({
            success: true,
            message: 'Categoria adicionada ao fornecedor com sucesso',
        });
    }
    async removeCategory(req, res) {
        const { id, categoryId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { id },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Fornecedor não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && supplier.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para editar este fornecedor');
        }
        const association = await database_1.prisma.supplierCategory.findUnique({
            where: {
                supplierId_categoryId: {
                    supplierId: id,
                    categoryId,
                },
            },
        });
        if (!association) {
            throw new errorHandler_1.NotFoundError('Associação não encontrada');
        }
        await database_1.prisma.supplierCategory.delete({
            where: {
                supplierId_categoryId: {
                    supplierId: id,
                    categoryId,
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'SUPPLIER_CATEGORY_REMOVED', {
            supplierId: id,
            categoryId,
        });
        res.json({
            success: true,
            message: 'Categoria removida do fornecedor com sucesso',
        });
    }
    async getStatistics(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const supplier = await database_1.prisma.supplier.findUnique({
            where: { id },
        });
        if (!supplier) {
            throw new errorHandler_1.NotFoundError('Fornecedor não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && supplier.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para ver estas estatísticas');
        }
        const [totalProposals, acceptedProposals, activeContracts, completedContracts, totalContractValue,] = await Promise.all([
            database_1.prisma.proposal.count({
                where: { supplierId: id },
            }),
            database_1.prisma.proposal.count({
                where: {
                    supplierId: id,
                    status: 'ACCEPTED',
                },
            }),
            database_1.prisma.contract.count({
                where: {
                    supplierId: id,
                    status: 'ACTIVE',
                },
            }),
            database_1.prisma.contract.count({
                where: {
                    supplierId: id,
                    status: 'COMPLETED',
                },
            }),
            database_1.prisma.contract.aggregate({
                where: { supplierId: id },
                _sum: {
                    totalValue: true,
                },
            }),
        ]);
        const statistics = {
            proposals: {
                total: totalProposals,
                accepted: acceptedProposals,
                successRate: totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0,
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
exports.SupplierController = SupplierController;
//# sourceMappingURL=SupplierController.js.map