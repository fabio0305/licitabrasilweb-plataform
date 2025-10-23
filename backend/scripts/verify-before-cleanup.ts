#!/usr/bin/env ts-node

/**
 * Script de Verificação Pré-Limpeza - LicitaBrasil Web Platform
 * 
 * Este script verifica o estado atual do banco de dados e gera um relatório
 * detalhado antes de executar a limpeza de dados.
 * 
 * Funcionalidades:
 * - Verifica a existência de usuários administradores
 * - Conta todos os registros que serão afetados
 * - Identifica possíveis problemas de integridade
 * - Gera relatório detalhado para revisão
 */

import { PrismaClient } from '@prisma/client';
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

interface DatabaseReport {
  timestamp: string;
  adminUsers: any[];
  nonAdminUsers: any[];
  dataToDelete: {
    users: number;
    suppliers: number;
    publicEntities: number;
    citizens: number;
    biddings: number;
    proposals: number;
    contracts: number;
    documents: number;
    sessions: number;
    auditLogs: number;
    notifications: number;
    permissions: number;
  };
  integrityChecks: {
    hasAdmins: boolean;
    orphanedRecords: any[];
    foreignKeyIssues: any[];
  };
}

// Função para verificar usuários administradores
async function checkAdminUsers() {
  console.log('🔍 Verificando usuários administradores...');
  
  const adminUsers = await prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      createdAt: true,
      lastLoginAt: true
    },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`✅ Encontrados ${adminUsers.length} usuário(s) administrador(es)`);
  
  if (adminUsers.length === 0) {
    console.log('⚠️  ATENÇÃO: Nenhum usuário administrador encontrado!');
    console.log('   A limpeza não pode ser executada sem pelo menos um administrador.');
  }
  
  return adminUsers;
}

// Função para verificar usuários não-admin
async function checkNonAdminUsers() {
  console.log('🔍 Verificando usuários não-administradores...');
  
  const nonAdminUsers = await prisma.user.findMany({
    where: { role: { not: UserRole.ADMIN } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true
    },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]
  });
  
  console.log(`📊 Encontrados ${nonAdminUsers.length} usuário(s) não-administrador(es)`);
  
  // Agrupar por role
  const byRole = nonAdminUsers.reduce((acc: Record<string, number>, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(byRole).forEach(([role, count]) => {
    console.log(`   ${role}: ${count} usuário(s)`);
  });
  
  return nonAdminUsers;
}

// Função para contar dados que serão deletados
async function countDataToDelete(nonAdminUserIds: string[]) {
  console.log('📊 Contando dados que serão removidos...');
  
  if (nonAdminUserIds.length === 0) {
    return {
      users: 0,
      suppliers: 0,
      publicEntities: 0,
      citizens: 0,
      biddings: 0,
      proposals: 0,
      contracts: 0,
      documents: 0,
      sessions: 0,
      auditLogs: 0,
      notifications: 0,
      permissions: 0
    };
  }
  
  const [
    suppliers,
    publicEntities,
    citizens,
    biddings,
    proposals,
    contracts,
    documents,
    sessions,
    auditLogs,
    notifications,
    permissions
  ] = await Promise.all([
    prisma.supplier.count({
      where: { userId: { in: nonAdminUserIds } }
    }),
    prisma.publicEntity.count({
      where: { userId: { in: nonAdminUserIds } }
    }),
    prisma.citizen.count({
      where: { userId: { in: nonAdminUserIds } }
    }),
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
          { uploadedBy: { in: nonAdminUserIds } },
          { 
            supplier: { 
              userId: { in: nonAdminUserIds } 
            } 
          },
          { 
            publicEntity: { 
              userId: { in: nonAdminUserIds } 
            } 
          }
        ]
      }
    }),
    prisma.userSession.count({
      where: { userId: { in: nonAdminUserIds } }
    }),
    prisma.auditLog.count({
      where: { userId: { in: nonAdminUserIds } }
    }),
    prisma.notification.count({
      where: { userId: { in: nonAdminUserIds } }
    }),
    prisma.userPermission.count({
      where: { userId: { in: nonAdminUserIds } }
    })
  ]);
  
  return {
    users: nonAdminUserIds.length,
    suppliers,
    publicEntities,
    citizens,
    biddings,
    proposals,
    contracts,
    documents,
    sessions,
    auditLogs,
    notifications,
    permissions
  };
}

// Função para verificar integridade
async function checkIntegrity(nonAdminUserIds: string[]) {
  console.log('🔍 Verificando integridade dos dados...');
  
  const issues = [];
  
  // Verificar registros órfãos
  const orphanedSuppliers = await prisma.supplier.findMany({
    where: {
      user: null
    },
    select: { id: true, companyName: true }
  });
  
  if (orphanedSuppliers.length > 0) {
    issues.push({
      type: 'orphaned_suppliers',
      count: orphanedSuppliers.length,
      description: 'Fornecedores sem usuário associado'
    });
  }
  
  const orphanedPublicEntities = await prisma.publicEntity.findMany({
    where: {
      user: null
    },
    select: { id: true, name: true }
  });
  
  if (orphanedPublicEntities.length > 0) {
    issues.push({
      type: 'orphaned_public_entities',
      count: orphanedPublicEntities.length,
      description: 'Órgãos públicos sem usuário associado'
    });
  }
  
  // Verificar contratos ativos que serão afetados
  const activeContracts = await prisma.contract.count({
    where: {
      status: 'ACTIVE',
      OR: [
        { supplier: { userId: { in: nonAdminUserIds } } },
        { publicEntity: { userId: { in: nonAdminUserIds } } }
      ]
    }
  });
  
  if (activeContracts > 0) {
    issues.push({
      type: 'active_contracts',
      count: activeContracts,
      description: 'Contratos ativos que serão removidos'
    });
  }
  
  // Verificar licitações abertas
  const openBiddings = await prisma.bidding.count({
    where: {
      status: { in: ['OPEN', 'PUBLISHED'] },
      publicEntity: {
        userId: { in: nonAdminUserIds }
      }
    }
  });
  
  if (openBiddings > 0) {
    issues.push({
      type: 'open_biddings',
      count: openBiddings,
      description: 'Licitações abertas que serão removidas'
    });
  }
  
  return issues;
}

// Função para gerar relatório
function generateReport(data: DatabaseReport): string {
  const report = `
# RELATÓRIO DE VERIFICAÇÃO PRÉ-LIMPEZA
## LicitaBrasil Web Platform

**Data/Hora:** ${data.timestamp}

## 👑 USUÁRIOS ADMINISTRADORES (SERÃO PRESERVADOS)

${data.adminUsers.length === 0 ? 
  '⚠️  **ATENÇÃO: NENHUM ADMINISTRADOR ENCONTRADO!**\n   A limpeza não pode ser executada sem pelo menos um administrador.' :
  data.adminUsers.map((admin, i) => 
    `${i + 1}. **${admin.firstName} ${admin.lastName}**
   - Email: ${admin.email}
   - Status: ${admin.status}
   - Criado em: ${new Date(admin.createdAt).toLocaleString('pt-BR')}
   - Último login: ${admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString('pt-BR') : 'Nunca'}`
  ).join('\n\n')
}

## 👥 USUÁRIOS NÃO-ADMINISTRADORES (SERÃO REMOVIDOS)

**Total:** ${data.nonAdminUsers.length} usuário(s)

${data.nonAdminUsers.length === 0 ? 
  '✅ Nenhum usuário não-administrador encontrado.' :
  data.nonAdminUsers.slice(0, 10).map((user, i) => 
    `${i + 1}. **${user.firstName} ${user.lastName}** (${user.role})
   - Email: ${user.email}
   - Status: ${user.status}
   - Criado em: ${new Date(user.createdAt).toLocaleString('pt-BR')}`
  ).join('\n\n') + 
  (data.nonAdminUsers.length > 10 ? `\n\n... e mais ${data.nonAdminUsers.length - 10} usuário(s)` : '')
}

## 📊 DADOS QUE SERÃO REMOVIDOS

| Tipo de Dado | Quantidade |
|---------------|------------|
| Usuários não-admin | ${data.dataToDelete.users} |
| Fornecedores | ${data.dataToDelete.suppliers} |
| Órgãos públicos | ${data.dataToDelete.publicEntities} |
| Cidadãos | ${data.dataToDelete.citizens} |
| Licitações | ${data.dataToDelete.biddings} |
| Propostas | ${data.dataToDelete.proposals} |
| Contratos | ${data.dataToDelete.contracts} |
| Documentos | ${data.dataToDelete.documents} |
| Sessões | ${data.dataToDelete.sessions} |
| Logs de auditoria | ${data.dataToDelete.auditLogs} |
| Notificações | ${data.dataToDelete.notifications} |
| Permissões | ${data.dataToDelete.permissions} |

## 🔍 VERIFICAÇÕES DE INTEGRIDADE

${data.integrityChecks.hasAdmins ? 
  '✅ Usuários administradores encontrados' : 
  '❌ **CRÍTICO:** Nenhum usuário administrador encontrado!'
}

${data.integrityChecks.orphanedRecords.length === 0 && data.integrityChecks.foreignKeyIssues.length === 0 ?
  '✅ Nenhum problema de integridade detectado' :
  '⚠️  **Problemas detectados:**\n' + 
  [...data.integrityChecks.orphanedRecords, ...data.integrityChecks.foreignKeyIssues]
    .map(issue => `   - ${issue.description}: ${issue.count} registro(s)`)
    .join('\n')
}

## 📋 RECOMENDAÇÕES

${!data.integrityChecks.hasAdmins ? 
  '🚨 **BLOQUEADOR:** Crie pelo menos um usuário administrador antes de executar a limpeza.\n' : ''
}

${data.dataToDelete.users === 0 ? 
  '✅ **Nenhuma ação necessária:** O banco já contém apenas administradores.\n' :
  `⚠️  **${data.dataToDelete.users} usuário(s) e todos os dados relacionados serão PERMANENTEMENTE removidos.**\n`
}

1. **Backup obrigatório:** Crie um backup completo do banco antes de prosseguir
2. **Teste em ambiente de desenvolvimento:** Execute primeiro em ambiente de teste
3. **Verificação pós-limpeza:** Valide a integridade após a execução
4. **Plano de rollback:** Tenha um plano para restaurar o backup se necessário

## 🔧 COMANDOS PARA EXECUÇÃO

### Criar Backup
\`\`\`bash
docker-compose exec -T postgres pg_dump -U licitabrasil licita_brasil_web > backup-pre-cleanup-$(date +%Y%m%d_%H%M%S).sql
\`\`\`

### Executar Limpeza (TypeScript)
\`\`\`bash
cd scripts
npx ts-node cleanup-user-data.ts
\`\`\`

### Executar Limpeza (SQL)
\`\`\`bash
docker-compose exec -T postgres psql -U licitabrasil -d licita_brasil_web -f cleanup-user-data.sql
\`\`\`

---
**Gerado em:** ${data.timestamp}
`;

  return report;
}

// Função principal
async function main() {
  console.log('🔍 VERIFICAÇÃO PRÉ-LIMPEZA - LICITABRASIL WEB PLATFORM');
  console.log('═'.repeat(60));
  
  try {
    const timestamp = new Date().toISOString();
    
    // Verificar administradores
    const adminUsers = await checkAdminUsers();
    
    // Verificar usuários não-admin
    const nonAdminUsers = await checkNonAdminUsers();
    const nonAdminUserIds = nonAdminUsers.map((user: any) => user.id);
    
    // Contar dados para deletar
    const dataToDelete = await countDataToDelete(nonAdminUserIds);
    
    // Verificar integridade
    const integrityIssues = await checkIntegrity(nonAdminUserIds);
    
    // Montar relatório
    const report: DatabaseReport = {
      timestamp,
      adminUsers,
      nonAdminUsers,
      dataToDelete,
      integrityChecks: {
        hasAdmins: adminUsers.length > 0,
        orphanedRecords: integrityIssues.filter(i => i.type.includes('orphaned')),
        foreignKeyIssues: integrityIssues.filter(i => !i.type.includes('orphaned'))
      }
    };
    
    // Gerar relatório em markdown
    const reportContent = generateReport(report);
    const reportFile = path.join(process.cwd(), `cleanup-verification-report-${new Date().toISOString().slice(0, 10)}.md`);
    
    fs.writeFileSync(reportFile, reportContent);
    
    console.log('\n✅ Verificação concluída!');
    console.log(`📄 Relatório salvo em: ${reportFile}`);
    
    // Exibir resumo no console
    console.log('\n📊 RESUMO:');
    console.log('═'.repeat(40));
    console.log(`👑 Administradores: ${adminUsers.length}`);
    console.log(`👥 Usuários não-admin: ${nonAdminUsers.length}`);
    console.log(`📋 Total de registros a remover: ${Object.values(dataToDelete).reduce((a, b) => a + b, 0)}`);
    console.log(`⚠️  Problemas de integridade: ${integrityIssues.length}`);
    
    if (!report.integrityChecks.hasAdmins) {
      console.log('\n🚨 ATENÇÃO: Nenhum administrador encontrado!');
      console.log('   Crie pelo menos um usuário administrador antes de executar a limpeza.');
    } else if (dataToDelete.users === 0) {
      console.log('\n✅ O banco já contém apenas administradores.');
    } else {
      console.log('\n⚠️  Limpeza necessária. Revise o relatório antes de prosseguir.');
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante a verificação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
if (require.main === module) {
  main().catch(console.error);
}
