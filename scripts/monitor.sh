#!/bin/bash

# Script de monitoramento para LicitaBrasil Web
# Verifica a saúde dos serviços e envia alertas se necessário

set -e

# Configurações
ALERT_EMAIL="admin@licitabrasilweb.com.br"
LOG_FILE="./logs/monitor.log"
SLACK_WEBHOOK_URL=""  # Configure se usar Slack

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Enviar alerta por email
send_email_alert() {
    local subject="$1"
    local message="$2"
    
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
        log "Alerta enviado por email: $subject"
    else
        warning "Comando 'mail' não disponível. Alerta não enviado."
    fi
}

# Enviar alerta para Slack
send_slack_alert() {
    local message="$1"
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1
        log "Alerta enviado para Slack"
    fi
}

# Verificar se container está rodando
check_container() {
    local container_name="$1"
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        log "Container $container_name está rodando"
        return 0
    else
        error "Container $container_name não está rodando"
        return 1
    fi
}

# Verificar saúde do backend
check_backend_health() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3001/health > /dev/null; then
            log "Backend está saudável (tentativa $attempt)"
            return 0
        fi
        
        warning "Backend não respondeu na tentativa $attempt"
        sleep 5
        ((attempt++))
    done
    
    error "Backend não está respondendo após $max_attempts tentativas"
    return 1
}

# Verificar banco de dados
check_database() {
    if docker-compose exec -T postgres pg_isready -U licitabrasil > /dev/null 2>&1; then
        log "PostgreSQL está saudável"
        return 0
    else
        error "PostgreSQL não está respondendo"
        return 1
    fi
}

# Verificar Redis
check_redis() {
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        log "Redis está saudável"
        return 0
    else
        error "Redis não está respondendo"
        return 1
    fi
}

# Verificar Nginx
check_nginx() {
    if curl -f -s http://localhost/health > /dev/null; then
        log "Nginx está saudável"
        return 0
    else
        error "Nginx não está respondendo"
        return 1
    fi
}

# Verificar uso de disco
check_disk_usage() {
    local threshold=80
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -gt "$threshold" ]; then
        warning "Uso de disco alto: ${usage}%"
        send_email_alert "Alerta: Uso de disco alto" "O uso de disco está em ${usage}%, acima do limite de ${threshold}%"
        return 1
    else
        log "Uso de disco normal: ${usage}%"
        return 0
    fi
}

# Verificar uso de memória
check_memory_usage() {
    local threshold=80
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -gt "$threshold" ]; then
        warning "Uso de memória alto: ${usage}%"
        send_email_alert "Alerta: Uso de memória alto" "O uso de memória está em ${usage}%, acima do limite de ${threshold}%"
        return 1
    else
        log "Uso de memória normal: ${usage}%"
        return 0
    fi
}

# Verificar logs de erro
check_error_logs() {
    local error_count=$(docker-compose logs --since=1h backend | grep -i error | wc -l)
    local threshold=10
    
    if [ "$error_count" -gt "$threshold" ]; then
        warning "Muitos erros nos logs: $error_count erros na última hora"
        send_email_alert "Alerta: Muitos erros nos logs" "Foram encontrados $error_count erros nos logs da última hora"
        return 1
    else
        log "Logs de erro normais: $error_count erros na última hora"
        return 0
    fi
}

# Verificar conectividade externa
check_external_connectivity() {
    if curl -f -s https://google.com > /dev/null; then
        log "Conectividade externa OK"
        return 0
    else
        error "Sem conectividade externa"
        return 1
    fi
}

# Verificar certificados SSL (se aplicável)
check_ssl_certificates() {
    local domain="licitabrasilweb.com.br"
    local days_threshold=30
    
    if command -v openssl &> /dev/null; then
        local expiry_date=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ "$days_until_expiry" -lt "$days_threshold" ]; then
            warning "Certificado SSL expira em $days_until_expiry dias"
            send_email_alert "Alerta: Certificado SSL expirando" "O certificado SSL para $domain expira em $days_until_expiry dias"
            return 1
        else
            log "Certificado SSL válido por mais $days_until_expiry dias"
            return 0
        fi
    else
        info "OpenSSL não disponível, pulando verificação de certificado"
        return 0
    fi
}

# Gerar relatório de status
generate_status_report() {
    local report_file="./logs/status_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== Relatório de Status - $(date) ==="
        echo ""
        echo "Containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "Uso de recursos:"
        echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
        echo "Memória: $(free | awk 'NR==2{printf "%.0f%%", $3*100/$2}')"
        echo "Disco: $(df / | awk 'NR==2 {print $5}')"
        echo ""
        echo "Logs recentes (últimas 10 linhas):"
        tail -10 $LOG_FILE
    } > $report_file
    
    log "Relatório de status gerado: $report_file"
}

# Função principal de monitoramento
main() {
    log "Iniciando monitoramento do sistema"
    
    local failed_checks=0
    
    # Verificar containers
    check_container "licitabrasil-backend" || ((failed_checks++))
    check_container "licitabrasil-postgres" || ((failed_checks++))
    check_container "licitabrasil-redis" || ((failed_checks++))
    check_container "licitabrasil-nginx" || ((failed_checks++))
    
    # Verificar saúde dos serviços
    check_backend_health || ((failed_checks++))
    check_database || ((failed_checks++))
    check_redis || ((failed_checks++))
    check_nginx || ((failed_checks++))
    
    # Verificar recursos do sistema
    check_disk_usage || ((failed_checks++))
    check_memory_usage || ((failed_checks++))
    
    # Verificar logs e conectividade
    check_error_logs || ((failed_checks++))
    check_external_connectivity || ((failed_checks++))
    
    # Verificar SSL (apenas em produção)
    if [ "$NODE_ENV" = "production" ]; then
        check_ssl_certificates || ((failed_checks++))
    fi
    
    # Gerar relatório se houver falhas
    if [ $failed_checks -gt 0 ]; then
        warning "Monitoramento concluído com $failed_checks falhas"
        generate_status_report
        send_slack_alert "⚠️ Sistema LicitaBrasil: $failed_checks verificações falharam"
    else
        log "Monitoramento concluído - todos os serviços estão saudáveis"
    fi
    
    return $failed_checks
}

# Executar monitoramento se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
