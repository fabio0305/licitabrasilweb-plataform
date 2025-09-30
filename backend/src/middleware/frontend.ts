import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Middleware para adicionar headers específicos para integração frontend
export const frontendIntegration = (req: Request, res: Response, next: NextFunction) => {
  // Headers para melhor integração com frontend
  res.setHeader('X-API-Version', process.env.API_VERSION || 'v1');
  res.setHeader('X-Powered-By', 'LicitaBrasil-API');
  
  // Headers para cache inteligente
  if (req.method === 'GET' && req.path.includes('/transparency/')) {
    // Dados de transparência podem ser cacheados por mais tempo
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutos
  } else if (req.method === 'GET' && req.path.includes('/dashboard')) {
    // Dashboards têm cache menor
    res.setHeader('Cache-Control', 'private, max-age=60'); // 1 minuto
  } else {
    // Outros endpoints não devem ser cacheados
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }

  // Headers para CORS avançado
  res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page-Count, X-Current-Page');
  
  next();
};

// Middleware para adicionar metadados de paginação nos headers
export const paginationHeaders = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    if (data && data.data && data.data.pagination) {
      const { total, totalPages, page } = data.data.pagination;
      res.setHeader('X-Total-Count', total.toString());
      res.setHeader('X-Page-Count', totalPages.toString());
      res.setHeader('X-Current-Page', page.toString());
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Middleware para log de requisições do frontend
export const frontendLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const userAgent = req.get('User-Agent') || 'Unknown';
  const origin = req.get('Origin') || req.get('Referer') || 'Unknown';
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent,
      origin,
      userId: (req as any).user?.id || 'anonymous',
      userRole: (req as any).user?.role || 'none'
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Frontend request error', logData);
    } else {
      logger.info('Frontend request', logData);
    }
  });
  
  next();
};

// Middleware para transformar erros em formato amigável para frontend
export const frontendErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log do erro completo
  logger.error('Frontend error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: (req as any).user?.id,
    userRole: (req as any).user?.role
  });

  // Resposta padronizada para o frontend
  const errorResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Erro interno do servidor',
      type: err.constructor.name,
      ...(isDevelopment && { stack: err.stack, details: err })
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Status code baseado no tipo de erro
  let statusCode = 500;
  
  if (err.name === 'ValidationError' || err.code === 'VALIDATION_ERROR') {
    statusCode = 400;
  } else if (err.name === 'AuthenticationError' || err.code === 'AUTHENTICATION_ERROR') {
    statusCode = 401;
  } else if (err.name === 'AuthorizationError' || err.code === 'AUTHORIZATION_ERROR') {
    statusCode = 403;
  } else if (err.name === 'NotFoundError' || err.code === 'NOT_FOUND') {
    statusCode = 404;
  } else if (err.name === 'ConflictError' || err.code === 'CONFLICT') {
    statusCode = 409;
  } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
    statusCode = 429;
  }

  res.status(statusCode).json(errorResponse);
};

// Middleware para adicionar informações do usuário nas respostas
export const userContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Adicionar contexto do usuário se autenticado
    if ((req as any).user && data && data.success) {
      data.userContext = {
        id: (req as any).user.id,
        role: (req as any).user.role,
        permissions: (req as any).user.permissions || [],
        timestamp: new Date().toISOString()
      };
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Middleware para validar origem do frontend
export const validateFrontendOrigin = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim());
  const origin = req.get('Origin');
  
  // Em desenvolvimento, permitir qualquer origem localhost
  if (process.env.NODE_ENV === 'development') {
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return next();
    }
  }
  
  // Em produção, validar origens específicas
  if (!origin || !allowedOrigins.includes(origin)) {
    logger.warn('Invalid frontend origin', { origin, allowedOrigins });
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_ORIGIN',
        message: 'Origem não autorizada'
      }
    });
  }
  
  next();
};

// Middleware para rate limiting específico por usuário
export const userRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id || req.ip;
    const now = Date.now();
    
    // Limpar registros expirados
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key);
      }
    }
    
    const userRequests = requests.get(userId);
    
    if (!userRequests) {
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Muitas requisições. Tente novamente em alguns minutos.',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
        }
      });
    }
    
    userRequests.count++;
    next();
  };
};

// Middleware para adicionar informações de debug em desenvolvimento
export const developmentDebug = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'development') {
    return next();
  }
  
  const originalJson = res.json;
  
  res.json = function(data: any) {
    if (data && data.success) {
      data.debug = {
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - (req as any).startTime,
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      };
    }
    
    return originalJson.call(this, data);
  };
  
  // Marcar tempo de início
  (req as any).startTime = Date.now();
  next();
};
