import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/config/database';
import { UserRole } from '@prisma/client';

describe('User Profiles Authentication & Authorization', () => {
  let adminToken: string;
  let supplierToken: string;
  let publicEntityToken: string;
  let citizenToken: string;
  let auditorToken: string;

  beforeAll(async () => {
    // Login com diferentes perfis para obter tokens
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@licitabrasil.com',
        password: 'Test123!@#'
      });
    adminToken = adminLogin.body.data.tokens.accessToken;

    const supplierLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'fornecedor@empresa.com.br',
        password: 'Test123!@#'
      });
    supplierToken = supplierLogin.body.data.tokens.accessToken;

    const publicEntityLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'comprador@prefeitura.sp.gov.br',
        password: 'Test123!@#'
      });
    publicEntityToken = publicEntityLogin.body.data.tokens.accessToken;

    const citizenLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'cidadao@email.com',
        password: 'Test123!@#'
      });
    citizenToken = citizenLogin.body.data.tokens.accessToken;

    const auditorLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'auditor@tcu.gov.br',
        password: 'Test123!@#'
      });
    auditorToken = auditorLogin.body.data.tokens.accessToken;
  });

  describe('Authentication Tests', () => {
    test('Should login successfully with admin credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@licitabrasil.com',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.ADMIN);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    test('Should login successfully with supplier credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'fornecedor@empresa.com.br',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.SUPPLIER);
    });

    test('Should login successfully with public entity credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'comprador@prefeitura.sp.gov.br',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.PUBLIC_ENTITY);
    });

    test('Should login successfully with citizen credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'cidadao@email.com',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.CITIZEN);
    });

    test('Should fail login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid@email.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authorization Tests', () => {
    test('Admin should access admin routes', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('Supplier should access supplier dashboard', async () => {
      const response = await request(app)
        .get('/api/v1/supplier-dashboard/dashboard')
        .set('Authorization', `Bearer ${supplierToken}`);

      expect(response.status).toBe(200);
    });

    test('Public entity should access buyer dashboard', async () => {
      const response = await request(app)
        .get('/api/v1/buyers/dashboard')
        .set('Authorization', `Bearer ${publicEntityToken}`);

      expect(response.status).toBe(200);
    });

    test('Citizen should access citizen profile', async () => {
      const response = await request(app)
        .get('/api/v1/citizens/profile/me')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(response.status).toBe(200);
    });

    test('Supplier should NOT access admin routes', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${supplierToken}`);

      expect(response.status).toBe(403);
    });

    test('Citizen should NOT access supplier dashboard', async () => {
      const response = await request(app)
        .get('/api/v1/supplier-dashboard/dashboard')
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(response.status).toBe(403);
    });

    test('Public entity should NOT access supplier dashboard', async () => {
      const response = await request(app)
        .get('/api/v1/supplier-dashboard/dashboard')
        .set('Authorization', `Bearer ${publicEntityToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Profile Management Tests', () => {
    test('Should get user profile information', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe(UserRole.ADMIN);
    });

    test('Should update user profile', async () => {
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          firstName: 'Carlos Updated',
          lastName: 'Oliveira Updated',
          phone: '(11) 9999-8888'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user.firstName).toBe('Carlos Updated');
    });
  });

  describe('Public Access Tests', () => {
    test('Should access transparency dashboard without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/transparency/dashboard');

      expect(response.status).toBe(200);
    });

    test('Should access public biddings without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/transparency/biddings');

      expect(response.status).toBe(200);
    });

    test('Should access public contracts without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/transparency/contracts');

      expect(response.status).toBe(200);
    });
  });

  describe('User Registration Tests', () => {
    test('Should register new citizen user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'novocidadao@test.com',
          password: 'Test123!@#',
          firstName: 'Novo',
          lastName: 'Cidadão',
          phone: '(11) 1234-5678',
          role: UserRole.CITIZEN
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe(UserRole.CITIZEN);
      expect(response.body.data.user.status).toBe('ACTIVE'); // Citizens are auto-activated
    });

    test('Should register new supplier user (pending approval)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'novofornecedor@test.com',
          password: 'Test123!@#',
          firstName: 'Novo',
          lastName: 'Fornecedor',
          phone: '(11) 1234-5678',
          role: UserRole.SUPPLIER
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe(UserRole.SUPPLIER);
      expect(response.body.data.user.status).toBe('PENDING'); // Suppliers need approval
    });

    test('Should not register user with existing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'admin@licitabrasil.com', // Email já existe
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
          phone: '(11) 1234-5678',
          role: UserRole.CITIZEN
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['novocidadao@test.com', 'novofornecedor@test.com']
        }
      }
    });
    await prisma.$disconnect();
  });
});
