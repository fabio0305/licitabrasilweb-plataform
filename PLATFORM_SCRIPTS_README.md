# 🚀 Scripts de Gerenciamento da Plataforma LicitaBrasil Web

Este documento descreve os scripts de gerenciamento da plataforma LicitaBrasil Web criados para facilitar operações de inicialização, parada e reinicialização.

## 📋 Scripts Disponíveis

### 1. 🔄 `restart-platform.sh` - Reiniciar Plataforma
**Descrição:** Reinicia toda a plataforma LicitaBrasil Web, incluindo recompilação de código e cópia de arquivos.

**Uso:**
```bash
./restart-platform.sh
```

**Funcionalidades:**
- ✅ Verifica dependências (Docker, Docker Compose)
- ✅ Recompila backend TypeScript automaticamente
- ✅ Recompila frontend React automaticamente
- ✅ Reinicia todos os serviços Docker
- ✅ Copia arquivos compilados para containers
- ✅ Verifica status e saúde dos serviços
- ✅ Testa conectividade da plataforma
- ✅ Relatório completo de status

**Serviços Reiniciados:**
- Backend (API Node.js/TypeScript)
- Frontend (React/Nginx)
- PostgreSQL (Banco de Dados)
- Redis (Cache)
- Prometheus (Monitoramento)
- Grafana (Dashboards)
- Outros serviços de monitoramento

---

### 2. 🛑 `stop-platform.sh` - Parar Plataforma
**Descrição:** Para toda a plataforma LicitaBrasil Web de forma segura com opções avançadas.

**Uso:**
```bash
./stop-platform.sh [OPÇÕES]
```

**Opções:**
- `--force` - Para os serviços sem confirmação
- `--graceful` - Para os serviços de forma gradual
- `--backup` - Cria backup antes de parar
- `--cleanup` - Remove recursos não utilizados
- `--help, -h` - Mostra ajuda

**Exemplos:**
```bash
./stop-platform.sh                    # Parada normal com confirmação
./stop-platform.sh --force           # Parada forçada sem confirmação
./stop-platform.sh --graceful --backup # Parada gradual com backup
```

**Funcionalidades:**
- ✅ Confirmação de segurança antes de parar
- ✅ Backup automático de dados críticos (opcional)
- ✅ Parada gradual para evitar perda de dados
- ✅ Limpeza de recursos não utilizados (opcional)
- ✅ Verificação de status final
- ✅ Instruções para reinicialização

---

### 3. 🚀 `start-platform.sh` - Iniciar Plataforma
**Descrição:** Inicia toda a plataforma LicitaBrasil Web com verificações completas.

**Uso:**
```bash
./start-platform.sh [OPÇÕES]
```

**Opções:**
- `--build` - Força recompilação do código
- `--infrastructure-first` - Inicia infraestrutura primeiro
- `--help, -h` - Mostra ajuda

**Exemplos:**
```bash
./start-platform.sh                           # Inicialização normal
./start-platform.sh --build                   # Recompila e inicia
./start-platform.sh --infrastructure-first    # Inicia BD/Cache primeiro
```

**Funcionalidades:**
- ✅ Verificação de Docker e dependências
- ✅ Verificação de variáveis de ambiente
- ✅ Verificação de recursos do sistema
- ✅ Compilação automática (opcional)
- ✅ Inicialização ordenada de serviços
- ✅ Verificação de saúde dos serviços
- ✅ Teste de conectividade externa
- ✅ Informações úteis da plataforma

---

## 🔧 Características dos Scripts

### 🎨 Interface Visual
- **Cores diferenciadas** para diferentes tipos de mensagem
- **Cabeçalhos informativos** com data/hora
- **Indicadores de progresso** claros
- **Relatórios de status** detalhados

### 🛡️ Segurança
- **Verificações preliminares** antes de executar
- **Confirmações de segurança** para operações críticas
- **Backup automático** de dados importantes
- **Validação de dependências**

### 📊 Monitoramento
- **Verificação de saúde** de cada serviço
- **Teste de conectividade** externa
- **Relatórios de status** completos
- **Logs informativos** durante execução

### ⚡ Performance
- **Inicialização ordenada** de serviços
- **Parada gradual** para evitar perda de dados
- **Recompilação automática** quando necessário
- **Otimização de recursos**

---

## 📋 Pré-requisitos

### Sistema
- **Docker** instalado e rodando
- **Docker Compose** instalado
- **Bash** shell disponível
- **curl** para testes de conectividade

### Arquivos Necessários
- `docker-compose.yml` no diretório raiz
- `.env` (opcional, mas recomendado)
- Diretórios `backend/` e `frontend/` (se aplicável)

---

## 🚀 Fluxo de Uso Recomendado

### Desenvolvimento
```bash
# 1. Parar plataforma
./stop-platform.sh --graceful

# 2. Fazer alterações no código

# 3. Reiniciar com recompilação
./restart-platform.sh
```

### Produção
```bash
# 1. Backup e parada segura
./stop-platform.sh --graceful --backup

# 2. Iniciar com verificações completas
./start-platform.sh --infrastructure-first
```

### Manutenção
```bash
# Parada para manutenção
./stop-platform.sh --force --cleanup

# Reinicialização após manutenção
./start-platform.sh --build
```

---

## 🔍 Troubleshooting

### Problemas Comuns

**1. Docker não está rodando**
```bash
sudo systemctl start docker
./start-platform.sh
```

**2. Serviços não iniciam**
```bash
./stop-platform.sh --force --cleanup
./start-platform.sh --build
```

**3. Problemas de conectividade**
```bash
./restart-platform.sh
# Aguardar 2-3 minutos para estabilização
```

**4. Espaço em disco insuficiente**
```bash
./stop-platform.sh --cleanup
docker system prune -f
./start-platform.sh
```

---

## 📊 URLs da Plataforma

Após inicialização bem-sucedida:

- **🌐 Website Principal:** https://licitabrasilweb.com.br
- **🔧 Painel Admin:** https://licitabrasilweb.com.br/admin
- **📊 API:** https://api.licitabrasilweb.com.br
- **📈 Grafana:** http://localhost:3000
- **📊 Prometheus:** http://localhost:9090

---

## 🆘 Suporte

Para problemas ou dúvidas:

1. **Verificar logs:** `docker-compose logs -f [serviço]`
2. **Status dos serviços:** `docker-compose ps`
3. **Reinicialização completa:** `./restart-platform.sh`
4. **Consultar documentação** do projeto

---

## 📝 Notas Importantes

- ⚠️ **Sempre fazer backup** antes de operações críticas
- ⚠️ **Aguardar estabilização** após inicialização (2-3 minutos)
- ⚠️ **Verificar recursos** do sistema antes de iniciar
- ⚠️ **Usar `--graceful`** para paradas em produção

---

**Criado para LicitaBrasil Web Platform**  
*Scripts de gerenciamento automatizado para máxima eficiência operacional*
