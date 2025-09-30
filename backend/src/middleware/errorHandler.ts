import { Request, Response, NextFunction } from 'express';
import { logger, logError } from '../utils/logger';

// Interface para erros customizados
export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

// Classe para erros da aplicação
export class AppError extends Error implements CustomError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Erros específicos da aplicação
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

// Função para determinar se um erro é operacional
const isOperationalError = (error: any): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Função para formatar resposta de erro
const formatErrorResponse = (error: CustomError, includeStack: boolean = false) => {
  const response: any = {
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

// Middleware principal de tratamento de erros
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log do erro
  logError(error, `${req.method} ${req.path}`);

  // Definir status code padrão
  let statusCode = error.statusCode || 500;
  let message = error.message;
  let code = error.code || 'INTERNAL_ERROR';

  // Tratar erros específicos do Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
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

  // Tratar erros de validação do Joi
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Dados inválidos';
  }

  // Tratar erros de JWT
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

  // Tratar erros de multer (upload)
  if (error.name === 'MulterError') {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    switch ((error as any).code) {
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

  // Criar objeto de erro customizado
  const customError: CustomError = {
    ...error,
    statusCode,
    message,
    code,
  };

  // Incluir stack trace apenas em desenvolvimento
  const includeStack = process.env.NODE_ENV === 'development';
  const errorResponse = formatErrorResponse(customError, includeStack);

  // Log adicional para erros não operacionais
  if (!isOperationalError(error)) {
    logger.error('Erro não operacional detectado:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  }

  // Enviar resposta
  res.status(statusCode).json(errorResponse);
};

// Middleware para capturar erros assíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para tratar erros não capturados
export const handleUncaughtErrors = () => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
};
