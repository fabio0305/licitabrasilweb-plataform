import { Router } from 'express';
import { authenticate, requireSupplierAccess } from '../middleware/auth';
import { validatePagination, validateUuidParam } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { SupplierDashboardController } from '../controllers/SupplierDashboardController';

const router = Router();
const supplierDashboardController = new SupplierDashboardController();

// Todas as rotas requerem autenticação e perfil de fornecedor
router.use(authenticate);
router.use(requireSupplierAccess);

// Dashboard do fornecedor
router.get('/dashboard', asyncHandler(supplierDashboardController.getDashboard));

// Licitações disponíveis
router.get('/biddings/available', validatePagination, asyncHandler(supplierDashboardController.getAvailableBiddings));

// Propostas do fornecedor
router.get('/proposals', validatePagination, asyncHandler(supplierDashboardController.getMyProposals));

// Contratos do fornecedor
router.get('/contracts', validatePagination, asyncHandler(supplierDashboardController.getMyContracts));

// Relatórios
router.get('/reports/performance', asyncHandler(supplierDashboardController.getPerformanceReport));

export default router;
