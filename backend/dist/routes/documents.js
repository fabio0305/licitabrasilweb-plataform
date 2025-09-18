"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const errorHandler_1 = require("@/middleware/errorHandler");
const DocumentController_1 = require("@/controllers/DocumentController");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const documentController = new DocumentController_1.DocumentController();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/jpeg',
            'image/png',
            'image/gif',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    },
});
router.use(auth_1.authenticate);
router.get('/', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(documentController.list));
router.get('/:id', validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(documentController.getById));
router.post('/upload', upload.single('file'), (0, errorHandler_1.asyncHandler)(documentController.upload));
router.get('/:id/download', validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(documentController.download));
router.delete('/:id', validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(documentController.delete));
exports.default = router;
//# sourceMappingURL=documents.js.map