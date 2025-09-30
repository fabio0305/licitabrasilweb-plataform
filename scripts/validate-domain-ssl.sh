#!/bin/bash

# Script para validar configuração de domínio e SSL do LicitaBrasil Web Platform
# Autor: Sistema LicitaBrasil
# Data: 2025-09-30

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
DOMAINS=(
    "licitabrasilweb.com.br"
    "www.licitabrasilweb.com.br"
    "api.licitabrasilweb.com.br"
    "monitoring.licitabrasilweb.com.br"
)

echo -e "${BLUE}🔍 Validação de Domínio e SSL - LicitaBrasil Web Platform${NC}"
echo "=============================================================="

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Função para verificar DNS
check_dns() {
    local domain=$1
    local server_ip=$2
    
    info "Verificando DNS para $domain..."
    
    # Obter IP do domínio
    domain_ip=$(dig +short "$domain" | tail -n1)
    
    if [[ -z "$domain_ip" ]]; then
        error "❌ DNS não resolvido para $domain"
        return 1
    fi
    
    if [[ -n "$server_ip" ]] && [[ "$domain_ip" != "$server_ip" ]]; then
        warning "⚠️  $domain aponta para $domain_ip (esperado: $server_ip)"
        return 1
    fi
    
    success "✅ DNS OK para $domain → $domain_ip"
    return 0
}

# Função para verificar conectividade HTTP
check_http_connectivity() {
    local domain=$1
    
    info "Testando conectividade HTTP para $domain..."
    
    # Testar HTTP (deve redirecionar para HTTPS)
    http_response=$(curl -s -o /dev/null -w "%{http_code}" "http://$domain" --max-time 10 || echo "000")
    
    if [[ "$http_response" == "301" ]] || [[ "$http_response" == "302" ]]; then
        success "✅ HTTP redirect OK para $domain (código: $http_response)"
    elif [[ "$http_response" == "000" ]]; then
        error "❌ Sem conectividade HTTP para $domain"
        return 1
    else
        warning "⚠️  HTTP resposta inesperada para $domain (código: $http_response)"
    fi
}

# Função para verificar HTTPS
check_https_connectivity() {
    local domain=$1
    
    info "Testando conectividade HTTPS para $domain..."
    
    # Testar HTTPS
    https_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" --max-time 10 --insecure || echo "000")
    
    if [[ "$https_response" == "200" ]] || [[ "$https_response" == "301" ]] || [[ "$https_response" == "302" ]]; then
        success "✅ HTTPS conectividade OK para $domain (código: $https_response)"
    elif [[ "$https_response" == "000" ]]; then
        error "❌ Sem conectividade HTTPS para $domain"
        return 1
    else
        warning "⚠️  HTTPS resposta inesperada para $domain (código: $https_response)"
    fi
}

# Função para verificar certificado SSL
check_ssl_certificate() {
    local domain=$1
    
    info "Verificando certificado SSL para $domain..."
    
    # Obter informações do certificado
    cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -text 2>/dev/null)
    
    if [[ $? -ne 0 ]]; then
        error "❌ Não foi possível obter certificado SSL para $domain"
        return 1
    fi
    
    # Verificar validade
    not_after=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [[ -n "$not_after" ]]; then
        expiry_date=$(date -d "$not_after" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$not_after" +%s 2>/dev/null)
        current_date=$(date +%s)
        days_until_expiry=$(( (expiry_date - current_date) / 86400 ))
        
        if [[ $days_until_expiry -gt 30 ]]; then
            success "✅ Certificado SSL válido para $domain (expira em $days_until_expiry dias)"
        elif [[ $days_until_expiry -gt 0 ]]; then
            warning "⚠️  Certificado SSL para $domain expira em $days_until_expiry dias"
        else
            error "❌ Certificado SSL para $domain expirado"
            return 1
        fi
    fi
    
    # Verificar se o domínio está no certificado
    if echo "$cert_info" | grep -q "DNS:$domain"; then
        success "✅ Domínio $domain presente no certificado"
    else
        error "❌ Domínio $domain NÃO encontrado no certificado"
        return 1
    fi
}

# Função para testar SSL Labs
test_ssl_labs() {
    local domain=$1
    
    info "Para teste completo SSL, acesse:"
    echo "  🔗 https://www.ssllabs.com/ssltest/analyze.html?d=$domain"
    echo "  🔗 https://www.immuniweb.com/ssl/?id=$domain"
}

# Função para verificar headers de segurança
check_security_headers() {
    local domain=$1
    
    info "Verificando headers de segurança para $domain..."
    
    headers=$(curl -s -I "https://$domain" --max-time 10 || echo "")
    
    if [[ -z "$headers" ]]; then
        error "❌ Não foi possível obter headers para $domain"
        return 1
    fi
    
    # Verificar headers importantes
    if echo "$headers" | grep -qi "strict-transport-security"; then
        success "✅ HSTS header presente"
    else
        warning "⚠️  HSTS header ausente"
    fi
    
    if echo "$headers" | grep -qi "x-frame-options"; then
        success "✅ X-Frame-Options header presente"
    else
        warning "⚠️  X-Frame-Options header ausente"
    fi
    
    if echo "$headers" | grep -qi "x-content-type-options"; then
        success "✅ X-Content-Type-Options header presente"
    else
        warning "⚠️  X-Content-Type-Options header ausente"
    fi
    
    if echo "$headers" | grep -qi "content-security-policy"; then
        success "✅ Content-Security-Policy header presente"
    else
        warning "⚠️  Content-Security-Policy header ausente"
    fi
}

# Função para testar endpoints específicos
test_specific_endpoints() {
    info "Testando endpoints específicos..."
    
    # Testar API health
    api_health=$(curl -s "https://api.licitabrasilweb.com.br/health" --max-time 10 || echo "")
    if echo "$api_health" | grep -q "OK"; then
        success "✅ API health endpoint funcionando"
    else
        warning "⚠️  API health endpoint com problemas"
    fi
    
    # Testar Grafana
    grafana_response=$(curl -s -o /dev/null -w "%{http_code}" "https://monitoring.licitabrasilweb.com.br" --max-time 10 || echo "000")
    if [[ "$grafana_response" == "200" ]]; then
        success "✅ Grafana acessível"
    else
        warning "⚠️  Grafana com problemas (código: $grafana_response)"
    fi
}

# Função para gerar relatório
generate_report() {
    local report_file="./logs/domain-ssl-validation-$(date +%Y%m%d_%H%M%S).log"
    
    log "Gerando relatório em $report_file..."
    
    {
        echo "Relatório de Validação - LicitaBrasil Web Platform"
        echo "================================================="
        echo "Data: $(date)"
        echo "Servidor: $(hostname)"
        echo ""
        echo "Domínios testados:"
        for domain in "${DOMAINS[@]}"; do
            echo "  - $domain"
        done
        echo ""
        echo "Para relatório detalhado, execute: $0 > $report_file"
    } > "$report_file"
    
    log "Relatório salvo em $report_file"
}

# Função principal
main() {
    log "Iniciando validação de domínio e SSL..."
    
    # Obter IP do servidor atual
    server_ip=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "")
    if [[ -n "$server_ip" ]]; then
        info "IP do servidor atual: $server_ip"
    fi
    
    echo ""
    
    # Testar cada domínio
    for domain in "${DOMAINS[@]}"; do
        echo "----------------------------------------"
        log "Testando domínio: $domain"
        echo ""
        
        # Verificar DNS
        check_dns "$domain" "$server_ip"
        
        # Verificar conectividade HTTP
        check_http_connectivity "$domain"
        
        # Verificar conectividade HTTPS
        check_https_connectivity "$domain"
        
        # Verificar certificado SSL
        check_ssl_certificate "$domain"
        
        # Verificar headers de segurança
        check_security_headers "$domain"
        
        echo ""
    done
    
    echo "----------------------------------------"
    
    # Testar endpoints específicos
    test_specific_endpoints
    
    echo ""
    echo "----------------------------------------"
    
    # Mostrar links para testes externos
    log "Testes externos recomendados:"
    for domain in "${DOMAINS[@]}"; do
        test_ssl_labs "$domain"
    done
    
    echo ""
    
    # Gerar relatório
    generate_report
    
    log "✅ Validação concluída!"
    echo ""
    echo "Resumo:"
    echo "  - Verifique os resultados acima"
    echo "  - Corrija quaisquer problemas identificados"
    echo "  - Execute testes externos para validação completa"
    echo "  - Configure monitoramento contínuo"
}

# Executar função principal
main "$@"
