import { prisma } from '../../src/config/database';
import { 
  hasPermission, 
  grantPermission, 
  revokePermission 
} from '../../src/middleware/auth';
import { Permission, UserRole } from '@prisma/client';

describe('Granular Permissions System', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Criar usuário de teste
    const testUser = await prisma.user.create({
      data: {
        email: 'test-permissions@test.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.SUPPLIER,
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.userPermission.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('Permission Management', () => {
    test('Should grant permission to user', async () => {
      await grantPermission(testUserId, Permission.CREATE_PROPOSAL);
      
      const hasCreateProposal = await hasPermission(testUserId, Permission.CREATE_PROPOSAL);
      expect(hasCreateProposal).toBe(true);
    });

    test('Should check if user has permission', async () => {
      const hasReadPublic = await hasPermission(testUserId, Permission.READ_PUBLIC_DATA);
      const hasManageSystem = await hasPermission(testUserId, Permission.MANAGE_SYSTEM);
      
      // Assumindo que READ_PUBLIC_DATA foi concedido via seed
      expect(hasReadPublic).toBe(true);
      // MANAGE_SYSTEM não deve estar disponível para fornecedor
      expect(hasManageSystem).toBe(false);
    });

    test('Should revoke permission from user', async () => {
      // Primeiro conceder a permissão
      await grantPermission(testUserId, Permission.EDIT_PROPOSAL);
      let hasEditProposal = await hasPermission(testUserId, Permission.EDIT_PROPOSAL);
      expect(hasEditProposal).toBe(true);

      // Depois revogar
      await revokePermission(testUserId, Permission.EDIT_PROPOSAL);
      hasEditProposal = await hasPermission(testUserId, Permission.EDIT_PROPOSAL);
      expect(hasEditProposal).toBe(false);
    });

    test('Should handle permission expiration', async () => {
      const expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() + 1); // Expira em 1 segundo

      await grantPermission(testUserId, Permission.DELETE_PROPOSAL, undefined, expirationDate);
      
      // Deve ter a permissão inicialmente
      let hasDeleteProposal = await hasPermission(testUserId, Permission.DELETE_PROPOSAL);
      expect(hasDeleteProposal).toBe(true);

      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Não deve mais ter a permissão
      hasDeleteProposal = await hasPermission(testUserId, Permission.DELETE_PROPOSAL);
      expect(hasDeleteProposal).toBe(false);
    });

    test('Should update existing permission', async () => {
      // Conceder permissão sem expiração
      await grantPermission(testUserId, Permission.SUBMIT_PROPOSAL);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 dias no futuro

      // Atualizar com expiração
      await grantPermission(testUserId, Permission.SUBMIT_PROPOSAL, testUserId, futureDate);

      const permission = await prisma.userPermission.findUnique({
        where: {
          userId_permission: {
            userId: testUserId,
            permission: Permission.SUBMIT_PROPOSAL,
          },
        },
      });

      expect(permission?.expiresAt).toEqual(futureDate);
      expect(permission?.grantedBy).toBe(testUserId);
    });
  });

  describe('Default Permissions by Role', () => {
    test('Should verify admin has all permissions', async () => {
      const adminUser = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });

      if (adminUser) {
        const adminPermissions = await prisma.userPermission.findMany({
          where: { 
            userId: adminUser.id,
            isActive: true,
          },
        });

        // Admin deve ter muitas permissões
        expect(adminPermissions.length).toBeGreaterThan(10);
        
        // Verificar algumas permissões específicas
        const hasManageUsers = await hasPermission(adminUser.id, Permission.MANAGE_USERS);
        const hasManageSystem = await hasPermission(adminUser.id, Permission.MANAGE_SYSTEM);
        const hasViewAuditLogs = await hasPermission(adminUser.id, Permission.VIEW_AUDIT_LOGS);

        expect(hasManageUsers).toBe(true);
        expect(hasManageSystem).toBe(true);
        expect(hasViewAuditLogs).toBe(true);
      }
    });

    test('Should verify supplier has limited permissions', async () => {
      const supplierUser = await prisma.user.findFirst({
        where: { role: UserRole.SUPPLIER },
      });

      if (supplierUser) {
        const hasReadPublic = await hasPermission(supplierUser.id, Permission.READ_PUBLIC_DATA);
        const hasCreateProposal = await hasPermission(supplierUser.id, Permission.CREATE_PROPOSAL);
        const hasManageUsers = await hasPermission(supplierUser.id, Permission.MANAGE_USERS);
        const hasManageSystem = await hasPermission(supplierUser.id, Permission.MANAGE_SYSTEM);

        expect(hasReadPublic).toBe(true);
        expect(hasCreateProposal).toBe(true);
        expect(hasManageUsers).toBe(false);
        expect(hasManageSystem).toBe(false);
      }
    });

    test('Should verify public entity has bidding permissions', async () => {
      const publicEntityUser = await prisma.user.findFirst({
        where: { role: UserRole.PUBLIC_ENTITY },
      });

      if (publicEntityUser) {
        const hasCreateBidding = await hasPermission(publicEntityUser.id, Permission.CREATE_BIDDING);
        const hasEditBidding = await hasPermission(publicEntityUser.id, Permission.EDIT_BIDDING);
        const hasPublishBidding = await hasPermission(publicEntityUser.id, Permission.PUBLISH_BIDDING);
        const hasCreateContract = await hasPermission(publicEntityUser.id, Permission.CREATE_CONTRACT);
        const hasManageUsers = await hasPermission(publicEntityUser.id, Permission.MANAGE_USERS);

        expect(hasCreateBidding).toBe(true);
        expect(hasEditBidding).toBe(true);
        expect(hasPublishBidding).toBe(true);
        expect(hasCreateContract).toBe(true);
        expect(hasManageUsers).toBe(false);
      }
    });

    test('Should verify citizen has minimal permissions', async () => {
      const citizenUser = await prisma.user.findFirst({
        where: { role: UserRole.CITIZEN },
      });

      if (citizenUser) {
        const hasReadPublic = await hasPermission(citizenUser.id, Permission.READ_PUBLIC_DATA);
        const hasCreateProposal = await hasPermission(citizenUser.id, Permission.CREATE_PROPOSAL);
        const hasCreateBidding = await hasPermission(citizenUser.id, Permission.CREATE_BIDDING);
        const hasManageUsers = await hasPermission(citizenUser.id, Permission.MANAGE_USERS);

        expect(hasReadPublic).toBe(true);
        expect(hasCreateProposal).toBe(false);
        expect(hasCreateBidding).toBe(false);
        expect(hasManageUsers).toBe(false);
      }
    });

    test('Should verify auditor has audit permissions', async () => {
      const auditorUser = await prisma.user.findFirst({
        where: { role: UserRole.AUDITOR },
      });

      if (auditorUser) {
        const hasReadPublic = await hasPermission(auditorUser.id, Permission.READ_PUBLIC_DATA);
        const hasReadPrivate = await hasPermission(auditorUser.id, Permission.READ_PRIVATE_DATA);
        const hasViewAuditLogs = await hasPermission(auditorUser.id, Permission.VIEW_AUDIT_LOGS);
        const hasGenerateReports = await hasPermission(auditorUser.id, Permission.GENERATE_REPORTS);
        const hasCreateBidding = await hasPermission(auditorUser.id, Permission.CREATE_BIDDING);
        const hasManageUsers = await hasPermission(auditorUser.id, Permission.MANAGE_USERS);

        expect(hasReadPublic).toBe(true);
        expect(hasReadPrivate).toBe(true);
        expect(hasViewAuditLogs).toBe(true);
        expect(hasGenerateReports).toBe(true);
        expect(hasCreateBidding).toBe(false);
        expect(hasManageUsers).toBe(false);
      }
    });
  });

  describe('Permission Validation', () => {
    test('Should handle non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const userHasPermission = await hasPermission(fakeUserId, Permission.READ_PUBLIC_DATA);
      expect(userHasPermission).toBe(false);
    });

    test('Should handle inactive permissions', async () => {
      // Conceder permissão
      await grantPermission(testUserId, Permission.EXPORT_DATA);
      
      // Verificar que tem a permissão
      let hasExportData = await hasPermission(testUserId, Permission.EXPORT_DATA);
      expect(hasExportData).toBe(true);

      // Desativar manualmente a permissão
      await prisma.userPermission.updateMany({
        where: {
          userId: testUserId,
          permission: Permission.EXPORT_DATA,
        },
        data: {
          isActive: false,
        },
      });

      // Verificar que não tem mais a permissão
      hasExportData = await hasPermission(testUserId, Permission.EXPORT_DATA);
      expect(hasExportData).toBe(false);
    });
  });
});
