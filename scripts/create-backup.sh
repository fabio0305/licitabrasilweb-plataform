#!/bin/bash

# =====================================================================
# SCRIPT DE BACKUP - LICITABRASIL WEB PLATFORM
# =====================================================================
# 
# Este script cria um backup completo do banco de dados PostgreSQL
# antes de executar operações destrutivas como limpeza de dados.
# 
# Uso: ./scripts/create-backup.sh [nome-do-backup]
# 
# =====================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

# Configurações
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-cleanup-backup-$TIMESTAMP}"
BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql"
UPLOADS_BACKUP="$BACKUP_DIR/${BACKUP_NAME}-uploads.tar.gz"

# Verificar se o Docker está rodando
check_docker() {
    log "Verificando se o Docker está rodando..."
    
    if ! docker info >/dev/null 2>&1; then
        error "Docker não está rodando ou não está acessível"
        exit 1
    fi
    
    success "Docker está rodando"
}

# Verificar se o container PostgreSQL está rodando
check_postgres() {
    log "Verificando container PostgreSQL..."
    
    if ! docker ps | grep -q "licitabrasil-postgres"; then
        error "Container PostgreSQL não está rodando"
        echo "Execute: docker-compose up -d postgres"
        exit 1
    fi
    
    success "Container PostgreSQL está rodando"
}

# Criar diretório de backup
create_backup_dir() {
    log "Criando diretório de backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    success "Diretório de backup criado: $BACKUP_DIR"
}

# Fazer backup do banco de dados
backup_database() {
    log "Iniciando backup do banco de dados..."
    log "Arquivo de destino: $BACKUP_FILE"
    
    # Verificar se o arquivo já existe
    if [[ -f "$BACKUP_FILE" ]]; then
        warning "Arquivo de backup já existe: $BACKUP_FILE"
        read -p "Deseja sobrescrever? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            error "Backup cancelado pelo usuário"
            exit 1
        fi
    fi
    
    # Executar backup
    if docker-compose exec -T postgres pg_dump -U licitabrasil licita_brasil_web > "$BACKUP_FILE"; then
        # Verificar se o backup foi criado com sucesso
        if [[ -s "$BACKUP_FILE" ]]; then
            local file_size=$(du -h "$BACKUP_FILE" | cut -f1)
            success "Backup do banco de dados criado com sucesso"
            log "Tamanho do arquivo: $file_size"
        else
            error "Backup criado mas o arquivo está vazio"
            rm -f "$BACKUP_FILE"
            exit 1
        fi
    else
        error "Falha ao criar backup do banco de dados"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
}

# Fazer backup dos uploads
backup_uploads() {
    log "Verificando diretório de uploads..."
    
    local uploads_dir="$PROJECT_ROOT/backend/uploads"
    
    if [[ -d "$uploads_dir" ]] && [[ "$(ls -A "$uploads_dir" 2>/dev/null)" ]]; then
        log "Fazendo backup dos uploads..."
        
        if tar -czf "$UPLOADS_BACKUP" -C "$PROJECT_ROOT/backend" uploads/; then
            local file_size=$(du -h "$UPLOADS_BACKUP" | cut -f1)
            success "Backup dos uploads criado com sucesso"
            log "Tamanho do arquivo: $file_size"
        else
            warning "Falha ao criar backup dos uploads"
        fi
    else
        log "Diretório de uploads vazio ou não existe - pulando backup"
    fi
}

# Verificar integridade do backup
verify_backup() {
    log "Verificando integridade do backup..."
    
    # Verificar se o arquivo SQL é válido
    if head -n 10 "$BACKUP_FILE" | grep -q "PostgreSQL database dump"; then
        success "Backup do banco de dados parece válido"
    else
        error "Backup do banco de dados pode estar corrompido"
        exit 1
    fi
    
    # Contar linhas do backup
    local line_count=$(wc -l < "$BACKUP_FILE")
    log "Backup contém $line_count linhas"
    
    if [[ $line_count -lt 100 ]]; then
        warning "Backup parece muito pequeno - verifique se está completo"
    fi
}

# Gerar relatório do backup
generate_report() {
    local report_file="$BACKUP_DIR/${BACKUP_NAME}-report.txt"
    
    log "Gerando relatório do backup..."
    
    cat > "$report_file" << EOF
RELATÓRIO DE BACKUP - LICITABRASIL WEB PLATFORM
===============================================

Data/Hora: $(date)
Backup Name: $BACKUP_NAME

ARQUIVOS CRIADOS:
- Banco de dados: $BACKUP_FILE
$(if [[ -f "$UPLOADS_BACKUP" ]]; then echo "- Uploads: $UPLOADS_BACKUP"; fi)

TAMANHOS:
- Banco de dados: $(du -h "$BACKUP_FILE" | cut -f1)
$(if [[ -f "$UPLOADS_BACKUP" ]]; then echo "- Uploads: $(du -h "$UPLOADS_BACKUP" | cut -f1)"; fi)

VERIFICAÇÕES:
- Integridade do SQL: $(if head -n 10 "$BACKUP_FILE" | grep -q "PostgreSQL database dump"; then echo "OK"; else echo "FALHA"; fi)
- Linhas no backup: $(wc -l < "$BACKUP_FILE")

COMANDOS PARA RESTAURAÇÃO:
# Restaurar banco de dados:
docker-compose exec -T postgres psql -U licitabrasil -d licita_brasil_web < "$BACKUP_FILE"

# Restaurar uploads (se existir):
$(if [[ -f "$UPLOADS_BACKUP" ]]; then echo "tar -xzf \"$UPLOADS_BACKUP\" -C \"$PROJECT_ROOT/backend/\""; else echo "# Nenhum backup de uploads criado"; fi)

NOTAS:
- Pare o sistema antes de restaurar
- Verifique a integridade após restauração
- Mantenha este backup em local seguro

===============================================
EOF

    success "Relatório salvo em: $report_file"
}

# Limpar backups antigos (opcional)
cleanup_old_backups() {
    log "Verificando backups antigos..."
    
    # Manter apenas os últimos 10 backups
    local old_backups=$(find "$BACKUP_DIR" -name "*.sql" -type f -printf '%T@ %p\n' | sort -n | head -n -10 | cut -d' ' -f2-)
    
    if [[ -n "$old_backups" ]]; then
        warning "Encontrados backups antigos para limpeza:"
        echo "$old_backups"
        
        read -p "Deseja remover backups antigos? (s/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            echo "$old_backups" | while read -r file; do
                if [[ -f "$file" ]]; then
                    rm -f "$file"
                    # Remover arquivos relacionados
                    rm -f "${file%.sql}-uploads.tar.gz"
                    rm -f "${file%.sql}-report.txt"
                    log "Removido: $(basename "$file")"
                fi
            done
            success "Limpeza de backups antigos concluída"
        fi
    else
        log "Nenhum backup antigo para limpeza"
    fi
}

# Função principal
main() {
    echo "🗄️  CRIAÇÃO DE BACKUP - LICITABRASIL WEB PLATFORM"
    echo "═══════════════════════════════════════════════════"
    
    # Verificações iniciais
    check_docker
    check_postgres
    
    # Criar backup
    create_backup_dir
    backup_database
    backup_uploads
    verify_backup
    generate_report
    
    # Limpeza opcional
    cleanup_old_backups
    
    echo ""
    echo "═══════════════════════════════════════════════════"
    success "BACKUP CONCLUÍDO COM SUCESSO!"
    echo ""
    log "Arquivos criados:"
    log "  📄 Banco de dados: $BACKUP_FILE"
    if [[ -f "$UPLOADS_BACKUP" ]]; then
        log "  📁 Uploads: $UPLOADS_BACKUP"
    fi
    log "  📋 Relatório: $BACKUP_DIR/${BACKUP_NAME}-report.txt"
    echo ""
    log "Para restaurar este backup:"
    log "  docker-compose exec -T postgres psql -U licitabrasil -d licita_brasil_web < \"$BACKUP_FILE\""
    echo "═══════════════════════════════════════════════════"
}

# Verificar se está sendo executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
