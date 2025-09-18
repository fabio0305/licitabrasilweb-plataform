"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const errorHandler_1 = require("@/middleware/errorHandler");
const notFoundHandler = (req, res, next) => {
    const error = new errorHandler_1.NotFoundError(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=notFoundHandler.js.map