#!/bin/bash

# Script para configurar as configurações padrão do sistema via API

echo "🔑 Obtendo token de autenticação..."
TOKEN=$(curl -s -X POST https://api.licitabrasilweb.com.br/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@licitabrasilweb.com.br", "password": "Test123!@#"}' | \
  jq -r '.data.tokens.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Erro ao obter token de autenticação"
  exit 1
fi

echo "✅ Token obtido com sucesso"

echo "🌱 Configurando configurações do sistema..."

# Configurações em formato JSON (formato esperado pelo backend)
CONFIG_DATA='{
  "configs": {
    "platform_name": {
      "value": "LicitaBrasil Web",
      "type": "string",
      "description": "Nome da plataforma"
    },
    "platform_description": {
      "value": "Plataforma de licitações públicas do Brasil",
      "type": "string",
      "description": "Descrição da plataforma"
    },
    "contact_email": {
      "value": "contato@licitabrasilweb.com.br",
      "type": "string",
      "description": "Email de contato"
    },
    "support_phone": {
      "value": "+55 11 99999-9999",
      "type": "string",
      "description": "Telefone de suporte"
    },
    "email_notifications": {
      "value": true,
      "type": "boolean",
      "description": "Habilitar notificações por email"
    },
    "sms_notifications": {
      "value": false,
      "type": "boolean",
      "description": "Habilitar notificações por SMS"
    },
    "push_notifications": {
      "value": true,
      "type": "boolean",
      "description": "Habilitar notificações push"
    },
    "notification_frequency": {
      "value": "daily",
      "type": "string",
      "description": "Frequência de notificações"
    },
    "bidding_auto_approval": {
      "value": false,
      "type": "boolean",
      "description": "Aprovação automática de licitações"
    },
    "min_bidding_duration": {
      "value": 7,
      "type": "number",
      "description": "Duração mínima de licitação (dias)"
    },
    "max_bidding_duration": {
      "value": 90,
      "type": "number",
      "description": "Duração máxima de licitação (dias)"
    },
    "proposal_deadline_hours": {
      "value": 24,
      "type": "number",
      "description": "Prazo para envio de propostas (horas)"
    },
    "user_auto_approval": {
      "value": false,
      "type": "boolean",
      "description": "Aprovação automática de usuários"
    },
    "max_login_attempts": {
      "value": 5,
      "type": "number",
      "description": "Máximo de tentativas de login"
    },
    "session_timeout": {
      "value": 1440,
      "type": "number",
      "description": "Timeout de sessão (minutos)"
    },
    "password_min_length": {
      "value": 8,
      "type": "number",
      "description": "Comprimento mínimo da senha"
    },
    "two_factor_auth": {
      "value": false,
      "type": "boolean",
      "description": "Habilitar autenticação de dois fatores"
    },
    "password_complexity": {
      "value": true,
      "type": "boolean",
      "description": "Exigir complexidade de senha"
    },
    "audit_log_retention": {
      "value": 365,
      "type": "number",
      "description": "Retenção de logs de auditoria (dias)"
    },
    "ip_whitelist": {
      "value": [],
      "type": "json",
      "description": "Lista de IPs permitidos"
    },
    "api_rate_limit": {
      "value": 1000,
      "type": "number",
      "description": "Limite de requisições por hora"
    },
    "webhook_enabled": {
      "value": false,
      "type": "boolean",
      "description": "Habilitar webhooks"
    },
    "external_auth": {
      "value": false,
      "type": "boolean",
      "description": "Habilitar autenticação externa"
    },
    "backup_frequency": {
      "value": "daily",
      "type": "string",
      "description": "Frequência de backup"
    }
  }
}'

echo "📤 Enviando configurações para a API..."

RESPONSE=$(curl -s -X PUT https://api.licitabrasilweb.com.br/api/v1/admin/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$CONFIG_DATA")

echo "📥 Resposta da API:"
echo "$RESPONSE" | jq '.'

# Verificar se foi bem-sucedido
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  echo "🎉 Configurações criadas com sucesso!"
  
  echo "🔍 Verificando configurações salvas..."
  curl -s -H "Authorization: Bearer $TOKEN" \
    https://api.licitabrasilweb.com.br/api/v1/admin/config | jq '.'
else
  echo "❌ Erro ao criar configurações"
  exit 1
fi
