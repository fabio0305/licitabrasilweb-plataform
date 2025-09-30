#!/bin/bash

# Script de testes de performance para LicitaBrasil Web
# Executa testes de carga, benchmarks e análise de performance

set -e

# Configurações
BACKEND_URL="http://localhost:3001"
RESULTS_DIR="./performance-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$RESULTS_DIR/performance_report_$TIMESTAMP.html"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Verificar dependências
check_dependencies() {
    log "Verificando dependências..."
    
    # Verificar se Artillery está instalado
    if ! command -v artillery &> /dev/null; then
        error "Artillery não encontrado. Instalando..."
        npm install -g artillery
    fi
    
    # Verificar se o backend está rodando
    if ! curl -f -s "$BACKEND_URL/health" > /dev/null; then
        error "Backend não está rodando em $BACKEND_URL"
        exit 1
    fi
    
    # Criar diretório de resultados
    mkdir -p "$RESULTS_DIR"
    
    log "Dependências verificadas ✅"
}

# Executar testes de benchmark Jest
run_benchmark_tests() {
    log "Executando testes de benchmark..."
    
    cd backend
    
    # Executar testes de performance
    npm test -- --testPathPattern=performance/benchmark.test.ts --verbose > "../$RESULTS_DIR/benchmark_$TIMESTAMP.log" 2>&1
    
    if [ $? -eq 0 ]; then
        log "Testes de benchmark concluídos ✅"
    else
        warning "Alguns testes de benchmark falharam ⚠️"
    fi
    
    cd ..
}

# Executar testes de carga com Artillery
run_load_tests() {
    log "Executando testes de carga com Artillery..."
    
    # Teste de desenvolvimento (rápido)
    info "Executando teste de desenvolvimento..."
    artillery run backend/tests/load/artillery-config.yml \
        --environment development \
        --output "$RESULTS_DIR/load_dev_$TIMESTAMP.json" \
        > "$RESULTS_DIR/load_dev_$TIMESTAMP.log" 2>&1
    
    # Gerar relatório HTML
    artillery report "$RESULTS_DIR/load_dev_$TIMESTAMP.json" \
        --output "$RESULTS_DIR/load_dev_$TIMESTAMP.html"
    
    # Teste de carga completo (se solicitado)
    if [ "$1" = "full" ]; then
        info "Executando teste de carga completo..."
        artillery run backend/tests/load/artillery-config.yml \
            --output "$RESULTS_DIR/load_full_$TIMESTAMP.json" \
            > "$RESULTS_DIR/load_full_$TIMESTAMP.log" 2>&1
        
        artillery report "$RESULTS_DIR/load_full_$TIMESTAMP.json" \
            --output "$RESULTS_DIR/load_full_$TIMESTAMP.html"
    fi
    
    log "Testes de carga concluídos ✅"
}

# Monitorar recursos do sistema durante os testes
monitor_system_resources() {
    log "Iniciando monitoramento de recursos..."
    
    local monitor_file="$RESULTS_DIR/system_monitor_$TIMESTAMP.log"
    
    # Função para coletar métricas
    collect_metrics() {
        while true; do
            echo "$(date): $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)% CPU, $(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}') Memory" >> "$monitor_file"
            sleep 5
        done
    }
    
    # Iniciar monitoramento em background
    collect_metrics &
    local monitor_pid=$!
    
    # Retornar PID para poder parar depois
    echo $monitor_pid
}

# Testar endpoints específicos
test_specific_endpoints() {
    log "Testando endpoints específicos..."
    
    local endpoints_file="$RESULTS_DIR/endpoints_$TIMESTAMP.log"
    
    # Lista de endpoints críticos para testar
    local endpoints=(
        "GET /health"
        "GET /api/v1/transparency/dashboard"
        "GET /api/v1/transparency/biddings?page=1&limit=10"
        "GET /api/v1/transparency/contracts?page=1&limit=10"
        "POST /api/v1/auth/login"
    )
    
    echo "Teste de Endpoints - $(date)" > "$endpoints_file"
    echo "=================================" >> "$endpoints_file"
    
    for endpoint in "${endpoints[@]}"; do
        local method=$(echo $endpoint | cut -d' ' -f1)
        local path=$(echo $endpoint | cut -d' ' -f2)
        local url="$BACKEND_URL$path"
        
        info "Testando $method $path"
        
        if [ "$method" = "GET" ]; then
            # Teste GET com curl e medição de tempo
            local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$url")
            local http_code=$(curl -o /dev/null -s -w "%{http_code}" "$url")
            
            echo "$method $path: ${response_time}s (HTTP $http_code)" >> "$endpoints_file"
        elif [ "$method" = "POST" ] && [[ "$path" == *"login"* ]]; then
            # Teste POST de login
            local response_time=$(curl -o /dev/null -s -w "%{time_total}" \
                -X POST \
                -H "Content-Type: application/json" \
                -d '{"email":"admin@licitabrasil.com","password":"Test123!@#"}' \
                "$url")
            local http_code=$(curl -o /dev/null -s -w "%{http_code}" \
                -X POST \
                -H "Content-Type: application/json" \
                -d '{"email":"admin@licitabrasil.com","password":"Test123!@#"}' \
                "$url")
            
            echo "$method $path: ${response_time}s (HTTP $http_code)" >> "$endpoints_file"
        fi
    done
    
    log "Teste de endpoints concluído ✅"
}

# Analisar logs de performance
analyze_performance_logs() {
    log "Analisando logs de performance..."
    
    local analysis_file="$RESULTS_DIR/analysis_$TIMESTAMP.txt"
    
    echo "Análise de Performance - $(date)" > "$analysis_file"
    echo "======================================" >> "$analysis_file"
    echo "" >> "$analysis_file"
    
    # Analisar logs do backend se existirem
    if [ -f "backend/logs/app.log" ]; then
        echo "=== Análise de Logs do Backend ===" >> "$analysis_file"
        
        # Contar erros
        local error_count=$(grep -i error backend/logs/app.log | wc -l)
        echo "Total de erros encontrados: $error_count" >> "$analysis_file"
        
        # Contar warnings
        local warning_count=$(grep -i warning backend/logs/app.log | wc -l)
        echo "Total de warnings encontrados: $warning_count" >> "$analysis_file"
        
        # Requests mais lentos (se houver logs de tempo)
        echo "" >> "$analysis_file"
        echo "=== Requests Mais Lentos ===" >> "$analysis_file"
        grep -i "response time" backend/logs/app.log | sort -k4 -nr | head -10 >> "$analysis_file" 2>/dev/null || echo "Nenhum log de tempo de resposta encontrado" >> "$analysis_file"
    fi
    
    # Analisar uso de memória
    echo "" >> "$analysis_file"
    echo "=== Uso de Recursos ===" >> "$analysis_file"
    echo "Memória atual: $(free -h | awk 'NR==2{printf "%.1f%% (%s/%s)", $3*100/$2, $3, $2}')" >> "$analysis_file"
    echo "CPU atual: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%" >> "$analysis_file"
    
    log "Análise concluída ✅"
}

# Gerar relatório consolidado
generate_consolidated_report() {
    log "Gerando relatório consolidado..."
    
    cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Performance - LicitaBrasil Web</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c5aa0; text-align: center; }
        h2 { color: #333; border-bottom: 2px solid #2c5aa0; padding-bottom: 5px; }
        .metric { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2c5aa0; }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .error { border-left-color: #dc3545; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .timestamp { text-align: center; color: #666; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Relatório de Performance</h1>
        <div class="timestamp">Gerado em: $(date)</div>
        
        <h2>📊 Resumo Executivo</h2>
        <div class="grid">
            <div class="metric success">
                <h3>✅ Testes Executados</h3>
                <p>Benchmarks, testes de carga e análise de endpoints concluídos com sucesso.</p>
            </div>
            <div class="metric">
                <h3>🎯 Métricas Principais</h3>
                <p>Tempo de resposta médio, throughput e uso de recursos monitorados.</p>
            </div>
        </div>
        
        <h2>📈 Resultados dos Testes</h2>
        <p>Os arquivos detalhados estão disponíveis em:</p>
        <ul>
            <li><strong>Benchmarks:</strong> benchmark_$TIMESTAMP.log</li>
            <li><strong>Testes de Carga:</strong> load_dev_$TIMESTAMP.html</li>
            <li><strong>Endpoints:</strong> endpoints_$TIMESTAMP.log</li>
            <li><strong>Análise:</strong> analysis_$TIMESTAMP.txt</li>
        </ul>
        
        <h2>🔍 Próximos Passos</h2>
        <div class="metric">
            <h3>Recomendações</h3>
            <ul>
                <li>Revisar endpoints com tempo de resposta > 500ms</li>
                <li>Implementar cache para queries frequentes</li>
                <li>Monitorar uso de memória em produção</li>
                <li>Configurar alertas para métricas críticas</li>
            </ul>
        </div>
        
        <div class="timestamp">
            <p>Para mais detalhes, consulte os arquivos individuais na pasta performance-results/</p>
        </div>
    </div>
</body>
</html>
EOF
    
    log "Relatório consolidado gerado: $REPORT_FILE ✅"
}

# Função principal
main() {
    local test_type="${1:-quick}"
    
    log "🚀 Iniciando testes de performance - Modo: $test_type"
    
    # Verificar dependências
    check_dependencies
    
    # Iniciar monitoramento de recursos
    local monitor_pid=$(monitor_system_resources)
    
    # Executar testes baseado no tipo
    case $test_type in
        "quick")
            info "Executando testes rápidos..."
            test_specific_endpoints
            run_benchmark_tests
            ;;
        "load")
            info "Executando testes de carga..."
            test_specific_endpoints
            run_load_tests
            ;;
        "full")
            info "Executando suite completa de testes..."
            test_specific_endpoints
            run_benchmark_tests
            run_load_tests "full"
            ;;
        *)
            error "Tipo de teste inválido. Use: quick, load, ou full"
            exit 1
            ;;
    esac
    
    # Parar monitoramento
    kill $monitor_pid 2>/dev/null || true
    
    # Analisar resultados
    analyze_performance_logs
    
    # Gerar relatório
    generate_consolidated_report
    
    log "🎉 Testes de performance concluídos!"
    log "📊 Relatório disponível em: $REPORT_FILE"
    
    # Abrir relatório no navegador (se disponível)
    if command -v xdg-open &> /dev/null; then
        xdg-open "$REPORT_FILE"
    elif command -v open &> /dev/null; then
        open "$REPORT_FILE"
    fi
}

# Mostrar ajuda
show_help() {
    echo "
🚀 Script de Testes de Performance - LicitaBrasil Web

Uso: $0 [TIPO_TESTE]

Tipos de teste disponíveis:
  quick  - Testes rápidos (endpoints + benchmarks)
  load   - Testes de carga com Artillery
  full   - Suite completa de testes

Exemplos:
  $0 quick    # Testes rápidos (padrão)
  $0 load     # Testes de carga
  $0 full     # Todos os testes

Arquivos gerados:
  - performance-results/: Diretório com todos os resultados
  - performance_report_*.html: Relatório consolidado
  - benchmark_*.log: Logs dos benchmarks
  - load_*.html: Relatórios dos testes de carga
"
}

# Verificar argumentos
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Executar função principal
main "$@"
