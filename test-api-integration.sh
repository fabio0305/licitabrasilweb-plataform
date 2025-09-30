#!/bin/bash

# Teste de integração da API LicitaBrasil
# Valida os endpoints principais e funcionalidades

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="http://localhost:3001/api/v1"
TOKEN=""

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

# Função para fazer requisições
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    
    if [ -n "$headers" ]; then
        curl -s -X "$method" "$API_BASE$endpoint" -H "Content-Type: application/json" -H "$headers" ${data:+-d "$data"}
    else
        curl -s -X "$method" "$API_BASE$endpoint" -H "Content-Type: application/json" ${data:+-d "$data"}
    fi
}

echo "🧪 Iniciando testes de integração da API LicitaBrasil"
echo "=================================================="

# Teste 1: Health Check
echo ""
info "Teste 1: Health Check"
response=$(curl -s http://localhost:3001/health)
if echo "$response" | grep -q '"status":"OK"'; then
    log "Health check passou"
else
    error "Health check falhou"
    echo "$response"
fi

# Teste 2: Dashboard público
echo ""
info "Teste 2: Dashboard público"
response=$(make_request GET "/transparency/dashboard")
if echo "$response" | grep -q '"success":true'; then
    log "Dashboard público obtido com sucesso"
    total_biddings=$(echo "$response" | grep -o '"totalBiddings":[0-9]*' | cut -d':' -f2)
    info "Total de licitações: $total_biddings"
else
    error "Falha ao obter dashboard público"
    echo "$response"
fi

# Teste 3: Login
echo ""
info "Teste 3: Login de usuário"
login_data='{"email":"admin@licitabrasil.com","password":"Test123!@#"}'
response=$(make_request POST "/auth/login" "$login_data")
if echo "$response" | grep -q '"success":true'; then
    log "Login realizado com sucesso"
    TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    user_name=$(echo "$response" | grep -o '"firstName":"[^"]*' | cut -d'"' -f4)
    user_role=$(echo "$response" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
    info "Usuário: $user_name"
    info "Role: $user_role"
    info "Token obtido: ${TOKEN:0:20}..."
else
    error "Falha no login"
    echo "$response"
    exit 1
fi

# Teste 4: Perfil do usuário (autenticado)
echo ""
info "Teste 4: Perfil do usuário"
response=$(make_request GET "/auth/profile" "" "Authorization: Bearer $TOKEN")
if echo "$response" | grep -q '"success":true'; then
    log "Perfil obtido com sucesso"
    email=$(echo "$response" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
    status=$(echo "$response" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    info "Email: $email"
    info "Status: $status"
else
    error "Falha ao obter perfil"
    echo "$response"
fi

# Teste 5: Licitações públicas
echo ""
info "Teste 5: Lista de licitações"
response=$(make_request GET "/transparency/biddings?page=1&limit=5")
if echo "$response" | grep -q '"success":true'; then
    log "Licitações obtidas com sucesso"
    total=$(echo "$response" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
    page=$(echo "$response" | grep -o '"page":[0-9]*' | cut -d':' -f2)
    info "Total encontrado: $total"
    info "Página atual: $page"
else
    error "Falha ao obter licitações"
    echo "$response"
fi

# Teste 6: Contratos públicos
echo ""
info "Teste 6: Lista de contratos"
response=$(make_request GET "/transparency/contracts?page=1&limit=5")
if echo "$response" | grep -q '"success":true'; then
    log "Contratos obtidos com sucesso"
    total=$(echo "$response" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
    info "Total encontrado: $total"
else
    error "Falha ao obter contratos"
    echo "$response"
fi

# Teste 7: Dashboard do fornecedor (autenticado)
echo ""
info "Teste 7: Dashboard do fornecedor"
response=$(make_request GET "/supplier-dashboard/dashboard" "" "Authorization: Bearer $TOKEN")
if echo "$response" | grep -q '"success":true'; then
    log "Dashboard do fornecedor obtido"
else
    warning "Dashboard do fornecedor não acessível (pode ser normal se usuário não for fornecedor)"
fi

# Teste 8: Busca de licitações
echo ""
info "Teste 8: Busca de licitações"
response=$(make_request GET "/transparency/biddings?search=tecnologia&page=1&limit=3")
if echo "$response" | grep -q '"success":true'; then
    log "Busca realizada com sucesso"
    total=$(echo "$response" | grep -o '"total":[0-9]*' | head -1 | cut -d':' -f2)
    info "Resultados encontrados: $total"
else
    error "Falha na busca"
    echo "$response"
fi

# Teste 9: CORS Headers
echo ""
info "Teste 9: Verificação de headers CORS"
headers=$(curl -s -I -X OPTIONS "$API_BASE/transparency/dashboard" -H "Origin: http://localhost:3000")
if echo "$headers" | grep -q "Access-Control-Allow-Origin"; then
    log "Headers CORS configurados"
else
    warning "Headers CORS podem não estar configurados"
fi

# Teste 10: Rate Limiting (fazer várias requisições rápidas)
echo ""
info "Teste 10: Rate Limiting"
rate_limit_test=true
for i in {1..10}; do
    response=$(make_request GET "/transparency/dashboard")
    if echo "$response" | grep -q "rate limit"; then
        log "Rate limiting funcionando (requisição $i bloqueada)"
        rate_limit_test=false
        break
    fi
done

if [ "$rate_limit_test" = true ]; then
    info "Rate limiting não ativado ou limite alto (10 requisições passaram)"
fi

# Teste 11: Logout
echo ""
info "Teste 11: Logout"
response=$(make_request POST "/auth/logout" "" "Authorization: Bearer $TOKEN")
if echo "$response" | grep -q '"success":true'; then
    log "Logout realizado com sucesso"
else
    warning "Logout pode ter falhado"
    echo "$response"
fi

# Teste 12: Acesso após logout (deve falhar)
echo ""
info "Teste 12: Acesso após logout (deve falhar)"
response=$(make_request GET "/auth/profile" "" "Authorization: Bearer $TOKEN")
if echo "$response" | grep -q '"success":false'; then
    log "Acesso negado corretamente após logout"
else
    error "Erro: Acesso ainda permitido após logout"
    echo "$response"
fi

echo ""
echo "🎉 Testes de integração concluídos!"
echo "=================================================="
