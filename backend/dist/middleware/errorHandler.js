"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUncaughtErrors = exports.asyncHandler = exports.errorHandler = exports.ExternalServiceError = exports.DatabaseError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Não autorizado') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Acesso negado') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(message = 'Recurso não encontrado') {
        super(message, 404, 'NOT_FOUND_ERROR');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message, details) {
        super(message, 409, 'CONFLICT_ERROR', details);
    }
}
exports.ConflictError = ConflictError;
class DatabaseError extends AppError {
    constructor(message, details) {
        super(message, 500, 'DATABASE_ERROR', details);
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends AppError {
    constructor(message, details) {
        super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
    }
}
exports.ExternalServiceError = ExternalServiceError;
const isOperationalError = (error) => {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
};
const formatErrorResponse = (error, includeStack = false) => {
    const response = {
        success: false,
        error: {
            message: error.message,
            code: error.code || 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
        },
    };
    if (error.details) {
        response.error.details = error.details;
    }
    if (includeStack && error.stack) {
        response.error.stack = error.stack;
    }
    return response;
};
const errorHandler = (error, req, res, next) => {
    (0, logger_1.logError)(error, `${req.method} ${req.path}`);
    let statusCode = error.statusCode || 500;
    let message = error.message;
    let code = error.code || 'INTERNAL_ERROR';
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error;
        switch (prismaError.code) {
            case 'P2002':
                statusCode = 409;
                code = 'UNIQUE_CONSTRAINT_ERROR';
                message = 'Registro já existe';
                break;
            case 'P2025':
                statusCode = 404;
                code = 'RECORD_NOT_FOUND';
                message = 'Registro não encontrado';
                break;
            case 'P2003':
                statusCode = 400;
                code = 'FOREIGN_KEY_CONSTRAINT_ERROR';
                message = 'Violação de chave estrangeira';
                break;
            default:
                statusCode = 500;
                code = 'DATABASE_ERROR';
                message = 'Erro interno do banco de dados';
        }
    }
    if (error.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Dados inválidos';
    }
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Token inválido';
    }
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Token expirado';
    }
    if (error.name === 'MulterError') {
        statusCode = 400;
        code = 'UPLOAD_ERROR';
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'Arquivo muito grande';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Muitos arquivos';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Campo de arquivo inesperado';
                break;
            default:
                message = 'Erro no upload do arquivo';
        }
    }
    const customError = {
        ...error,
        statusCode,
        message,
        code,
    };
    const includeStack = process.env.NODE_ENV === 'development';
    const errorResponse = formatErrorResponse(customError, includeStack);
    if (!isOperationalError(error)) {
        logger_1.logger.error('Erro não operacional detectado:', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const handleUncaughtErrors = () => {
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught Exception:', error);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
};
exports.handleUncaughtErrors = handleUncaughtErrors;
//# sourceMappingURL=errorHandler.js.map