import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { redisClient } from '@/config/redis';
import { AuthenticationError, AuthorizationError } from '@/middleware/errorHandler';
import { logAuth, logSecurity } from '@/utils/logger';
import { UserRole } from '@prisma/client';

// Interface para o payload do JWT
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat?: number;
  exp?: number;
}

// Estender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Middleware de autenticação
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token de acesso não fornecido');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    if (!token) {
      throw new AuthenticationError('Token de acesso inválido');
    }

    // Verificar se o token está na blacklist
    const isBlacklisted = await redisClient.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      logSecurity('Token blacklisted usado', { token: token.substring(0, 20) + '...', ip: req.ip });
      throw new AuthenticationError('Token inválido');
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Verificar se a sessão ainda existe no Redis
    const sessionData = await redisClient.getSession(decoded.sessionId);
    if (!sessionData) {
      throw new AuthenticationError('Sessão expirada');
    }

    // Verificar se o usuário ainda existe e está ativo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('Usuário não encontrado');
    }

    if (user.status !== 'ACTIVE') {
      logSecurity('Tentativa de acesso com usuário inativo', { 
        userId: user.id, 
        status: user.status,
        ip: req.ip 
      });
      throw new AuthenticationError('Conta inativa');
    }

    // Atualizar último acesso
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Adicionar informações do usuário à requisição
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: decoded.sessionId,
    };

    logAuth('Token validado com sucesso', user.id, req.ip);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logSecurity('Token JWT inválido', { error: error.message, ip: req.ip });
      next(new AuthenticationError('Token inválido'));
    } else if (error instanceof jwt.TokenExpiredError) {
      logSecurity('Token JWT expirado', { ip: req.ip });
      next(new AuthenticationError('Token expirado'));
    } else {
      next(error);
    }
  }
};

// Middleware de autorização por role
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError('Usuário não autenticado'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurity('Tentativa de acesso não autorizado', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      return next(new AuthorizationError('Acesso negado para este recurso'));
    }

    next();
  };
};

// Middleware para verificar se o usuário é admin
export const requireAdmin = authorize(UserRole.ADMIN);

// Middleware para verificar se o usuário é fornecedor
export const requireSupplier = authorize(UserRole.SUPPLIER);

// Middleware para verificar se o usuário é órgão público
export const requirePublicEntity = authorize(UserRole.PUBLIC_ENTITY);

// Middleware para verificar se o usuário é auditor
export const requireAuditor = authorize(UserRole.AUDITOR);

// Middleware para verificar se o usuário pode acessar recursos de fornecedor
export const requireSupplierAccess = authorize(UserRole.SUPPLIER, UserRole.ADMIN);

// Middleware para verificar se o usuário pode acessar recursos de órgão público
export const requirePublicEntityAccess = authorize(UserRole.PUBLIC_ENTITY, UserRole.ADMIN);

// Middleware para verificar se o usuário pode acessar recursos administrativos
export const requireAdminAccess = authorize(UserRole.ADMIN);

// Middleware para verificar se o usuário pode acessar recursos de auditoria
export const requireAuditAccess = authorize(UserRole.AUDITOR, UserRole.ADMIN);

// Middleware opcional de autenticação (não falha se não autenticado)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continua sem autenticação
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continua sem autenticação
    }

    // Verificar se o token está na blacklist
    const isBlacklisted = await redisClient.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(); // Continua sem autenticação
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Verificar se a sessão ainda existe
    const sessionData = await redisClient.getSession(decoded.sessionId);
    if (!sessionData) {
      return next(); // Continua sem autenticação
    }

    // Verificar se o usuário ainda existe e está ativo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return next(); // Continua sem autenticação
    }

    // Adicionar informações do usuário à requisição
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    next();
  }
};

// Função para gerar token JWT
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_SECRET || 'default-secret-key';
  try {
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    } as jwt.SignOptions);
  } catch (error) {
    throw new Error('Erro ao gerar token JWT');
  }
};

// Função para gerar refresh token
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-key';
  try {
    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    } as jwt.SignOptions);
  } catch (error) {
    throw new Error('Erro ao gerar refresh token');
  }
};

// Função para verificar refresh token
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
};

// Função para adicionar token à blacklist
export const blacklistToken = async (token: string, expiresIn: number = 86400): Promise<void> => {
  await redisClient.set(`blacklist:${token}`, 'true', expiresIn);
};
