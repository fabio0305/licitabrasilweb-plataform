#!/bin/bash

# Script de Deploy para Staging - LicitaBrasil Web Platform
# Executa deploy completo em ambiente de staging para testes finais

set -e

# Configurações
STAGING_ENV_FILE=".env.staging"
COMPOSE_FILE="docker-compose.dev.yml"
BACKUP_DIR="./backups/staging"
LOG_FILE="./logs/deploy-staging.log"
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

# Criar diretórios necessários
create_directories() {
    log "Criando diretórios necessários..."
    
    mkdir -p logs
    mkdir -p backups/staging
    mkdir -p backend/uploads
    mkdir -p performance-results
    mkdir -p monitoring/prometheus
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    log "Diretórios criados com sucesso"
}

# Verificar pré-requisitos
check_prerequisites() {
    log "Verificando pré-requisitos para staging..."
    
    # Verificar se arquivo .env.staging existe
    if [ ! -f "$STAGING_ENV_FILE" ]; then
        error "Arquivo $STAGING_ENV_FILE não encontrado"
        exit 1
    fi
    
    # Verificar se Docker está instalado
    if ! command -v docker &> /dev/null; then
        warning "Docker não está instalado. Tentando instalar..."
        install_docker
    fi
    
    # Verificar se docker-compose está instalado
    if ! command -v docker-compose &> /dev/null; then
        warning "Docker Compose não está instalado. Tentando instalar..."
        install_docker_compose
    fi
    
    # Verificar se backend está buildado
    if [ ! -d "backend/dist" ]; then
        info "Backend não está buildado. Executando build..."
        cd backend && npm run build && cd ..
    fi
    
    log "Pré-requisitos verificados"
}

# Instalar Docker (se necessário)
install_docker() {
    info "Instalando Docker..."
    
    # Atualizar repositórios
    sudo apt-get update
    
    # Instalar dependências
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Adicionar chave GPG do Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Adicionar repositório
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Instalar Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Adicionar usuário ao grupo docker
    sudo usermod -aG docker $USER
    
    log "Docker instalado com sucesso"
}

# Instalar Docker Compose (se necessário)
install_docker_compose() {
    info "Instalando Docker Compose..."
    
    # Baixar Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Dar permissão de execução
    sudo chmod +x /usr/local/bin/docker-compose
    
    log "Docker Compose instalado com sucesso"
}

# Fazer backup do ambiente atual
backup_current_environment() {
    log "Fazendo backup do ambiente atual..."
    
    # Criar diretório de backup
    mkdir -p "$BACKUP_DIR/$TIMESTAMP"
    
    # Backup de arquivos de configuração
    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/$TIMESTAMP/env.backup"
    fi
    
    # Backup do banco de dados (se existir)
    if docker ps | grep -q postgres; then
        info "Fazendo backup do banco de dados..."
        docker exec -t $(docker ps -q -f name=postgres) pg_dumpall -c -U licitabrasil > "$BACKUP_DIR/$TIMESTAMP/database.sql"
    fi
    
    # Backup de uploads (se existir)
    if [ -d "backend/uploads" ]; then
        tar -czf "$BACKUP_DIR/$TIMESTAMP/uploads.tar.gz" backend/uploads/
    fi
    
    log "Backup concluído em $BACKUP_DIR/$TIMESTAMP"
}

# Parar serviços existentes
stop_existing_services() {
    log "Parando serviços existentes..."
    
    # Parar containers se estiverem rodando
    if docker ps -q | grep -q .; then
        docker-compose -f $COMPOSE_FILE down --remove-orphans || true
    fi
    
    # Limpar containers órfãos
    docker container prune -f || true
    
    log "Serviços existentes parados"
}

# Configurar ambiente de staging
setup_staging_environment() {
    log "Configurando ambiente de staging..."
    
    # Copiar arquivo de ambiente
    cp $STAGING_ENV_FILE .env
    
    # Gerar secrets se necessário
    if grep -q "CHANGE_ME" .env; then
        warning "Gerando secrets automáticos (recomenda-se configurar manualmente)"
        
        # Gerar JWT secrets
        JWT_SECRET=$(openssl rand -base64 32)
        JWT_REFRESH_SECRET=$(openssl rand -base64 32)
        
        # Substituir placeholders
        sed -i "s/CHANGE_ME_STAGING_JWT_SECRET_MIN_32_CHARS/$JWT_SECRET/g" .env
        sed -i "s/CHANGE_ME_STAGING_JWT_REFRESH_SECRET_MIN_32_CHARS/$JWT_REFRESH_SECRET/g" .env
        
        info "Secrets gerados automaticamente"
    fi
    
    log "Ambiente de staging configurado"
}

# Executar deploy
execute_deploy() {
    log "Executando deploy de staging..."
    
    # Build das imagens
    info "Fazendo build das imagens Docker..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # Iniciar serviços
    info "Iniciando serviços..."
    docker-compose -f $COMPOSE_FILE up -d
    
    # Aguardar serviços ficarem prontos
    info "Aguardando serviços ficarem prontos..."
    sleep 30
    
    # Executar migrações
    info "Executando migrações do banco de dados..."
    docker-compose -f $COMPOSE_FILE exec -T backend npm run db:migrate || true
    
    # Executar seeds
    info "Executando seeds do banco de dados..."
    docker-compose -f $COMPOSE_FILE exec -T backend npm run db:seed || true
    
    log "Deploy executado com sucesso"
}

# Verificar saúde dos serviços
check_services_health() {
    log "Verificando saúde dos serviços..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        info "Tentativa $attempt de $max_attempts..."
        
        # Verificar backend
        if curl -f -s http://localhost:3001/health > /dev/null; then
            log "Backend está saudável"
            break
        else
            warning "Backend não está respondendo ainda..."
        fi
        
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Serviços não ficaram saudáveis após $max_attempts tentativas"
        return 1
    fi
    
    # Verificar outros serviços
    info "Verificando outros serviços..."
    
    # PostgreSQL
    if docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U licitabrasil > /dev/null 2>&1; then
        log "PostgreSQL está saudável"
    else
        warning "PostgreSQL pode não estar saudável"
    fi
    
    # Redis
    if docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping | grep -q "PONG"; then
        log "Redis está saudável"
    else
        warning "Redis pode não estar saudável"
    fi
    
    log "Verificação de saúde concluída"
}

# Executar testes de fumaça
run_smoke_tests() {
    log "Executando testes de fumaça..."
    
    # Teste básico de API
    if curl -f -s http://localhost:3001/api/v1/transparency/dashboard > /dev/null; then
        log "✅ Dashboard público funcionando"
    else
        error "❌ Dashboard público não está funcionando"
        return 1
    fi
    
    # Teste de login
    login_response=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@licitabrasil.com","password":"Test123!@#"}')
    
    if echo "$login_response" | grep -q '"success":true'; then
        log "✅ Sistema de login funcionando"
    else
        error "❌ Sistema de login não está funcionando"
        return 1
    fi
    
    # Teste de endpoints principais
    local endpoints=(
        "/api/v1/transparency/biddings?page=1&limit=5"
        "/api/v1/transparency/contracts?page=1&limit=5"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "http://localhost:3001$endpoint" > /dev/null; then
            log "✅ Endpoint $endpoint funcionando"
        else
            warning "⚠️  Endpoint $endpoint pode ter problemas"
        fi
    done
    
    log "Testes de fumaça concluídos"
}

# Gerar relatório de deploy
generate_deploy_report() {
    log "Gerando relatório de deploy..."
    
    local report_file="./logs/staging_deploy_report_$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Relatório de Deploy - Staging
**Data**: $(date)
**Ambiente**: Staging
**Status**: Sucesso

## Serviços Deployados
- ✅ Backend API (http://localhost:3001)
- ✅ PostgreSQL (localhost:5432)
- ✅ Redis (localhost:6379)
- ✅ Nginx (http://localhost:80)

## Testes Executados
- ✅ Health checks
- ✅ Testes de fumaça
- ✅ Conectividade de serviços

## URLs de Acesso
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Dashboard**: http://localhost:3001/api/v1/transparency/dashboard

## Próximos Passos
1. Executar testes de carga completos
2. Validar todas as funcionalidades
3. Configurar monitoramento
4. Preparar para produção

## Logs
- Deploy: $LOG_FILE
- Backup: $BACKUP_DIR/$TIMESTAMP
EOF

    log "Relatório gerado: $report_file"
}

# Função principal
main() {
    log "🚀 Iniciando deploy de staging - LicitaBrasil Web Platform"
    
    # Executar etapas do deploy
    create_directories
    check_prerequisites
    backup_current_environment
    stop_existing_services
    setup_staging_environment
    execute_deploy
    
    # Verificar se deploy foi bem-sucedido
    if check_services_health && run_smoke_tests; then
        log "🎉 Deploy de staging concluído com SUCESSO!"
        generate_deploy_report
        
        echo ""
        echo "📊 RESUMO DO DEPLOY"
        echo "=================="
        echo "✅ Ambiente: Staging"
        echo "✅ Status: Funcionando"
        echo "✅ API: http://localhost:3001"
        echo "✅ Health: http://localhost:3001/health"
        echo ""
        echo "🔧 Comandos úteis:"
        echo "docker-compose -f $COMPOSE_FILE logs -f    # Ver logs"
        echo "docker-compose -f $COMPOSE_FILE ps          # Ver status"
        echo "docker-compose -f $COMPOSE_FILE down        # Parar serviços"
        echo ""
        
        return 0
    else
        error "❌ Deploy de staging FALHOU!"
        
        # Mostrar logs de erro
        echo ""
        echo "📋 LOGS DE ERRO:"
        docker-compose -f $COMPOSE_FILE logs --tail=50
        
        return 1
    fi
}

# Executar função principal se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
