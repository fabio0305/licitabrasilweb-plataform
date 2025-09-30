import { Router } from 'express';
import { authenticate, requireSupplierAccess, requirePublicEntityAccess } from '../middleware/auth';
import { validateProposal, validatePagination, validateUuidParam } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ProposalController } from '../controllers/ProposalController';

const router = Router();
const proposalController = new ProposalController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas gerais
router.get('/', validatePagination, asyncHandler(proposalController.list));
router.get('/:id', validateUuidParam, asyncHandler(proposalController.getById));

// Rotas para fornecedores
router.post('/', requireSupplierAccess, validateProposal, asyncHandler(proposalController.create));
router.put('/:id', requireSupplierAccess, validateUuidParam, validateProposal, asyncHandler(proposalController.update));
router.put('/:id/submit', requireSupplierAccess, validateUuidParam, asyncHandler(proposalController.submit));
router.put('/:id/withdraw', requireSupplierAccess, validateUuidParam, asyncHandler(proposalController.withdraw));
router.delete('/:id', requireSupplierAccess, validateUuidParam, asyncHandler(proposalController.delete));

// Rotas para órgãos públicos (avaliação)
router.put('/:id/evaluate', requirePublicEntityAccess, validateUuidParam, asyncHandler(proposalController.evaluate));
router.put('/:id/accept', requirePublicEntityAccess, validateUuidParam, asyncHandler(proposalController.accept));
router.put('/:id/reject', requirePublicEntityAccess, validateUuidParam, asyncHandler(proposalController.reject));

export default router;
