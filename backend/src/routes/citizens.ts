import { Router } from 'express';
import { authenticate, requireCitizenAccess, requireAdminAccess } from '../middleware/auth';
import { validateCitizen, validatePagination, validateUuidParam } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { CitizenController } from '../controllers/CitizenController';

const router = Router();
const citizenController = new CitizenController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas administrativas (apenas admins podem listar todos os cidadãos)
router.get('/', requireAdminAccess, validatePagination, asyncHandler(citizenController.list));
router.get('/:id', requireAdminAccess, validateUuidParam, asyncHandler(citizenController.getById));

// Rotas para cidadãos
router.post('/', requireCitizenAccess, validateCitizen, asyncHandler(citizenController.create));
router.put('/:id', requireCitizenAccess, validateUuidParam, validateCitizen, asyncHandler(citizenController.update));

// Rotas específicas do cidadão
router.get('/profile/me', requireCitizenAccess, asyncHandler(citizenController.getMyProfile));
router.get('/biddings/interested', requireCitizenAccess, validatePagination, asyncHandler(citizenController.getInterestedBiddings));

export default router;
