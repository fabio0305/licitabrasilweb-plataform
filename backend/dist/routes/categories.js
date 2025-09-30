"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const CategoryController_1 = require("../controllers/CategoryController");
const router = (0, express_1.Router)();
const categoryController = new CategoryController_1.CategoryController();
router.get('/', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(categoryController.list));
router.get('/tree', (0, errorHandler_1.asyncHandler)(categoryController.getTree));
router.get('/:id', validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(categoryController.getById));
router.post('/', auth_1.authenticate, auth_1.requireAdminAccess, validation_1.validateCategory, (0, errorHandler_1.asyncHandler)(categoryController.create));
router.put('/:id', auth_1.authenticate, auth_1.requireAdminAccess, validation_1.validateUuidParam, validation_1.validateCategory, (0, errorHandler_1.asyncHandler)(categoryController.update));
router.delete('/:id', auth_1.authenticate, auth_1.requireAdminAccess, validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(categoryController.delete));
exports.default = router;
//# sourceMappingURL=categories.js.map