import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { UserRole } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Middleware de autenticação
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Token de autenticação não fornecido'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Buscar usuário no banco
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, role: true, status: true },
        });

        if (!user || user.status !== 'ACTIVE') {
          return next(new Error('Usuário não encontrado ou inativo'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        
        next();
      } catch (error) {
        logger.error('Erro na autenticação WebSocket:', error);
        next(new Error('Token inválido'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Usuário conectado via WebSocket: ${socket.userId}`);

      // Adicionar usuário à lista de conectados
      if (socket.userId) {
        if (!this.connectedUsers.has(socket.userId)) {
          this.connectedUsers.set(socket.userId, new Set());
        }
        this.connectedUsers.get(socket.userId)!.add(socket.id);

        // Entrar em salas baseadas no role
        socket.join(`user:${socket.userId}`);
        socket.join(`role:${socket.userRole}`);

        // Admins entram em sala especial
        if (socket.userRole === UserRole.ADMIN) {
          socket.join('admins');
        }
      }

      // Eventos personalizados
      socket.on('join-bidding', (biddingId: string) => {
        socket.join(`bidding:${biddingId}`);
        logger.info(`Usuário ${socket.userId} entrou na sala da licitação ${biddingId}`);
      });

      socket.on('leave-bidding', (biddingId: string) => {
        socket.leave(`bidding:${biddingId}`);
        logger.info(`Usuário ${socket.userId} saiu da sala da licitação ${biddingId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Usuário desconectado via WebSocket: ${socket.userId}`);
        
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

  // Métodos públicos para enviar notificações
  public notifyUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
    logger.info(`Notificação enviada para usuário ${userId}: ${event}`);
  }

  public notifyRole(role: UserRole, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
    logger.info(`Notificação enviada para role ${role}: ${event}`);
  }

  public notifyBidding(biddingId: string, event: string, data: any) {
    this.io.to(`bidding:${biddingId}`).emit(event, data);
    logger.info(`Notificação enviada para licitação ${biddingId}: ${event}`);
  }

  public notifyAdmins(event: string, data: any) {
    this.io.to('admins').emit(event, data);
    logger.info(`Notificação enviada para admins: ${event}`);
  }

  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
    logger.info(`Broadcast enviado: ${event}`);
  }

  // Verificar se usuário está online
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Obter estatísticas de conexões
  public getConnectionStats() {
    return {
      totalConnections: this.io.engine.clientsCount,
      uniqueUsers: this.connectedUsers.size,
      connectedUsers: Array.from(this.connectedUsers.keys()),
    };
  }
}

export default WebSocketService;
