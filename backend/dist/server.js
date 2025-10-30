"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const websocket_1 = __importDefault(require("./services/websocket"));
const notificationService_1 = __importDefault(require("./services/notificationService"));
const schedulerService_1 = __importDefault(require("./services/schedulerService"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const monitoring_1 = require("./middleware/monitoring");
const logger_1 = require("./utils/logger");
const frontend_1 = require("./middleware/frontend");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const publicEntities_1 = __importDefault(require("./routes/publicEntities"));
const biddings_1 = __importDefault(require("./routes/biddings"));
const proposals_1 = __importDefault(require("./routes/proposals"));
const contracts_1 = __importDefault(require("./routes/contracts"));
const categories_1 = __importDefault(require("./routes/categories"));
const documents_1 = __importDefault(require("./routes/documents"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const transparency_1 = __importDefault(require("./routes/transparency"));
const admin_1 = __importDefault(require("./routes/admin"));
const monitoring_2 = __importDefault(require("./routes/monitoring"));
const backup_1 = __importDefault(require("./routes/backup"));
const citizens_1 = __importDefault(require("./routes/citizens"));
const buyers_1 = __importDefault(require("./routes/buyers"));
const supplierDashboard_1 = __importDefault(require("./routes/supplierDashboard"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: [
                "'self'",
                "https://licitabrasilweb.com.br",
                "https://www.licitabrasilweb.com.br",
                "https://api.licitabrasilweb.com.br",
                "https://monitoring.licitabrasilweb.com.br",
                "wss://licitabrasilweb.com.br",
                "wss://api.licitabrasilweb.com.br"
            ],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "data:", "https:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use(limiter);
const corsOptions = {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.logger.info(message.trim()) } }));
app.use(monitoring_1.monitoringMiddleware);
app.use(frontend_1.frontendIntegration);
app.use(frontend_1.paginationHeaders);
app.use(frontend_1.frontendLogger);
app.use(frontend_1.userContextMiddleware);
if (process.env.NODE_ENV === 'development') {
    app.use(frontend_1.developmentDebug);
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express_1.default.static('uploads'));
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LicitaBrasil Web API Documentation',
}));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;
app.use(`${API_PREFIX}/auth`, auth_1.default);
app.use(`${API_PREFIX}/users`, users_1.default);
app.use(`${API_PREFIX}/suppliers`, suppliers_1.default);
app.use(`${API_PREFIX}/public-entities`, publicEntities_1.default);
app.use(`${API_PREFIX}/biddings`, biddings_1.default);
app.use(`${API_PREFIX}/proposals`, proposals_1.default);
app.use(`${API_PREFIX}/contracts`, contracts_1.default);
app.use(`${API_PREFIX}/categories`, categories_1.default);
app.use(`${API_PREFIX}/documents`, documents_1.default);
app.use(`${API_PREFIX}/notifications`, notifications_1.default);
app.use(`${API_PREFIX}/transparency`, transparency_1.default);
app.use(`${API_PREFIX}/admin`, admin_1.default);
app.use(`${API_PREFIX}/monitoring`, monitoring_2.default);
app.use(`${API_PREFIX}/backup`, backup_1.default);
app.use(`${API_PREFIX}/citizens`, citizens_1.default);
app.use(`${API_PREFIX}/buyers`, buyers_1.default);
app.use(`${API_PREFIX}/supplier-dashboard`, supplierDashboard_1.default);
app.use(notFoundHandler_1.notFoundHandler);
app.use(frontend_1.frontendErrorHandler);
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
        logger_1.logger.info('✅ Conexão com PostgreSQL estabelecida');
        await (0, redis_1.connectRedis)();
        logger_1.logger.info('✅ Conexão com Redis estabelecida');
        const server = (0, http_1.createServer)(app);
        const websocketService = new websocket_1.default(server);
        logger_1.logger.info('🔌 WebSocket inicializado');
        const notificationService = notificationService_1.default.getInstance();
        notificationService.setWebSocketService(websocketService);
        logger_1.logger.info('🔔 Serviço de notificações configurado');
        const schedulerService = schedulerService_1.default.getInstance();
        schedulerService.startScheduledTasks();
        logger_1.logger.info('⏰ Tarefas agendadas iniciadas');
        server.listen(PORT, () => {
            logger_1.logger.info(`🚀 Servidor rodando na porta ${PORT}`);
            logger_1.logger.info(`📊 Ambiente: ${process.env.NODE_ENV}`);
            logger_1.logger.info(`🔗 API disponível em: http://localhost:${PORT}${API_PREFIX}`);
            logger_1.logger.info(`🔌 WebSocket disponível em: ws://localhost:${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM recebido. Encerrando servidor...');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT recebido. Encerrando servidor...');
    process.exit(0);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map