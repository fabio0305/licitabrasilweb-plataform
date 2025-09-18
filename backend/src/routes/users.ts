import { Router } from 'express';
import { authenticate, requireAdminAccess } from '@/middleware/auth';
import { validatePagination, validateUuidParam } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { UserController } from '@/controllers/UserController';

const router = Router();
const userController = new UserController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas administrativas (apenas admin)
router.get('/', requireAdminAccess, validatePagination, asyncHandler(userController.list));
router.get('/statistics', requireAdminAccess, asyncHandler(userController.getStatistics));
router.get('/:id', requireAdminAccess, validateUuidParam, asyncHandler(userController.getById));
router.put('/:id/status', requireAdminAccess, validateUuidParam, asyncHandler(userController.updateStatus));
router.put('/:id/role', requireAdminAccess, validateUuidParam, asyncHandler(userController.updateRole));
router.delete('/:id', requireAdminAccess, validateUuidParam, asyncHandler(userController.delete));

export default router;
