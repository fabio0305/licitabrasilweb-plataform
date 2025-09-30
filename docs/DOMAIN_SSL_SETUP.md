# 🌐 Configuração de Domínio e SSL - LicitaBrasil Web Platform

## 📋 Visão Geral

Este documento descreve como configurar o domínio de produção e certificados SSL para o LicitaBrasil Web Platform.

## 🎯 Domínios Configurados

| Domínio | Propósito | Porta | SSL |
|---------|-----------|-------|-----|
| `licitabrasilweb.com.br` | Site principal | 443 | ✅ |
| `www.licitabrasilweb.com.br` | Alias do principal | 443 | ✅ |
| `api.licitabrasilweb.com.br` | API REST | 443 | ✅ |
| `monitoring.licitabrasilweb.com.br` | Grafana/Prometheus | 443 | ✅ |

## 🚀 Configuração Rápida

### Opção 1: Script Automatizado (Recomendado)

```bash
# Executar script principal
./scripts/setup-production-domain.sh
```

### Opção 2: Configuração Manual

1. **Configurar DNS**
2. **Escolher tipo de certificado**
3. **Executar script específico**
4. **Validar configuração**

## 📝 Pré-requisitos

### 1. Configuração DNS

Configure os seguintes registros DNS:

```dns
# Registros A (substitua X.X.X.X pelo IP do servidor)
licitabrasilweb.com.br.           A    X.X.X.X
www.licitabrasilweb.com.br.       A    X.X.X.X
api.licitabrasilweb.com.br.       A    X.X.X.X
monitoring.licitabrasilweb.com.br. A    X.X.X.X

# Opcional: Registro AAAA para IPv6
licitabrasilweb.com.br.           AAAA XXXX:XXXX:XXXX:XXXX::1
```

### 2. Ferramentas Necessárias

```bash
# Verificar se estão instaladas
which curl dig openssl docker docker-compose

# Instalar se necessário (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install curl dnsutils openssl
```

### 3. Containers Rodando

```bash
# Verificar status
docker-compose ps

# Iniciar se necessário
docker-compose up -d
```

## 🔐 Opções de Certificado SSL

### Opção 1: Let's Encrypt (Recomendado)

**Vantagens:**
- ✅ Gratuito
- ✅ Renovação automática
- ✅ Reconhecido por todos os navegadores
- ✅ Suporte a múltiplos domínios

**Configuração:**
```bash
./scripts/setup-ssl-letsencrypt.sh
```

**Requisitos:**
- Domínios devem apontar para o servidor
- Portas 80 e 443 abertas
- Email válido para notificações

### Opção 2: Certificado Comercial

**Vantagens:**
- ✅ Validação estendida (EV) disponível
- ✅ Suporte técnico
- ✅ Garantia financeira

**Configuração:**
```bash
./scripts/setup-ssl-commercial.sh
```

**Requisitos:**
- Certificado (.crt ou .pem)
- Chave privada (.key)
- Cadeia de certificados (recomendado)

### Opção 3: Auto-assinado (Apenas Teste)

**Uso:**
- ⚠️ Apenas para desenvolvimento/teste
- ❌ Não usar em produção

**Configuração:**
```bash
# Incluído no script principal
./scripts/setup-production-domain.sh
# Escolher opção 3
```

## 🔧 Configurações Implementadas

### 1. Nginx - Configurações de Segurança

```nginx
# Protocolos SSL modernos
ssl_protocols TLSv1.2 TLSv1.3;

# Ciphers seguros
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256...;

# Headers de segurança
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Content-Security-Policy "default-src 'self'...";
```

### 2. Rate Limiting

```nginx
# Zonas de rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=5r/s;
```

### 3. Redirecionamento HTTP → HTTPS

```nginx
# Redirecionamento automático
server {
    listen 80;
    server_name licitabrasilweb.com.br www.licitabrasilweb.com.br api.licitabrasilweb.com.br monitoring.licitabrasilweb.com.br;
    return 301 https://$server_name$request_uri;
}
```

## 🧪 Validação e Testes

### 1. Teste Automatizado

```bash
# Executar validação completa
./scripts/validate-domain-ssl.sh
```

### 2. Testes Manuais

```bash
# Testar conectividade
curl -I https://licitabrasilweb.com.br
curl -I https://api.licitabrasilweb.com.br
curl -I https://monitoring.licitabrasilweb.com.br

# Testar redirecionamento HTTP → HTTPS
curl -I http://licitabrasilweb.com.br

# Testar API
curl https://api.licitabrasilweb.com.br/health
```

### 3. Testes Externos

- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **ImmuniWeb**: https://www.immuniweb.com/ssl/
- **Security Headers**: https://securityheaders.com/

## 📊 Monitoramento

### 1. Logs do Nginx

```bash
# Logs de acesso
docker-compose logs nginx | grep "GET\|POST"

# Logs de erro
docker-compose logs nginx | grep "error"

# Logs SSL específicos
docker-compose exec nginx tail -f /var/log/nginx/access.log
```

### 2. Monitoramento de Certificados

```bash
# Verificar expiração
openssl x509 -in nginx/ssl/licitabrasil.crt -noout -enddate

# Script de monitoramento (adicionar ao cron)
./scripts/check-ssl-expiry.sh
```

### 3. Alertas

Configure alertas para:
- Expiração de certificados (30 dias antes)
- Falhas de renovação
- Problemas de conectividade SSL

## 🔄 Renovação de Certificados

### Let's Encrypt (Automática)

```bash
# Configurado automaticamente via cron
30 2 * * * /path/to/project/scripts/renew-ssl.sh

# Teste manual de renovação
certbot renew --dry-run
```

### Certificado Comercial (Manual)

1. Obter novo certificado do fornecedor
2. Executar script de instalação:
   ```bash
   ./scripts/setup-ssl-commercial.sh
   ```

## 🚨 Troubleshooting

### Problemas Comuns

1. **DNS não resolve**
   ```bash
   # Verificar DNS
   dig licitabrasilweb.com.br
   nslookup licitabrasilweb.com.br
   ```

2. **Certificado inválido**
   ```bash
   # Verificar certificado
   openssl x509 -in nginx/ssl/licitabrasil.crt -text -noout
   ```

3. **Nginx não inicia**
   ```bash
   # Testar configuração
   docker-compose exec nginx nginx -t
   
   # Ver logs
   docker-compose logs nginx
   ```

4. **Porta 443 não acessível**
   ```bash
   # Verificar firewall
   sudo ufw status
   sudo iptables -L
   
   # Verificar se porta está aberta
   netstat -tlnp | grep :443
   ```

## 📁 Estrutura de Arquivos

```
project/
├── nginx/
│   ├── conf.d/
│   │   └── licitabrasil-production.conf  # Configuração principal
│   ├── nginx.conf                        # Configuração global
│   └── ssl/                             # Certificados SSL
│       ├── licitabrasil.crt            # Certificado principal
│       ├── licitabrasil.key            # Chave privada
│       ├── licitabrasil-chain.crt      # Cadeia de certificados
│       └── dhparam.pem                 # Parâmetros DH
├── scripts/
│   ├── setup-production-domain.sh      # Script principal
│   ├── setup-ssl-letsencrypt.sh       # Let's Encrypt
│   ├── setup-ssl-commercial.sh        # Certificado comercial
│   └── validate-domain-ssl.sh         # Validação
├── .env.production                     # Variáveis de ambiente
└── docs/
    └── DOMAIN_SSL_SETUP.md            # Esta documentação
```

## 🔗 Links Úteis

- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Security Headers](https://securityheaders.com/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs: `docker-compose logs nginx`
2. Executar validação: `./scripts/validate-domain-ssl.sh`
3. Consultar documentação oficial do Nginx
4. Verificar configuração DNS
