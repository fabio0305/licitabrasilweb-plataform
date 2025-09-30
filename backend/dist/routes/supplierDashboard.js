"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const SupplierDashboardController_1 = require("../controllers/SupplierDashboardController");
const router = (0, express_1.Router)();
const supplierDashboardController = new SupplierDashboardController_1.SupplierDashboardController();
router.use(auth_1.authenticate);
router.use(auth_1.requireSupplierAccess);
router.get('/dashboard', (0, errorHandler_1.asyncHandler)(supplierDashboardController.getDashboard));
router.get('/biddings/available', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(supplierDashboardController.getAvailableBiddings));
router.get('/proposals', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(supplierDashboardController.getMyProposals));
router.get('/contracts', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(supplierDashboardController.getMyContracts));
router.get('/reports/performance', (0, errorHandler_1.asyncHandler)(supplierDashboardController.getPerformanceReport));
exports.default = router;
//# sourceMappingURL=supplierDashboard.js.map