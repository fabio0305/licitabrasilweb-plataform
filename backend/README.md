# LicitaBrasil Web - Backend API

## 🚀 Visão Geral

API completa para plataforma de licitações públicas brasileiras, desenvolvida com Node.js, TypeScript, Express.js e Prisma ORM.

## ✨ Funcionalidades Implementadas

### 🔐 Autenticação e Autorização
- ✅ Sistema completo de autenticação JWT
- ✅ Controle de acesso baseado em roles (ADMIN, SUPPLIER, PUBLIC_ENTITY, AUDITOR)
- ✅ Middleware de autorização granular
- ✅ Sessões com Redis para performance

### 📊 Gestão de Licitações
- ✅ CRUD completo de licitações
- ✅ Endpoints públicos para consulta
- ✅ Gestão de status (DRAFT → PUBLISHED → OPEN → CLOSED)
- ✅ Filtros avançados e paginação
- ✅ Validações de negócio

### 🏢 Gestão de Entidades
- ✅ **Fornecedores**: Cadastro, verificação, categorias
- ✅ **Órgãos Públicos**: Gestão de perfis e verificação
- ✅ **Propostas**: Submissão, avaliação, aceitação/rejeição
- ✅ **Contratos**: Ciclo completo de gestão

### 📄 Sistema de Documentos
- ✅ Upload e download de arquivos
- ✅ Controle de acesso por entidade
- ✅ Validação de tipos de arquivo
- ✅ Logs de atividade

### 🔔 Sistema de Notificações
- ✅ Notificações em tempo real
- ✅ Filtros por tipo e status
- ✅ Marcação como lida
- ✅ Estatísticas de notificações

### 📈 Monitoramento e Logs
- ✅ Middleware de monitoramento de performance
- ✅ Logs estruturados com Winston
- ✅ Métricas de API em tempo real
- ✅ Health checks detalhados

### 📚 Documentação
- ✅ Documentação Swagger/OpenAPI completa
- ✅ Coleção Postman para testes
- ✅ Exemplos de uso

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express.js** - Framework web
- **Prisma ORM** - ORM moderno para TypeScript
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Winston** - Sistema de logs
- **Jest** - Framework de testes
- **Swagger** - Documentação da API

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### 1. Instalação
```bash
npm install
```

### 2. Configuração do Ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Configuração do Banco de Dados
```bash
# Executar migrações
npx prisma migrate dev

# Gerar cliente Prisma
npx prisma generate
```

### 4. Executar em Desenvolvimento
```bash
npm run dev
```

### 5. Executar em Produção
```bash
npm run build
npm start
```

## 📋 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila TypeScript
- `npm start` - Executa versão compilada
- `npm test` - Executa testes
- `npm run test:watch` - Executa testes em modo watch
- `npm run prisma:studio` - Abre Prisma Studio
- `npm run prisma:reset` - Reset do banco de dados

## 🔗 Endpoints Principais

### Públicos (sem autenticação)
- `GET /health` - Health check
- `GET /api/v1/biddings/public` - Lista licitações públicas
- `GET /api/v1/biddings/public/:id` - Detalhes de licitação pública

### Autenticação
- `POST /api/v1/auth/register` - Registro de usuário
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/profile` - Perfil do usuário

### Licitações (autenticado)
- `GET /api/v1/biddings` - Lista todas as licitações
- `POST /api/v1/biddings` - Criar licitação (órgão público)
- `PUT /api/v1/biddings/:id` - Atualizar licitação
- `POST /api/v1/biddings/:id/publish` - Publicar licitação

### Monitoramento (admin)
- `GET /api/v1/monitoring/metrics` - Métricas da API
- `GET /api/v1/monitoring/health` - Health check detalhado

## 📖 Documentação da API

Acesse a documentação interativa em:
- **Swagger UI**: http://localhost:3001/api-docs

## 🧪 Testes

### Executar Testes
```bash
npm test
```

### Cobertura de Testes
```bash
npm run test:coverage
```

## 📊 Monitoramento

### Métricas Disponíveis
- Tempo de resposta médio
- Requisições por hora
- Status codes
- Endpoints mais acessados
- Requisições lentas
- Erros recentes

### Logs
Os logs são estruturados e incluem:
- Timestamp
- Nível (info, warn, error)
- Mensagem
- Contexto adicional
- User ID (quando disponível)

## 🔧 Configuração de Produção

### Variáveis de Ambiente Importantes
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### Recomendações
- Use HTTPS em produção
- Configure rate limiting adequado
- Monitore logs e métricas
- Faça backup regular do banco
- Use Redis para cache em produção

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 📞 Suporte

Para suporte, entre em contato:
- Email: contato@licitabrasil.com.br
- GitHub Issues: [Criar Issue](https://github.com/fabio0305/licitabrasilweb-plataform/issues)

---

**Status do Projeto**: ✅ **Implementação Completa dos Controladores - Concluída!**

Todos os controladores principais foram implementados com funcionalidades completas, incluindo CRUD, validações, autenticação, autorização e logs de auditoria.
