#!/bin/bash

# Script de Configuração de Monitoramento para Produção
# LicitaBrasil Web Platform - Sistema completo de monitoramento 24/7

set -e

# Configurações
MONITORING_DIR="./monitoring"
LOG_FILE="./logs/monitoring-setup.log"
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

# Criar estrutura de monitoramento
create_monitoring_structure() {
    log "Criando estrutura de monitoramento..."
    
    mkdir -p $MONITORING_DIR/{prometheus,grafana,alertmanager,exporters}
    mkdir -p $MONITORING_DIR/grafana/{dashboards,datasources,provisioning}
    mkdir -p $MONITORING_DIR/prometheus/{rules,targets}
    mkdir -p logs/monitoring
    
    log "Estrutura de monitoramento criada"
}

# Configurar Prometheus
setup_prometheus() {
    log "Configurando Prometheus para produção..."
    
    cat > $MONITORING_DIR/prometheus/prometheus.yml << EOF
# Prometheus Configuration for Production - LicitaBrasil
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'licitabrasil-production'
    environment: 'production'

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 30s

  # LicitaBrasil Backend
  - job_name: 'licitabrasil-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s

  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 30s

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 30s

  # Nginx
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
    scrape_interval: 30s

  # Node Exporter (System metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 15s

  # Blackbox Exporter (External monitoring)
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - https://licitabrasilweb.com.br
        - https://api.licitabrasilweb.com.br/health
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
EOF

    log "Prometheus configurado"
}

# Configurar regras de alerta
setup_alert_rules() {
    log "Configurando regras de alerta..."
    
    cat > $MONITORING_DIR/prometheus/rules/licitabrasil-alerts.yml << EOF
groups:
  - name: licitabrasil_critical_alerts
    rules:
      # Sistema crítico
      - alert: SystemDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Sistema {{ \$labels.instance }} está fora do ar"
          description: "O sistema {{ \$labels.instance }} não está respondendo há mais de 1 minuto"

      # Alto uso de CPU
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Alto uso de CPU em {{ \$labels.instance }}"
          description: "CPU está acima de 85% há mais de 5 minutos: {{ \$value }}%"

      # Alto uso de memória
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Alto uso de memória em {{ \$labels.instance }}"
          description: "Memória está acima de 90% há mais de 5 minutos: {{ \$value }}%"

      # Pouco espaço em disco
      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pouco espaço em disco em {{ \$labels.instance }}"
          description: "Espaço em disco abaixo de 10%: {{ \$value }}%"

  - name: licitabrasil_application_alerts
    rules:
      # Alto tempo de resposta da API
      - alert: HighAPIResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="licitabrasil-backend"}[5m])) > 2
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Alto tempo de resposta da API"
          description: "95º percentil do tempo de resposta está acima de 2s: {{ \$value }}s"

      # Alta taxa de erro
      - alert: HighErrorRate
        expr: rate(http_requests_total{job="licitabrasil-backend",status=~"5.."}[5m]) / rate(http_requests_total{job="licitabrasil-backend"}[5m]) * 100 > 5
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "Alta taxa de erro na API"
          description: "Taxa de erro 5xx acima de 5%: {{ \$value }}%"

      # Muitas conexões no banco
      - alert: HighDatabaseConnections
        expr: pg_stat_database_numbackends / pg_settings_max_connections * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Muitas conexões no banco de dados"
          description: "Uso de conexões acima de 80%: {{ \$value }}%"

      # Redis com pouca memória
      - alert: RedisHighMemoryUsage
        expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Alto uso de memória no Redis"
          description: "Uso de memória do Redis acima de 85%: {{ \$value }}%"

  - name: licitabrasil_business_alerts
    rules:
      # Poucas licitações sendo criadas
      - alert: LowBiddingCreationRate
        expr: rate(licitabrasil_biddings_created_total[1h]) < 0.1
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Baixa taxa de criação de licitações"
          description: "Menos de 0.1 licitações por segundo sendo criadas na última hora"

      # Muitos logins falhando
      - alert: HighLoginFailureRate
        expr: rate(licitabrasil_login_failures_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Alta taxa de falhas de login"
          description: "Mais de 10 falhas de login por segundo: possível ataque"
EOF

    log "Regras de alerta configuradas"
}

# Configurar Alertmanager
setup_alertmanager() {
    log "Configurando Alertmanager..."
    
    cat > $MONITORING_DIR/alertmanager/alertmanager.yml << EOF
# Alertmanager Configuration for Production - LicitaBrasil
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@licitabrasilweb.com.br'
  smtp_auth_username: 'alerts@licitabrasilweb.com.br'
  smtp_auth_password: 'CHANGE_ME_SMTP_PASSWORD'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      group_wait: 5s
      repeat_interval: 5m
    - match:
        severity: warning
      receiver: 'warning-alerts'
      repeat_interval: 30m

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://backend:3001/api/v1/webhooks/alerts'
        send_resolved: true

  - name: 'critical-alerts'
    email_configs:
      - to: 'admin@licitabrasilweb.com.br'
        subject: '🚨 CRÍTICO: {{ .GroupLabels.alertname }} - LicitaBrasil'
        body: |
          🚨 ALERTA CRÍTICO - LicitaBrasil Web Platform
          
          Alerta: {{ .GroupLabels.alertname }}
          Severidade: {{ .CommonLabels.severity }}
          
          Detalhes:
          {{ range .Alerts }}
          - {{ .Annotations.summary }}
            {{ .Annotations.description }}
            Instância: {{ .Labels.instance }}
            Horário: {{ .StartsAt }}
          {{ end }}
          
          Dashboard: https://monitoring.licitabrasilweb.com.br
    slack_configs:
      - api_url: 'CHANGE_ME_SLACK_WEBHOOK_URL'
        channel: '#alerts-critical'
        title: '🚨 Alerta Crítico - LicitaBrasil'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'warning-alerts'
    email_configs:
      - to: 'monitoring@licitabrasilweb.com.br'
        subject: '⚠️ Aviso: {{ .GroupLabels.alertname }} - LicitaBrasil'
        body: |
          ⚠️ ALERTA DE AVISO - LicitaBrasil Web Platform
          
          Alerta: {{ .GroupLabels.alertname }}
          Severidade: {{ .CommonLabels.severity }}
          
          Detalhes:
          {{ range .Alerts }}
          - {{ .Annotations.summary }}
            {{ .Annotations.description }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
EOF

    log "Alertmanager configurado"
}

# Configurar Grafana
setup_grafana() {
    log "Configurando Grafana..."
    
    # Datasource
    cat > $MONITORING_DIR/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

    # Dashboard principal
    cat > $MONITORING_DIR/grafana/dashboards/licitabrasil-overview.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "LicitaBrasil - Overview",
    "tags": ["licitabrasil", "overview"],
    "timezone": "America/Sao_Paulo",
    "panels": [
      {
        "id": 1,
        "title": "Status dos Serviços",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"licitabrasil.*\"}",
            "legendFormat": "{{ job }}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {
                "options": {
                  "0": {
                    "text": "DOWN",
                    "color": "red"
                  },
                  "1": {
                    "text": "UP",
                    "color": "green"
                  }
                }
              }
            ]
          }
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Tempo de Resposta da API",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"licitabrasil-backend\"}[5m]))",
            "legendFormat": "95º percentil"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job=\"licitabrasil-backend\"}[5m]))",
            "legendFormat": "Mediana"
          }
        ],
        "yAxes": [
          {
            "unit": "s"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Taxa de Requisições",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"licitabrasil-backend\"}[5m])",
            "legendFormat": "{{ method }} {{ status }}"
          }
        ],
        "yAxes": [
          {
            "unit": "reqps"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 8
        }
      },
      {
        "id": 4,
        "title": "Uso de Recursos do Sistema",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU %"
          },
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
            "legendFormat": "Memória %"
          }
        ],
        "yAxes": [
          {
            "unit": "percent",
            "max": 100
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 8
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

    log "Grafana configurado"
}

# Configurar exporters
setup_exporters() {
    log "Configurando exporters..."
    
    # Node Exporter (já incluído no docker-compose)
    # PostgreSQL Exporter
    cat > $MONITORING_DIR/exporters/postgres-exporter.env << EOF
DATA_SOURCE_NAME=postgresql://postgres_exporter:CHANGE_ME_EXPORTER_PASSWORD@postgres:5432/licita_brasil_production?sslmode=disable
PG_EXPORTER_EXTEND_QUERY_PATH=/etc/postgres_exporter/queries.yaml
EOF

    # Redis Exporter (configuração via docker-compose)
    # Nginx Exporter (configuração via docker-compose)
    
    log "Exporters configurados"
}

# Criar docker-compose para monitoramento
create_monitoring_compose() {
    log "Criando docker-compose para monitoramento..."
    
    cat > docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: licitabrasil-prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    container_name: licitabrasil-alertmanager
    restart: unless-stopped
    volumes:
      - ./monitoring/alertmanager:/etc/alertmanager
      - alertmanager_data:/alertmanager
    ports:
      - "9093:9093"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: licitabrasil-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=CHANGE_ME_GRAFANA_PASSWORD
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_DOMAIN=monitoring.licitabrasilweb.com.br
      - GF_SERVER_ROOT_URL=https://monitoring.licitabrasilweb.com.br/
    volumes:
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: licitabrasil-node-exporter
    restart: unless-stopped
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    ports:
      - "9100:9100"
    networks:
      - monitoring

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: licitabrasil-postgres-exporter
    restart: unless-stopped
    env_file:
      - ./monitoring/exporters/postgres-exporter.env
    ports:
      - "9187:9187"
    networks:
      - monitoring

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: licitabrasil-redis-exporter
    restart: unless-stopped
    environment:
      - REDIS_ADDR=redis://redis:6379
      - REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD
    ports:
      - "9121:9121"
    networks:
      - monitoring

  blackbox-exporter:
    image: prom/blackbox-exporter:latest
    container_name: licitabrasil-blackbox-exporter
    restart: unless-stopped
    ports:
      - "9115:9115"
    networks:
      - monitoring

volumes:
  prometheus_data:
  alertmanager_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
EOF

    log "Docker-compose para monitoramento criado"
}

# Função principal
main() {
    log "🚀 Iniciando configuração de monitoramento para produção - LicitaBrasil"
    
    # Executar configurações
    create_monitoring_structure
    setup_prometheus
    setup_alert_rules
    setup_alertmanager
    setup_grafana
    setup_exporters
    create_monitoring_compose
    
    log "🎉 Monitoramento para produção configurado com SUCESSO!"
    
    echo ""
    echo "📊 RESUMO DO MONITORAMENTO"
    echo "========================="
    echo "✅ Prometheus configurado com métricas completas"
    echo "✅ Alertmanager configurado com notificações"
    echo "✅ Grafana configurado com dashboards"
    echo "✅ Exporters configurados (Node, PostgreSQL, Redis)"
    echo "✅ Regras de alerta configuradas"
    echo "✅ Docker-compose para monitoramento criado"
    echo ""
    echo "🔧 PARA INICIAR O MONITORAMENTO:"
    echo "docker-compose -f docker-compose.monitoring.yml up -d"
    echo ""
    echo "🌐 URLS DE ACESSO:"
    echo "- Prometheus: http://localhost:9090"
    echo "- Grafana: http://localhost:3000 (admin/CHANGE_ME_GRAFANA_PASSWORD)"
    echo "- Alertmanager: http://localhost:9093"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "- Configurar senhas nos arquivos de configuração"
    echo "- Configurar SMTP para alertas por email"
    echo "- Configurar Slack webhook para alertas críticos"
    echo "- Ajustar thresholds conforme necessário"
    echo ""
}

# Executar função principal se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
