import { Router } from 'express';
import { authenticate, requirePublicEntityAccess, requireSupplierAccess } from '../middleware/auth';
import { validateContract, validatePagination, validateUuidParam } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ContractController } from '../controllers/ContractController';

const router = Router();
const contractController = new ContractController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas gerais
router.get('/', validatePagination, asyncHandler(contractController.list));
router.get('/:id', validateUuidParam, asyncHandler(contractController.getById));

// Rotas para órgãos públicos
router.post('/', requirePublicEntityAccess, validateContract, asyncHandler(contractController.create));
router.put('/:id', requirePublicEntityAccess, validateUuidParam, validateContract, asyncHandler(contractController.update));
router.put('/:id/activate', requirePublicEntityAccess, validateUuidParam, asyncHandler(contractController.activate));
router.put('/:id/suspend', requirePublicEntityAccess, validateUuidParam, asyncHandler(contractController.suspend));
router.put('/:id/terminate', requirePublicEntityAccess, validateUuidParam, asyncHandler(contractController.terminate));
router.put('/:id/complete', requirePublicEntityAccess, validateUuidParam, asyncHandler(contractController.complete));

// Rotas para assinatura (ambos os lados)
router.put('/:id/sign', validateUuidParam, asyncHandler(contractController.sign));

export default router;
