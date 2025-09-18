"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const database_1 = require("@/config/database");
const errorHandler_1 = require("@/middleware/errorHandler");
const logger_1 = require("@/utils/logger");
class CategoryController {
    async list(req, res) {
        const { page = 1, limit = 50, search, parentId, includeInactive = false } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (!includeInactive || includeInactive === 'false') {
            where.isActive = true;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (parentId) {
            where.parentId = parentId === 'null' ? null : parentId;
        }
        const startTime = Date.now();
        const [categories, total] = await Promise.all([
            database_1.prisma.category.findMany({
                where,
                skip: offset,
                take: Number(limit),
                include: {
                    parent: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    children: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            isActive: true,
                        },
                        where: {
                            isActive: true,
                        },
                    },
                    _count: {
                        select: {
                            children: true,
                            biddings: true,
                            suppliers: true,
                        },
                    },
                },
                orderBy: [
                    { parentId: 'asc' },
                    { name: 'asc' },
                ],
            }),
            database_1.prisma.category.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'categories', Date.now() - startTime);
        const totalPages = Math.ceil(total / Number(limit));
        res.json({
            success: true,
            data: {
                categories,
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
    async getTree(req, res) {
        const { includeInactive = false } = req.query;
        const where = {};
        if (!includeInactive || includeInactive === 'false') {
            where.isActive = true;
        }
        const categories = await database_1.prisma.category.findMany({
            where,
            include: {
                children: {
                    where,
                    include: {
                        children: {
                            where,
                            include: {
                                children: {
                                    where,
                                    orderBy: { name: 'asc' },
                                },
                            },
                            orderBy: { name: 'asc' },
                        },
                    },
                    orderBy: { name: 'asc' },
                },
                _count: {
                    select: {
                        biddings: true,
                        suppliers: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        const rootCategories = categories.filter(cat => !cat.parentId);
        res.json({
            success: true,
            data: { categories: rootCategories },
        });
    }
    async getById(req, res) {
        const { id } = req.params;
        const category = await database_1.prisma.category.findUnique({
            where: { id },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                children: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        description: true,
                        isActive: true,
                    },
                    orderBy: { name: 'asc' },
                },
                biddings: {
                    select: {
                        bidding: {
                            select: {
                                id: true,
                                title: true,
                                biddingNumber: true,
                                status: true,
                            },
                        },
                    },
                    take: 10,
                },
                suppliers: {
                    select: {
                        supplier: {
                            select: {
                                id: true,
                                companyName: true,
                            },
                        },
                    },
                    take: 10,
                },
                _count: {
                    select: {
                        children: true,
                        biddings: true,
                        suppliers: true,
                    },
                },
            },
        });
        if (!category) {
            throw new errorHandler_1.NotFoundError('Categoria não encontrada');
        }
        res.json({
            success: true,
            data: { category },
        });
    }
    async create(req, res) {
        const userId = req.user.userId;
        const { name, description, code, parentId, } = req.body;
        const existingCode = await database_1.prisma.category.findUnique({
            where: { code },
        });
        if (existingCode) {
            throw new errorHandler_1.ConflictError('Código de categoria já existe');
        }
        const existingName = await database_1.prisma.category.findFirst({
            where: {
                name,
                parentId: parentId || null,
            },
        });
        if (existingName) {
            throw new errorHandler_1.ConflictError('Nome de categoria já existe neste nível');
        }
        if (parentId) {
            const parentCategory = await database_1.prisma.category.findUnique({
                where: { id: parentId },
            });
            if (!parentCategory) {
                throw new errorHandler_1.NotFoundError('Categoria pai não encontrada');
            }
            if (!parentCategory.isActive) {
                throw new errorHandler_1.ValidationError('Categoria pai deve estar ativa');
            }
        }
        const category = await database_1.prisma.category.create({
            data: {
                name,
                description,
                code,
                parentId: parentId || null,
            },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'CATEGORY_CREATED', {
            categoryId: category.id,
            categoryName: category.name,
            categoryCode: category.code,
        });
        res.status(201).json({
            success: true,
            message: 'Categoria criada com sucesso',
            data: { category },
        });
    }
    async update(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const { name, description, code, parentId, isActive, } = req.body;
        const category = await database_1.prisma.category.findUnique({
            where: { id },
            include: {
                children: { select: { id: true } },
            },
        });
        if (!category) {
            throw new errorHandler_1.NotFoundError('Categoria não encontrada');
        }
        if (code && code !== category.code) {
            const existingCode = await database_1.prisma.category.findUnique({
                where: { code },
            });
            if (existingCode) {
                throw new errorHandler_1.ConflictError('Código de categoria já existe');
            }
        }
        if (name && (name !== category.name || parentId !== category.parentId)) {
            const existingName = await database_1.prisma.category.findFirst({
                where: {
                    name,
                    parentId: parentId || null,
                    id: { not: id },
                },
            });
            if (existingName) {
                throw new errorHandler_1.ConflictError('Nome de categoria já existe neste nível');
            }
        }
        if (parentId && parentId !== category.parentId) {
            if (parentId === id) {
                throw new errorHandler_1.ValidationError('Categoria não pode ser pai de si mesma');
            }
            const parentCategory = await database_1.prisma.category.findUnique({
                where: { id: parentId },
            });
            if (!parentCategory) {
                throw new errorHandler_1.NotFoundError('Categoria pai não encontrada');
            }
            if (!parentCategory.isActive) {
                throw new errorHandler_1.ValidationError('Categoria pai deve estar ativa');
            }
            const isDescendant = await this.isDescendant(parentId, id);
            if (isDescendant) {
                throw new errorHandler_1.ValidationError('Categoria pai não pode ser descendente da categoria atual');
            }
        }
        if (isActive === false && category.isActive && category.children.length > 0) {
            const activeChildren = await database_1.prisma.category.count({
                where: {
                    parentId: id,
                    isActive: true,
                },
            });
            if (activeChildren > 0) {
                throw new errorHandler_1.ValidationError('Não é possível desativar categoria com subcategorias ativas');
            }
        }
        const updatedCategory = await database_1.prisma.category.update({
            where: { id },
            data: {
                name,
                description,
                code,
                parentId: parentId || null,
                isActive,
            },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                children: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        isActive: true,
                    },
                },
            },
        });
        (0, logger_1.logUserActivity)(userId, 'CATEGORY_UPDATED', {
            categoryId: id,
            categoryName: updatedCategory.name,
        });
        res.json({
            success: true,
            message: 'Categoria atualizada com sucesso',
            data: { category: updatedCategory },
        });
    }
    async delete(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const category = await database_1.prisma.category.findUnique({
            where: { id },
            include: {
                children: { select: { id: true } },
                biddings: { select: { id: true } },
                suppliers: { select: { id: true } },
            },
        });
        if (!category) {
            throw new errorHandler_1.NotFoundError('Categoria não encontrada');
        }
        if (category.children.length > 0) {
            throw new errorHandler_1.ValidationError('Não é possível excluir categoria com subcategorias');
        }
        if (category.biddings.length > 0 || category.suppliers.length > 0) {
            throw new errorHandler_1.ValidationError('Não é possível excluir categoria com licitações ou fornecedores associados');
        }
        await database_1.prisma.category.delete({
            where: { id },
        });
        (0, logger_1.logUserActivity)(userId, 'CATEGORY_DELETED', {
            categoryId: id,
            categoryName: category.name,
        });
        res.json({
            success: true,
            message: 'Categoria excluída com sucesso',
        });
    }
    async isDescendant(potentialAncestorId, categoryId) {
        const category = await database_1.prisma.category.findUnique({
            where: { id: categoryId },
            select: { parentId: true },
        });
        if (!category || !category.parentId) {
            return false;
        }
        if (category.parentId === potentialAncestorId) {
            return true;
        }
        return this.isDescendant(potentialAncestorId, category.parentId);
    }
}
exports.CategoryController = CategoryController;
//# sourceMappingURL=CategoryController.js.map