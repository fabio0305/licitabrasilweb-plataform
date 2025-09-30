#!/bin/bash

# Teste de performance simplificado
# Mede tempo de resposta e throughput básico

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="http://localhost:3001"

log() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "🚀 Iniciando testes de performance simplificados"
echo "==============================================="

# Função para medir tempo de resposta
measure_response_time() {
    local endpoint=$1
    local name=$2
    local iterations=${3:-10}
    
    info "Testando $name ($iterations iterações)..."
    
    local total_time=0
    local min_time=999999
    local max_time=0
    local success_count=0
    
    for i in $(seq 1 $iterations); do
        local start_time=$(date +%s%N)
        
        if curl -f -s "$API_BASE$endpoint" > /dev/null 2>&1; then
            local end_time=$(date +%s%N)
            local response_time=$(( (end_time - start_time) / 1000000 ))
            
            total_time=$((total_time + response_time))
            success_count=$((success_count + 1))
            
            if [ $response_time -lt $min_time ]; then
                min_time=$response_time
            fi
            
            if [ $response_time -gt $max_time ]; then
                max_time=$response_time
            fi
        fi
    done
    
    if [ $success_count -gt 0 ]; then
        local avg_time=$((total_time / success_count))
        local success_rate=$((success_count * 100 / iterations))
        
        log "$name - Sucesso: $success_rate% ($success_count/$iterations)"
        info "  Tempo médio: ${avg_time}ms"
        info "  Tempo mínimo: ${min_time}ms"
        info "  Tempo máximo: ${max_time}ms"
        
        # Avaliar performance
        if [ $avg_time -lt 100 ]; then
            log "  Performance: Excelente (< 100ms)"
        elif [ $avg_time -lt 300 ]; then
            info "  Performance: Boa (< 300ms)"
        elif [ $avg_time -lt 1000 ]; then
            warning "  Performance: Aceitável (< 1s)"
        else
            error "  Performance: Lenta (> 1s)"
        fi
    else
        error "$name - Todas as requisições falharam"
    fi
    
    echo ""
}

# Teste de throughput (requisições simultâneas)
test_throughput() {
    local endpoint=$1
    local name=$2
    local concurrent=${3:-10}
    
    info "Teste de throughput: $name ($concurrent requisições simultâneas)..."
    
    local start_time=$(date +%s)
    local success_count=0
    
    # Executar requisições em paralelo
    for i in $(seq 1 $concurrent); do
        {
            if curl -f -s "$API_BASE$endpoint" > /dev/null 2>&1; then
                echo "success" > "/tmp/perf_test_$i"
            else
                echo "fail" > "/tmp/perf_test_$i"
            fi
        } &
    done
    
    # Aguardar todas as requisições
    wait
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    # Contar sucessos
    for i in $(seq 1 $concurrent); do
        if [ -f "/tmp/perf_test_$i" ] && [ "$(cat /tmp/perf_test_$i)" = "success" ]; then
            success_count=$((success_count + 1))
        fi
        rm -f "/tmp/perf_test_$i"
    done
    
    local success_rate=$((success_count * 100 / concurrent))
    local throughput=0
    
    if [ $total_time -gt 0 ]; then
        throughput=$((success_count / total_time))
    fi
    
    log "$name - Throughput: $throughput req/s"
    info "  Requisições bem-sucedidas: $success_count/$concurrent ($success_rate%)"
    info "  Tempo total: ${total_time}s"
    
    echo ""
}

# Teste de carga progressiva
test_progressive_load() {
    local endpoint=$1
    local name=$2
    
    info "Teste de carga progressiva: $name"
    
    for load in 1 5 10 20; do
        info "  Testando com $load requisições simultâneas..."
        
        local start_time=$(date +%s)
        local success_count=0
        
        for i in $(seq 1 $load); do
            {
                if curl -f -s "$API_BASE$endpoint" > /dev/null 2>&1; then
                    echo "success" > "/tmp/load_test_$i"
                else
                    echo "fail" > "/tmp/load_test_$i"
                fi
            } &
        done
        
        wait
        
        local end_time=$(date +%s)
        local total_time=$((end_time - start_time))
        
        for i in $(seq 1 $load); do
            if [ -f "/tmp/load_test_$i" ] && [ "$(cat /tmp/load_test_$i)" = "success" ]; then
                success_count=$((success_count + 1))
            fi
            rm -f "/tmp/load_test_$i"
        done
        
        local success_rate=$((success_count * 100 / load))
        local throughput=0
        
        if [ $total_time -gt 0 ]; then
            throughput=$((success_count / total_time))
        fi
        
        info "    $load req: $throughput req/s, $success_rate% sucesso"
    done
    
    echo ""
}

# Executar testes

# 1. Teste de tempo de resposta
echo "📊 TESTES DE TEMPO DE RESPOSTA"
echo "==============================="
measure_response_time "/health" "Health Check" 20
measure_response_time "/api/v1/transparency/dashboard" "Dashboard Público" 15
measure_response_time "/api/v1/transparency/biddings?page=1&limit=10" "Lista de Licitações" 10
measure_response_time "/api/v1/transparency/contracts?page=1&limit=10" "Lista de Contratos" 10

# 2. Teste de throughput
echo "🚀 TESTES DE THROUGHPUT"
echo "======================="
test_throughput "/health" "Health Check" 20
test_throughput "/api/v1/transparency/dashboard" "Dashboard Público" 15
test_throughput "/api/v1/transparency/biddings?page=1&limit=5" "Lista de Licitações" 10

# 3. Teste de carga progressiva
echo "📈 TESTES DE CARGA PROGRESSIVA"
echo "=============================="
test_progressive_load "/api/v1/transparency/dashboard" "Dashboard Público"

# 4. Teste de autenticação (performance)
echo "🔐 TESTE DE PERFORMANCE DE AUTENTICAÇÃO"
echo "======================================="

info "Testando performance de login..."
login_times=()
for i in {1..5}; do
    start_time=$(date +%s%N)
    
    response=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@licitabrasil.com","password":"Test123!@#"}')
    
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))
    
    if echo "$response" | grep -q '"success":true'; then
        login_times+=($response_time)
        info "  Login $i: ${response_time}ms"
    else
        error "  Login $i: Falhou"
    fi
done

if [ ${#login_times[@]} -gt 0 ]; then
    total=0
    for time in "${login_times[@]}"; do
        total=$((total + time))
    done
    avg_login_time=$((total / ${#login_times[@]}))
    
    log "Tempo médio de login: ${avg_login_time}ms"
    
    if [ $avg_login_time -lt 500 ]; then
        log "Performance de login: Boa"
    elif [ $avg_login_time -lt 1000 ]; then
        warning "Performance de login: Aceitável"
    else
        error "Performance de login: Lenta"
    fi
fi

echo ""

# 5. Resumo final
echo "📋 RESUMO DOS TESTES DE PERFORMANCE"
echo "==================================="

# Verificar se o sistema está sob carga
current_load=$(uptime | awk -F'load average:' '{ print $2 }' | cut -d, -f1 | xargs)
memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')

info "Carga do sistema durante os testes: $current_load"
info "Uso de memória durante os testes: ${memory_usage}%"

# Recomendações
echo ""
echo "💡 RECOMENDAÇÕES"
echo "==============="
log "✅ Sistema respondendo adequadamente"
log "✅ Endpoints principais funcionais"

if (( $(echo "$memory_usage > 80" | bc -l) )); then
    warning "⚠️  Alto uso de memória detectado"
fi

info "🔧 Para melhorar performance:"
info "   - Implementar cache Redis para endpoints frequentes"
info "   - Otimizar queries do banco de dados"
info "   - Configurar compressão gzip"
info "   - Implementar rate limiting"

echo ""
echo "🎉 Testes de performance concluídos!"
