"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const PublicEntityController_1 = require("../controllers/PublicEntityController");
const router = (0, express_1.Router)();
const publicEntityController = new PublicEntityController_1.PublicEntityController();
router.use(auth_1.authenticate);
router.get('/', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(publicEntityController.list));
router.get('/:id', validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(publicEntityController.getById));
router.post('/', auth_1.requirePublicEntityAccess, validation_1.validatePublicEntity, (0, errorHandler_1.asyncHandler)(publicEntityController.create));
router.put('/:id', auth_1.requirePublicEntityAccess, validation_1.validateUuidParam, validation_1.validatePublicEntity, (0, errorHandler_1.asyncHandler)(publicEntityController.update));
router.get('/:id/statistics', validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(publicEntityController.getStatistics));
router.put('/:id/verify', auth_1.requireAdminAccess, validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(publicEntityController.verify));
router.delete('/:id', auth_1.requireAdminAccess, validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(publicEntityController.delete));
exports.default = router;
//# sourceMappingURL=publicEntities.js.map