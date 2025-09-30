#!/bin/bash

# Script de deploy para produção
# Uso: ./scripts/deploy.sh [environment]

set -e

# Configurações
ENVIRONMENT=${1:-production}
PROJECT_NAME="licitabrasil-web"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a $LOG_FILE
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado"
    fi
    
    log "Docker e Docker Compose verificados"
}

# Verificar variáveis de ambiente
check_env() {
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        error "Arquivo .env.${ENVIRONMENT} não encontrado"
    fi
    
    # Copiar arquivo de ambiente
    cp ".env.${ENVIRONMENT}" ".env"
    log "Arquivo de ambiente configurado para ${ENVIRONMENT}"
}

# Fazer backup do banco de dados
backup_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Iniciando backup do banco de dados..."
        
        mkdir -p $BACKUP_DIR
        BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"
        
        docker-compose exec -T postgres pg_dump -U licitabrasil licita_brasil_web > $BACKUP_FILE
        
        if [ $? -eq 0 ]; then
            log "Backup criado: $BACKUP_FILE"
        else
            error "Falha ao criar backup do banco de dados"
        fi
    fi
}

# Executar testes
run_tests() {
    log "Executando testes..."
    
    cd backend
    npm test
    
    if [ $? -eq 0 ]; then
        log "Todos os testes passaram"
    else
        error "Testes falharam. Deploy cancelado."
    fi
    
    cd ..
}

# Build das imagens Docker
build_images() {
    log "Construindo imagens Docker..."
    
    docker-compose build --no-cache
    
    if [ $? -eq 0 ]; then
        log "Imagens construídas com sucesso"
    else
        error "Falha ao construir imagens Docker"
    fi
}

# Deploy da aplicação
deploy_app() {
    log "Iniciando deploy da aplicação..."
    
    # Parar serviços existentes
    docker-compose down
    
    # Executar migrações do banco
    log "Executando migrações do banco de dados..."
    docker-compose run --rm backend npx prisma migrate deploy
    
    # Executar seeds se necessário
    if [ "$ENVIRONMENT" != "production" ]; then
        log "Executando seeds do banco de dados..."
        docker-compose run --rm backend npm run db:seed
    fi
    
    # Iniciar serviços
    log "Iniciando serviços..."
    docker-compose up -d
    
    # Aguardar serviços ficarem prontos
    log "Aguardando serviços ficarem prontos..."
    sleep 30
    
    # Verificar saúde dos serviços
    check_health
}

# Verificar saúde dos serviços
check_health() {
    log "Verificando saúde dos serviços..."
    
    # Verificar backend
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log "Backend está saudável"
    else
        error "Backend não está respondendo"
    fi
    
    # Verificar nginx
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log "Nginx está saudável"
    else
        warning "Nginx pode não estar configurado corretamente"
    fi
    
    # Verificar banco de dados
    if docker-compose exec -T postgres pg_isready -U licitabrasil > /dev/null 2>&1; then
        log "PostgreSQL está saudável"
    else
        error "PostgreSQL não está respondendo"
    fi
    
    # Verificar Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        log "Redis está saudável"
    else
        error "Redis não está respondendo"
    fi
}

# Limpeza de imagens antigas
cleanup() {
    log "Limpando imagens Docker antigas..."
    
    docker image prune -f
    docker system prune -f
    
    log "Limpeza concluída"
}

# Rollback em caso de falha
rollback() {
    error "Deploy falhou. Iniciando rollback..."
    
    # Restaurar backup se existir
    if [ -f "$BACKUP_FILE" ]; then
        log "Restaurando backup do banco de dados..."
        docker-compose exec -T postgres psql -U licitabrasil -d licita_brasil_web < $BACKUP_FILE
    fi
    
    # Voltar para versão anterior
    git checkout HEAD~1
    docker-compose down
    docker-compose up -d
    
    error "Rollback concluído"
}

# Função principal
main() {
    log "Iniciando deploy para ambiente: $ENVIRONMENT"
    
    # Trap para rollback em caso de erro
    trap rollback ERR
    
    check_docker
    check_env
    
    if [ "$ENVIRONMENT" = "production" ]; then
        backup_database
        run_tests
    fi
    
    build_images
    deploy_app
    cleanup
    
    log "Deploy concluído com sucesso!"
    log "Aplicação disponível em: http://localhost"
    log "API disponível em: http://localhost/api/v1"
    log "Documentação da API: http://localhost/api-docs"
}

# Verificar se o script está sendo executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
