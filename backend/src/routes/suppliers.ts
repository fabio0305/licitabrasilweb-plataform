import { Router } from 'express';
import { authenticate, requireSupplierAccess, requireAdminAccess } from '@/middleware/auth';
import { validateSupplier, validatePagination, validateUuidParam } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { SupplierController } from '@/controllers/SupplierController';

const router = Router();
const supplierController = new SupplierController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas públicas (com autenticação)
router.get('/', validatePagination, asyncHandler(supplierController.list));
router.get('/:id', validateUuidParam, asyncHandler(supplierController.getById));

// Rotas para fornecedores
router.post('/', requireSupplierAccess, validateSupplier, asyncHandler(supplierController.create));
router.put('/:id', requireSupplierAccess, validateUuidParam, validateSupplier, asyncHandler(supplierController.update));

// Rotas para gestão de categorias
router.post('/:id/categories', requireSupplierAccess, validateUuidParam, asyncHandler(supplierController.addCategory));
router.delete('/:id/categories/:categoryId', requireSupplierAccess, validateUuidParam, asyncHandler(supplierController.removeCategory));

// Rotas para estatísticas
router.get('/:id/statistics', validateUuidParam, asyncHandler(supplierController.getStatistics));

// Rotas administrativas
router.put('/:id/verify', requireAdminAccess, validateUuidParam, asyncHandler(supplierController.verify));
router.delete('/:id', requireAdminAccess, validateUuidParam, asyncHandler(supplierController.delete));

export default router;
