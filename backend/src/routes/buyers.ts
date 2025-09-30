import { Router } from 'express';
import { authenticate, requirePublicEntityAccess } from '../middleware/auth';
import { validatePagination, validateUuidParam } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { BuyerController } from '../controllers/BuyerController';

const router = Router();
const buyerController = new BuyerController();

// Todas as rotas requerem autenticação e perfil de órgão público
router.use(authenticate);
router.use(requirePublicEntityAccess);

// Dashboard do comprador
router.get('/dashboard', asyncHandler(buyerController.getDashboard));

// Licitações do comprador
router.get('/biddings', validatePagination, asyncHandler(buyerController.getMyBiddings));

// Propostas recebidas
router.get('/proposals', validatePagination, asyncHandler(buyerController.getReceivedProposals));

// Contratos do comprador
router.get('/contracts', validatePagination, asyncHandler(buyerController.getMyContracts));

// Relatórios
router.get('/reports/purchases', asyncHandler(buyerController.getPurchaseReport));

export default router;
