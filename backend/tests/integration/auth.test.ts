import request from 'supertest';
import app from '@/server';
import { prisma } from '@/config/database';

// Mock do Prisma para testes de integração
jest.mock('@/config/database');

describe('Auth Integration Tests', () => {
  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'SUPPLIER',
    status: 'ACTIVE',
    password: '$2a$10$hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '11999999999',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user: expect.objectContaining({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
          }),
        },
      });

      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 409 when email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '11999999999',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        message: 'E-mail já está em uso',
      });
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '11999999999',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const userData = {
        email: 'test@example.com',
        // password missing
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.session.create as jest.Mock).mockResolvedValue({
        id: 'session-id',
        token: 'jwt-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Mock bcrypt compare
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      // Mock JWT sign
      const jwt = require('jsonwebtoken');
      jwt.sign = jest.fn().mockReturnValue('jwt-token');

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: expect.objectContaining({
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
          }),
          token: 'jwt-token',
        },
      });

      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock bcrypt compare to return false
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Credenciais inválidas',
      });
    });

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Credenciais inválidas',
      });
    });

    it('should return 403 for inactive user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const inactiveUser = { ...mockUser, status: 'INACTIVE' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Conta inativa. Entre em contato com o suporte.',
      });
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout user successfully', async () => {
      const token = 'valid-jwt-token';

      (prisma.session.findUnique as jest.Mock).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id-123',
        token,
      });
      (prisma.session.delete as jest.Mock).mockResolvedValue({});

      // Mock JWT verify
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 'user-id-123' });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    });

    it('should return 401 for missing token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Token de acesso requerido',
      });
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile', async () => {
      const token = 'valid-jwt-token';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Mock JWT verify
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue({ userId: 'user-id-123' });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: expect.objectContaining({
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
          }),
        },
      });

      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return 401 for invalid token', async () => {
      const token = 'invalid-jwt-token';

      // Mock JWT verify to throw error
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Token inválido',
      });
    });
  });
});
