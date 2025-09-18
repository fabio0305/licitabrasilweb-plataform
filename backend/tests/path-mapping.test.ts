// Mock do módulo antes de importar
jest.mock('@/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Path Mapping Test', () => {
  it('should resolve path mapping correctly', async () => {
    // Importar após o mock
    const { prisma } = await import('@/config/database');
    
    expect(prisma).toBeDefined();
    expect(prisma.user.findUnique).toBeDefined();
  });
});
