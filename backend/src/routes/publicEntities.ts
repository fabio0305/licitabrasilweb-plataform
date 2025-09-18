import { Router } from 'express';
import { authenticate, requirePublicEntityAccess, requireAdminAccess } from '@/middleware/auth';
import { validatePublicEntity, validatePagination, validateUuidParam } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { PublicEntityController } from '@/controllers/PublicEntityController';

const router = Router();
const publicEntityController = new PublicEntityController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas públicas (com autenticação)
router.get('/', validatePagination, asyncHandler(publicEntityController.list));
router.get('/:id', validateUuidParam, asyncHandler(publicEntityController.getById));

// Rotas para órgãos públicos
router.post('/', requirePublicEntityAccess, validatePublicEntity, asyncHandler(publicEntityController.create));
router.put('/:id', requirePublicEntityAccess, validateUuidParam, validatePublicEntity, asyncHandler(publicEntityController.update));

// Rotas para estatísticas
router.get('/:id/statistics', validateUuidParam, asyncHandler(publicEntityController.getStatistics));

// Rotas administrativas
router.put('/:id/verify', requireAdminAccess, validateUuidParam, asyncHandler(publicEntityController.verify));
router.delete('/:id', requireAdminAccess, validateUuidParam, asyncHandler(publicEntityController.delete));

export default router;
