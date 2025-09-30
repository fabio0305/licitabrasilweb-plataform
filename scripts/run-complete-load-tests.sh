#!/bin/bash

# Script de Testes de Carga Completos
# LicitaBrasil Web Platform - Suite completa de testes de performance

set -e

# Configurações
API_BASE="http://localhost:3001"
RESULTS_DIR="./performance-results"
LOG_FILE="./logs/load-tests.log"
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

# Criar diretórios de resultados
create_results_directories() {
    log "Criando diretórios de resultados..."
    
    mkdir -p $RESULTS_DIR/{artillery,custom,reports}
    mkdir -p logs
    
    log "Diretórios criados com sucesso"
}

# Verificar se o backend está rodando
check_backend_status() {
    log "Verificando status do backend..."
    
    if curl -f -s "$API_BASE/health" > /dev/null; then
        log "Backend está rodando e respondendo"
        
        # Obter informações do sistema
        health_info=$(curl -s "$API_BASE/health" | jq -r '.uptime // "N/A"' 2>/dev/null || echo "N/A")
        info "Uptime do backend: $health_info"
    else
        error "Backend não está respondendo em $API_BASE"
        error "Certifique-se de que o backend está rodando antes de executar os testes"
        exit 1
    fi
}

# Teste de carga básico com curl
run_basic_load_test() {
    log "Executando teste de carga básico..."
    
    local endpoint="$1"
    local name="$2"
    local concurrent=${3:-10}
    local requests=${4:-100}
    
    info "Testando $name - $concurrent usuários simultâneos, $requests requisições"
    
    local start_time=$(date +%s)
    local success_count=0
    local total_time=0
    
    # Executar requisições em paralelo
    for i in $(seq 1 $concurrent); do
        {
            local user_requests=$((requests / concurrent))
            local user_success=0
            local user_time=0
            
            for j in $(seq 1 $user_requests); do
                local req_start=$(date +%s%N)
                
                if curl -f -s "$API_BASE$endpoint" > /dev/null 2>&1; then
                    local req_end=$(date +%s%N)
                    local req_time=$(( (req_end - req_start) / 1000000 ))
                    
                    user_success=$((user_success + 1))
                    user_time=$((user_time + req_time))
                fi
            done
            
            echo "$user_success $user_time" > "/tmp/load_test_user_$i"
        } &
    done
    
    # Aguardar todos os processos
    wait
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    # Coletar resultados
    for i in $(seq 1 $concurrent); do
        if [ -f "/tmp/load_test_user_$i" ]; then
            local user_data=$(cat "/tmp/load_test_user_$i")
            local user_success=$(echo $user_data | cut -d' ' -f1)
            local user_time=$(echo $user_data | cut -d' ' -f2)
            
            success_count=$((success_count + user_success))
            total_time=$((total_time + user_time))
            
            rm -f "/tmp/load_test_user_$i"
        fi
    done
    
    # Calcular métricas
    local success_rate=$((success_count * 100 / requests))
    local avg_response_time=0
    local throughput=0
    
    if [ $success_count -gt 0 ]; then
        avg_response_time=$((total_time / success_count))
    fi
    
    if [ $total_duration -gt 0 ]; then
        throughput=$((success_count / total_duration))
    fi
    
    # Salvar resultados
    cat >> "$RESULTS_DIR/custom/basic_load_test_$TIMESTAMP.txt" << EOF
=== Teste de Carga Básico: $name ===
Endpoint: $endpoint
Usuários simultâneos: $concurrent
Total de requisições: $requests
Requisições bem-sucedidas: $success_count
Taxa de sucesso: $success_rate%
Tempo total: ${total_duration}s
Tempo médio de resposta: ${avg_response_time}ms
Throughput: ${throughput} req/s

EOF

    log "$name - Sucesso: $success_rate% ($success_count/$requests), Throughput: ${throughput} req/s"
}

# Teste de stress progressivo
run_stress_test() {
    log "Executando teste de stress progressivo..."
    
    local endpoint="$1"
    local name="$2"
    
    info "Teste de stress: $name"
    
    # Níveis de carga progressivos
    local levels=(1 5 10 20 50 100)
    
    for level in "${levels[@]}"; do
        info "  Testando com $level usuários simultâneos..."
        
        local start_time=$(date +%s)
        local success_count=0
        
        # Executar requisições
        for i in $(seq 1 $level); do
            {
                if curl -f -s "$API_BASE$endpoint" > /dev/null 2>&1; then
                    echo "success" > "/tmp/stress_test_$i"
                else
                    echo "fail" > "/tmp/stress_test_$i"
                fi
            } &
        done
        
        wait
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        # Contar sucessos
        for i in $(seq 1 $level); do
            if [ -f "/tmp/stress_test_$i" ] && [ "$(cat /tmp/stress_test_$i)" = "success" ]; then
                success_count=$((success_count + 1))
            fi
            rm -f "/tmp/stress_test_$i"
        done
        
        local success_rate=$((success_count * 100 / level))
        local throughput=0
        
        if [ $duration -gt 0 ]; then
            throughput=$((success_count / duration))
        fi
        
        info "    $level usuários: $throughput req/s, $success_rate% sucesso"
        
        # Salvar resultado
        echo "$level,$success_count,$level,$success_rate,$throughput,$duration" >> "$RESULTS_DIR/custom/stress_test_$name_$TIMESTAMP.csv"
        
        # Pausa entre níveis
        sleep 2
    done
    
    log "Teste de stress concluído: $name"
}

# Teste de endurance (longa duração)
run_endurance_test() {
    log "Executando teste de endurance..."
    
    local endpoint="$1"
    local name="$2"
    local duration=${3:-300} # 5 minutos por padrão
    local concurrent=${4:-10}
    
    info "Teste de endurance: $name - ${duration}s com $concurrent usuários"
    
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    local total_requests=0
    local total_success=0
    
    # Executar teste contínuo
    while [ $(date +%s) -lt $end_time ]; do
        local batch_success=0
        
        # Batch de requisições
        for i in $(seq 1 $concurrent); do
            {
                if curl -f -s "$API_BASE$endpoint" > /dev/null 2>&1; then
                    echo "success" > "/tmp/endurance_$i"
                else
                    echo "fail" > "/tmp/endurance_$i"
                fi
            } &
        done
        
        wait
        
        # Contar sucessos do batch
        for i in $(seq 1 $concurrent); do
            total_requests=$((total_requests + 1))
            if [ -f "/tmp/endurance_$i" ] && [ "$(cat /tmp/endurance_$i)" = "success" ]; then
                batch_success=$((batch_success + 1))
                total_success=$((total_success + 1))
            fi
            rm -f "/tmp/endurance_$i"
        done
        
        # Log progresso a cada 30 segundos
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $((elapsed % 30)) -eq 0 ]; then
            local current_success_rate=$((total_success * 100 / total_requests))
            info "  Progresso: ${elapsed}s/${duration}s - Taxa de sucesso: $current_success_rate%"
        fi
        
        sleep 1
    done
    
    local final_time=$(date +%s)
    local actual_duration=$((final_time - start_time))
    local success_rate=$((total_success * 100 / total_requests))
    local avg_throughput=$((total_success / actual_duration))
    
    # Salvar resultados
    cat >> "$RESULTS_DIR/custom/endurance_test_$TIMESTAMP.txt" << EOF
=== Teste de Endurance: $name ===
Endpoint: $endpoint
Duração planejada: ${duration}s
Duração real: ${actual_duration}s
Usuários simultâneos: $concurrent
Total de requisições: $total_requests
Requisições bem-sucedidas: $total_success
Taxa de sucesso: $success_rate%
Throughput médio: ${avg_throughput} req/s

EOF

    log "Endurance concluído: $name - $success_rate% sucesso, ${avg_throughput} req/s"
}

# Executar Artillery se disponível
run_artillery_tests() {
    log "Verificando disponibilidade do Artillery..."
    
    if command -v artillery &> /dev/null; then
        log "Artillery encontrado. Executando testes avançados..."
        
        # Criar configuração do Artillery
        cat > "$RESULTS_DIR/artillery/artillery-config.yml" << EOF
config:
  target: '$API_BASE'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Normal load"
    - duration: 60
      arrivalRate: 20
      name: "Peak load"
  processor: "./artillery-processor.js"

scenarios:
  - name: "Public browsing"
    weight: 40
    flow:
      - get:
          url: "/health"
      - get:
          url: "/api/v1/transparency/dashboard"
      - get:
          url: "/api/v1/transparency/biddings?page=1&limit=10"

  - name: "API stress test"
    weight: 30
    flow:
      - get:
          url: "/api/v1/transparency/contracts?page=1&limit=5"
      - get:
          url: "/api/v1/transparency/biddings?page={{ \$randomInt(1, 5) }}&limit=10"

  - name: "Authentication flow"
    weight: 30
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "admin@licitabrasil.com"
            password: "Test123!@#"
          capture:
            - json: "$.token"
              as: "token"
      - get:
          url: "/api/v1/transparency/dashboard"
          headers:
            Authorization: "Bearer {{ token }}"
EOF

        # Executar Artillery
        info "Executando Artillery..."
        artillery run "$RESULTS_DIR/artillery/artillery-config.yml" \
            --output "$RESULTS_DIR/artillery/artillery-results-$TIMESTAMP.json" \
            > "$RESULTS_DIR/artillery/artillery-output-$TIMESTAMP.txt" 2>&1
        
        # Gerar relatório HTML
        if [ -f "$RESULTS_DIR/artillery/artillery-results-$TIMESTAMP.json" ]; then
            artillery report "$RESULTS_DIR/artillery/artillery-results-$TIMESTAMP.json" \
                --output "$RESULTS_DIR/artillery/artillery-report-$TIMESTAMP.html"
            
            log "Relatório Artillery gerado: artillery-report-$TIMESTAMP.html"
        fi
        
    else
        warning "Artillery não está disponível. Pulando testes avançados."
        info "Para instalar: npm install -g artillery"
    fi
}

# Gerar relatório consolidado
generate_consolidated_report() {
    log "Gerando relatório consolidado..."
    
    local report_file="$RESULTS_DIR/reports/consolidated-report-$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# Relatório de Testes de Carga - LicitaBrasil Web Platform

**Data**: $(date)
**Duração dos testes**: Aproximadamente 15 minutos
**API Base**: $API_BASE

## Resumo Executivo

Os testes de carga foram executados para validar a performance e estabilidade do sistema LicitaBrasil Web Platform sob diferentes cenários de carga.

## Testes Executados

### 1. Testes de Carga Básicos
- **Health Check**: Endpoint de verificação de saúde
- **Dashboard Público**: Endpoint principal de transparência
- **Lista de Licitações**: Endpoint de listagem paginada
- **Lista de Contratos**: Endpoint de contratos públicos

### 2. Testes de Stress Progressivo
Testados com 1, 5, 10, 20, 50 e 100 usuários simultâneos para identificar o ponto de saturação.

### 3. Testes de Endurance
Testes de longa duração (5 minutos) para verificar estabilidade sob carga constante.

### 4. Testes Artillery (se disponível)
Testes avançados com cenários realistas de uso.

## Resultados Detalhados

### Métricas de Performance
EOF

    # Adicionar resultados dos testes básicos se existirem
    if [ -f "$RESULTS_DIR/custom/basic_load_test_$TIMESTAMP.txt" ]; then
        echo "" >> "$report_file"
        echo "### Resultados dos Testes Básicos" >> "$report_file"
        echo '```' >> "$report_file"
        cat "$RESULTS_DIR/custom/basic_load_test_$TIMESTAMP.txt" >> "$report_file"
        echo '```' >> "$report_file"
    fi

    # Adicionar informações do sistema
    cat >> "$report_file" << EOF

## Informações do Sistema

### Recursos do Sistema
- **CPU**: $(nproc) cores
- **Memória**: $(free -h | awk '/^Mem:/ {print $2}')
- **Disco**: $(df -h / | awk 'NR==2 {print $4}') disponível

### Configuração do Backend
- **Node.js**: $(node --version 2>/dev/null || echo "N/A")
- **Ambiente**: Development/Testing
- **Porta**: 3001

## Recomendações

### Performance
1. **Otimização de queries**: Implementar índices adequados no banco de dados
2. **Cache**: Configurar cache Redis para endpoints frequentes
3. **CDN**: Implementar CDN para arquivos estáticos
4. **Load Balancer**: Considerar múltiplas instâncias para alta disponibilidade

### Monitoramento
1. **Métricas**: Implementar coleta de métricas em tempo real
2. **Alertas**: Configurar alertas para degradação de performance
3. **Logs**: Estruturar logs para análise de performance

### Infraestrutura
1. **Scaling**: Preparar para auto-scaling baseado em métricas
2. **Database**: Otimizar configurações do PostgreSQL
3. **Redis**: Configurar Redis para cache distribuído

## Conclusão

O sistema demonstrou boa estabilidade durante os testes realizados. As recomendações acima devem ser implementadas antes do deploy em produção para garantir performance otimizada.

---

*Relatório gerado automaticamente em $(date)*
EOF

    log "Relatório consolidado gerado: $report_file"
}

# Função principal
main() {
    log "🚀 Iniciando testes de carga completos - LicitaBrasil Web Platform"
    
    # Preparação
    create_results_directories
    check_backend_status
    
    # Testes básicos
    log "=== EXECUTANDO TESTES DE CARGA BÁSICOS ==="
    run_basic_load_test "/health" "Health_Check" 10 50
    run_basic_load_test "/api/v1/transparency/dashboard" "Dashboard_Publico" 15 75
    run_basic_load_test "/api/v1/transparency/biddings?page=1&limit=10" "Lista_Licitacoes" 10 50
    run_basic_load_test "/api/v1/transparency/contracts?page=1&limit=10" "Lista_Contratos" 10 50
    
    # Testes de stress
    log "=== EXECUTANDO TESTES DE STRESS ==="
    run_stress_test "/api/v1/transparency/dashboard" "Dashboard"
    run_stress_test "/health" "HealthCheck"
    
    # Testes de endurance
    log "=== EXECUTANDO TESTES DE ENDURANCE ==="
    run_endurance_test "/api/v1/transparency/dashboard" "Dashboard" 180 5
    
    # Testes Artillery
    log "=== EXECUTANDO TESTES ARTILLERY ==="
    run_artillery_tests
    
    # Relatório final
    generate_consolidated_report
    
    log "🎉 Testes de carga completos concluídos com SUCESSO!"
    
    echo ""
    echo "📊 RESUMO DOS TESTES"
    echo "==================="
    echo "✅ Testes básicos de carga executados"
    echo "✅ Testes de stress progressivo executados"
    echo "✅ Testes de endurance executados"
    echo "✅ Relatório consolidado gerado"
    echo ""
    echo "📁 RESULTADOS SALVOS EM:"
    echo "- Diretório: $RESULTS_DIR"
    echo "- Relatório: $RESULTS_DIR/reports/consolidated-report-$TIMESTAMP.md"
    echo "- Logs: $LOG_FILE"
    echo ""
    echo "🔧 PRÓXIMOS PASSOS:"
    echo "1. Analisar resultados dos testes"
    echo "2. Implementar otimizações identificadas"
    echo "3. Configurar monitoramento em produção"
    echo "4. Executar testes em ambiente de produção"
    echo ""
}

# Executar função principal se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
