import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { redisClient } from '../config/redis';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  blacklistToken,
  JWTPayload 
} from '../middleware/auth';
import { 
  AuthenticationError, 
  ValidationError, 
  ConflictError,
  NotFoundError 
} from '../middleware/errorHandler';
import { logAuth, logUserActivity, logger } from '../utils/logger';
import { UserStatus } from '@prisma/client';
import { validateCpf as validateCpfAlgorithm, maskCpfForLog } from '../utils/cpfValidation';
import AuditService from '../services/auditService';
import { incrementLoginFailure, clearLoginFailures, loginFailureRateLimit } from '../middleware/rateLimiting';

export class AuthController {
  private auditService: AuditService;

  constructor() {
    this.auditService = AuditService.getInstance();
  }

  // Validação de CPF com auditoria e validação avançada
  async validateCpf(req: Request, res: Response) {
    const { cpf } = req.body;

    try {
      // Validação avançada do algoritmo do CPF
      const cpfValidation = validateCpfAlgorithm(cpf);

      if (!cpfValidation.isValid) {
        // Log da tentativa de validação com CPF inválido
        await this.auditService.logCpfValidation(
          req,
          cpf,
          'FAILURE',
          false,
          cpfValidation.error
        );

        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CPF',
            message: cpfValidation.error,
            type: 'ValidationError'
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      // Verificar se o CPF já está cadastrado
      const existingUser = await prisma.user.findUnique({
        where: { cpf: cpfValidation.formatted },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
        },
      });

      if (existingUser) {
        // Log da tentativa com CPF já cadastrado
        await this.auditService.logCpfValidation(
          req,
          cpf,
          'FAILURE',
          true,
          'CPF já cadastrado'
        );

        return res.status(409).json({
          success: false,
          message: 'CPF já cadastrado',
          data: {
            isRegistered: true,
            user: {
              firstName: existingUser.firstName,
              lastName: existingUser.lastName,
              email: existingUser.email,
              role: existingUser.role,
              status: existingUser.status,
            },
          },
        });
      }

      // Log da validação bem-sucedida
      await this.auditService.logCpfValidation(
        req,
        cpf,
        'SUCCESS',
        false
      );

      res.json({
        success: true,
        message: 'CPF válido e disponível para cadastro',
        data: {
          isRegistered: false,
          cpf: cpfValidation.formatted,
        },
      });

    } catch (error) {
      // Log do erro
      await this.auditService.logCpfValidation(
        req,
        cpf,
        'ERROR',
        false,
        error instanceof Error ? error.message : 'Erro interno'
      );

      logger.error('Erro na validação de CPF', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
          type: 'InternalError'
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }
  }

  // Registro de usuário
  async register(req: Request, res: Response) {
    const { email, password, firstName, lastName, phone, role, cpf } = req.body;

    // Verificar se o usuário já existe (por email ou CPF)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(cpf ? [{ cpf }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError('Email já está em uso');
      }
      if (existingUser.cpf === cpf) {
        throw new ConflictError('CPF já cadastrado');
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    // Definir status inicial baseado no role
    let initialStatus: UserStatus = UserStatus.PENDING;
    if (role === 'CITIZEN') {
      initialStatus = UserStatus.ACTIVE; // Cidadãos são ativados automaticamente
    }

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        cpf,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        status: initialStatus,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    logAuth('Usuário registrado', user.id, req.ip);
    logUserActivity(user.id, 'USER_REGISTERED');

    const message = role === 'CITIZEN'
      ? 'Usuário registrado com sucesso.'
      : 'Usuário registrado com sucesso. Aguarde aprovação.';

    res.status(201).json({
      success: true,
      message,
      data: { user },
    });
  }

  // Login
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const clientIp = req.ip || 'unknown';

    // Verificar rate limiting de falhas de login antes de processar
    const failureKey = `login_failures:${clientIp}`;
    try {
      const currentFailures = await redisClient.get(failureKey);
      const failureCount = currentFailures ? parseInt(currentFailures) : 0;

      if (failureCount >= 3) {
        logger.warn('Rate limit de falhas de login excedido', {
          ip: clientIp,
          failures: failureCount,
          email: email
        });

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Muitas tentativas de login com credenciais inválidas. Tente novamente em 10 minutos.',
            type: 'RateLimitError'
          },
          retryAfter: 600, // 10 minutos
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }
    } catch (redisError) {
      logger.error('Erro ao verificar rate limiting de falhas:', redisError);
      // Em caso de erro no Redis, permite continuar
    }

    try {
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Incrementar contador de falhas para IP
        await incrementLoginFailure(clientIp);
        logAuth('Tentativa de login com email inexistente', undefined, clientIp);
        await this.auditService.logLoginAttempt(req, email, 'FAILURE', 'Email não encontrado');
        throw new AuthenticationError('Credenciais inválidas');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // Incrementar contador de falhas para IP
        await incrementLoginFailure(clientIp);
        logAuth('Tentativa de login com senha incorreta', user.id, clientIp);
        await this.auditService.logLoginAttempt(req, email, 'FAILURE', 'Senha incorreta');
        throw new AuthenticationError('Credenciais inválidas');
      }

      // Verificar status do usuário
      if (user.status !== 'ACTIVE') {
        // Incrementar contador de falhas para IP
        await incrementLoginFailure(clientIp);
        logAuth('Tentativa de login com conta inativa', user.id, clientIp);
        await this.auditService.logLoginAttempt(req, email, 'FAILURE', `Conta com status: ${user.status}`);
        throw new AuthenticationError('Conta inativa ou pendente de aprovação');
      }

      // Login bem-sucedido - limpar contador de falhas
      await clearLoginFailures(clientIp);

    // Gerar ID da sessão
    const sessionId = uuidv4();

    // Criar payload do token
    const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    // Gerar tokens
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Salvar sessão no Redis
    await redisClient.setSession(sessionId, {
      userId: user.id,
      email: user.email,
      role: user.role,
      loginAt: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    }, 7 * 24 * 60 * 60); // 7 dias

    // Salvar sessão no banco
    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: refreshToken,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logAuth('Login realizado com sucesso', user.id, req.ip);
    logUserActivity(user.id, 'USER_LOGIN', { ip: req.ip });

    // Log de auditoria para login bem-sucedido
    await this.auditService.logLoginAttempt(req, email, 'SUCCESS', undefined, user.id);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          },
        },
      });
    } catch (error) {
      // Re-throw o erro para que seja tratado pelo middleware de erro
      throw error;
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token é obrigatório');
    }

    try {
      // Verificar refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Verificar se a sessão existe
      const session = await prisma.userSession.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true },
      });

      if (!session || session.token !== refreshToken) {
        throw new AuthenticationError('Refresh token inválido');
      }

      if (session.expiresAt < new Date()) {
        // Remover sessão expirada
        await prisma.userSession.delete({
          where: { id: session.id },
        });
        await redisClient.deleteSession(session.id);
        throw new AuthenticationError('Refresh token expirado');
      }

      // Verificar se o usuário ainda está ativo
      if (session.user.status !== 'ACTIVE') {
        throw new AuthenticationError('Usuário inativo');
      }

      // Gerar novo access token
      const tokenPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        sessionId: session.id,
      };

      const newAccessToken = generateToken(tokenPayload);

      logAuth('Token renovado', session.user.id, req.ip);

      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          accessToken: newAccessToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        },
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError('Refresh token inválido');
    }
  }

  // Logout
  async logout(req: Request, res: Response) {
    const { sessionId } = req.user!;
    const authHeader = req.headers.authorization!;
    const token = authHeader.substring(7);

    // Adicionar token à blacklist
    await blacklistToken(token);

    // Remover sessão do Redis
    await redisClient.deleteSession(sessionId);

    // Remover sessão do banco
    await prisma.userSession.deleteMany({
      where: { id: sessionId },
    });

    logAuth('Logout realizado', req.user!.userId, req.ip);
    logUserActivity(req.user!.userId, 'USER_LOGOUT', { ip: req.ip });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  }

  // Obter perfil do usuário
  async getProfile(req: Request, res: Response) {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    res.json({
      success: true,
      data: { user },
    });
  }

  // Atualizar perfil
  async updateProfile(req: Request, res: Response) {
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    logUserActivity(req.user!.userId, 'PROFILE_UPDATED');

    // Log de auditoria para atualização de perfil
    await this.auditService.logAction(
      'PROFILE_UPDATE',
      req,
      'SUCCESS',
      {
        updatedFields: { firstName, lastName, phone },
        userId: req.user!.userId
      }
    );

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: { user },
    });
  }

  // Alterar senha
  async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = req.body;

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    logUserActivity(user.id, 'PASSWORD_CHANGED', { ip: req.ip });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  }

  // Esqueci minha senha
  async forgotPassword(req: Request, res: Response): Promise<Response> {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Sempre retorna sucesso por segurança (não revela se email existe)
    if (!user) {
      return res.json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha',
      });
    }

    // TODO: Implementar envio de email com token de reset
    // Por enquanto, apenas log
    logUserActivity(user.id, 'PASSWORD_RESET_REQUESTED', { ip: req.ip });

    return res.json({
      success: true,
      message: 'Se o email existir, você receberá instruções para redefinir sua senha',
    });
  }

  // Redefinir senha
  async resetPassword(req: Request, res: Response): Promise<Response> {
    const { token, newPassword } = req.body;

    // TODO: Implementar validação do token de reset
    // Por enquanto, apenas retorna erro
    throw new ValidationError('Funcionalidade não implementada');
  }
}
