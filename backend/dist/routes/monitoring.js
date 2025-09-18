"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const client_1 = require("@prisma/client");
const monitoring_1 = require("@/middleware/monitoring");
const errorHandler_1 = require("@/middleware/errorHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)(client_1.UserRole.ADMIN));
router.get('/metrics', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const metrics = (0, monitoring_1.getMetrics)();
    res.json({
        success: true,
        message: 'Métricas obtidas com sucesso',
        data: metrics,
    });
}));
router.get('/health', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system,
        },
        nodeVersion: process.version,
    };
    res.json({
        success: true,
        message: 'Status de saúde obtido com sucesso',
        data: healthData,
    });
}));
exports.default = router;
//# sourceMappingURL=monitoring.js.map