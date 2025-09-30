# Guia de Infraestrutura - LicitaBrasil Web

## 🏗️ Arquitetura do Sistema

### Visão Geral
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │     Backend     │    │   PostgreSQL    │
│  (Reverse Proxy)│◄──►│   (Node.js)     │◄──►│   (Database)    │
│     Port 80     │    │   Port 3001     │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │      Redis      │              │
         │              │     (Cache)     │              │
         │              │   Port 6379     │              │
         │              └─────────────────┘              │
         │                                               │
         ▼                                               │
┌─────────────────┐                                     │
│    Frontend     │                                     │
│   (React/Vue)   │                                     │
│  Static Files   │                                     │
└─────────────────┘                                     │
                                                        │
                              ┌─────────────────┐       │
                              │   File Storage  │       │
                              │   (Uploads)     │       │
                              │   Volume Mount  │       │
                              └─────────────────┘       │
                                                        │
                              ┌─────────────────┐       │
                              │      Logs       │       │
                              │   (Monitoring)  │       │
                              │   Volume Mount  │       │
                              └─────────────────┘       │
```

## 🐳 Docker Configuration

### Containers
1. **licitabrasil-backend**: API Node.js
2. **licitabrasil-postgres**: Banco de dados PostgreSQL
3. **licitabrasil-redis**: Cache e sessões
4. **licitabrasil-nginx**: Reverse proxy e servidor web

### Volumes
- `postgres_data`: Dados persistentes do PostgreSQL
- `redis_data`: Dados persistentes do Redis
- `./backend/uploads`: Arquivos enviados pelos usuários
- `./backend/logs`: Logs da aplicação

### Networks
- `licitabrasil-network`: Rede interna para comunicação entre containers

## 🚀 Deploy

### Pré-requisitos
```bash
# Docker e Docker Compose
sudo apt update
sudo apt install docker.io docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Git para clonar o repositório
sudo apt install git
```

### Deploy de Produção
```bash
# 1. Clonar repositório
git clone https://github.com/fabio0305/licitabrasilweb-plataform.git
cd licitabrasilweb-plataform

# 2. Configurar variáveis de ambiente
cp .env.production .env
# Editar .env com valores reais

# 3. Executar deploy
./scripts/deploy.sh production
```

### Deploy de Desenvolvimento
```bash
# 1. Usar docker-compose de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# 2. Acessar serviços
# API: http://localhost:3001
# Adminer: http://localhost:8080
# Redis Commander: http://localhost:8081
```

## 🔧 Configuração de Ambiente

### Variáveis Críticas
```env
# Segurança - ALTERAR EM PRODUÇÃO
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
DB_PASSWORD=secure-database-password
REDIS_PASSWORD=secure-redis-password

# URLs
FRONTEND_URL=https://licitabrasilweb.com.br
CORS_ORIGINS=https://licitabrasilweb.com.br

# Email
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-email-password
```

### Configuração SSL/HTTPS
```bash
# 1. Obter certificados (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d licitabrasilweb.com.br

# 2. Copiar certificados
sudo cp /etc/letsencrypt/live/licitabrasilweb.com.br/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/licitabrasilweb.com.br/privkey.pem ./nginx/ssl/key.pem

# 3. Descomentar configuração HTTPS no nginx/conf.d/default.conf
```

## 📊 Monitoramento

### Health Checks
- **Backend**: `http://localhost:3001/health`
- **Nginx**: `http://localhost/health`
- **PostgreSQL**: `docker-compose exec postgres pg_isready`
- **Redis**: `docker-compose exec redis redis-cli ping`

### Script de Monitoramento
```bash
# Executar verificação manual
./scripts/monitor.sh

# Configurar cron para monitoramento automático
crontab -e
# Adicionar: */5 * * * * /path/to/project/scripts/monitor.sh
```

### Logs
```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f nginx

# Logs da aplicação
tail -f backend/logs/app.log
```

## 🔒 Segurança

### Configurações Implementadas
1. **Containers não-root**: Usuários específicos para cada serviço
2. **Rate Limiting**: Nginx configurado com limites por IP
3. **CORS**: Configurado para domínios específicos
4. **Headers de Segurança**: X-Frame-Options, X-XSS-Protection, etc.
5. **Validação de Input**: Joi schemas para todas as entradas
6. **JWT Tokens**: Com expiração e refresh automático

### Recomendações Adicionais
```bash
# 1. Firewall
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# 2. Fail2ban para proteção SSH
sudo apt install fail2ban

# 3. Backup automático
# Configurar script de backup no cron
```

## 💾 Backup e Recuperação

### Backup Manual
```bash
# Backup do banco de dados
docker-compose exec postgres pg_dump -U licitabrasil licita_brasil_web > backup.sql

# Backup de arquivos
tar -czf uploads_backup.tar.gz backend/uploads/
```

### Backup Automático
```bash
# Script de backup (já incluído em scripts/deploy.sh)
# Configurar no cron:
# 0 2 * * * /path/to/project/scripts/backup.sh
```

### Restauração
```bash
# Restaurar banco de dados
docker-compose exec -T postgres psql -U licitabrasil -d licita_brasil_web < backup.sql

# Restaurar arquivos
tar -xzf uploads_backup.tar.gz
```

## 📈 Performance

### Otimizações Implementadas
1. **Nginx**: Compressão gzip, cache de arquivos estáticos
2. **PostgreSQL**: Índices otimizados, connection pooling
3. **Redis**: Cache de sessões e dados frequentes
4. **Node.js**: Cluster mode, keep-alive connections

### Monitoramento de Performance
```bash
# Uso de recursos
docker stats

# Performance do banco
docker-compose exec postgres psql -U licitabrasil -d licita_brasil_web -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;"
```

## 🔄 CI/CD

### GitHub Actions (Exemplo)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.4
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/project
            git pull origin main
            ./scripts/deploy.sh production
```

## 🌐 Domínio e DNS

### Configuração DNS
```
# Registros A
licitabrasilweb.com.br.     A    YOUR_SERVER_IP
www.licitabrasilweb.com.br. A    YOUR_SERVER_IP

# Registro CNAME para subdomínios
api.licitabrasilweb.com.br. CNAME licitabrasilweb.com.br.
```

## 📱 Escalabilidade

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
    
  nginx:
    depends_on:
      - backend
    # Load balancer configuration
```

### Vertical Scaling
```yaml
# Limites de recursos
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## 🆘 Troubleshooting

### Problemas Comuns

#### Container não inicia
```bash
# Verificar logs
docker-compose logs container_name

# Verificar recursos
docker system df
docker system prune
```

#### Banco de dados não conecta
```bash
# Verificar se PostgreSQL está rodando
docker-compose exec postgres pg_isready

# Verificar configurações de rede
docker network ls
docker network inspect licitabrasil-network
```

#### Performance lenta
```bash
# Verificar uso de recursos
docker stats

# Verificar logs de erro
docker-compose logs | grep ERROR

# Verificar conexões do banco
docker-compose exec postgres psql -U licitabrasil -c "SELECT * FROM pg_stat_activity;"
```

## 📞 Suporte

### Comandos Úteis
```bash
# Status dos serviços
docker-compose ps

# Reiniciar serviço específico
docker-compose restart backend

# Executar comando em container
docker-compose exec backend npm run db:migrate

# Limpar sistema
docker system prune -a
```

### Contatos
- **Documentação**: Consulte este arquivo e a documentação da API
- **Logs**: Sempre verifique os logs antes de reportar problemas
- **Monitoramento**: Use o script de monitoramento para diagnósticos

---

**Infraestrutura preparada para produção com alta disponibilidade e segurança** 🚀
