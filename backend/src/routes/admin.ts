import { Router } from 'express';
import { authenticate, requireAdminAccess } from '../middleware/auth';
import { validatePagination, validateUuidParam, validateUserList } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { AdminController } from '../controllers/AdminController';
import { UserController } from '../controllers/UserController';
import { SupplierController } from '../controllers/SupplierController';
import { PublicEntityController } from '../controllers/PublicEntityController';
import { BiddingController } from '../controllers/BiddingController';
import { ContractController } from '../controllers/ContractController';

const router = Router();
const adminController = new AdminController();
const userController = new UserController();
const supplierController = new SupplierController();
const publicEntityController = new PublicEntityController();
const biddingController = new BiddingController();
const contractController = new ContractController();

// Todas as rotas requerem autenticação e acesso de admin
router.use(authenticate);
router.use(requireAdminAccess);

// Gestão de usuários
router.get('/users', validateUserList, asyncHandler(userController.list));
router.get('/users/statistics', asyncHandler(userController.getStatistics));
router.get('/users/:id', validateUuidParam, asyncHandler(userController.getById));
router.get('/users/:id/permissions', validateUuidParam, asyncHandler(userController.getUserPermissions));
router.put('/users/:id', validateUuidParam, asyncHandler(userController.update));
router.put('/users/:id/status', validateUuidParam, asyncHandler(userController.updateStatus));
router.put('/users/:id/role', validateUuidParam, asyncHandler(userController.updateRole));
router.put('/users/:id/reset-password', validateUuidParam, asyncHandler(userController.resetPassword));
router.post('/users', asyncHandler(userController.createUser));
router.delete('/users/:id', validateUuidParam, asyncHandler(userController.delete));

// Gestão de fornecedores
router.get('/suppliers', validatePagination, asyncHandler(supplierController.list));
router.put('/suppliers/:id/verify', validateUuidParam, asyncHandler(supplierController.verify));

// Gestão de órgãos públicos
router.get('/public-entities', validatePagination, asyncHandler(publicEntityController.list));
router.put('/public-entities/:id/verify', validateUuidParam, asyncHandler(publicEntityController.verify));

// Gestão de licitações
router.get('/biddings', validatePagination, asyncHandler(biddingController.list));
router.put('/biddings/:id/moderate', validateUuidParam, asyncHandler(adminController.moderateBidding));

// Gestão de contratos
router.get('/contracts', validatePagination, asyncHandler(contractController.list));

// Configurações do sistema
router.get('/config', asyncHandler(adminController.getConfig));
router.put('/config', asyncHandler(adminController.updateConfig));

// Logs de auditoria
router.get('/audit-logs', validatePagination, asyncHandler(adminController.getAuditLogs));

// Estatísticas administrativas
router.get('/statistics', asyncHandler(adminController.getStatistics));

// Dashboard de moderação
router.get('/moderation', asyncHandler(adminController.getModerationDashboard));

// Backup e recuperação
router.post('/backup', asyncHandler(adminController.createBackup));
router.get('/backup/status', asyncHandler(adminController.getBackupStatus));

export default router;
