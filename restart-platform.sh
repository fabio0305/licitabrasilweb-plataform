#!/bin/bash

# =============================================================================
# SCRIPT: Restart Platform - LicitaBrasil Web
# DESCRIÇÃO: Reinicia toda a plataforma LicitaBrasil Web usando Docker Compose
# AUTOR: Sistema LicitaBrasil
# DATA: $(date +"%Y-%m-%d")
# =============================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para imprimir cabeçalho
print_header() {
    echo -e "${PURPLE}=============================================================================${NC}"
    echo -e "${PURPLE}                    LICITABRASIL WEB - RESTART PLATFORM                    ${NC}"
    echo -e "${PURPLE}=============================================================================${NC}"
    echo -e "${CYAN}Data/Hora: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}Diretório: $(pwd)${NC}"
    echo ""
}

# Função para imprimir status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Função para imprimir sucesso
print_success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

# Função para imprimir aviso
print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Função para imprimir erro
print_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Função para verificar se Docker Compose está disponível
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose não encontrado!"
        print_error "Por favor, instale o Docker Compose antes de continuar."
        exit 1
    fi
    print_success "Docker Compose encontrado"
}

# Função para verificar se o arquivo docker-compose.yml existe
check_compose_file() {
    if [ ! -f "docker-compose.yml" ]; then
        print_error "Arquivo docker-compose.yml não encontrado no diretório atual!"
        print_error "Certifique-se de estar no diretório raiz do projeto."
        exit 1
    fi
    print_success "Arquivo docker-compose.yml encontrado"
}

# Função para recompilar o backend se necessário
rebuild_backend() {
    print_status "Verificando se é necessário recompilar o backend..."
    
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_status "Recompilando backend TypeScript..."
        cd backend
        npm run build
        if [ $? -eq 0 ]; then
            print_success "Backend recompilado com sucesso"
        else
            print_warning "Falha na recompilação do backend, continuando..."
        fi
        cd ..
    else
        print_warning "Diretório backend não encontrado, pulando recompilação"
    fi
}

# Função para recompilar o frontend se necessário
rebuild_frontend() {
    print_status "Verificando se é necessário recompilar o frontend..."
    
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Recompilando frontend React..."
        cd frontend
        npm run build
        if [ $? -eq 0 ]; then
            print_success "Frontend recompilado com sucesso"
        else
            print_warning "Falha na recompilação do frontend, continuando..."
        fi
        cd ..
    else
        print_warning "Diretório frontend não encontrado, pulando recompilação"
    fi
}

# Função para copiar arquivos compilados para containers
copy_compiled_files() {
    print_status "Copiando arquivos compilados para containers..."
    
    # Copiar backend compilado
    if [ -d "backend/dist" ]; then
        print_status "Copiando backend compilado..."
        docker cp backend/dist/. licitabrasil-backend:/app/dist/ 2>/dev/null
        if [ $? -eq 0 ]; then
            print_success "Backend copiado para container"
        else
            print_warning "Falha ao copiar backend (container pode não estar rodando)"
        fi
    fi
    
    # Copiar frontend compilado
    if [ -d "frontend/build" ]; then
        print_status "Copiando frontend compilado..."
        docker cp frontend/build/. licitabrasil-nginx:/usr/share/nginx/html/ 2>/dev/null
        if [ $? -eq 0 ]; then
            print_success "Frontend copiado para container"
        else
            print_warning "Falha ao copiar frontend (container pode não estar rodando)"
        fi
    fi
}

# Função para reiniciar os serviços
restart_services() {
    print_status "Reiniciando todos os serviços da plataforma..."
    
    # Reiniciar todos os serviços
    docker-compose restart
    
    if [ $? -eq 0 ]; then
        print_success "Todos os serviços foram reiniciados"
    else
        print_error "Falha ao reiniciar os serviços"
        exit 1
    fi
}

# Função para verificar status dos serviços
check_services_status() {
    print_status "Verificando status dos serviços..."
    echo ""
    
    # Aguardar alguns segundos para os serviços iniciarem
    sleep 10
    
    # Mostrar status dos serviços
    docker-compose ps
    
    echo ""
    print_status "Verificando saúde dos serviços principais..."
    
    # Verificar backend
    if docker ps --filter "name=licitabrasil-backend" --filter "status=running" | grep -q licitabrasil-backend; then
        print_success "Backend está rodando"
    else
        print_error "Backend não está rodando"
    fi
    
    # Verificar nginx
    if docker ps --filter "name=licitabrasil-nginx" --filter "status=running" | grep -q licitabrasil-nginx; then
        print_success "Nginx está rodando"
    else
        print_error "Nginx não está rodando"
    fi
    
    # Verificar postgres
    if docker ps --filter "name=licitabrasil-postgres" --filter "status=running" | grep -q licitabrasil-postgres; then
        print_success "PostgreSQL está rodando"
    else
        print_error "PostgreSQL não está rodando"
    fi
    
    # Verificar redis
    if docker ps --filter "name=licitabrasil-redis" --filter "status=running" | grep -q licitabrasil-redis; then
        print_success "Redis está rodando"
    else
        print_error "Redis não está rodando"
    fi
}

# Função para testar conectividade
test_connectivity() {
    print_status "Testando conectividade da plataforma..."
    
    # Aguardar mais tempo para os serviços estabilizarem
    sleep 15
    
    # Testar website principal
    if curl -s -I https://licitabrasilweb.com.br | grep -q "200"; then
        print_success "Website principal acessível (https://licitabrasilweb.com.br)"
    else
        print_warning "Website principal pode não estar acessível"
    fi
    
    # Testar API
    if curl -s -I https://api.licitabrasilweb.com.br/health | grep -q "200"; then
        print_success "API acessível (https://api.licitabrasilweb.com.br)"
    else
        print_warning "API pode não estar acessível"
    fi
}

# Função principal
main() {
    print_header
    
    print_status "Iniciando reinicialização da plataforma LicitaBrasil Web..."
    echo ""
    
    # Verificações preliminares
    check_docker_compose
    check_compose_file
    
    echo ""
    
    # Recompilação (opcional)
    rebuild_backend
    rebuild_frontend
    
    echo ""
    
    # Reiniciar serviços
    restart_services
    
    echo ""
    
    # Copiar arquivos compilados após reinicialização
    copy_compiled_files
    
    echo ""
    
    # Verificar status
    check_services_status
    
    echo ""
    
    # Testar conectividade
    test_connectivity
    
    echo ""
    print_success "Reinicialização da plataforma concluída!"
    echo -e "${PURPLE}=============================================================================${NC}"
    echo -e "${GREEN}✅ Plataforma LicitaBrasil Web reiniciada com sucesso!${NC}"
    echo -e "${CYAN}🌐 Website: https://licitabrasilweb.com.br${NC}"
    echo -e "${CYAN}🔧 Admin: https://licitabrasilweb.com.br/admin${NC}"
    echo -e "${CYAN}📊 Monitoramento: https://licitabrasilweb.com.br:3000 (Grafana)${NC}"
    echo -e "${PURPLE}=============================================================================${NC}"
}

# Executar função principal
main "$@"
