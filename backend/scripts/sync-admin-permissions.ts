import { PrismaClient, Permission, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// Todas as permissões que um administrador deve ter
const ADMIN_PERMISSIONS: Permission[] = [
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

/**
 * Sincroniza permissões para todos os administradores
 * Garante que todos os usuários com role ADMIN tenham todas as permissões necessárias
 */
async function syncAdminPermissions() {
  try {
    console.log('🔧 Iniciando sincronização de permissões de administradores...\n');

    // Buscar todos os administradores
    const adminUsers = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    if (adminUsers.length === 0) {
      console.log('⚠️  Nenhum administrador encontrado no sistema.');
      return;
    }

    console.log(`👥 Encontrados ${adminUsers.length} administrador(es):`);
    adminUsers.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.firstName} ${admin.lastName} (${admin.email}) - ${admin.status}`);
    });

    console.log(`\n🔑 Aplicando ${ADMIN_PERMISSIONS.length} permissões para cada administrador...\n`);

    // Aplicar permissões para cada administrador
    for (const admin of adminUsers) {
      console.log(`👤 Processando: ${admin.firstName} ${admin.lastName}`);
      
      let permissionsGranted = 0;
      let permissionsUpdated = 0;

      for (const permission of ADMIN_PERMISSIONS) {
        try {
          const result = await prisma.userPermission.upsert({
            where: {
              userId_permission: {
                userId: admin.id,
                permission,
              },
            },
            update: {
              isActive: true,
              grantedAt: new Date(),
            },
            create: {
              userId: admin.id,
              permission,
              grantedBy: admin.id, // Auto-concedido
              isActive: true,
            },
          });

          // Verificar se foi criado ou atualizado
          const wasCreated = result.grantedAt.getTime() === result.createdAt.getTime();
          if (wasCreated) {
            permissionsGranted++;
          } else {
            permissionsUpdated++;
          }

        } catch (error) {
          console.log(`   ❌ Erro ao processar permissão ${permission}: ${error}`);
        }
      }

      console.log(`   ✅ ${permissionsGranted} novas permissões concedidas, ${permissionsUpdated} atualizadas`);
    }

    // Verificação final
    console.log('\n📊 VERIFICAÇÃO FINAL:');
    console.log('='.repeat(50));

    for (const admin of adminUsers) {
      const activePermissions = await prisma.userPermission.count({
        where: {
          userId: admin.id,
          isActive: true,
        },
      });

      const status = activePermissions === ADMIN_PERMISSIONS.length ? '✅' : '⚠️';
      console.log(`${status} ${admin.firstName} ${admin.lastName}: ${activePermissions}/${ADMIN_PERMISSIONS.length} permissões ativas`);

      // Listar permissões faltantes se houver
      if (activePermissions < ADMIN_PERMISSIONS.length) {
        const userPermissions = await prisma.userPermission.findMany({
          where: {
            userId: admin.id,
            isActive: true,
          },
          select: { permission: true },
        });

        const userPermissionList = userPermissions.map(p => p.permission);
        const missingPermissions = ADMIN_PERMISSIONS.filter(p => !userPermissionList.includes(p));
        
        console.log(`   Permissões faltantes: ${missingPermissions.join(', ')}`);
      }
    }

    console.log('\n🎉 Sincronização de permissões concluída!');
    console.log('📝 Todos os administradores agora têm acesso completo à plataforma.');

  } catch (error) {
    console.error('\n❌ Erro durante a sincronização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Função para conceder permissões a um administrador específico
 */
export async function grantAdminPermissions(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new Error('Usuário não é administrador');
    }

    console.log(`🔑 Concedendo permissões de administrador para ${user.firstName} ${user.lastName}...`);

    for (const permission of ADMIN_PERMISSIONS) {
      await prisma.userPermission.upsert({
        where: {
          userId_permission: {
            userId,
            permission,
          },
        },
        update: {
          isActive: true,
          grantedAt: new Date(),
        },
        create: {
          userId,
          permission,
          grantedBy: userId, // Auto-concedido
          isActive: true,
        },
      });
    }

    console.log(`✅ Permissões concedidas com sucesso para ${user.firstName} ${user.lastName}`);
  } catch (error) {
    console.error('❌ Erro ao conceder permissões:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  syncAdminPermissions()
    .then(() => {
      console.log('\n✨ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Falha na execução do script:', error);
      process.exit(1);
    });
}

export default syncAdminPermissions;
