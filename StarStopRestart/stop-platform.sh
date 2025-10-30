#!/bin/bash

# =============================================================================
# SCRIPT: Stop Platform - LicitaBrasil Web
# DESCRIÇÃO: Para toda a plataforma LicitaBrasil Web usando Docker Compose
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
    echo -e "${PURPLE}                     LICITABRASIL WEB - STOP PLATFORM                      ${NC}"
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

# Função para mostrar status atual dos serviços
show_current_status() {
    print_status "Status atual dos serviços:"
    echo ""
    docker-compose ps
    echo ""
}

# Função para confirmar parada dos serviços
confirm_stop() {
    echo -e "${YELLOW}⚠️  ATENÇÃO: Esta ação irá parar TODOS os serviços da plataforma LicitaBrasil Web!${NC}"
    echo ""
    echo -e "${RED}Serviços que serão parados:${NC}"
    echo -e "${CYAN}  • Backend (API)${NC}"
    echo -e "${CYAN}  • Frontend (Website)${NC}"
    echo -e "${CYAN}  • Nginx (Proxy Reverso)${NC}"
    echo -e "${CYAN}  • PostgreSQL (Banco de Dados)${NC}"
    echo -e "${CYAN}  • Redis (Cache)${NC}"
    echo -e "${CYAN}  • Prometheus (Monitoramento)${NC}"
    echo -e "${CYAN}  • Grafana (Dashboards)${NC}"
    echo -e "${CYAN}  • Outros serviços de monitoramento${NC}"
    echo ""
    echo -e "${YELLOW}A plataforma ficará INDISPONÍVEL até ser reiniciada!${NC}"
    echo ""
    
    read -p "Tem certeza que deseja continuar? (s/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_warning "Operação cancelada pelo usuário"
        exit 0
    fi
    
    print_status "Confirmação recebida, prosseguindo com a parada dos serviços..."
}

# Função para fazer backup de dados críticos (opcional)
backup_critical_data() {
    print_status "Verificando se é necessário fazer backup de dados críticos..."
    
    # Criar diretório de backup se não existir
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    
    if [ "$1" = "--backup" ]; then
        print_status "Criando backup de dados críticos..."
        mkdir -p "$BACKUP_DIR"
        
        # Backup do banco de dados PostgreSQL
        print_status "Fazendo backup do banco de dados..."
        docker exec licitabrasil-postgres pg_dumpall -U postgres > "$BACKUP_DIR/postgres_backup.sql" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            print_success "Backup do banco de dados criado: $BACKUP_DIR/postgres_backup.sql"
        else
            print_warning "Falha ao criar backup do banco de dados"
        fi
        
        # Backup de configurações importantes
        if [ -f ".env" ]; then
            cp .env "$BACKUP_DIR/env_backup"
            print_success "Backup das variáveis de ambiente criado"
        fi
        
        if [ -f "docker-compose.yml" ]; then
            cp docker-compose.yml "$BACKUP_DIR/docker-compose_backup.yml"
            print_success "Backup do docker-compose criado"
        fi
        
        print_success "Backup completo salvo em: $BACKUP_DIR"
    else
        print_status "Backup não solicitado (use --backup para criar backup automático)"
    fi
}

# Função para parar os serviços gradualmente
stop_services_gracefully() {
    print_status "Parando serviços de forma gradual para evitar perda de dados..."
    
    # Parar serviços de aplicação primeiro
    print_status "Parando serviços de aplicação..."
    docker-compose stop nginx backend 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Serviços de aplicação parados"
    else
        print_warning "Alguns serviços de aplicação podem não ter parado corretamente"
    fi
    
    # Aguardar um pouco para conexões finalizarem
    sleep 5
    
    # Parar serviços de dados
    print_status "Parando serviços de dados..."
    docker-compose stop postgres redis 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Serviços de dados parados"
    else
        print_warning "Alguns serviços de dados podem não ter parado corretamente"
    fi
    
    # Parar todos os outros serviços
    print_status "Parando serviços restantes..."
    docker-compose stop
    
    if [ $? -eq 0 ]; then
        print_success "Todos os serviços foram parados"
    else
        print_error "Falha ao parar alguns serviços"
        return 1
    fi
}

# Função para parar todos os serviços de uma vez
stop_all_services() {
    print_status "Parando todos os serviços da plataforma..."
    
    docker-compose stop
    
    if [ $? -eq 0 ]; then
        print_success "Todos os serviços foram parados"
    else
        print_error "Falha ao parar os serviços"
        return 1
    fi
}

# Função para verificar se todos os serviços pararam
verify_services_stopped() {
    print_status "Verificando se todos os serviços pararam..."
    echo ""
    
    # Mostrar status final
    docker-compose ps
    
    echo ""
    
    # Verificar serviços específicos
    RUNNING_SERVICES=$(docker-compose ps --services --filter "status=running" 2>/dev/null)
    
    if [ -z "$RUNNING_SERVICES" ]; then
        print_success "Todos os serviços foram parados com sucesso"
        return 0
    else
        print_warning "Alguns serviços ainda estão rodando:"
        echo "$RUNNING_SERVICES"
        return 1
    fi
}

# Função para limpeza opcional
cleanup_resources() {
    if [ "$1" = "--cleanup" ]; then
        print_status "Executando limpeza de recursos..."
        
        # Remover containers parados
        print_status "Removendo containers parados..."
        docker-compose rm -f 2>/dev/null
        
        # Limpar volumes órfãos (cuidado!)
        print_status "Limpando volumes órfãos..."
        docker volume prune -f 2>/dev/null
        
        # Limpar redes não utilizadas
        print_status "Limpando redes não utilizadas..."
        docker network prune -f 2>/dev/null
        
        print_success "Limpeza de recursos concluída"
    else
        print_status "Limpeza não solicitada (use --cleanup para limpeza automática)"
    fi
}

# Função para mostrar informações de como reiniciar
show_restart_info() {
    echo ""
    echo -e "${CYAN}📋 Para reiniciar a plataforma, use um dos seguintes comandos:${NC}"
    echo -e "${GREEN}   ./start-platform.sh${NC}     - Iniciar todos os serviços"
    echo -e "${GREEN}   ./restart-platform.sh${NC}   - Reiniciar todos os serviços"
    echo -e "${GREEN}   docker-compose up -d${NC}    - Comando Docker Compose direto"
    echo ""
}

# Função principal
main() {
    print_header
    
    print_status "Iniciando parada da plataforma LicitaBrasil Web..."
    echo ""
    
    # Verificações preliminares
    check_docker_compose
    check_compose_file
    
    echo ""
    
    # Mostrar status atual
    show_current_status
    
    # Confirmar ação (apenas se não for modo silencioso)
    if [ "$1" != "--force" ]; then
        confirm_stop
        echo ""
    fi
    
    # Backup opcional
    backup_critical_data "$@"
    
    echo ""
    
    # Parar serviços
    if [ "$1" = "--graceful" ] || [ "$2" = "--graceful" ]; then
        stop_services_gracefully
    else
        stop_all_services
    fi
    
    echo ""
    
    # Verificar se pararam
    verify_services_stopped
    
    echo ""
    
    # Limpeza opcional
    cleanup_resources "$@"
    
    # Mostrar informações de reinicialização
    show_restart_info
    
    echo ""
    print_success "Parada da plataforma concluída!"
    echo -e "${PURPLE}=============================================================================${NC}"
    echo -e "${RED}🛑 Plataforma LicitaBrasil Web foi parada com sucesso!${NC}"
    echo -e "${YELLOW}⚠️  A plataforma está INDISPONÍVEL até ser reiniciada${NC}"
    echo -e "${CYAN}🔄 Use ./start-platform.sh para reiniciar${NC}"
    echo -e "${PURPLE}=============================================================================${NC}"
}

# Mostrar ajuda se solicitado
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Uso: $0 [OPÇÕES]"
    echo ""
    echo "Opções:"
    echo "  --force      Para os serviços sem confirmação"
    echo "  --graceful   Para os serviços de forma gradual"
    echo "  --backup     Cria backup antes de parar"
    echo "  --cleanup    Remove recursos não utilizados"
    echo "  --help, -h   Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0                    # Parada normal com confirmação"
    echo "  $0 --force           # Parada forçada sem confirmação"
    echo "  $0 --graceful --backup # Parada gradual com backup"
    exit 0
fi

# Executar função principal
main "$@"
