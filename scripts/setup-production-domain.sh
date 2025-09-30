#!/bin/bash

# Script principal para configurar domínio de produção e SSL - LicitaBrasil Web Platform
# Autor: Sistema LicitaBrasil
# Data: 2025-09-30

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configurações
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups/domain-setup-$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}🌐 Configuração de Domínio de Produção - LicitaBrasil Web Platform${NC}"
echo "========================================================================"

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

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Função para verificar pré-requisitos
check_prerequisites() {
    log "Verificando pré-requisitos..."
    
    # Verificar se está no diretório correto
    if [[ ! -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        error "Execute este script no diretório raiz do projeto"
    fi
    
    # Verificar se Docker está rodando
    if ! docker info &>/dev/null; then
        error "Docker não está rodando ou não está acessível"
    fi
    
    # Verificar se os containers estão rodando
    if ! docker-compose ps | grep -q "Up"; then
        warning "Alguns containers não estão rodando. Execute 'docker-compose up -d' primeiro"
    fi
    
    # Verificar ferramentas necessárias
    for tool in curl dig openssl; do
        if ! command -v "$tool" &>/dev/null; then
            error "Ferramenta necessária não encontrada: $tool"
        fi
    done
    
    success "Pré-requisitos verificados"
}

# Função para fazer backup
create_backup() {
    log "Criando backup da configuração atual..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup das configurações
    cp -r "$PROJECT_ROOT/nginx" "$BACKUP_DIR/"
    cp "$PROJECT_ROOT/.env.production" "$BACKUP_DIR/"
    
    if [[ -d "$PROJECT_ROOT/ssl" ]]; then
        cp -r "$PROJECT_ROOT/ssl" "$BACKUP_DIR/"
    fi
    
    log "Backup criado em: $BACKUP_DIR"
}

# Função para mostrar menu de opções
show_menu() {
    echo ""
    echo -e "${PURPLE}Escolha o tipo de configuração SSL:${NC}"
    echo "1) Let's Encrypt (Gratuito, recomendado)"
    echo "2) Certificado comercial (já possuo certificados)"
    echo "3) Manter certificados auto-assinados (apenas para teste)"
    echo "4) Apenas validar configuração atual"
    echo "5) Sair"
    echo ""
}

# Função para configurar Let's Encrypt
setup_letsencrypt() {
    log "Configurando certificados Let's Encrypt..."
    
    if [[ -f "$SCRIPT_DIR/setup-ssl-letsencrypt.sh" ]]; then
        chmod +x "$SCRIPT_DIR/setup-ssl-letsencrypt.sh"
        "$SCRIPT_DIR/setup-ssl-letsencrypt.sh"
    else
        error "Script setup-ssl-letsencrypt.sh não encontrado"
    fi
}

# Função para configurar certificado comercial
setup_commercial_ssl() {
    log "Configurando certificados comerciais..."
    
    if [[ -f "$SCRIPT_DIR/setup-ssl-commercial.sh" ]]; then
        chmod +x "$SCRIPT_DIR/setup-ssl-commercial.sh"
        "$SCRIPT_DIR/setup-ssl-commercial.sh"
    else
        error "Script setup-ssl-commercial.sh não encontrado"
    fi
}

# Função para manter certificados auto-assinados
keep_self_signed() {
    log "Mantendo certificados auto-assinados..."
    
    # Verificar se existem certificados
    if [[ ! -f "$PROJECT_ROOT/nginx/ssl/licitabrasil.crt" ]]; then
        log "Gerando novos certificados auto-assinados..."
        
        mkdir -p "$PROJECT_ROOT/nginx/ssl"
        
        # Gerar certificado auto-assinado com múltiplos domínios
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$PROJECT_ROOT/nginx/ssl/licitabrasil.key" \
            -out "$PROJECT_ROOT/nginx/ssl/licitabrasil.crt" \
            -config <(
                echo '[dn]'
                echo 'CN=licitabrasilweb.com.br'
                echo '[req]'
                echo 'distinguished_name = dn'
                echo '[SAN]'
                echo 'subjectAltName=DNS:licitabrasilweb.com.br,DNS:www.licitabrasilweb.com.br,DNS:api.licitabrasilweb.com.br,DNS:monitoring.licitabrasilweb.com.br'
            ) \
            -extensions SAN \
            -subj "/C=BR/ST=SP/L=SaoPaulo/O=LicitaBrasil/CN=licitabrasilweb.com.br"
        
        # Criar arquivo de cadeia (cópia do certificado para auto-assinado)
        cp "$PROJECT_ROOT/nginx/ssl/licitabrasil.crt" "$PROJECT_ROOT/nginx/ssl/licitabrasil-chain.crt"
        
        # Gerar parâmetros DH
        openssl dhparam -out "$PROJECT_ROOT/nginx/ssl/dhparam.pem" 2048
        
        success "Certificados auto-assinados gerados"
    else
        success "Certificados auto-assinados já existem"
    fi
}

# Função para validar configuração
validate_configuration() {
    log "Validando configuração..."
    
    if [[ -f "$SCRIPT_DIR/validate-domain-ssl.sh" ]]; then
        chmod +x "$SCRIPT_DIR/validate-domain-ssl.sh"
        "$SCRIPT_DIR/validate-domain-ssl.sh"
    else
        error "Script validate-domain-ssl.sh não encontrado"
    fi
}

# Função para testar configuração do Nginx
test_nginx_config() {
    log "Testando configuração do Nginx..."
    
    if docker-compose exec nginx nginx -t &>/dev/null; then
        success "Configuração do Nginx válida"
    else
        error "Configuração do Nginx inválida. Verifique os logs: docker-compose logs nginx"
    fi
}

# Função para reiniciar serviços
restart_services() {
    log "Reiniciando serviços..."
    
    # Reiniciar nginx
    docker-compose restart nginx
    
    # Aguardar inicialização
    sleep 10
    
    # Verificar se está funcionando
    if docker-compose ps nginx | grep -q "Up"; then
        success "Nginx reiniciado com sucesso"
    else
        error "Falha ao reiniciar Nginx"
    fi
}

# Função para mostrar informações finais
show_final_info() {
    log "✅ Configuração de domínio concluída!"
    echo ""
    echo "Domínios configurados:"
    echo "  🌐 https://licitabrasilweb.com.br (Principal)"
    echo "  🌐 https://www.licitabrasilweb.com.br (WWW)"
    echo "  🔗 https://api.licitabrasilweb.com.br (API)"
    echo "  📊 https://monitoring.licitabrasilweb.com.br (Monitoramento)"
    echo ""
    echo "Próximos passos:"
    echo "1. Configure os registros DNS para apontar para este servidor"
    echo "2. Teste todos os domínios em um navegador"
    echo "3. Execute validação SSL: ./scripts/validate-domain-ssl.sh"
    echo "4. Configure monitoramento de expiração de certificados"
    echo ""
    echo "Arquivos importantes:"
    echo "  - nginx/conf.d/licitabrasil-production.conf (configuração Nginx)"
    echo "  - .env.production (variáveis de ambiente)"
    echo "  - nginx/ssl/ (certificados SSL)"
    echo ""
    if [[ -d "$BACKUP_DIR" ]]; then
        echo "Backup da configuração anterior: $BACKUP_DIR"
    fi
}

# Função principal
main() {
    # Verificar pré-requisitos
    check_prerequisites
    
    # Criar backup
    create_backup
    
    # Mostrar informações iniciais
    info "Este script irá configurar:"
    echo "  - Domínio principal: licitabrasilweb.com.br"
    echo "  - Subdomínios: www, api, monitoring"
    echo "  - Certificados SSL/TLS"
    echo "  - Configurações de segurança"
    echo "  - Redirecionamento HTTP → HTTPS"
    echo ""
    
    # Loop do menu
    while true; do
        show_menu
        read -p "Escolha uma opção (1-5): " choice
        
        case $choice in
            1)
                setup_letsencrypt
                break
                ;;
            2)
                setup_commercial_ssl
                break
                ;;
            3)
                keep_self_signed
                break
                ;;
            4)
                validate_configuration
                exit 0
                ;;
            5)
                log "Operação cancelada pelo usuário"
                exit 0
                ;;
            *)
                warning "Opção inválida. Tente novamente."
                ;;
        esac
    done
    
    # Testar configuração
    test_nginx_config
    
    # Reiniciar serviços
    restart_services
    
    # Mostrar informações finais
    show_final_info
}

# Verificar se está sendo executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
