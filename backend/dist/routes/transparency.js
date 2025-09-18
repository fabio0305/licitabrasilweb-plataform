"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const validation_1 = require("@/middleware/validation");
const errorHandler_1 = require("@/middleware/errorHandler");
const router = (0, express_1.Router)();
router.use(auth_1.optionalAuth);
router.get('/biddings', validation_1.validatePagination, validation_1.validateDateRange, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({ success: true, message: 'Licitações públicas para transparência - TODO' });
}));
router.get('/biddings/:id', validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({ success: true, message: 'Detalhes públicos de licitação - TODO' });
}));
router.get('/contracts', validation_1.validatePagination, validation_1.validateDateRange, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({ success: true, message: 'Contratos públicos - TODO' });
}));
router.get('/contracts/:id', validation_1.validateUuidParam, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({ success: true, message: 'Detalhes públicos de contrato - TODO' });
}));
router.get('/statistics', validation_1.validateDateRange, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({ success: true, message: 'Estatísticas públicas - TODO' });
}));
router.get('/reports/biddings', validation_1.validateDateRange, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({ success: true, message: 'Relatório de licitações - TODO' });
}));
router.get('/reports/contracts', validation_1.validateDateRange, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({ success: true, message: 'Relatório de contratos - TODO' });
}));
router.get('/reports/suppliers', validation_1.validateDateRange, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({ success: true, message: 'Relatório de fornecedores - TODO' });
}));
router.get('/open-data/biddings', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({ success: true, message: 'Dados abertos de licitações - TODO' });
}));
router.get('/open-data/contracts', validation_1.validatePagination, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.json({ success: true, message: 'Dados abertos de contratos - TODO' });
}));
exports.default = router;
//# sourceMappingURL=transparency.js.map