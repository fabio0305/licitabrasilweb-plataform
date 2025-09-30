"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BackupController_1 = require("../controllers/BackupController");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const backupController = new BackupController_1.BackupController();
router.post('/', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(backupController.createBackup.bind(backupController)));
router.get('/', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(backupController.listBackups.bind(backupController)));
router.get('/statistics', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(backupController.getStatistics.bind(backupController)));
router.post('/restore', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(backupController.restoreDatabase.bind(backupController)));
router.get('/download/:filename', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(backupController.downloadBackup.bind(backupController)));
router.delete('/:filename', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(backupController.deleteBackup.bind(backupController)));
router.get('/verify/:filename', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(backupController.verifyBackup.bind(backupController)));
router.put('/schedule', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(backupController.updateBackupSchedule.bind(backupController)));
exports.default = router;
//# sourceMappingURL=backup.js.map