"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const emailService_1 = __importDefault(require("../services/emailService"));
class UserController {
    async list(req, res) {
        const { page = 1, limit = 10, search, role, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role) {
            where.role = role;
        }
        if (status) {
            where.status = status;
        }
        const startTime = Date.now();
        const [users, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where,
                skip: offset,
                take: Number(limit),
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    status: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                    supplier: {
                        select: {
                            id: true,
                            companyName: true,
                            cnpj: true,
                            isActive: true,
                            verifiedAt: true,
                        },
                    },
                    publicEntity: {
                        select: {
                            id: true,
                            name: true,
                            cnpj: true,
                            entityType: true,
                            isActive: true,
                            verifiedAt: true,
                        },
                    },
                    _count: {
                        select: {
                            auditLogs: true,
                            sessions: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.user.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'users', Date.now() - startTime);
        const totalPages = Math.ceil(total / Number(limit));
        res.json({
            success: true,
            data: {
                users,
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
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatar: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                supplier: {
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
                                contracts: true,
                            },
                        },
                    },
                },
                publicEntity: {
                    include: {
                        _count: {
                            select: {
                                biddings: true,
                                contracts: true,
                            },
                        },
                    },
                },
                auditLogs: {
                    select: {
                        id: true,
                        action: true,
                        resource: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 10,
                },
                sessions: {
                    select: {
                        id: true,
                        ipAddress: true,
                        userAgent: true,
                        createdAt: true,
                        expiresAt: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 5,
                },
                _count: {
                    select: {
                        auditLogs: true,
                        sessions: true,
                    },
                },
            },
        });
        if (!user) {
            throw new errorHandler_1.NotFoundError('Usuário não encontrado');
        }
        res.json({
            success: true,
            data: { user },
        });
    }
    async updateStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const adminUserId = req.user.userId;
        if (!Object.values(client_1.UserStatus).includes(status)) {
            throw new errorHandler_1.ValidationError('Status inválido');
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
            },
        });
        if (!user) {
            throw new errorHandler_1.NotFoundError('Usuário não encontrado');
        }
        if (user.role === client_1.UserRole.ADMIN && user.id !== adminUserId) {
            throw new errorHandler_1.AuthorizationError('Não é possível alterar status de outros administradores');
        }
        const updatedUser = await database_1.prisma.user.update({
            where: { id },
            data: { status },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                updatedAt: true,
            },
        });
        (0, logger_1.logUserActivity)(adminUserId, 'USER_STATUS_UPDATED', {
            targetUserId: id,
            oldStatus: user.status,
            newStatus: status,
        });
        if (user.status !== client_1.UserStatus.ACTIVE && status === client_1.UserStatus.ACTIVE) {
            const emailService = emailService_1.default.getInstance();
            await emailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`, user.role);
        }
        res.json({
            success: true,
            message: 'Status do usuário atualizado com sucesso',
            data: { user: updatedUser },
        });
    }
    async updateRole(req, res) {
        const { id } = req.params;
        const { role } = req.body;
        const adminUserId = req.user.userId;
        if (!Object.values(client_1.UserRole).includes(role)) {
            throw new errorHandler_1.ValidationError('Role inválido');
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                supplier: { select: { id: true } },
                publicEntity: { select: { id: true } },
            },
        });
        if (!user) {
            throw new errorHandler_1.NotFoundError('Usuário não encontrado');
        }
        if (user.role === client_1.UserRole.ADMIN && user.id !== adminUserId) {
            throw new errorHandler_1.AuthorizationError('Não é possível alterar role de outros administradores');
        }
        if (role === client_1.UserRole.SUPPLIER && user.publicEntity) {
            throw new errorHandler_1.ValidationError('Usuário possui perfil de órgão público e não pode ser fornecedor');
        }
        if (role === client_1.UserRole.PUBLIC_ENTITY && user.supplier) {
            throw new errorHandler_1.ValidationError('Usuário possui perfil de fornecedor e não pode ser órgão público');
        }
        const updatedUser = await database_1.prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                updatedAt: true,
            },
        });
        (0, logger_1.logUserActivity)(adminUserId, 'USER_ROLE_UPDATED', {
            targetUserId: id,
            oldRole: user.role,
            newRole: role,
        });
        res.json({
            success: true,
            message: 'Role do usuário atualizado com sucesso',
            data: { user: updatedUser },
        });
    }
    async delete(req, res) {
        const { id } = req.params;
        const adminUserId = req.user.userId;
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            include: {
                supplier: {
                    include: {
                        proposals: { select: { id: true } },
                        contracts: { select: { id: true } },
                    },
                },
                publicEntity: {
                    include: {
                        biddings: { select: { id: true } },
                        contracts: { select: { id: true } },
                    },
                },
            },
        });
        if (!user) {
            throw new errorHandler_1.NotFoundError('Usuário não encontrado');
        }
        if (user.role === client_1.UserRole.ADMIN && user.id !== adminUserId) {
            throw new errorHandler_1.AuthorizationError('Não é possível excluir outros administradores');
        }
        const hasAssociatedData = (user.supplier && (user.supplier.proposals.length > 0 || user.supplier.contracts.length > 0)) ||
            (user.publicEntity && (user.publicEntity.biddings.length > 0 || user.publicEntity.contracts.length > 0));
        if (hasAssociatedData) {
            throw new errorHandler_1.ValidationError('Não é possível excluir usuário com propostas, licitações ou contratos associados');
        }
        await database_1.prisma.user.delete({
            where: { id },
        });
        (0, logger_1.logUserActivity)(adminUserId, 'USER_DELETED', {
            targetUserId: id,
            targetUserEmail: user.email,
            targetUserRole: user.role,
        });
        res.json({
            success: true,
            message: 'Usuário excluído com sucesso',
        });
    }
    async getStatistics(req, res) {
        const [totalUsers, usersByRole, usersByStatus, recentUsers, activeUsers,] = await Promise.all([
            database_1.prisma.user.count(),
            database_1.prisma.user.groupBy({
                by: ['role'],
                _count: {
                    role: true,
                },
            }),
            database_1.prisma.user.groupBy({
                by: ['status'],
                _count: {
                    status: true,
                },
            }),
            database_1.prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
            database_1.prisma.user.count({
                where: {
                    lastLoginAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        const statistics = {
            total: totalUsers,
            recent: recentUsers,
            active: activeUsers,
            byRole: usersByRole.reduce((acc, item) => {
                acc[item.role] = item._count.role;
                return acc;
            }, {}),
            byStatus: usersByStatus.reduce((acc, item) => {
                acc[item.status] = item._count.status;
                return acc;
            }, {}),
        };
        res.json({
            success: true,
            data: { statistics },
        });
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map