import { PrismaClient, UserRole, Permission } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPermissions() {
  console.log('🌱 Seeding user permissions...');

  try {
    // Buscar usuários por role
    const adminUsers = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
    });

    const supplierUsers = await prisma.user.findMany({
      where: { role: UserRole.SUPPLIER },
    });

    const publicEntityUsers = await prisma.user.findMany({
      where: { role: UserRole.PUBLIC_ENTITY },
    });

    const auditorUsers = await prisma.user.findMany({
      where: { role: UserRole.AUDITOR },
    });

    const citizenUsers = await prisma.user.findMany({
      where: { role: UserRole.CITIZEN },
    });

    // Permissões para ADMINISTRADORES (todas as permissões)
    const adminPermissions: Permission[] = [
      Permission.READ_PUBLIC_DATA,
      Permission.READ_PRIVATE_DATA,
      Permission.WRITE_DATA,
      Permission.DELETE_DATA,
      Permission.CREATE_BIDDING,
      Permission.EDIT_BIDDING,
      Permission.DELETE_BIDDING,
      Permission.PUBLISH_BIDDING,
      Permission.CANCEL_BIDDING,
      Permission.CREATE_PROPOSAL,
      Permission.EDIT_PROPOSAL,
      Permission.DELETE_PROPOSAL,
      Permission.SUBMIT_PROPOSAL,
      Permission.CREATE_CONTRACT,
      Permission.EDIT_CONTRACT,
      Permission.SIGN_CONTRACT,
      Permission.TERMINATE_CONTRACT,
      Permission.MANAGE_USERS,
      Permission.MANAGE_SYSTEM,
      Permission.VIEW_AUDIT_LOGS,
      Permission.MANAGE_CATEGORIES,
      Permission.GENERATE_REPORTS,
      Permission.EXPORT_DATA,
    ];

    for (const admin of adminUsers) {
      for (const permission of adminPermissions) {
        await prisma.userPermission.upsert({
          where: {
            userId_permission: {
              userId: admin.id,
              permission,
            },
          },
          update: {},
          create: {
            userId: admin.id,
            permission,
            grantedBy: admin.id, // Auto-concedido
            isActive: true,
          },
        });
      }
    }

    // Permissões para FORNECEDORES
    const supplierPermissions: Permission[] = [
      Permission.READ_PUBLIC_DATA,
      Permission.CREATE_PROPOSAL,
      Permission.EDIT_PROPOSAL,
      Permission.DELETE_PROPOSAL,
      Permission.SUBMIT_PROPOSAL,
      Permission.GENERATE_REPORTS,
    ];

    for (const supplier of supplierUsers) {
      for (const permission of supplierPermissions) {
        await prisma.userPermission.upsert({
          where: {
            userId_permission: {
              userId: supplier.id,
              permission,
            },
          },
          update: {},
          create: {
            userId: supplier.id,
            permission,
            isActive: true,
          },
        });
      }
    }

    // Permissões para ÓRGÃOS PÚBLICOS (COMPRADORES)
    const publicEntityPermissions: Permission[] = [
      Permission.READ_PUBLIC_DATA,
      Permission.READ_PRIVATE_DATA,
      Permission.WRITE_DATA,
      Permission.CREATE_BIDDING,
      Permission.EDIT_BIDDING,
      Permission.DELETE_BIDDING,
      Permission.PUBLISH_BIDDING,
      Permission.CANCEL_BIDDING,
      Permission.CREATE_CONTRACT,
      Permission.EDIT_CONTRACT,
      Permission.SIGN_CONTRACT,
      Permission.TERMINATE_CONTRACT,
      Permission.GENERATE_REPORTS,
      Permission.EXPORT_DATA,
    ];

    for (const publicEntity of publicEntityUsers) {
      for (const permission of publicEntityPermissions) {
        await prisma.userPermission.upsert({
          where: {
            userId_permission: {
              userId: publicEntity.id,
              permission,
            },
          },
          update: {},
          create: {
            userId: publicEntity.id,
            permission,
            isActive: true,
          },
        });
      }
    }

    // Permissões para AUDITORES
    const auditorPermissions: Permission[] = [
      Permission.READ_PUBLIC_DATA,
      Permission.READ_PRIVATE_DATA,
      Permission.VIEW_AUDIT_LOGS,
      Permission.GENERATE_REPORTS,
      Permission.EXPORT_DATA,
    ];

    for (const auditor of auditorUsers) {
      for (const permission of auditorPermissions) {
        await prisma.userPermission.upsert({
          where: {
            userId_permission: {
              userId: auditor.id,
              permission,
            },
          },
          update: {},
          create: {
            userId: auditor.id,
            permission,
            isActive: true,
          },
        });
      }
    }

    // Permissões para CIDADÃOS
    const citizenPermissions: Permission[] = [
      Permission.READ_PUBLIC_DATA,
    ];

    for (const citizen of citizenUsers) {
      for (const permission of citizenPermissions) {
        await prisma.userPermission.upsert({
          where: {
            userId_permission: {
              userId: citizen.id,
              permission,
            },
          },
          update: {},
          create: {
            userId: citizen.id,
            permission,
            isActive: true,
          },
        });
      }
    }

    console.log('✅ User permissions seeded successfully!');

    // Log das permissões criadas
    console.log('\n📋 PERMISSÕES ATRIBUÍDAS:');
    console.log('========================');
    console.log(`👑 ADMINISTRADORES: ${adminPermissions.length} permissões (acesso total)`);
    console.log(`🏛️  COMPRADORES: ${publicEntityPermissions.length} permissões (gestão de licitações)`);
    console.log(`🏢 FORNECEDORES: ${supplierPermissions.length} permissões (participação em licitações)`);
    console.log(`🔍 AUDITORES: ${auditorPermissions.length} permissões (auditoria e relatórios)`);
    console.log(`👤 CIDADÃOS: ${citizenPermissions.length} permissões (acesso público)`);
    console.log('========================');

  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
}
