"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupMetrics = exports.getMetrics = exports.monitoringMiddleware = void 0;
const logger_1 = require("@/utils/logger");
const metrics = [];
const MAX_METRICS = 10000;
const monitoringMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    res.send = function (data) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const metric = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userId: req.user?.userId,
            timestamp: new Date(),
        };
        metrics.push(metric);
        if (metrics.length > MAX_METRICS) {
            metrics.shift();
        }
        logger_1.logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            userId: req.user?.userId,
        });
        if (responseTime > 1000) {
            logger_1.logger.warn(`Requisição lenta detectada: ${req.method} ${req.originalUrl} - ${responseTime}ms`, {
                method: req.method,
                url: req.originalUrl,
                responseTime,
                userId: req.user?.userId,
            });
        }
        if (res.statusCode >= 400) {
            logger_1.logger.error(`Erro na requisição: ${req.method} ${req.originalUrl} - ${res.statusCode}`, {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                responseTime,
                userId: req.user?.userId,
            });
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.monitoringMiddleware = monitoringMiddleware;
const getMetrics = () => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const recentMetrics = metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
    const dailyMetrics = metrics.filter(m => m.timestamp.getTime() > oneDayAgo);
    const totalRequests = metrics.length;
    const recentRequests = recentMetrics.length;
    const dailyRequests = dailyMetrics.length;
    const avgResponseTime = metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
        : 0;
    const recentAvgResponseTime = recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
        : 0;
    const statusCodes = metrics.reduce((acc, m) => {
        acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
        return acc;
    }, {});
    const endpointCounts = metrics.reduce((acc, m) => {
        const endpoint = `${m.method} ${m.url}`;
        acc[endpoint] = (acc[endpoint] || 0) + 1;
        return acc;
    }, {});
    const topEndpoints = Object.entries(endpointCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }));
    const hourlyRequests = Array.from({ length: 24 }, (_, i) => {
        const hourStart = now - ((i + 1) * 60 * 60 * 1000);
        const hourEnd = now - (i * 60 * 60 * 1000);
        const count = metrics.filter(m => m.timestamp.getTime() >= hourStart && m.timestamp.getTime() < hourEnd).length;
        return {
            hour: new Date(hourEnd).getHours(),
            count
        };
    }).reverse();
    return {
        summary: {
            totalRequests,
            recentRequests,
            dailyRequests,
            avgResponseTime: Math.round(avgResponseTime),
            recentAvgResponseTime: Math.round(recentAvgResponseTime),
        },
        statusCodes,
        topEndpoints,
        hourlyRequests,
        errors: metrics.filter(m => m.statusCode >= 400).slice(-50),
        slowRequests: metrics.filter(m => m.responseTime > 1000).slice(-20),
    };
};
exports.getMetrics = getMetrics;
const cleanupMetrics = () => {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const initialLength = metrics.length;
    for (let i = metrics.length - 1; i >= 0; i--) {
        if (metrics[i].timestamp.getTime() < oneDayAgo) {
            metrics.splice(i, 1);
        }
    }
    const removedCount = initialLength - metrics.length;
    if (removedCount > 0) {
        logger_1.logger.info(`Limpeza de métricas: ${removedCount} métricas antigas removidas`);
    }
};
exports.cleanupMetrics = cleanupMetrics;
setInterval(exports.cleanupMetrics, 60 * 60 * 1000);
//# sourceMappingURL=monitoring.js.map