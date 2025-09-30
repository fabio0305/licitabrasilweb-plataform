"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
class WebSocketService {
    constructor(server) {
        this.connectedUsers = new Map();
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Token de autenticação não fornecido'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                const user = await database_1.prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: { id: true, role: true, status: true },
                });
                if (!user || user.status !== 'ACTIVE') {
                    return next(new Error('Usuário não encontrado ou inativo'));
                }
                socket.userId = user.id;
                socket.userRole = user.role;
                next();
            }
            catch (error) {
                logger_1.logger.error('Erro na autenticação WebSocket:', error);
                next(new Error('Token inválido'));
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger_1.logger.info(`Usuário conectado via WebSocket: ${socket.userId}`);
            if (socket.userId) {
                if (!this.connectedUsers.has(socket.userId)) {
                    this.connectedUsers.set(socket.userId, new Set());
                }
                this.connectedUsers.get(socket.userId).add(socket.id);
                socket.join(`user:${socket.userId}`);
                socket.join(`role:${socket.userRole}`);
                if (socket.userRole === client_1.UserRole.ADMIN) {
                    socket.join('admins');
                }
            }
            socket.on('join-bidding', (biddingId) => {
                socket.join(`bidding:${biddingId}`);
                logger_1.logger.info(`Usuário ${socket.userId} entrou na sala da licitação ${biddingId}`);
            });
            socket.on('leave-bidding', (biddingId) => {
                socket.leave(`bidding:${biddingId}`);
                logger_1.logger.info(`Usuário ${socket.userId} saiu da sala da licitação ${biddingId}`);
            });
            socket.on('disconnect', () => {
                logger_1.logger.info(`Usuário desconectado via WebSocket: ${socket.userId}`);
                if (socket.userId) {
                    const userSockets = this.connectedUsers.get(socket.userId);
                    if (userSockets) {
                        userSockets.delete(socket.id);
                        if (userSockets.size === 0) {
                            this.connectedUsers.delete(socket.userId);
                        }
                    }
                }
            });
        });
    }
    notifyUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
        logger_1.logger.info(`Notificação enviada para usuário ${userId}: ${event}`);
    }
    notifyRole(role, event, data) {
        this.io.to(`role:${role}`).emit(event, data);
        logger_1.logger.info(`Notificação enviada para role ${role}: ${event}`);
    }
    notifyBidding(biddingId, event, data) {
        this.io.to(`bidding:${biddingId}`).emit(event, data);
        logger_1.logger.info(`Notificação enviada para licitação ${biddingId}: ${event}`);
    }
    notifyAdmins(event, data) {
        this.io.to('admins').emit(event, data);
        logger_1.logger.info(`Notificação enviada para admins: ${event}`);
    }
    broadcast(event, data) {
        this.io.emit(event, data);
        logger_1.logger.info(`Broadcast enviado: ${event}`);
    }
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
    getConnectionStats() {
        return {
            totalConnections: this.io.engine.clientsCount,
            uniqueUsers: this.connectedUsers.size,
            connectedUsers: Array.from(this.connectedUsers.keys()),
        };
    }
}
exports.default = WebSocketService;
//# sourceMappingURL=websocket.js.map