#!/bin/bash

# Script para configurar certificados SSL comerciais para LicitaBrasil Web Platform
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
SSL_DIR="./nginx/ssl"
BACKUP_DIR="./backups/ssl/$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}🔐 Configurando certificados SSL comerciais para LicitaBrasil Web Platform${NC}"
echo "=========================================================================="

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

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Função para validar arquivo de certificado
validate_certificate() {
    local cert_file=$1
    
    if [[ ! -f "$cert_file" ]]; then
        error "Arquivo de certificado não encontrado: $cert_file"
    fi
    
    # Verificar se é um certificado válido
    if ! openssl x509 -in "$cert_file" -text -noout &>/dev/null; then
        error "Arquivo de certificado inválido: $cert_file"
    fi
    
    # Mostrar informações do certificado
    log "Informações do certificado:"
    openssl x509 -in "$cert_file" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:)"
}

# Função para validar chave privada
validate_private_key() {
    local key_file=$1
    
    if [[ ! -f "$key_file" ]]; then
        error "Arquivo de chave privada não encontrado: $key_file"
    fi
    
    # Verificar se é uma chave privada válida
    if ! openssl rsa -in "$key_file" -check -noout &>/dev/null; then
        error "Arquivo de chave privada inválido: $key_file"
    fi
    
    log "Chave privada validada com sucesso"
}

# Função para verificar compatibilidade entre certificado e chave
verify_cert_key_match() {
    local cert_file=$1
    local key_file=$2
    
    log "Verificando compatibilidade entre certificado e chave privada..."
    
    cert_modulus=$(openssl x509 -noout -modulus -in "$cert_file" | openssl md5)
    key_modulus=$(openssl rsa -noout -modulus -in "$key_file" | openssl md5)
    
    if [[ "$cert_modulus" != "$key_modulus" ]]; then
        error "Certificado e chave privada não são compatíveis"
    fi
    
    log "Certificado e chave privada são compatíveis ✅"
}

# Função para fazer backup dos certificados atuais
backup_current_certificates() {
    if [[ -d "$SSL_DIR" ]] && [[ "$(ls -A $SSL_DIR 2>/dev/null)" ]]; then
        log "Fazendo backup dos certificados atuais..."
        mkdir -p "$BACKUP_DIR"
        cp -r "$SSL_DIR"/* "$BACKUP_DIR/"
        log "Backup salvo em: $BACKUP_DIR"
    fi
}

# Função para instalar certificados
install_certificates() {
    local cert_file=$1
    local key_file=$2
    local chain_file=$3
    
    log "Instalando certificados..."
    
    # Criar diretório SSL se não existir
    mkdir -p "$SSL_DIR"
    
    # Copiar certificado principal
    cp "$cert_file" "$SSL_DIR/licitabrasil.crt"
    chmod 644 "$SSL_DIR/licitabrasil.crt"
    
    # Copiar chave privada
    cp "$key_file" "$SSL_DIR/licitabrasil.key"
    chmod 600 "$SSL_DIR/licitabrasil.key"
    
    # Copiar cadeia de certificados (se fornecida)
    if [[ -n "$chain_file" ]] && [[ -f "$chain_file" ]]; then
        cp "$chain_file" "$SSL_DIR/licitabrasil-chain.crt"
        chmod 644 "$SSL_DIR/licitabrasil-chain.crt"
        log "Cadeia de certificados instalada"
    else
        warning "Cadeia de certificados não fornecida - alguns navegadores podem mostrar avisos"
    fi
    
    # Gerar parâmetros DH se não existirem
    if [[ ! -f "$SSL_DIR/dhparam.pem" ]]; then
        log "Gerando parâmetros Diffie-Hellman..."
        openssl dhparam -out "$SSL_DIR/dhparam.pem" 2048
    fi
    
    log "Certificados instalados com sucesso"
}

# Função para testar configuração SSL
test_ssl_configuration() {
    log "Testando configuração SSL..."
    
    # Testar sintaxe do nginx
    if docker-compose exec nginx nginx -t &>/dev/null; then
        log "Configuração do Nginx válida ✅"
    else
        error "Configuração do Nginx inválida"
    fi
    
    # Recarregar nginx
    docker-compose exec nginx nginx -s reload
    
    log "Nginx recarregado com sucesso"
}

# Função para mostrar informações pós-instalação
show_post_install_info() {
    log "✅ Certificados SSL instalados com sucesso!"
    echo ""
    echo "Arquivos instalados:"
    echo "  - $SSL_DIR/licitabrasil.crt (certificado principal)"
    echo "  - $SSL_DIR/licitabrasil.key (chave privada)"
    echo "  - $SSL_DIR/licitabrasil-chain.crt (cadeia de certificados)"
    echo "  - $SSL_DIR/dhparam.pem (parâmetros DH)"
    echo ""
    echo "Próximos passos:"
    echo "1. Teste os domínios:"
    echo "   - https://licitabrasilweb.com.br"
    echo "   - https://www.licitabrasilweb.com.br"
    echo "   - https://api.licitabrasilweb.com.br"
    echo "   - https://monitoring.licitabrasilweb.com.br"
    echo ""
    echo "2. Verifique a qualidade SSL:"
    echo "   - https://www.ssllabs.com/ssltest/"
    echo "   - https://www.immuniweb.com/ssl/"
    echo ""
    echo "3. Configure monitoramento de expiração"
    echo "4. Configure renovação automática (se aplicável)"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        echo ""
        echo "Backup dos certificados anteriores: $BACKUP_DIR"
    fi
}

# Função principal
main() {
    info "Este script ajuda a instalar certificados SSL comerciais"
    echo ""
    echo "Você precisará fornecer:"
    echo "1. Arquivo do certificado (.crt ou .pem)"
    echo "2. Arquivo da chave privada (.key ou .pem)"
    echo "3. Arquivo da cadeia de certificados (opcional, mas recomendado)"
    echo ""
    
    # Solicitar arquivos
    read -p "Caminho para o arquivo do certificado: " cert_file
    read -p "Caminho para o arquivo da chave privada: " key_file
    read -p "Caminho para a cadeia de certificados (opcional): " chain_file
    
    # Validar arquivos
    validate_certificate "$cert_file"
    validate_private_key "$key_file"
    verify_cert_key_match "$cert_file" "$key_file"
    
    if [[ -n "$chain_file" ]] && [[ -f "$chain_file" ]]; then
        validate_certificate "$chain_file"
    fi
    
    # Confirmar instalação
    echo ""
    warning "ATENÇÃO: Esta operação irá substituir os certificados atuais"
    read -p "Deseja continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Operação cancelada pelo usuário"
        exit 0
    fi
    
    # Fazer backup
    backup_current_certificates
    
    # Instalar certificados
    install_certificates "$cert_file" "$key_file" "$chain_file"
    
    # Testar configuração
    test_ssl_configuration
    
    # Mostrar informações
    show_post_install_info
}

# Verificar se está no diretório correto
if [[ ! -f "docker-compose.yml" ]]; then
    error "Execute este script no diretório raiz do projeto (onde está o docker-compose.yml)"
fi

# Executar função principal
main "$@"
