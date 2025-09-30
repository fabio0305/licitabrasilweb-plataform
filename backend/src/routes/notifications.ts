import { Router } from 'express';
import { authenticate, requireAdminAccess } from '../middleware/auth';
import { validatePagination, validateUuidParam } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();
const notificationController = new NotificationController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas para usuários
router.get('/', validatePagination, asyncHandler(notificationController.list));
router.get('/:id', validateUuidParam, asyncHandler(notificationController.getById));
router.put('/:id/read', validateUuidParam, asyncHandler(notificationController.markAsRead));
router.put('/read-all', asyncHandler(notificationController.markAllAsRead));
router.delete('/:id', validateUuidParam, asyncHandler(notificationController.delete));
router.delete('/read-all', asyncHandler(notificationController.deleteAllRead));

// Rotas administrativas
router.post('/', requireAdminAccess, asyncHandler(notificationController.create));
router.post('/bulk', requireAdminAccess, asyncHandler(notificationController.sendBulk));
router.get('/admin/statistics', requireAdminAccess, asyncHandler(notificationController.getStatistics));

export default router;
