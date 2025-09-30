"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const BuyerController_1 = require("../controllers/BuyerController");
const router = (0, express_1.Router)();
const buyerController = new BuyerController_1.BuyerController();
router.use(auth_1.authenticate);
router.use(auth_1.requirePublicEntityAccess);
router.get('/dashboard', (0, errorHandler_1.asyncHandler)(buyerController.getDashboard));
router.get('/biddings', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(buyerController.getMyBiddings));
router.get('/proposals', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(buyerController.getReceivedProposals));
router.get('/contracts', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(buyerController.getMyContracts));
router.get('/reports/purchases', (0, errorHandler_1.asyncHandler)(buyerController.getPurchaseReport));
exports.default = router;
//# sourceMappingURL=buyers.js.map