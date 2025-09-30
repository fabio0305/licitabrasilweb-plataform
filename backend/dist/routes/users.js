"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const UserController_1 = require("../controllers/UserController");
const router = (0, express_1.Router)();
const userController = new UserController_1.UserController();
router.use(auth_1.authenticate);
router.get('/', auth_1.requireAdminAccess, validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(userController.list));
router.get('/statistics', auth_1.requireAdminAccess, (0, errorHandler_1.asyncHandler)(userController.getStatistics));
router.get('/:id', auth_1.requireAdminAccess, validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(userController.getById));
router.put('/:id/status', auth_1.requireAdminAccess, validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(userController.updateStatus));
router.put('/:id/role', auth_1.requireAdminAccess, validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(userController.updateRole));
router.delete('/:id', auth_1.requireAdminAccess, validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(userController.delete));
exports.default = router;
//# sourceMappingURL=users.js.map