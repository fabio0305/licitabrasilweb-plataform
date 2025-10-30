#!/bin/bash

# =============================================================================
# SCRIPT: Start Platform - LicitaBrasil Web
# DESCRIÇÃO: Inicia toda a plataforma LicitaBrasil Web usando Docker Compose
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
    echo -e "${PURPLE}                     LICITABRASIL WEB - START PLATFORM                     ${NC}"
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

# Função para verificar se Docker está rodando
check_docker() {
    if ! docker info &> /dev/null; then
        print_error "Docker não está rodando!"
        print_error "Por favor, inicie o Docker antes de continuar."
        exit 1
    fi
    print_success "Docker está rodando"
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

# Função para verificar variáveis de ambiente
check_environment() {
    print_status "Verificando variáveis de ambiente..."
    
    if [ -f ".env" ]; then
        print_success "Arquivo .env encontrado"
        
        # Verificar variáveis críticas (sem mostrar valores)
        if grep -q "DATABASE_URL" .env 2>/dev/null; then
            print_success "DATABASE_URL configurada"
        else
            print_warning "DATABASE_URL não encontrada no .env"
        fi
        
        if grep -q "JWT_SECRET" .env 2>/dev/null; then
            print_success "JWT_SECRET configurada"
        else
            print_warning "JWT_SECRET não encontrada no .env"
        fi
    else
        print_warning "Arquivo .env não encontrado"
        print_warning "Usando variáveis de ambiente padrão"
    fi
}

# Função para verificar recursos do sistema
check_system_resources() {
    print_status "Verificando recursos do sistema..."
    
    # Verificar espaço em disco
    DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        print_warning "Espaço em disco baixo: ${DISK_USAGE}% usado"
    else
        print_success "Espaço em disco adequado: ${DISK_USAGE}% usado"
    fi
    
    # Verificar memória disponível
    if command -v free &> /dev/null; then
        MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        if [ "$MEMORY_USAGE" -gt 90 ]; then
            print_warning "Uso de memória alto: ${MEMORY_USAGE}%"
        else
            print_success "Memória adequada: ${MEMORY_USAGE}% em uso"
        fi
    fi
}

# Função para mostrar status atual dos serviços
show_current_status() {
    print_status "Status atual dos serviços:"
    echo ""
    docker-compose ps
    echo ""
}

# Função para compilar o backend se necessário
build_backend() {
    print_status "Verificando se é necessário compilar o backend..."
    
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        if [ "$1" = "--build" ] || [ ! -d "backend/dist" ]; then
            print_status "Compilando backend TypeScript..."
            cd backend
            
            # Verificar se node_modules existe
            if [ ! -d "node_modules" ]; then
                print_status "Instalando dependências do backend..."
                npm install
            fi
            
            npm run build
            if [ $? -eq 0 ]; then
                print_success "Backend compilado com sucesso"
            else
                print_error "Falha na compilação do backend"
                cd ..
                exit 1
            fi
            cd ..
        else
            print_success "Backend já compilado"
        fi
    else
        print_warning "Diretório backend não encontrado"
    fi
}

# Função para compilar o frontend se necessário
build_frontend() {
    print_status "Verificando se é necessário compilar o frontend..."
    
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        if [ "$1" = "--build" ] || [ ! -d "frontend/build" ]; then
            print_status "Compilando frontend React..."
            cd frontend
            
            # Verificar se node_modules existe
            if [ ! -d "node_modules" ]; then
                print_status "Instalando dependências do frontend..."
                npm install
            fi
            
            npm run build
            if [ $? -eq 0 ]; then
                print_success "Frontend compilado com sucesso"
            else
                print_error "Falha na compilação do frontend"
                cd ..
                exit 1
            fi
            cd ..
        else
            print_success "Frontend já compilado"
        fi
    else
        print_warning "Diretório frontend não encontrado"
    fi
}

# Função para iniciar serviços de infraestrutura primeiro
start_infrastructure_services() {
    print_status "Iniciando serviços de infraestrutura..."
    
    # Iniciar banco de dados e cache primeiro
    docker-compose up -d postgres redis
    
    if [ $? -eq 0 ]; then
        print_success "Serviços de infraestrutura iniciados"
    else
        print_error "Falha ao iniciar serviços de infraestrutura"
        return 1
    fi
    
    # Aguardar serviços ficarem prontos
    print_status "Aguardando serviços de infraestrutura ficarem prontos..."
    sleep 15
    
    # Verificar se PostgreSQL está pronto
    for i in {1..30}; do
        if docker exec licitabrasil-postgres pg_isready -U postgres &>/dev/null; then
            print_success "PostgreSQL está pronto"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "PostgreSQL pode não estar completamente pronto"
        fi
        sleep 2
    done
    
    # Verificar se Redis está pronto
    for i in {1..30}; do
        if docker exec licitabrasil-redis redis-cli ping &>/dev/null; then
            print_success "Redis está pronto"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Redis pode não estar completamente pronto"
        fi
        sleep 2
    done
}

# Função para iniciar todos os serviços
start_all_services() {
    print_status "Iniciando todos os serviços da plataforma..."
    
    if [ "$1" = "--infrastructure-first" ]; then
        start_infrastructure_services
        echo ""
        print_status "Iniciando serviços de aplicação..."
        docker-compose up -d
    else
        docker-compose up -d
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Todos os serviços foram iniciados"
    else
        print_error "Falha ao iniciar os serviços"
        return 1
    fi
}

# Função para copiar arquivos compilados para containers
copy_compiled_files() {
    print_status "Copiando arquivos compilados para containers..."
    
    # Aguardar containers estarem prontos
    sleep 10
    
    # Copiar backend compilado
    if [ -d "backend/dist" ]; then
        print_status "Copiando backend compilado..."
        docker cp backend/dist/. licitabrasil-backend:/app/dist/
        if [ $? -eq 0 ]; then
            print_success "Backend copiado para container"
            # Reiniciar backend para carregar novo código
            docker-compose restart backend
        else
            print_warning "Falha ao copiar backend"
        fi
    fi
    
    # Copiar frontend compilado
    if [ -d "frontend/build" ]; then
        print_status "Copiando frontend compilado..."
        docker cp frontend/build/. licitabrasil-nginx:/usr/share/nginx/html/
        if [ $? -eq 0 ]; then
            print_success "Frontend copiado para container"
        else
            print_warning "Falha ao copiar frontend"
        fi
    fi
}

# Função para verificar saúde dos serviços
check_services_health() {
    print_status "Verificando saúde dos serviços..."
    echo ""
    
    # Aguardar serviços estabilizarem
    sleep 20
    
    # Mostrar status dos serviços
    docker-compose ps
    
    echo ""
    print_status "Verificando saúde individual dos serviços..."
    
    # Verificar backend
    if docker ps --filter "name=licitabrasil-backend" --filter "status=running" | grep -q licitabrasil-backend; then
        # Testar endpoint de saúde
        if curl -s http://localhost:3001/health &>/dev/null; then
            print_success "Backend está saudável"
        else
            print_warning "Backend está rodando mas pode não estar respondendo"
        fi
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
        if docker exec licitabrasil-postgres pg_isready -U postgres &>/dev/null; then
            print_success "PostgreSQL está saudável"
        else
            print_warning "PostgreSQL está rodando mas pode não estar pronto"
        fi
    else
        print_error "PostgreSQL não está rodando"
    fi
    
    # Verificar redis
    if docker ps --filter "name=licitabrasil-redis" --filter "status=running" | grep -q licitabrasil-redis; then
        if docker exec licitabrasil-redis redis-cli ping &>/dev/null; then
            print_success "Redis está saudável"
        else
            print_warning "Redis está rodando mas pode não estar respondendo"
        fi
    else
        print_error "Redis não está rodando"
    fi
}

# Função para testar conectividade externa
test_external_connectivity() {
    print_status "Testando conectividade externa..."
    
    # Aguardar mais tempo para estabilização completa
    sleep 30
    
    # Testar website principal
    if curl -s -I https://licitabrasilweb.com.br | grep -q "200\|301\|302"; then
        print_success "Website principal acessível (https://licitabrasilweb.com.br)"
    else
        print_warning "Website principal pode não estar acessível externamente"
    fi
    
    # Testar API
    if curl -s -I https://api.licitabrasilweb.com.br/health | grep -q "200"; then
        print_success "API acessível (https://api.licitabrasilweb.com.br)"
    else
        print_warning "API pode não estar acessível externamente"
    fi
    
    # Testar Grafana
    if curl -s -I http://localhost:3000 | grep -q "200\|302"; then
        print_success "Grafana acessível (http://localhost:3000)"
    else
        print_warning "Grafana pode não estar acessível"
    fi
}

# Função para mostrar informações úteis
show_platform_info() {
    echo ""
    echo -e "${CYAN}📋 Informações da Plataforma:${NC}"
    echo -e "${GREEN}   🌐 Website Principal: https://licitabrasilweb.com.br${NC}"
    echo -e "${GREEN}   🔧 Painel Admin: https://licitabrasilweb.com.br/admin${NC}"
    echo -e "${GREEN}   📊 API: https://api.licitabrasilweb.com.br${NC}"
    echo -e "${GREEN}   📈 Grafana: http://localhost:3000${NC}"
    echo -e "${GREEN}   📊 Prometheus: http://localhost:9090${NC}"
    echo ""
    echo -e "${CYAN}🔧 Comandos Úteis:${NC}"
    echo -e "${YELLOW}   docker-compose logs -f [serviço]${NC}  - Ver logs em tempo real"
    echo -e "${YELLOW}   docker-compose ps${NC}                - Status dos serviços"
    echo -e "${YELLOW}   ./stop-platform.sh${NC}              - Parar a plataforma"
    echo -e "${YELLOW}   ./restart-platform.sh${NC}           - Reiniciar a plataforma"
    echo ""
}

# Função principal
main() {
    print_header
    
    print_status "Iniciando a plataforma LicitaBrasil Web..."
    echo ""
    
    # Verificações preliminares
    check_docker
    check_docker_compose
    check_compose_file
    check_environment
    check_system_resources
    
    echo ""
    
    # Mostrar status atual
    show_current_status
    
    # Compilação (se solicitada)
    build_backend "$@"
    build_frontend "$@"
    
    echo ""
    
    # Iniciar serviços
    start_all_services "$@"
    
    echo ""
    
    # Copiar arquivos compilados
    copy_compiled_files
    
    echo ""
    
    # Verificar saúde
    check_services_health
    
    echo ""
    
    # Testar conectividade
    test_external_connectivity
    
    # Mostrar informações úteis
    show_platform_info
    
    echo ""
    print_success "Inicialização da plataforma concluída!"
    echo -e "${PURPLE}=============================================================================${NC}"
    echo -e "${GREEN}🚀 Plataforma LicitaBrasil Web iniciada com sucesso!${NC}"
    echo -e "${CYAN}🌐 Acesse: https://licitabrasilweb.com.br${NC}"
    echo -e "${PURPLE}=============================================================================${NC}"
}

# Mostrar ajuda se solicitado
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Uso: $0 [OPÇÕES]"
    echo ""
    echo "Opções:"
    echo "  --build                 Força recompilação do código"
    echo "  --infrastructure-first  Inicia infraestrutura primeiro"
    echo "  --help, -h             Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0                           # Inicialização normal"
    echo "  $0 --build                   # Recompila e inicia"
    echo "  $0 --infrastructure-first    # Inicia BD/Cache primeiro"
    exit 0
fi

# Executar função principal
main "$@"
