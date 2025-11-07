const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configurações padrão do sistema
const defaultConfigs = [
  // Configurações Gerais
  {
    key: 'platform_name',
    value: 'LicitaBrasil Web',
    type: 'string',
    description: 'Nome da plataforma',
    isPublic: true
  },
  {
    key: 'platform_description',
    value: 'Plataforma de licitações públicas do Brasil',
    type: 'string',
    description: 'Descrição da plataforma',
    isPublic: true
  },
  {
    key: 'contact_email',
    value: 'contato@licitabrasilweb.com.br',
    type: 'string',
    description: 'Email de contato principal',
    isPublic: true
  },
  {
    key: 'support_phone',
    value: '(11) 3000-0000',
    type: 'string',
    description: 'Telefone de suporte',
    isPublic: true
  },

  // Configurações de Notificações
  {
    key: 'email_notifications',
    value: 'true',
    type: 'boolean',
    description: 'Habilitar notificações por email',
    isPublic: true
  },
  {
    key: 'sms_notifications',
    value: 'false',
    type: 'boolean',
    description: 'Habilitar notificações por SMS',
    isPublic: true
  },
  {
    key: 'push_notifications',
    value: 'true',
    type: 'boolean',
    description: 'Habilitar notificações push',
    isPublic: true
  },
  {
    key: 'notification_frequency',
    value: 'daily',
    type: 'string',
    description: 'Frequência das notificações (immediate, daily, weekly)',
    isPublic: true
  },

  // Configurações de Licitações
  {
    key: 'bidding_auto_approval',
    value: 'false',
    type: 'boolean',
    description: 'Aprovação automática de licitações',
    isPublic: true
  },
  {
    key: 'min_bidding_duration',
    value: '5',
    type: 'number',
    description: 'Duração mínima de licitação (dias)',
    isPublic: true
  },
  {
    key: 'max_bidding_duration',
    value: '90',
    type: 'number',
    description: 'Duração máxima de licitação (dias)',
    isPublic: true
  },
  {
    key: 'proposal_deadline_hours',
    value: '24',
    type: 'number',
    description: 'Prazo para envio de propostas (horas antes do fechamento)',
    isPublic: true
  },

  // Configurações de Usuários
  {
    key: 'user_auto_approval',
    value: 'false',
    type: 'boolean',
    description: 'Aprovação automática de usuários',
    isPublic: true
  },
  {
    key: 'max_login_attempts',
    value: '5',
    type: 'number',
    description: 'Máximo de tentativas de login',
    isPublic: true
  },
  {
    key: 'session_timeout',
    value: '1800',
    type: 'number',
    description: 'Timeout de sessão (segundos)',
    isPublic: true
  },
  {
    key: 'password_min_length',
    value: '8',
    type: 'number',
    description: 'Comprimento mínimo da senha',
    isPublic: true
  },

  // Configurações de Segurança
  {
    key: 'two_factor_auth',
    value: 'false',
    type: 'boolean',
    description: 'Habilitar autenticação de dois fatores',
    isPublic: true
  },
  {
    key: 'password_complexity',
    value: 'medium',
    type: 'string',
    description: 'Nível de complexidade da senha (low, medium, high)',
    isPublic: true
  },
  {
    key: 'audit_log_retention',
    value: '365',
    type: 'number',
    description: 'Retenção de logs de auditoria (dias)',
    isPublic: true
  },
  {
    key: 'ip_whitelist',
    value: '[]',
    type: 'json',
    description: 'Lista de IPs permitidos (JSON array)',
    isPublic: true
  },

  // Configurações de Integração
  {
    key: 'api_rate_limit',
    value: '1000',
    type: 'number',
    description: 'Limite de requisições por hora',
    isPublic: true
  },
  {
    key: 'webhook_enabled',
    value: 'false',
    type: 'boolean',
    description: 'Habilitar webhooks',
    isPublic: true
  },
  {
    key: 'external_auth',
    value: 'false',
    type: 'boolean',
    description: 'Habilitar autenticação externa',
    isPublic: true
  },
  {
    key: 'backup_frequency',
    value: 'daily',
    type: 'string',
    description: 'Frequência de backup (daily, weekly, monthly)',
    isPublic: true
  }
];

async function seedSystemConfig() {
  try {
    console.log('🌱 Iniciando seed das configurações do sistema...');

    // Verificar se já existem configurações
    const existingConfigs = await prisma.systemConfig.count();
    
    if (existingConfigs > 0) {
      console.log(`⚠️ Já existem ${existingConfigs} configurações. Atualizando apenas as que não existem...`);
    }

    let created = 0;
    let updated = 0;

    for (const config of defaultConfigs) {
      const result = await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: {
          // Não atualizar se já existe, apenas garantir que existe
        },
        create: config
      });

      if (result.createdAt === result.updatedAt) {
        created++;
        console.log(`✅ Criada configuração: ${config.key}`);
      } else {
        updated++;
        console.log(`🔄 Configuração já existe: ${config.key}`);
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`  - Configurações criadas: ${created}`);
    console.log(`  - Configurações existentes: ${updated}`);
    console.log(`  - Total: ${created + updated}`);

    // Verificar resultado final
    const totalConfigs = await prisma.systemConfig.count();
    console.log(`\n✅ Total de configurações no banco: ${totalConfigs}`);

  } catch (error) {
    console.error('❌ Erro ao fazer seed das configurações:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedSystemConfig()
    .then(() => {
      console.log('🎉 Seed das configurações concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no seed:', error);
      process.exit(1);
    });
}

module.exports = { seedSystemConfig, defaultConfigs };
