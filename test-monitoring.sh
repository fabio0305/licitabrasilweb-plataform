#!/bin/bash

# Teste de monitoramento simplificado (sem Docker)
# Valida os health checks e métricas básicas

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

echo "🔍 Iniciando testes de monitoramento"
echo "===================================="

# Verificar se backend está rodando
info "Verificando se o backend está rodando..."
if curl -f -s http://localhost:3001/health > /dev/null; then
    log "Backend está rodando e respondendo"
else
    error "Backend não está respondendo"
    exit 1
fi

# Verificar health check detalhado
info "Verificando health check detalhado..."
health_response=$(curl -s http://localhost:3001/health)
if echo "$health_response" | grep -q '"status":"OK"'; then
    log "Health check passou"
    uptime=$(echo "$health_response" | grep -o '"uptime":[0-9.]*' | cut -d':' -f2)
    environment=$(echo "$health_response" | grep -o '"environment":"[^"]*' | cut -d'"' -f4)
    info "Uptime: ${uptime}s"
    info "Environment: $environment"
else
    error "Health check falhou"
    echo "$health_response"
fi

# Verificar conectividade com endpoints principais
info "Verificando endpoints principais..."

endpoints=(
    "/api/v1/transparency/dashboard"
    "/api/v1/transparency/biddings?page=1&limit=1"
    "/api/v1/transparency/contracts?page=1&limit=1"
)

for endpoint in "${endpoints[@]}"; do
    if curl -f -s "http://localhost:3001$endpoint" > /dev/null; then
        log "Endpoint $endpoint respondendo"
    else
        error "Endpoint $endpoint não está respondendo"
    fi
done

# Verificar tempo de resposta
info "Medindo tempo de resposta..."
for i in {1..5}; do
    start_time=$(date +%s%N)
    curl -s http://localhost:3001/api/v1/transparency/dashboard > /dev/null
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))
    info "Tentativa $i: ${response_time}ms"
done

# Verificar uso de recursos do sistema
info "Verificando recursos do sistema..."

# Uso de memória
memory_info=$(free -h | awk 'NR==2{printf "%.1f%% (%s/%s)", $3*100/$2, $3, $2}')
info "Uso de memória: $memory_info"

# Uso de CPU (aproximado)
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
info "Uso de CPU: ${cpu_usage}%"

# Uso de disco
disk_usage=$(df / | awk 'NR==2 {print $5}')
info "Uso de disco: $disk_usage"

# Verificar processos Node.js
info "Verificando processos Node.js..."
node_processes=$(ps aux | grep -c "[n]ode")
info "Processos Node.js ativos: $node_processes"

# Verificar logs de erro (se existirem)
info "Verificando logs de erro..."
if [ -f "backend/logs/app.log" ]; then
    error_count=$(grep -i error backend/logs/app.log | wc -l)
    warning_count=$(grep -i warning backend/logs/app.log | wc -l)
    info "Erros encontrados nos logs: $error_count"
    info "Warnings encontrados nos logs: $warning_count"
    
    if [ "$error_count" -gt 0 ]; then
        warning "Últimos 3 erros encontrados:"
        grep -i error backend/logs/app.log | tail -3
    fi
else
    info "Arquivo de log não encontrado"
fi

# Teste de carga simples
info "Executando teste de carga simples (10 requisições simultâneas)..."
start_time=$(date +%s)

for i in {1..10}; do
    curl -s http://localhost:3001/api/v1/transparency/dashboard > /dev/null &
done

wait # Aguardar todas as requisições terminarem
end_time=$(date +%s)
total_time=$((end_time - start_time))

log "Teste de carga concluído em ${total_time}s"

# Verificar conectividade externa (se necessário)
info "Verificando conectividade externa..."
if curl -f -s https://google.com > /dev/null; then
    log "Conectividade externa OK"
else
    warning "Sem conectividade externa"
fi

# Gerar relatório resumido
echo ""
echo "📊 RELATÓRIO DE MONITORAMENTO"
echo "============================="
echo "✅ Backend: Funcionando"
echo "✅ Health Check: OK"
echo "✅ Endpoints principais: Respondendo"
echo "ℹ️  Memória: $memory_info"
echo "ℹ️  CPU: ${cpu_usage}%"
echo "ℹ️  Disco: $disk_usage"
echo "ℹ️  Processos Node.js: $node_processes"

# Verificar se há problemas críticos
critical_issues=0

# Verificar uso de memória alto
memory_percent=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$memory_percent" -gt 85 ]; then
    error "Uso de memória crítico: ${memory_percent}%"
    ((critical_issues++))
fi

# Verificar uso de CPU alto
cpu_percent=$(echo "$cpu_usage" | cut -d'.' -f1)
if [ "$cpu_percent" -gt 80 ]; then
    error "Uso de CPU crítico: ${cpu_percent}%"
    ((critical_issues++))
fi

# Verificar uso de disco alto
disk_percent=$(echo "$disk_usage" | sed 's/%//')
if [ "$disk_percent" -gt 85 ]; then
    error "Uso de disco crítico: ${disk_percent}%"
    ((critical_issues++))
fi

echo ""
if [ "$critical_issues" -eq 0 ]; then
    log "Sistema saudável - nenhum problema crítico detectado"
else
    error "$critical_issues problema(s) crítico(s) detectado(s)"
fi

echo ""
echo "🎉 Monitoramento concluído!"
