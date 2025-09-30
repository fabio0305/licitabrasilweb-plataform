import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import { getMetrics } from '../middleware/monitoring';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Middleware de autenticação e autorização (apenas admins)
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @swagger
 * /monitoring/metrics:
 *   get:
 *     summary: Obter métricas do sistema
 *     description: Retorna estatísticas detalhadas sobre o desempenho da API
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRequests:
 *                           type: integer
 *                         recentRequests:
 *                           type: integer
 *                         dailyRequests:
 *                           type: integer
 *                         avgResponseTime:
 *                           type: integer
 *                         recentAvgResponseTime:
 *                           type: integer
 *                     statusCodes:
 *                       type: object
 *                     topEndpoints:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           endpoint:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     hourlyRequests:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           hour:
 *                             type: integer
 *                           count:
 *                             type: integer
 *       401:
 *         description: Token de autenticação inválido
 *       403:
 *         description: Acesso negado - apenas administradores
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = getMetrics();
  
  res.json({
    success: true,
    message: 'Métricas obtidas com sucesso',
    data: metrics,
  });
}));

/**
 * @swagger
 * /monitoring/health:
 *   get:
 *     summary: Verificação de saúde detalhada
 *     description: Retorna informações detalhadas sobre a saúde do sistema
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status de saúde retornado com sucesso
 */
router.get('/health', asyncHandler(async (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
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

export default router;
