"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const CitizenController_1 = require("../controllers/CitizenController");
const router = (0, express_1.Router)();
const citizenController = new CitizenController_1.CitizenController();
router.use(auth_1.authenticate);
router.get('/', auth_1.requireAdminAccess, validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(citizenController.list));
router.get('/:id', auth_1.requireAdminAccess, validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(citizenController.getById));
router.post('/', auth_1.requireCitizenAccess, validation_1.validateCitizen, (0, errorHandler_1.asyncHandler)(citizenController.create));
router.put('/:id', auth_1.requireCitizenAccess, validation_1.validateUuidParam, validation_1.validateCitizen, (0, errorHandler_1.asyncHandler)(citizenController.update));
router.get('/profile/me', auth_1.requireCitizenAccess, (0, errorHandler_1.asyncHandler)(citizenController.getMyProfile));
router.get('/biddings/interested', auth_1.requireCitizenAccess, validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(citizenController.getInterestedBiddings));
exports.default = router;
//# sourceMappingURL=citizens.js.map