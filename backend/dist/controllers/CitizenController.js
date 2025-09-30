"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizenController = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
class CitizenController {
    async list(req, res) {
        const { page = 1, limit = 10, search, city, state, isActive } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { cpf: { contains: search } },
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
        const startTime = Date.now();
        const [citizens, total] = await Promise.all([
            database_1.prisma.citizen.findMany({
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
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            database_1.prisma.citizen.count({ where }),
        ]);
        (0, logger_1.logDatabaseOperation)('SELECT', 'citizens', Date.now() - startTime);
        const totalPages = Math.ceil(total / Number(limit));
        res.json({
            success: true,
            data: {
                citizens,
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
        const citizen = await database_1.prisma.citizen.findUnique({
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
            },
        });
        if (!citizen) {
            throw new errorHandler_1.NotFoundError('Cidadão não encontrado');
        }
        res.json({
            success: true,
            data: { citizen },
        });
    }
    async create(req, res) {
        const userId = req.user.userId;
        const { cpf, dateOfBirth, profession, address, city, state, zipCode, interests } = req.body;
        const existingCitizen = await database_1.prisma.citizen.findUnique({
            where: { userId },
        });
        if (existingCitizen) {
            throw new errorHandler_1.ConflictError('Usuário já possui um perfil de cidadão');
        }
        if (cpf) {
            const existingCpf = await database_1.prisma.citizen.findUnique({
                where: { cpf },
            });
            if (existingCpf) {
                throw new errorHandler_1.ConflictError('CPF já está em uso por outro cidadão');
            }
        }
        const citizen = await database_1.prisma.citizen.create({
            data: {
                userId,
                cpf,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                profession,
                address,
                city,
                state,
                zipCode,
                interests: interests || [],
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
        (0, logger_1.logUserActivity)(userId, 'CITIZEN_PROFILE_CREATED');
        res.status(201).json({
            success: true,
            message: 'Perfil de cidadão criado com sucesso',
            data: { citizen },
        });
    }
    async update(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { cpf, dateOfBirth, profession, address, city, state, zipCode, interests } = req.body;
        const citizen = await database_1.prisma.citizen.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!citizen) {
            throw new errorHandler_1.NotFoundError('Cidadão não encontrado');
        }
        if (userRole !== client_1.UserRole.ADMIN && citizen.userId !== userId) {
            throw new errorHandler_1.AuthorizationError('Você não tem permissão para editar este perfil');
        }
        if (cpf && cpf !== citizen.cpf) {
            const existingCpf = await database_1.prisma.citizen.findUnique({
                where: { cpf },
            });
            if (existingCpf) {
                throw new errorHandler_1.ConflictError('CPF já está em uso por outro cidadão');
            }
        }
        const updatedCitizen = await database_1.prisma.citizen.update({
            where: { id },
            data: {
                cpf,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                profession,
                address,
                city,
                state,
                zipCode,
                interests: interests || citizen.interests,
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
        (0, logger_1.logUserActivity)(userId, 'CITIZEN_PROFILE_UPDATED');
        res.json({
            success: true,
            message: 'Perfil de cidadão atualizado com sucesso',
            data: { citizen: updatedCitizen },
        });
    }
    async getMyProfile(req, res) {
        const userId = req.user.userId;
        const citizen = await database_1.prisma.citizen.findUnique({
            where: { userId },
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
            },
        });
        if (!citizen) {
            throw new errorHandler_1.NotFoundError('Perfil de cidadão não encontrado');
        }
        res.json({
            success: true,
            data: { citizen },
        });
    }
    async getInterestedBiddings(req, res) {
        const userId = req.user.userId;
        const { page = 1, limit = 10, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const citizen = await database_1.prisma.citizen.findUnique({
            where: { userId },
            select: { interests: true },
        });
        if (!citizen) {
            throw new errorHandler_1.NotFoundError('Perfil de cidadão não encontrado');
        }
        const where = {
            isPublic: true,
            status: status || { not: 'DRAFT' },
        };
        if (citizen.interests && citizen.interests.length > 0) {
            where.categories = {
                some: {
                    category: {
                        OR: [
                            { name: { in: citizen.interests } },
                            { code: { in: citizen.interests } },
                        ],
                    },
                },
            };
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
                    openingDate: 'desc',
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
}
exports.CitizenController = CitizenController;
//# sourceMappingURL=CitizenController.js.map