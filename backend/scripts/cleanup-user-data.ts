#!/usr/bin/env ts-node

/**
 * Script de Limpeza de Dados de Usuários - LicitaBrasil Web Platform
 * 
 * Este script remove todos os perfis e registros de usuários não-administrativos
 * do banco de dados de produção, preservando apenas dados de administradores.
 * 
 * ATENÇÃO: Este script é DESTRUTIVO e deve ser usado com extrema cautela!
 * 
 * Requisitos:
 * - Backup do banco de dados deve ser criado antes da execução
 * - Apenas usuários com role ADMIN serão preservados
 * - Todos os dados relacionados aos usuários não-admin serão removidos
 */

import { PrismaClient } from '@prisma/client';
import { createInterface } from 'readline';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Enum UserRole (caso não esteja disponível)
enum UserRole {
  ADMIN = 'ADMIN',
  SUPPLIER = 'SUPPLIER',
  PUBLIC_ENTITY = 'PUBLIC_ENTITY',
  AUDITOR = 'AUDITOR',
  CITIZEN = 'CITIZEN'
}

const prisma = new PrismaClient();
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

interface CleanupStats {
  usersToDelete: number;
  suppliersToDelete: number;
  publicEntitiesToDelete: number;
  citizensToDelete: number;
  biddingsToDelete: number;
  proposalsToDelete: number;
  contractsToDelete: number;
  documentsToDelete: number;
  sessionsToDelete: number;
  auditLogsToDelete: number;
  notificationsToDelete: number;
  permissionsToDelete: number;
}

// Função para fazer pergunta ao usuário
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Função para criar backup do banco de dados
async function createDatabaseBackup(): Promise<string> {
  console.log('\n🔄 Criando backup do banco de dados...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = path.join(backupDir, `cleanup-backup-${timestamp}.sql`);
  
  // Criar diretório de backup se não existir
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  try {
    // Usar docker-compose para fazer backup
    const command = `docker-compose exec -T postgres pg_dump -U licitabrasil licita_brasil_web > "${backupFile}"`;
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ Backup criado com sucesso: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw new Error('Falha ao criar backup do banco de dados');
  }
}

// Função para contar registros que serão afetados
async function getCleanupStats(): Promise<CleanupStats> {
  console.log('\n📊 Analisando dados para limpeza...');
  
  // Buscar usuários não-admin
  const nonAdminUsers = await prisma.user.findMany({
    where: {
      role: { not: UserRole.ADMIN }
    },
    include: {
      supplier: true,
      publicEntity: true,
      citizen: true,
      sessions: true,
      auditLogs: true,
      permissions: true
    }
  });
  
  const nonAdminUserIds = nonAdminUsers.map(user => user.id);
  
  // Contar registros relacionados
  const [
    biddingsCount,
    proposalsCount,
    contractsCount,
    documentsCount,
    notificationsCount
  ] = await Promise.all([
    prisma.bidding.count({
      where: {
        publicEntity: {
          userId: { in: nonAdminUserIds }
        }
      }
    }),
    prisma.proposal.count({
      where: {
        supplier: {
          userId: { in: nonAdminUserIds }
        }
      }
    }),
    prisma.contract.count({
      where: {
        OR: [
          { supplier: { userId: { in: nonAdminUserIds } } },
          { publicEntity: { userId: { in: nonAdminUserIds } } }
        ]
      }
    }),
    prisma.document.count({
      where: {
        OR: [
          { supplierId: { in: nonAdminUsers.filter(u => u.supplier).map(u => u.supplier!.id) } },
          { publicEntityId: { in: nonAdminUsers.filter(u => u.publicEntity).map(u => u.publicEntity!.id) } }
        ]
      }
    }),
    prisma.notification.count({
      where: {
        userId: { in: nonAdminUserIds }
      }
    })
  ]);
  
  return {
    usersToDelete: nonAdminUsers.length,
    suppliersToDelete: nonAdminUsers.filter(u => u.supplier).length,
    publicEntitiesToDelete: nonAdminUsers.filter(u => u.publicEntity).length,
    citizensToDelete: nonAdminUsers.filter(u => u.citizen).length,
    biddingsToDelete: biddingsCount,
    proposalsToDelete: proposalsCount,
    contractsToDelete: contractsCount,
    documentsToDelete: documentsCount,
    sessionsToDelete: nonAdminUsers.reduce((sum, user) => sum + user.sessions.length, 0),
    auditLogsToDelete: nonAdminUsers.reduce((sum, user) => sum + user.auditLogs.length, 0),
    notificationsToDelete: notificationsCount,
    permissionsToDelete: nonAdminUsers.reduce((sum, user) => sum + user.permissions.length, 0)
  };
}

// Função para exibir estatísticas
function displayStats(stats: CleanupStats) {
  console.log('\n📋 RESUMO DOS DADOS QUE SERÃO REMOVIDOS:');
  console.log('═'.repeat(50));
  console.log(`👥 Usuários não-admin: ${stats.usersToDelete}`);
  console.log(`🏢 Fornecedores: ${stats.suppliersToDelete}`);
  console.log(`🏛️  Órgãos públicos: ${stats.publicEntitiesToDelete}`);
  console.log(`👤 Cidadãos: ${stats.citizensToDelete}`);
  console.log(`📋 Licitações: ${stats.biddingsToDelete}`);
  console.log(`📄 Propostas: ${stats.proposalsToDelete}`);
  console.log(`📝 Contratos: ${stats.contractsToDelete}`);
  console.log(`📎 Documentos: ${stats.documentsToDelete}`);
  console.log(`🔐 Sessões: ${stats.sessionsToDelete}`);
  console.log(`📊 Logs de auditoria: ${stats.auditLogsToDelete}`);
  console.log(`🔔 Notificações: ${stats.notificationsToDelete}`);
  console.log(`🔑 Permissões: ${stats.permissionsToDelete}`);
  console.log('═'.repeat(50));
}

// Função para verificar administradores
async function checkAdminUsers() {
  const adminUsers = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      createdAt: true
    }
  });
  
  console.log('\n👑 USUÁRIOS ADMINISTRADORES QUE SERÃO PRESERVADOS:');
  console.log('═'.repeat(60));
  
  if (adminUsers.length === 0) {
    console.log('⚠️  ATENÇÃO: Nenhum usuário administrador encontrado!');
    console.log('   Isso pode deixar o sistema sem acesso administrativo.');
    return false;
  }
  
  adminUsers.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Criado em: ${admin.createdAt.toLocaleString('pt-BR')}`);
    console.log('');
  });
  
  return true;
}

// Função principal de limpeza
async function performCleanup(): Promise<void> {
  console.log('\n🧹 Iniciando limpeza de dados...');

  try {
    // Usar transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      // 1. Buscar IDs de usuários não-admin
      const nonAdminUsers = await tx.user.findMany({
        where: { role: { not: UserRole.ADMIN } },
        select: { id: true },
        include: {
          supplier: { select: { id: true } },
          publicEntity: { select: { id: true } },
          citizen: { select: { id: true } }
        }
      });

      const nonAdminUserIds = nonAdminUsers.map(user => user.id);
      const supplierIds = nonAdminUsers.filter(u => u.supplier).map(u => u.supplier!.id);
      const publicEntityIds = nonAdminUsers.filter(u => u.publicEntity).map(u => u.publicEntity!.id);

      if (nonAdminUserIds.length === 0) {
        console.log('ℹ️  Nenhum usuário não-admin encontrado para limpeza.');
        return;
      }

      console.log(`🔄 Removendo dados de ${nonAdminUserIds.length} usuários não-admin...`);

      // 2. Remover dados em ordem específica (respeitando foreign keys)

      // 2.1. Remover itens de propostas
      console.log('   Removendo itens de propostas...');
      await tx.proposalItem.deleteMany({
        where: {
          proposal: {
            supplier: { userId: { in: nonAdminUserIds } }
          }
        }
      });

      // 2.2. Remover contratos
      console.log('   Removendo contratos...');
      await tx.contract.deleteMany({
        where: {
          OR: [
            { supplier: { userId: { in: nonAdminUserIds } } },
            { publicEntity: { userId: { in: nonAdminUserIds } } }
          ]
        }
      });

      // 2.3. Remover propostas
      console.log('   Removendo propostas...');
      await tx.proposal.deleteMany({
        where: {
          supplier: { userId: { in: nonAdminUserIds } }
        }
      });

      // 2.4. Remover categorias de licitações
      console.log('   Removendo categorias de licitações...');
      await tx.biddingCategory.deleteMany({
        where: {
          bidding: {
            publicEntity: { userId: { in: nonAdminUserIds } }
          }
        }
      });

      // 2.5. Remover licitações
      console.log('   Removendo licitações...');
      await tx.bidding.deleteMany({
        where: {
          publicEntity: { userId: { in: nonAdminUserIds } }
        }
      });

      // 2.6. Remover documentos
      console.log('   Removendo documentos...');
      await tx.document.deleteMany({
        where: {
          OR: [
            { supplierId: { in: supplierIds } },
            { publicEntityId: { in: publicEntityIds } }
          ]
        }
      });

      // 2.7. Remover categorias de fornecedores
      console.log('   Removendo categorias de fornecedores...');
      await tx.supplierCategory.deleteMany({
        where: {
          supplier: { userId: { in: nonAdminUserIds } }
        }
      });

      // 2.8. Remover sessões de usuário
      console.log('   Removendo sessões de usuário...');
      await tx.userSession.deleteMany({
        where: { userId: { in: nonAdminUserIds } }
      });

      // 2.9. Remover permissões de usuário
      console.log('   Removendo permissões de usuário...');
      await tx.userPermission.deleteMany({
        where: { userId: { in: nonAdminUserIds } }
      });

      // 2.10. Remover logs de auditoria
      console.log('   Removendo logs de auditoria...');
      await tx.auditLog.deleteMany({
        where: { userId: { in: nonAdminUserIds } }
      });

      // 2.11. Remover notificações
      console.log('   Removendo notificações...');
      await tx.notification.deleteMany({
        where: { userId: { in: nonAdminUserIds } }
      });

      // 2.12. Remover perfis específicos
      console.log('   Removendo perfis de fornecedores...');
      await tx.supplier.deleteMany({
        where: { userId: { in: nonAdminUserIds } }
      });

      console.log('   Removendo perfis de órgãos públicos...');
      await tx.publicEntity.deleteMany({
        where: { userId: { in: nonAdminUserIds } }
      });

      console.log('   Removendo perfis de cidadãos...');
      await tx.citizen.deleteMany({
        where: { userId: { in: nonAdminUserIds } }
      });

      // 2.13. Finalmente, remover usuários não-admin
      console.log('   Removendo usuários não-admin...');
      await tx.user.deleteMany({
        where: { id: { in: nonAdminUserIds } }
      });

      console.log('✅ Limpeza concluída com sucesso!');
    });

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

// Função para verificar integridade após limpeza
async function verifyCleanup(): Promise<void> {
  console.log('\n🔍 Verificando integridade após limpeza...');

  const [
    totalUsers,
    adminUsers,
    suppliers,
    publicEntities,
    citizens,
    biddings,
    proposals,
    contracts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.supplier.count(),
    prisma.publicEntity.count(),
    prisma.citizen.count(),
    prisma.bidding.count(),
    prisma.proposal.count(),
    prisma.contract.count()
  ]);

  console.log('\n📊 ESTADO FINAL DO BANCO DE DADOS:');
  console.log('═'.repeat(40));
  console.log(`👥 Total de usuários: ${totalUsers}`);
  console.log(`👑 Usuários admin: ${adminUsers}`);
  console.log(`🏢 Fornecedores: ${suppliers}`);
  console.log(`🏛️  Órgãos públicos: ${publicEntities}`);
  console.log(`👤 Cidadãos: ${citizens}`);
  console.log(`📋 Licitações: ${biddings}`);
  console.log(`📄 Propostas: ${proposals}`);
  console.log(`📝 Contratos: ${contracts}`);
  console.log('═'.repeat(40));

  if (totalUsers === adminUsers && adminUsers > 0) {
    console.log('✅ Verificação bem-sucedida: Apenas usuários admin permanecem no sistema.');
  } else {
    console.log('⚠️  Atenção: Verificação indica possíveis inconsistências.');
  }
}

// Função principal
async function main() {
  console.log('🧹 SCRIPT DE LIMPEZA DE DADOS - LICITABRASIL WEB PLATFORM');
  console.log('═'.repeat(60));
  console.log('⚠️  ATENÇÃO: Este script é DESTRUTIVO e irreversível!');
  console.log('⚠️  Todos os dados de usuários não-admin serão PERMANENTEMENTE removidos!');
  console.log('⚠️  Certifique-se de ter um backup antes de continuar!');
  console.log('═'.repeat(60));

  try {
    // 1. Verificar administradores
    const hasAdmins = await checkAdminUsers();
    if (!hasAdmins) {
      console.log('\n❌ OPERAÇÃO CANCELADA: Nenhum administrador encontrado!');
      console.log('   Crie pelo menos um usuário administrador antes de executar a limpeza.');
      return;
    }

    // 2. Obter estatísticas
    const stats = await getCleanupStats();
    displayStats(stats);

    if (stats.usersToDelete === 0) {
      console.log('\n✅ Nenhum dado para limpeza. O banco já contém apenas administradores.');
      return;
    }

    // 3. Confirmações de segurança
    console.log('\n🔐 CONFIRMAÇÕES DE SEGURANÇA:');
    console.log('═'.repeat(40));

    const confirm1 = await question('1. Você criou um backup do banco de dados? (sim/não): ');
    if (confirm1.toLowerCase() !== 'sim') {
      console.log('\n❌ OPERAÇÃO CANCELADA: Crie um backup antes de continuar.');

      const createBackup = await question('Deseja criar um backup agora? (s/n): ');
      if (createBackup.toLowerCase() === 's') {
        await createDatabaseBackup();
        console.log('\n✅ Backup criado. Execute o script novamente para continuar.');
      }
      return;
    }

    const confirm2 = await question('2. Você confirma que deseja REMOVER PERMANENTEMENTE todos os dados não-admin? (sim/não): ');
    if (confirm2.toLowerCase() !== 'sim') {
      console.log('\n❌ OPERAÇÃO CANCELADA pelo usuário.');
      return;
    }

    const confirm3 = await question('3. Digite "CONFIRMAR LIMPEZA" para prosseguir: ');
    if (confirm3 !== 'CONFIRMAR LIMPEZA') {
      console.log('\n❌ OPERAÇÃO CANCELADA: Confirmação incorreta.');
      return;
    }

    // 4. Criar backup automático
    console.log('\n🔄 Criando backup de segurança...');
    const backupFile = await createDatabaseBackup();

    // 5. Executar limpeza
    await performCleanup();

    // 6. Verificar resultado
    await verifyCleanup();

    console.log('\n🎉 LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('═'.repeat(50));
    console.log(`📁 Backup salvo em: ${backupFile}`);
    console.log('✅ Apenas dados de administradores foram preservados.');
    console.log('✅ Todos os outros dados foram removidos com segurança.');
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO:', error);
    console.log('\n🔄 INSTRUÇÕES DE RECUPERAÇÃO:');
    console.log('1. Pare o sistema imediatamente');
    console.log('2. Restaure o backup do banco de dados');
    console.log('3. Verifique a integridade dos dados');
    console.log('4. Investigue a causa do erro antes de tentar novamente');
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Executar script
if (require.main === module) {
  main().catch(console.error);
}
