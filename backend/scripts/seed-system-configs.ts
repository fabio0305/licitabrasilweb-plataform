import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ConfigItem {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  isPublic: boolean;
}

const defaultConfigs: ConfigItem[] = [
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
    description: 'Email de contato',
    isPublic: true
  },
  {
    key: 'support_phone',
    value: '+55 11 99999-9999',
    type: 'string',
    description: 'Telefone de suporte',
    isPublic: true
  },

  // Notificações
  {
    key: 'email_notifications',
    value: true,
    type: 'boolean',
    description: 'Habilitar notificações por email',
    isPublic: false
  },
  {
    key: 'sms_notifications',
    value: false,
    type: 'boolean',
    description: 'Habilitar notificações por SMS',
    isPublic: false
  },
  {
    key: 'push_notifications',
    value: true,
    type: 'boolean',
    description: 'Habilitar notificações push',
    isPublic: false
  },
  {
    key: 'notification_frequency',
    value: 'daily',
    type: 'string',
    description: 'Frequência de notificações (immediate, daily, weekly)',
    isPublic: false
  },

  // Licitações
  {
    key: 'bidding_auto_approval',
    value: false,
    type: 'boolean',
    description: 'Aprovação automática de licitações',
    isPublic: false
  },
  {
    key: 'min_bidding_duration',
    value: 7,
    type: 'number',
    description: 'Duração mínima de licitação (dias)',
    isPublic: true
  },
  {
    key: 'max_bidding_duration',
    value: 90,
    type: 'number',
    description: 'Duração máxima de licitação (dias)',
    isPublic: true
  },
  {
    key: 'proposal_deadline_hours',
    value: 24,
    type: 'number',
    description: 'Prazo para envio de propostas (horas antes do fechamento)',
    isPublic: true
  },

  // Usuários
  {
    key: 'user_auto_approval',
    value: false,
    type: 'boolean',
    description: 'Aprovação automática de usuários',
    isPublic: false
  },
  {
    key: 'max_login_attempts',
    value: 5,
    type: 'number',
    description: 'Máximo de tentativas de login',
    isPublic: false
  },
  {
    key: 'session_timeout',
    value: 1440,
    type: 'number',
    description: 'Timeout de sessão (minutos)',
    isPublic: false
  },
  {
    key: 'password_min_length',
    value: 8,
    type: 'number',
    description: 'Comprimento mínimo da senha',
    isPublic: true
  },

  // Segurança
  {
    key: 'two_factor_auth',
    value: false,
    type: 'boolean',
    description: 'Habilitar autenticação de dois fatores',
    isPublic: false
  },
  {
    key: 'password_complexity',
    value: true,
    type: 'boolean',
    description: 'Exigir complexidade de senha',
    isPublic: true
  },
  {
    key: 'audit_log_retention',
    value: 365,
    type: 'number',
    description: 'Retenção de logs de auditoria (dias)',
    isPublic: false
  },
  {
    key: 'ip_whitelist',
    value: [],
    type: 'json',
    description: 'Lista de IPs permitidos (vazio = todos)',
    isPublic: false
  },

  // Integração
  {
    key: 'api_rate_limit',
    value: 1000,
    type: 'number',
    description: 'Limite de requisições por hora',
    isPublic: false
  },
  {
    key: 'webhook_enabled',
    value: false,
    type: 'boolean',
    description: 'Habilitar webhooks',
    isPublic: false
  },
  {
    key: 'external_auth',
    value: false,
    type: 'boolean',
    description: 'Habilitar autenticação externa',
    isPublic: false
  },
  {
    key: 'backup_frequency',
    value: 'daily',
    type: 'string',
    description: 'Frequência de backup (daily, weekly, monthly)',
    isPublic: false
  }
];

async function seedSystemConfigs() {
  console.log('🌱 Iniciando seed das configurações do sistema...');

  try {
    for (const config of defaultConfigs) {
      const stringValue = typeof config.value === 'string' 
        ? config.value 
        : JSON.stringify(config.value);

      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: {
          value: stringValue,
          type: config.type,
          description: config.description,
          isPublic: config.isPublic,
        },
        create: {
          key: config.key,
          value: stringValue,
          type: config.type,
          description: config.description,
          isPublic: config.isPublic,
        },
      });

      console.log(`✅ Configuração '${config.key}' criada/atualizada`);
    }

    console.log(`🎉 Seed concluído! ${defaultConfigs.length} configurações processadas.`);
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed se o arquivo for chamado diretamente
if (require.main === module) {
  seedSystemConfigs()
    .then(() => {
      console.log('✨ Seed das configurações concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha no seed das configurações:', error);
      process.exit(1);
    });
}

export { seedSystemConfigs };
