// Registrar path mappings primeiro
// import './register-paths'; // Comentado para produção - paths são resolvidos durante build

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import WebSocketService from './services/websocket';
import NotificationService from './services/notificationService';
import SchedulerService from './services/schedulerService';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { monitoringMiddleware } from './middleware/monitoring';
import { logger } from './utils/logger';
import {
  frontendIntegration,
  paginationHeaders,
  frontendLogger,
  frontendErrorHandler,
  userContextMiddleware,
  developmentDebug
} from './middleware/frontend';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

// Importar rotas
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import supplierRoutes from './routes/suppliers';
import publicEntityRoutes from './routes/publicEntities';
import biddingRoutes from './routes/biddings';
import proposalRoutes from './routes/proposals';
import contractRoutes from './routes/contracts';
import categoryRoutes from './routes/categories';
import documentRoutes from './routes/documents';
import notificationRoutes from './routes/notifications';
import transparencyRoutes from './routes/transparency';
import adminRoutes from './routes/admin';
import monitoringRoutes from './routes/monitoring';
import backupRoutes from './routes/backup';
import citizenRoutes from './routes/citizens';
import buyerRoutes from './routes/buyers';
import supplierDashboardRoutes from './routes/supplierDashboard';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração de Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // máximo 100 requests por IP
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de segurança
app.use(helmet());
app.use(limiter);

// Configuração CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Middlewares gerais
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(monitoringMiddleware); // Middleware de monitoramento

// Middlewares específicos para integração frontend
app.use(frontendIntegration);
app.use(paginationHeaders);
app.use(frontendLogger);
app.use(userContextMiddleware);
if (process.env.NODE_ENV === 'development') {
  app.use(developmentDebug);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static('uploads'));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LicitaBrasil Web API Documentation',
}));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Rotas da API
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/suppliers`, supplierRoutes);
app.use(`${API_PREFIX}/public-entities`, publicEntityRoutes);
app.use(`${API_PREFIX}/biddings`, biddingRoutes);
app.use(`${API_PREFIX}/proposals`, proposalRoutes);
app.use(`${API_PREFIX}/contracts`, contractRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/documents`, documentRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/transparency`, transparencyRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/monitoring`, monitoringRoutes);
app.use(`${API_PREFIX}/backup`, backupRoutes);
app.use(`${API_PREFIX}/citizens`, citizenRoutes);
app.use(`${API_PREFIX}/buyers`, buyerRoutes);
app.use(`${API_PREFIX}/supplier-dashboard`, supplierDashboardRoutes);

// Middleware de tratamento de erros
app.use(notFoundHandler);
app.use(frontendErrorHandler); // Error handler específico para frontend
app.use(errorHandler);

// Inicialização do servidor
async function startServer() {
  try {
    // Conectar ao banco de dados
    await connectDatabase();
    logger.info('✅ Conexão com PostgreSQL estabelecida');

    // Conectar ao Redis
    await connectRedis();
    logger.info('✅ Conexão com Redis estabelecida');

    // Criar servidor HTTP
    const server = createServer(app);

    // Inicializar WebSocket
    const websocketService = new WebSocketService(server);
    logger.info('🔌 WebSocket inicializado');

    // Configurar serviço de notificações
    const notificationService = NotificationService.getInstance();
    notificationService.setWebSocketService(websocketService);
    logger.info('🔔 Serviço de notificações configurado');

    // Iniciar tarefas agendadas
    const schedulerService = SchedulerService.getInstance();
    schedulerService.startScheduledTasks();
    logger.info('⏰ Tarefas agendadas iniciadas');

    // Iniciar servidor
    server.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📊 Ambiente: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API disponível em: http://localhost:${PORT}${API_PREFIX}`);
      logger.info(`🔌 WebSocket disponível em: ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais do sistema
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export default app;
