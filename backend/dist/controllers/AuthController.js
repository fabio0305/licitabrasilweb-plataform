"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
class AuthController {
    async register(req, res) {
        const { email, password, firstName, lastName, phone, role } = req.body;
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new errorHandler_1.ConflictError('Email já está em uso');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
        let initialStatus = client_1.UserStatus.PENDING;
        if (role === 'CITIZEN') {
            initialStatus = client_1.UserStatus.ACTIVE;
        }
        const user = await database_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                role,
                status: initialStatus,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });
        (0, logger_1.logAuth)('Usuário registrado', user.id, req.ip);
        (0, logger_1.logUserActivity)(user.id, 'USER_REGISTERED');
        const message = role === 'CITIZEN'
            ? 'Usuário registrado com sucesso.'
            : 'Usuário registrado com sucesso. Aguarde aprovação.';
        res.status(201).json({
            success: true,
            message,
            data: { user },
        });
    }
    async login(req, res) {
        const { email, password } = req.body;
        const user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            (0, logger_1.logAuth)('Tentativa de login com email inexistente', undefined, req.ip);
            throw new errorHandler_1.AuthenticationError('Credenciais inválidas');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            (0, logger_1.logAuth)('Tentativa de login com senha incorreta', user.id, req.ip);
            throw new errorHandler_1.AuthenticationError('Credenciais inválidas');
        }
        if (user.status !== 'ACTIVE') {
            (0, logger_1.logAuth)('Tentativa de login com conta inativa', user.id, req.ip);
            throw new errorHandler_1.AuthenticationError('Conta inativa ou pendente de aprovação');
        }
        const sessionId = (0, uuid_1.v4)();
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            sessionId,
        };
        const accessToken = (0, auth_1.generateToken)(tokenPayload);
        const refreshToken = (0, auth_1.generateRefreshToken)(tokenPayload);
        await redis_1.redisClient.setSession(sessionId, {
            userId: user.id,
            email: user.email,
            role: user.role,
            loginAt: new Date().toISOString(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        }, 7 * 24 * 60 * 60);
        await database_1.prisma.userSession.create({
            data: {
                id: sessionId,
                userId: user.id,
                token: refreshToken,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        (0, logger_1.logAuth)('Login realizado com sucesso', user.id, req.ip);
        (0, logger_1.logUserActivity)(user.id, 'USER_LOGIN', { ip: req.ip });
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    status: user.status,
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                },
            },
        });
    }
    async refreshToken(req, res) {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new errorHandler_1.ValidationError('Refresh token é obrigatório');
        }
        try {
            const decoded = (0, auth_1.verifyRefreshToken)(refreshToken);
            const session = await database_1.prisma.userSession.findUnique({
                where: { id: decoded.sessionId },
                include: { user: true },
            });
            if (!session || session.token !== refreshToken) {
                throw new errorHandler_1.AuthenticationError('Refresh token inválido');
            }
            if (session.expiresAt < new Date()) {
                await database_1.prisma.userSession.delete({
                    where: { id: session.id },
                });
                await redis_1.redisClient.deleteSession(session.id);
                throw new errorHandler_1.AuthenticationError('Refresh token expirado');
            }
            if (session.user.status !== 'ACTIVE') {
                throw new errorHandler_1.AuthenticationError('Usuário inativo');
            }
            const tokenPayload = {
                userId: session.user.id,
                email: session.user.email,
                role: session.user.role,
                sessionId: session.id,
            };
            const newAccessToken = (0, auth_1.generateToken)(tokenPayload);
            (0, logger_1.logAuth)('Token renovado', session.user.id, req.ip);
            res.json({
                success: true,
                message: 'Token renovado com sucesso',
                data: {
                    accessToken: newAccessToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
                },
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AuthenticationError) {
                throw error;
            }
            throw new errorHandler_1.AuthenticationError('Refresh token inválido');
        }
    }
    async logout(req, res) {
        const { sessionId } = req.user;
        const authHeader = req.headers.authorization;
        const token = authHeader.substring(7);
        await (0, auth_1.blacklistToken)(token);
        await redis_1.redisClient.deleteSession(sessionId);
        await database_1.prisma.userSession.deleteMany({
            where: { id: sessionId },
        });
        (0, logger_1.logAuth)('Logout realizado', req.user.userId, req.ip);
        (0, logger_1.logUserActivity)(req.user.userId, 'USER_LOGOUT', { ip: req.ip });
        res.json({
            success: true,
            message: 'Logout realizado com sucesso',
        });
    }
    async getProfile(req, res) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.userId },
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
    async updateProfile(req, res) {
        const { firstName, lastName, phone } = req.body;
        const user = await database_1.prisma.user.update({
            where: { id: req.user.userId },
            data: {
                firstName,
                lastName,
                phone,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatar: true,
                role: true,
                status: true,
                updatedAt: true,
            },
        });
        (0, logger_1.logUserActivity)(req.user.userId, 'PROFILE_UPDATED');
        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            data: { user },
        });
    }
    async changePassword(req, res) {
        const { currentPassword, newPassword } = req.body;
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user) {
            throw new errorHandler_1.NotFoundError('Usuário não encontrado');
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new errorHandler_1.ValidationError('Senha atual incorreta');
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
        });
        (0, logger_1.logUserActivity)(user.id, 'PASSWORD_CHANGED', { ip: req.ip });
        res.json({
            success: true,
            message: 'Senha alterada com sucesso',
        });
    }
    async forgotPassword(req, res) {
        const { email } = req.body;
        const user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.json({
                success: true,
                message: 'Se o email existir, você receberá instruções para redefinir sua senha',
            });
        }
        (0, logger_1.logUserActivity)(user.id, 'PASSWORD_RESET_REQUESTED', { ip: req.ip });
        return res.json({
            success: true,
            message: 'Se o email existir, você receberá instruções para redefinir sua senha',
        });
    }
    async resetPassword(req, res) {
        const { token, newPassword } = req.body;
        throw new errorHandler_1.ValidationError('Funcionalidade não implementada');
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map