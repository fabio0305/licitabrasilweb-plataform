#!/bin/bash

# Script para configurar certificados SSL Let's Encrypt para LicitaBrasil Web Platform
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
DOMAIN="licitabrasilweb.com.br"
API_DOMAIN="api.licitabrasilweb.com.br"
MONITORING_DOMAIN="monitoring.licitabrasilweb.com.br"
EMAIL="admin@licitabrasilweb.com.br"
WEBROOT_PATH="/var/www/certbot"
SSL_DIR="./nginx/ssl"

echo -e "${BLUE}🔐 Configurando SSL/TLS com Let's Encrypt para LicitaBrasil Web Platform${NC}"
echo "=================================================================="

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   warning "Este script não deve ser executado como root para segurança"
fi

# Criar diretórios necessários
log "Criando diretórios SSL..."
mkdir -p "$SSL_DIR"
mkdir -p "$WEBROOT_PATH"
mkdir -p "./logs"

# Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
    log "Instalando Certbot..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx
    else
        error "Sistema operacional não suportado. Instale o certbot manualmente."
    fi
fi

# Função para gerar certificado
generate_certificate() {
    local domain=$1
    local additional_domains=$2
    
    log "Gerando certificado para $domain..."
    
    # Parar nginx temporariamente para standalone mode
    docker-compose stop nginx 2>/dev/null || true
    
    # Gerar certificado usando standalone mode
    if [[ -n "$additional_domains" ]]; then
        sudo certbot certonly \
            --standalone \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            --domains "$domain,$additional_domains" \
            --non-interactive \
            --verbose
    else
        sudo certbot certonly \
            --standalone \
            --email "$EMAIL" \
            --agree-tos \
            --no-eff-email \
            --domains "$domain" \
            --non-interactive \
            --verbose
    fi
    
    if [[ $? -eq 0 ]]; then
        log "Certificado gerado com sucesso para $domain"
    else
        error "Falha ao gerar certificado para $domain"
    fi
}

# Função para copiar certificados
copy_certificates() {
    local domain=$1
    
    log "Copiando certificados para $SSL_DIR..."
    
    # Copiar certificados do Let's Encrypt
    sudo cp "/etc/letsencrypt/live/$domain/fullchain.pem" "$SSL_DIR/licitabrasil.crt"
    sudo cp "/etc/letsencrypt/live/$domain/privkey.pem" "$SSL_DIR/licitabrasil.key"
    sudo cp "/etc/letsencrypt/live/$domain/chain.pem" "$SSL_DIR/licitabrasil-chain.crt"
    
    # Ajustar permissões
    sudo chown $(whoami):$(whoami) "$SSL_DIR"/*
    chmod 644 "$SSL_DIR/licitabrasil.crt"
    chmod 644 "$SSL_DIR/licitabrasil-chain.crt"
    chmod 600 "$SSL_DIR/licitabrasil.key"
    
    log "Certificados copiados com sucesso"
}

# Função para gerar DH parameters
generate_dhparam() {
    log "Gerando parâmetros Diffie-Hellman (isso pode demorar alguns minutos)..."
    
    if [[ ! -f "$SSL_DIR/dhparam.pem" ]]; then
        openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048
        log "Parâmetros DH gerados com sucesso"
    else
        log "Parâmetros DH já existem, pulando..."
    fi
}

# Função para configurar renovação automática
setup_auto_renewal() {
    log "Configurando renovação automática..."
    
    # Criar script de renovação
    cat > "./scripts/renew-ssl.sh" << 'EOF'
#!/bin/bash
# Script de renovação automática SSL

# Renovar certificados
certbot renew --quiet

# Copiar certificados atualizados
if [[ -f "/etc/letsencrypt/live/licitabrasilweb.com.br/fullchain.pem" ]]; then
    cp "/etc/letsencrypt/live/licitabrasilweb.com.br/fullchain.pem" "./nginx/ssl/licitabrasil.crt"
    cp "/etc/letsencrypt/live/licitabrasilweb.com.br/privkey.pem" "./nginx/ssl/licitabrasil.key"
    cp "/etc/letsencrypt/live/licitabrasilweb.com.br/chain.pem" "./nginx/ssl/licitabrasil-chain.crt"
    
    # Recarregar nginx
    docker-compose exec nginx nginx -s reload
    
    echo "Certificados renovados e nginx recarregado"
fi
EOF
    
    chmod +x "./scripts/renew-ssl.sh"
    
    # Adicionar ao crontab (executar todo dia às 2:30 AM)
    (crontab -l 2>/dev/null; echo "30 2 * * * $(pwd)/scripts/renew-ssl.sh >> $(pwd)/logs/ssl-renewal.log 2>&1") | crontab -
    
    log "Renovação automática configurada (crontab)"
}

# Função principal
main() {
    log "Iniciando configuração SSL..."
    
    # Verificar se os domínios estão apontando para este servidor
    warning "IMPORTANTE: Certifique-se de que os seguintes domínios estão apontando para este servidor:"
    echo "  - $DOMAIN"
    echo "  - www.$DOMAIN"
    echo "  - $API_DOMAIN"
    echo "  - $MONITORING_DOMAIN"
    echo ""
    
    read -p "Os domínios estão configurados corretamente? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Configure os domínios DNS primeiro e execute novamente"
    fi
    
    # Gerar certificado principal (com www)
    generate_certificate "$DOMAIN" "www.$DOMAIN"
    
    # Gerar certificado para API
    generate_certificate "$API_DOMAIN"
    
    # Gerar certificado para monitoramento
    generate_certificate "$MONITORING_DOMAIN"
    
    # Copiar certificados (usar o certificado principal)
    copy_certificates "$DOMAIN"
    
    # Gerar DH parameters
    generate_dhparam
    
    # Configurar renovação automática
    setup_auto_renewal
    
    # Reiniciar nginx
    log "Reiniciando nginx com novos certificados..."
    docker-compose up -d nginx
    
    log "✅ Configuração SSL concluída com sucesso!"
    echo ""
    echo "Próximos passos:"
    echo "1. Teste os domínios em https://$DOMAIN"
    echo "2. Verifique o certificado em https://www.ssllabs.com/ssltest/"
    echo "3. Configure monitoramento de expiração de certificados"
    echo ""
    echo "Arquivos criados:"
    echo "  - $SSL_DIR/licitabrasil.crt (certificado)"
    echo "  - $SSL_DIR/licitabrasil.key (chave privada)"
    echo "  - $SSL_DIR/licitabrasil-chain.crt (cadeia)"
    echo "  - $SSL_DIR/dhparam.pem (parâmetros DH)"
    echo "  - ./scripts/renew-ssl.sh (script de renovação)"
}

# Executar função principal
main "$@"
