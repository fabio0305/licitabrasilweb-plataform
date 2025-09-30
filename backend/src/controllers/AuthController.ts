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
import { logAuth, logUserActivity } from '../utils/logger';
import { UserStatus } from '@prisma/client';

export class AuthController {
  // Registro de usuário
  async register(req: Request, res: Response) {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email já está em uso');
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

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logAuth('Tentativa de login com email inexistente', undefined, req.ip);
      throw new AuthenticationError('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logAuth('Tentativa de login com senha incorreta', user.id, req.ip);
      throw new AuthenticationError('Credenciais inválidas');
    }

    // Verificar status do usuário
    if (user.status !== 'ACTIVE') {
      logAuth('Tentativa de login com conta inativa', user.id, req.ip);
      throw new AuthenticationError('Conta inativa ou pendente de aprovação');
    }

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
