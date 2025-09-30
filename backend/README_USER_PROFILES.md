# Sistema de Controle de Acesso - LicitaBrasil Web

## 🎯 Visão Geral

Este documento descreve a implementação completa do sistema de controle de acesso baseado em perfis de usuário para a plataforma LicitaBrasil Web. O sistema suporta quatro tipos principais de usuários com funcionalidades específicas e permissões granulares.

## 🚀 Funcionalidades Implementadas

### ✅ Sistema de Perfis de Usuário
- **Administrador**: Acesso total ao sistema
- **Comprador (Órgão Público)**: Gestão de licitações e contratos
- **Fornecedor**: Participação em licitações
- **Cidadão**: Acesso de transparência
- **Auditor**: Auditoria e fiscalização

### ✅ Autenticação e Autorização
- JWT tokens com refresh automático
- Middleware de autorização por role
- Sistema de permissões granulares
- Blacklist de tokens para logout seguro
- Sessões persistentes no Redis

### ✅ Endpoints de API RESTful
- Endpoints específicos para cada perfil
- Documentação Swagger integrada
- Validação de entrada com Joi
- Tratamento de erros padronizado

### ✅ Banco de Dados
- Schema Prisma atualizado
- Migrações automáticas
- Relacionamentos entre perfis
- Índices otimizados

### ✅ Dados de Teste
- Scripts de seed automatizados
- Usuários de teste para cada perfil
- Categorias e permissões pré-configuradas
- Credenciais documentadas

## 📊 Estatísticas do Sistema

### Perfis de Usuário
- **5 tipos** de perfil implementados
- **23 permissões** granulares disponíveis
- **8 usuários** de teste criados
- **10 categorias** principais com subcategorias

### Endpoints da API
- **30+ endpoints** específicos por perfil
- **4 dashboards** personalizados
- **Transparência pública** sem autenticação
- **Relatórios especializados** por perfil

### Segurança
- **Autenticação JWT** com expiração
- **Autorização baseada** em roles e permissões
- **Logs de auditoria** para ações sensíveis
- **Rate limiting** e proteção CORS

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Auth Guard  │ │◄──►│ │ JWT Middleware│ │    │ │ Users       │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Role Routes │ │◄──►│ │ Controllers │ │◄──►│ │ Profiles    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Dashboards  │ │◄──►│ │ Permissions │ │◄──►│ │ Permissions │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Como Usar

### 1. Configuração Inicial
```bash
# Instalar dependências
cd backend
npm install

# Configurar banco de dados
npm run db:migrate
npm run db:generate

# Executar seeds
npm run db:seed
```

### 2. Executar o Sistema
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

### 3. Testar a API
```bash
# Executar testes
npm test

# Testes específicos de autenticação
npm test -- --testPathPattern=auth
```

### 4. Acessar Documentação
- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🔑 Credenciais de Teste

### Administrador
```
Email: admin@licitabrasil.com
Senha: Test123!@#
Funcionalidades: Acesso total ao sistema
```

### Comprador (Prefeitura SP)
```
Email: comprador@prefeitura.sp.gov.br
Senha: Test123!@#
Funcionalidades: Gestão de licitações e contratos
```

### Fornecedor (TechSolutions)
```
Email: fornecedor@empresa.com.br
Senha: Test123!@#
Funcionalidades: Participação em licitações
```

### Cidadão
```
Email: cidadao@email.com
Senha: Test123!@#
Funcionalidades: Transparência e acompanhamento
```

### Auditor
```
Email: auditor@tcu.gov.br
Senha: Test123!@#
Funcionalidades: Auditoria e relatórios
```

## 📚 Documentação Adicional

- **[API Completa](./docs/USER_PROFILES_API.md)** - Documentação detalhada da API
- **[Swagger UI](http://localhost:3001/api-docs)** - Documentação interativa
- **[Postman Collection](./postman/)** - Coleção de testes

## 🧪 Testes

### Cobertura de Testes
- ✅ Autenticação por perfil
- ✅ Autorização baseada em roles
- ✅ Permissões granulares
- ✅ Middleware de segurança
- ✅ Endpoints específicos

### Executar Testes
```bash
# Todos os testes
npm test

# Testes de autenticação
npm test -- --testPathPattern=auth

# Testes com cobertura
npm run test:coverage
```

## 🔒 Segurança

### Implementações de Segurança
- **JWT Tokens** com expiração configurável
- **Refresh Tokens** para renovação automática
- **Blacklist de Tokens** para logout seguro
- **Rate Limiting** para prevenir ataques
- **Validação de Entrada** com Joi
- **Logs de Auditoria** para rastreabilidade
- **CORS** configurado adequadamente
- **Helmet** para headers de segurança

### Boas Práticas
- Senhas hasheadas com bcrypt (12 rounds)
- Tokens armazenados de forma segura
- Sessões com expiração automática
- Logs de tentativas de acesso
- Validação rigorosa de permissões

## 📈 Performance

### Otimizações Implementadas
- **Índices de Banco** otimizados
- **Cache Redis** para sessões
- **Paginação** em todas as listagens
- **Queries Otimizadas** com Prisma
- **Compressão** de respostas HTTP

### Monitoramento
- Logs estruturados com Winston
- Métricas de tempo de resposta
- Monitoramento de erros
- Health checks automáticos

## 🚀 Deploy

### Variáveis de Ambiente
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Docker
```dockerfile
# Dockerfile já configurado
docker build -t licitabrasil-backend .
docker run -p 3001:3001 licitabrasil-backend
```

## 🤝 Contribuição

### Estrutura do Código
```
src/
├── controllers/     # Controllers específicos por perfil
├── middleware/      # Autenticação e autorização
├── routes/         # Rotas organizadas por funcionalidade
├── services/       # Lógica de negócio
├── utils/          # Utilitários e helpers
└── database/       # Seeds e migrações
```

### Padrões de Código
- TypeScript com tipagem rigorosa
- ESLint para padronização
- Prettier para formatação
- Testes unitários obrigatórios
- Documentação inline

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação da API
2. Verifique os logs de erro
3. Execute os testes para validar
4. Consulte o Swagger UI para exemplos

---

**Desenvolvido para LicitaBrasil Web Platform**  
Sistema completo de controle de acesso com 4 perfis de usuário, 23 permissões granulares e funcionalidades específicas para cada tipo de usuário.
