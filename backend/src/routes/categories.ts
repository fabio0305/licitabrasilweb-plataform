import { Router } from 'express';
import { authenticate, requireAdminAccess } from '@/middleware/auth';
import { validateCategory, validatePagination, validateUuidParam } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { CategoryController } from '@/controllers/CategoryController';

const router = Router();
const categoryController = new CategoryController();

// Rotas públicas (sem autenticação)
router.get('/', validatePagination, asyncHandler(categoryController.list));
router.get('/tree', asyncHandler(categoryController.getTree));
router.get('/:id', validateUuidParam, asyncHandler(categoryController.getById));

// Rotas administrativas (requerem autenticação e acesso de admin)
router.post('/', authenticate, requireAdminAccess, validateCategory, asyncHandler(categoryController.create));
router.put('/:id', authenticate, requireAdminAccess, validateUuidParam, validateCategory, asyncHandler(categoryController.update));
router.delete('/:id', authenticate, requireAdminAccess, validateUuidParam, asyncHandler(categoryController.delete));

export default router;
