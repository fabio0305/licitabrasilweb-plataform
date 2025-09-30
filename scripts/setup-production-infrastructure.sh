#!/bin/bash

# Script de Configuração de Infraestrutura de Produção
# LicitaBrasil Web Platform - Configuração completa para produção

set -e

# Configurações
PRODUCTION_ENV_FILE=".env.production"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups/production"
LOG_FILE="./logs/production-setup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ ERROR: $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  INFO: $1${NC}" | tee -a $LOG_FILE
}

# Criar diretórios de produção
create_production_directories() {
    log "Criando estrutura de diretórios para produção..."
    
    # Diretórios principais
    mkdir -p logs/production
    mkdir -p backups/production/{database,uploads,configs}
    mkdir -p ssl/{certs,private}
    mkdir -p nginx/{conf.d,ssl}
    mkdir -p monitoring/{prometheus,grafana,alertmanager}
    mkdir -p data/{postgres,redis,elasticsearch}
    
    # Diretórios de aplicação
    mkdir -p backend/{uploads,logs,temp}
    mkdir -p frontend/dist
    
    # Diretórios de segurança
    mkdir -p security/{keys,certificates}
    
    log "Estrutura de diretórios criada com sucesso"
}

# Configurar PostgreSQL para produção
setup_postgresql_production() {
    log "Configurando PostgreSQL para produção..."
    
    # Criar arquivo de configuração PostgreSQL otimizado
    cat > ./data/postgres/postgresql.conf << EOF
# PostgreSQL Configuration for Production - LicitaBrasil
# Performance and Security Optimized

# Connection Settings
listen_addresses = '*'
port = 5432
max_connections = 200
superuser_reserved_connections = 3

# Memory Settings
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 10MB

# Security
ssl = on
ssl_cert_file = '/var/lib/postgresql/ssl/server.crt'
ssl_key_file = '/var/lib/postgresql/ssl/server.key'
password_encryption = scram-sha-256

# Replication (for future scaling)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 32

# Monitoring
shared_preload_libraries = 'pg_stat_statements'
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all
EOF

    # Criar script de inicialização do banco
    cat > ./data/postgres/init-production.sql << EOF
-- Inicialização do Banco de Dados de Produção
-- LicitaBrasil Web Platform

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Criar usuário de aplicação com privilégios limitados
CREATE USER licitabrasil_app WITH PASSWORD 'CHANGE_ME_APP_PASSWORD';
GRANT CONNECT ON DATABASE licita_brasil_production TO licitabrasil_app;
GRANT USAGE ON SCHEMA public TO licitabrasil_app;
GRANT CREATE ON SCHEMA public TO licitabrasil_app;

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_statement = 'mod';
EOF

    log "PostgreSQL configurado para produção"
}

# Configurar Redis para produção
setup_redis_production() {
    log "Configurando Redis para produção..."
    
    cat > ./data/redis/redis-production.conf << EOF
# Redis Configuration for Production - LicitaBrasil
# Security and Performance Optimized

# Network
bind 0.0.0.0
port 6379
protected-mode yes
requirepass CHANGE_ME_REDIS_PASSWORD

# General
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# Append Only File
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Memory Management
maxmemory 2gb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
rename-command CONFIG "CONFIG_CHANGE_ME_SECRET"

# Performance
tcp-keepalive 300
timeout 0
tcp-backlog 511
maxclients 10000

# Monitoring
latency-monitor-threshold 100
EOF

    log "Redis configurado para produção"
}

# Configurar SSL/TLS
setup_ssl_certificates() {
    log "Configurando certificados SSL/TLS..."
    
    # Criar certificado auto-assinado para desenvolvimento/teste
    # Em produção, usar certificados válidos (Let's Encrypt, etc.)
    
    if [ ! -f "./ssl/certs/licitabrasil.crt" ]; then
        info "Gerando certificado SSL auto-assinado para testes..."
        
        # Gerar chave privada
        openssl genrsa -out ./ssl/private/licitabrasil.key 2048
        
        # Gerar certificado
        openssl req -new -x509 -key ./ssl/private/licitabrasil.key \
            -out ./ssl/certs/licitabrasil.crt -days 365 \
            -subj "/C=BR/ST=SP/L=Sao Paulo/O=LicitaBrasil/CN=licitabrasilweb.com.br"
        
        # Configurar permissões
        chmod 600 ./ssl/private/licitabrasil.key
        chmod 644 ./ssl/certs/licitabrasil.crt
        
        warning "Certificado auto-assinado criado. Para produção, use certificados válidos!"
    else
        log "Certificados SSL já existem"
    fi
}

# Configurar Nginx para produção
setup_nginx_production() {
    log "Configurando Nginx para produção..."
    
    cat > ./nginx/nginx-production.conf << EOF
# Nginx Configuration for Production - LicitaBrasil
# High Performance and Security

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for" '
                    'rt=\$request_time uct="\$upstream_connect_time" '
                    'uht="\$upstream_header_time" urt="\$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

    # Configuração do servidor principal
    cat > ./nginx/conf.d/licitabrasil-production.conf << EOF
# LicitaBrasil Production Server Configuration

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name licitabrasilweb.com.br www.licitabrasilweb.com.br;
    return 301 https://\$server_name\$request_uri;
}

# Main HTTPS Server
server {
    listen 443 ssl http2;
    server_name licitabrasilweb.com.br www.licitabrasilweb.com.br;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/licitabrasil.crt;
    ssl_certificate_key /etc/nginx/ssl/licitabrasil.key;

    # Root directory
    root /usr/share/nginx/html;
    index index.html index.htm;

    # API Proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Login endpoint with stricter rate limiting
    location /api/v1/auth/login {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }

    # Frontend SPA
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Security
    location ~ /\. {
        deny all;
    }
}

# API Subdomain
server {
    listen 443 ssl http2;
    server_name api.licitabrasilweb.com.br;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/licitabrasil.crt;
    ssl_certificate_key /etc/nginx/ssl/licitabrasil.key;

    # API Only
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    log "Nginx configurado para produção"
}

# Configurar monitoramento
setup_monitoring_production() {
    log "Configurando monitoramento para produção..."
    
    # Prometheus configuration
    cat > ./monitoring/prometheus/prometheus-production.yml << EOF
# Prometheus Configuration for Production
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Backend API
  - job_name: 'licitabrasil-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s

  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Nginx
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  # Node Exporter (System metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

    # Alert rules
    cat > ./monitoring/prometheus/alert_rules.yml << EOF
groups:
  - name: licitabrasil_alerts
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for more than 5 minutes"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 85% for more than 5 minutes"

      # API response time
      - alert: HighAPIResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High API response time"
          description: "95th percentile response time is above 1 second"

      # Database connections
      - alert: HighDatabaseConnections
        expr: pg_stat_database_numbackends / pg_settings_max_connections * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connection usage"
          description: "Database connection usage is above 80%"
EOF

    log "Monitoramento configurado para produção"
}

# Gerar secrets de produção
generate_production_secrets() {
    log "Gerando secrets de produção..."
    
    # Gerar secrets seguros
    JWT_SECRET=$(openssl rand -base64 64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Salvar secrets em arquivo seguro
    cat > ./security/production-secrets.env << EOF
# Production Secrets - LicitaBrasil Web Platform
# KEEP THIS FILE SECURE AND NEVER COMMIT TO VERSION CONTROL

JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD

# Generated on: $(date)
EOF

    # Configurar permissões restritivas
    chmod 600 ./security/production-secrets.env
    
    log "Secrets de produção gerados e salvos em ./security/production-secrets.env"
    warning "IMPORTANTE: Mantenha o arquivo de secrets seguro e nunca o commite no Git!"
}

# Função principal
main() {
    log "🚀 Iniciando configuração de infraestrutura de produção - LicitaBrasil"
    
    # Executar configurações
    create_production_directories
    setup_postgresql_production
    setup_redis_production
    setup_ssl_certificates
    setup_nginx_production
    setup_monitoring_production
    generate_production_secrets
    
    log "🎉 Infraestrutura de produção configurada com SUCESSO!"
    
    echo ""
    echo "📊 RESUMO DA CONFIGURAÇÃO"
    echo "========================"
    echo "✅ Diretórios de produção criados"
    echo "✅ PostgreSQL configurado e otimizado"
    echo "✅ Redis configurado para produção"
    echo "✅ Certificados SSL configurados"
    echo "✅ Nginx configurado com segurança"
    echo "✅ Monitoramento Prometheus configurado"
    echo "✅ Secrets de produção gerados"
    echo ""
    echo "🔧 PRÓXIMOS PASSOS:"
    echo "1. Revisar e ajustar configurações conforme necessário"
    echo "2. Configurar domínio e DNS"
    echo "3. Obter certificados SSL válidos (Let's Encrypt)"
    echo "4. Executar deploy de produção"
    echo "5. Configurar backup automático"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "- Arquivo de secrets: ./security/production-secrets.env"
    echo "- Nunca commitar secrets no Git"
    echo "- Configurar firewall e segurança do servidor"
    echo ""
}

# Executar função principal se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
