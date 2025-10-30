"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokePermission = exports.grantPermission = exports.hasPermission = exports.requirePermission = exports.blacklistToken = exports.verifyRefreshToken = exports.generateRefreshToken = exports.generateToken = exports.optionalAuth = exports.requireAnyUser = exports.requireAuditAccess = exports.requireAdminAccess = exports.requireCitizenAccess = exports.requirePublicEntityAccess = exports.requireSupplierAccess = exports.requireCitizen = exports.requireAuditor = exports.requirePublicEntity = exports.requireSupplier = exports.requireAdmin = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AuthenticationError('Token de acesso não fornecido');
        }
        const token = authHeader.substring(7);
        if (!token) {
            throw new errorHandler_1.AuthenticationError('Token de acesso inválido');
        }
        try {
            const isBlacklisted = await redis_1.redisClient.exists(`blacklist:${token}`);
            if (isBlacklisted) {
                (0, logger_1.logSecurity)('Token blacklisted usado', { token: token.substring(0, 20) + '...', ip: req.ip });
                throw new errorHandler_1.AuthenticationError('Token inválido');
            }
        }
        catch (redisError) {
            console.warn('Redis indisponível para verificação de blacklist:', redisError);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        try {
            const sessionData = await redis_1.redisClient.getSession(decoded.sessionId);
            if (!sessionData) {
                throw new errorHandler_1.AuthenticationError('Sessão expirada');
            }
        }
        catch (redisError) {
            console.warn('Redis indisponível para verificação de sessão:', redisError);
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                firstName: true,
                lastName: true,
            },
        });
        if (!user) {
            throw new errorHandler_1.AuthenticationError('Usuário não encontrado');
        }
        if (user.status !== 'ACTIVE') {
            (0, logger_1.logSecurity)('Tentativa de acesso com usuário inativo', {
                userId: user.id,
                status: user.status,
                ip: req.ip
            });
            throw new errorHandler_1.AuthenticationError('Conta inativa');
        }
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
            sessionId: decoded.sessionId,
        };
        (0, logger_1.logAuth)('Token validado com sucesso', user.id, req.ip);
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            (0, logger_1.logSecurity)('Token JWT inválido', { error: error.message, ip: req.ip });
            next(new errorHandler_1.AuthenticationError('Token inválido'));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            (0, logger_1.logSecurity)('Token JWT expirado', { ip: req.ip });
            next(new errorHandler_1.AuthenticationError('Token expirado'));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AuthenticationError('Usuário não autenticado'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            (0, logger_1.logSecurity)('Tentativa de acesso não autorizado', {
                userId: req.user.userId,
                userRole: req.user.role,
                requiredRoles: allowedRoles,
                path: req.path,
                method: req.method,
                ip: req.ip,
            });
            return next(new errorHandler_1.AuthorizationError('Acesso negado para este recurso'));
        }
        next();
    };
};
exports.authorize = authorize;
exports.requireAdmin = (0, exports.authorize)(client_1.UserRole.ADMIN);
exports.requireSupplier = (0, exports.authorize)(client_1.UserRole.SUPPLIER);
exports.requirePublicEntity = (0, exports.authorize)(client_1.UserRole.PUBLIC_ENTITY);
exports.requireAuditor = (0, exports.authorize)(client_1.UserRole.AUDITOR);
exports.requireCitizen = (0, exports.authorize)(client_1.UserRole.CITIZEN);
exports.requireSupplierAccess = (0, exports.authorize)(client_1.UserRole.SUPPLIER, client_1.UserRole.ADMIN);
exports.requirePublicEntityAccess = (0, exports.authorize)(client_1.UserRole.PUBLIC_ENTITY, client_1.UserRole.ADMIN);
exports.requireCitizenAccess = (0, exports.authorize)(client_1.UserRole.CITIZEN, client_1.UserRole.ADMIN);
exports.requireAdminAccess = (0, exports.authorize)(client_1.UserRole.ADMIN);
exports.requireAuditAccess = (0, exports.authorize)(client_1.UserRole.AUDITOR, client_1.UserRole.ADMIN);
exports.requireAnyUser = (0, exports.authorize)(client_1.UserRole.ADMIN, client_1.UserRole.SUPPLIER, client_1.UserRole.PUBLIC_ENTITY, client_1.UserRole.AUDITOR, client_1.UserRole.CITIZEN);
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        if (!token) {
            return next();
        }
        try {
            const isBlacklisted = await redis_1.redisClient.exists(`blacklist:${token}`);
            if (isBlacklisted) {
                return next();
            }
        }
        catch (redisError) {
            console.warn('Redis indisponível para verificação de blacklist:', redisError);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        try {
            const sessionData = await redis_1.redisClient.getSession(decoded.sessionId);
            if (!sessionData) {
                return next();
            }
        }
        catch (redisError) {
            console.warn('Redis indisponível para verificação de sessão:', redisError);
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
            },
        });
        if (!user || user.status !== 'ACTIVE') {
            return next();
        }
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
            sessionId: decoded.sessionId,
        };
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET || 'default-secret-key';
    try {
        return jsonwebtoken_1.default.sign(payload, secret, {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        });
    }
    catch (error) {
        throw new Error('Erro ao gerar token JWT');
    }
};
exports.generateToken = generateToken;
const generateRefreshToken = (payload) => {
    const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-key';
    try {
        return jsonwebtoken_1.default.sign(payload, secret, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        });
    }
    catch (error) {
        throw new Error('Erro ao gerar refresh token');
    }
};
exports.generateRefreshToken = generateRefreshToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
const blacklistToken = async (token, expiresIn = 86400) => {
    try {
        await redis_1.redisClient.set(`blacklist:${token}`, 'true', expiresIn);
    }
    catch (redisError) {
        console.warn('Redis indisponível para blacklist de token:', redisError);
    }
};
exports.blacklistToken = blacklistToken;
const requirePermission = (...requiredPermissions) => {
    return async (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AuthenticationError('Usuário não autenticado'));
        }
        try {
            const userPermissions = await database_1.prisma.userPermission.findMany({
                where: {
                    userId: req.user.userId,
                    isActive: true,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } }
                    ]
                },
                select: {
                    permission: true
                }
            });
            const userPermissionList = userPermissions.map(p => p.permission);
            const hasAllPermissions = requiredPermissions.every(permission => userPermissionList.includes(permission));
            if (!hasAllPermissions) {
                (0, logger_1.logSecurity)('Tentativa de acesso sem permissão necessária', {
                    userId: req.user.userId,
                    userRole: req.user.role,
                    requiredPermissions,
                    userPermissions: userPermissionList,
                    path: req.path,
                    method: req.method,
                    ip: req.ip,
                });
                return next(new errorHandler_1.AuthorizationError('Permissões insuficientes para este recurso'));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requirePermission = requirePermission;
const hasPermission = async (userId, permission) => {
    const userPermission = await database_1.prisma.userPermission.findFirst({
        where: {
            userId,
            permission,
            isActive: true,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
            ]
        }
    });
    return !!userPermission;
};
exports.hasPermission = hasPermission;
const grantPermission = async (userId, permission, grantedBy, expiresAt) => {
    await database_1.prisma.userPermission.upsert({
        where: {
            userId_permission: {
                userId,
                permission
            }
        },
        update: {
            isActive: true,
            grantedBy,
            expiresAt,
            updatedAt: new Date()
        },
        create: {
            userId,
            permission,
            grantedBy,
            expiresAt,
            isActive: true
        }
    });
};
exports.grantPermission = grantPermission;
const revokePermission = async (userId, permission) => {
    await database_1.prisma.userPermission.updateMany({
        where: {
            userId,
            permission
        },
        data: {
            isActive: false,
            updatedAt: new Date()
        }
    });
};
exports.revokePermission = revokePermission;
//# sourceMappingURL=auth.js.map