import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { validatePagination, validateUuidParam, validateDateRange } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { TransparencyController } from '../controllers/TransparencyController';

const router = Router();
const transparencyController = new TransparencyController();

// Todas as rotas são públicas (autenticação opcional)
router.use(optionalAuth);

// Dashboard público de transparência
router.get('/dashboard', asyncHandler(transparencyController.getPublicDashboard));

// Licitações públicas
router.get('/biddings', validatePagination, asyncHandler(transparencyController.getPublicBiddings));

// Contratos públicos
router.get('/contracts', validatePagination, asyncHandler(transparencyController.getPublicContracts));

// Relatórios de gastos públicos
router.get('/reports/spending', validateDateRange, asyncHandler(transparencyController.getPublicSpendingReport));

// Manter rotas legadas para compatibilidade
router.get('/statistics', validateDateRange, asyncHandler(transparencyController.getPublicDashboard));

router.get('/reports/biddings', validateDateRange, asyncHandler(transparencyController.getPublicBiddings));

router.get('/reports/contracts', validateDateRange, asyncHandler(transparencyController.getPublicContracts));

router.get('/open-data/biddings', validatePagination, asyncHandler(transparencyController.getPublicBiddings));

router.get('/open-data/contracts', validatePagination, asyncHandler(transparencyController.getPublicContracts));

export default router;
