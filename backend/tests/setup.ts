import { PrismaClient } from '@prisma/client';

// Mock do Prisma para testes
jest.mock('@/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    supplier: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    publicEntity: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    bidding: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    proposal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    contract: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    document: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    systemConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

// Mock do Redis
jest.mock('@/config/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
  },
}));

// Mock do logger
jest.mock('@/utils/logger', () => ({
  logUserActivity: jest.fn(),
  logDatabaseOperation: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock do fs/promises para testes de upload
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  unlink: jest.fn(),
  access: jest.fn(),
}));

// Configurações globais para testes
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Helpers para testes
export const mockUser = {
  id: 'user-id-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'SUPPLIER',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockSupplier = {
  id: 'supplier-id-123',
  userId: 'user-id-123',
  companyName: 'Test Company',
  cnpj: '12345678901234',
  isActive: true,
  verifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockPublicEntity = {
  id: 'entity-id-123',
  userId: 'user-id-123',
  name: 'Test Entity',
  cnpj: '12345678901234',
  entityType: 'MUNICIPALITY',
  isActive: true,
  verifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockBidding = {
  id: 'bidding-id-123',
  publicEntityId: 'entity-id-123',
  title: 'Test Bidding',
  description: 'Test Description',
  biddingNumber: 'BID-2024-001',
  status: 'DRAFT',
  openingDate: new Date(),
  closingDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockRequest = (overrides = {}) => ({
  user: { userId: 'user-id-123', role: 'SUPPLIER' },
  params: {},
  query: {},
  body: {},
  file: null,
  ...overrides,
});

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.sendFile = jest.fn().mockReturnValue(res);
  return res;
};
