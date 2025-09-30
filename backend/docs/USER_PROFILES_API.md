# Sistema de Controle de Acesso - LicitaBrasil Web

## Visão Geral

O sistema implementa um controle de acesso abrangente baseado em perfis de usuário e permissões granulares para a plataforma LicitaBrasil. Suporta quatro tipos principais de usuários com funcionalidades específicas para cada perfil.

## Perfis de Usuário

### 1. 👑 Administrador (ADMIN)
- **Descrição**: Administrador da plataforma com acesso total ao sistema
- **Permissões**: Todas as permissões disponíveis (23 permissões)
- **Funcionalidades**:
  - Gerenciamento completo de usuários
  - Configuração do sistema
  - Acesso a logs de auditoria
  - Aprovação de fornecedores e órgãos públicos
  - Relatórios administrativos

### 2. 🏛️ Comprador (PUBLIC_ENTITY)
- **Descrição**: Organizações do setor público que criam e gerenciam processos de compras
- **Permissões**: 14 permissões (gestão de licitações e contratos)
- **Funcionalidades**:
  - Criação e gestão de licitações
  - Análise de propostas
  - Criação e gestão de contratos
  - Dashboard de compras
  - Relatórios de compras

### 3. 🏢 Fornecedor (SUPPLIER)
- **Descrição**: Empresas/indivíduos que participam de processos licitatórios
- **Permissões**: 6 permissões (participação em licitações)
- **Funcionalidades**:
  - Visualização de licitações disponíveis
  - Criação e submissão de propostas
  - Gestão de contratos ganhos
  - Dashboard de fornecedor
  - Relatórios de performance

### 4. 👤 Cidadão (CITIZEN)
- **Descrição**: Usuários do público em geral com acesso de transparência
- **Permissões**: 1 permissão (acesso público)
- **Funcionalidades**:
  - Visualização de licitações públicas
  - Acompanhamento de contratos
  - Dashboard de transparência
  - Configuração de interesses

### 5. 🔍 Auditor (AUDITOR)
- **Descrição**: Usuários especializados em auditoria e fiscalização
- **Permissões**: 5 permissões (auditoria e relatórios)
- **Funcionalidades**:
  - Acesso a dados privados para auditoria
  - Visualização de logs de auditoria
  - Geração de relatórios especializados
  - Exportação de dados

## Credenciais de Teste

### Administrador
```
Email: admin@licitabrasil.com
Senha: Test123!@#
```

### Compradores
```
# Prefeitura de São Paulo
Email: comprador@prefeitura.sp.gov.br
Senha: Test123!@#

# Governo do Rio de Janeiro
Email: comprador@governo.rj.gov.br
Senha: Test123!@#
```

### Fornecedores
```
# TechSolutions
Email: fornecedor@empresa.com.br
Senha: Test123!@#

# ConstrutoraPro
Email: fornecedor2@construcoes.com.br
Senha: Test123!@#
```

### Cidadãos
```
# Carlos Oliveira
Email: cidadao@email.com
Senha: Test123!@#

# Fernanda Lima
Email: cidadao2@email.com
Senha: Test123!@#
```

### Auditor
```
Email: auditor@tcu.gov.br
Senha: Test123!@#
```

## Endpoints da API

### Autenticação
```
POST /api/v1/auth/register    # Registro de usuário
POST /api/v1/auth/login       # Login
POST /api/v1/auth/logout      # Logout
POST /api/v1/auth/refresh     # Renovar token
GET  /api/v1/auth/profile     # Obter perfil
PUT  /api/v1/auth/profile     # Atualizar perfil
```

### Administração
```
GET  /api/v1/admin/users      # Listar usuários (Admin)
PUT  /api/v1/admin/users/:id  # Gerenciar usuário (Admin)
```

### Fornecedores
```
GET  /api/v1/suppliers                    # Listar fornecedores
POST /api/v1/suppliers                    # Criar perfil fornecedor
GET  /api/v1/supplier-dashboard/dashboard # Dashboard fornecedor
GET  /api/v1/supplier-dashboard/biddings/available # Licitações disponíveis
GET  /api/v1/supplier-dashboard/proposals # Minhas propostas
GET  /api/v1/supplier-dashboard/contracts # Meus contratos
```

### Compradores (Órgãos Públicos)
```
GET  /api/v1/public-entities     # Listar órgãos públicos
POST /api/v1/public-entities     # Criar perfil órgão público
GET  /api/v1/buyers/dashboard    # Dashboard comprador
GET  /api/v1/buyers/biddings     # Minhas licitações
GET  /api/v1/buyers/proposals    # Propostas recebidas
GET  /api/v1/buyers/contracts    # Meus contratos
```

### Cidadãos
```
POST /api/v1/citizens                    # Criar perfil cidadão
GET  /api/v1/citizens/profile/me         # Meu perfil
GET  /api/v1/citizens/biddings/interested # Licitações de interesse
```

### Transparência (Público)
```
GET  /api/v1/transparency/dashboard      # Dashboard público
GET  /api/v1/transparency/biddings       # Licitações públicas
GET  /api/v1/transparency/contracts      # Contratos públicos
GET  /api/v1/transparency/reports/spending # Relatório de gastos
```

## Sistema de Permissões

### Permissões Disponíveis
- `READ_PUBLIC_DATA` - Ler dados públicos
- `READ_PRIVATE_DATA` - Ler dados privados
- `WRITE_DATA` - Escrever dados
- `DELETE_DATA` - Deletar dados
- `CREATE_BIDDING` - Criar licitação
- `EDIT_BIDDING` - Editar licitação
- `DELETE_BIDDING` - Deletar licitação
- `PUBLISH_BIDDING` - Publicar licitação
- `CANCEL_BIDDING` - Cancelar licitação
- `CREATE_PROPOSAL` - Criar proposta
- `EDIT_PROPOSAL` - Editar proposta
- `DELETE_PROPOSAL` - Deletar proposta
- `SUBMIT_PROPOSAL` - Submeter proposta
- `CREATE_CONTRACT` - Criar contrato
- `EDIT_CONTRACT` - Editar contrato
- `SIGN_CONTRACT` - Assinar contrato
- `TERMINATE_CONTRACT` - Terminar contrato
- `MANAGE_USERS` - Gerenciar usuários
- `MANAGE_SYSTEM` - Gerenciar sistema
- `VIEW_AUDIT_LOGS` - Ver logs de auditoria
- `MANAGE_CATEGORIES` - Gerenciar categorias
- `GENERATE_REPORTS` - Gerar relatórios
- `EXPORT_DATA` - Exportar dados

### Distribuição de Permissões por Perfil

| Permissão | Admin | Comprador | Fornecedor | Auditor | Cidadão |
|-----------|-------|-----------|------------|---------|---------|
| READ_PUBLIC_DATA | ✅ | ✅ | ✅ | ✅ | ✅ |
| READ_PRIVATE_DATA | ✅ | ✅ | ❌ | ✅ | ❌ |
| CREATE_BIDDING | ✅ | ✅ | ❌ | ❌ | ❌ |
| CREATE_PROPOSAL | ✅ | ❌ | ✅ | ❌ | ❌ |
| MANAGE_USERS | ✅ | ❌ | ❌ | ❌ | ❌ |
| VIEW_AUDIT_LOGS | ✅ | ❌ | ❌ | ✅ | ❌ |
| GENERATE_REPORTS | ✅ | ✅ | ✅ | ✅ | ❌ |

## Exemplos de Uso

### 1. Login e Obtenção de Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@licitabrasil.com",
    "password": "Test123!@#"
  }'
```

### 2. Acessar Dashboard do Fornecedor
```bash
curl -X GET http://localhost:3001/api/v1/supplier-dashboard/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Criar Perfil de Cidadão
```bash
curl -X POST http://localhost:3001/api/v1/citizens \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "123.456.789-00",
    "profession": "Engenheiro",
    "city": "São Paulo",
    "state": "SP",
    "interests": ["Tecnologia", "Obras Públicas"]
  }'
```

### 4. Acessar Dados de Transparência (Sem Autenticação)
```bash
curl -X GET http://localhost:3001/api/v1/transparency/dashboard
```

## Estrutura do Banco de Dados

### Principais Tabelas
- `users` - Usuários base
- `suppliers` - Perfis de fornecedores
- `public_entities` - Perfis de órgãos públicos
- `citizens` - Perfis de cidadãos
- `user_permissions` - Permissões granulares
- `biddings` - Licitações
- `proposals` - Propostas
- `contracts` - Contratos

## Segurança

### Autenticação
- JWT tokens com expiração configurável
- Refresh tokens para renovação
- Blacklist de tokens para logout seguro
- Sessões armazenadas no Redis

### Autorização
- Middleware de verificação de roles
- Sistema de permissões granulares
- Verificação de propriedade de recursos
- Logs de auditoria para ações sensíveis

### Validação
- Validação de entrada com Joi
- Sanitização de dados
- Rate limiting
- Proteção contra ataques comuns

## Monitoramento

### Logs
- Logs de autenticação
- Logs de atividade do usuário
- Logs de segurança
- Logs de operações do banco

### Métricas
- Tempo de resposta das operações
- Número de usuários por perfil
- Atividade por endpoint
- Erros e exceções

## Integração Frontend

### Fluxo de Autenticação
```javascript
// 1. Login
const login = async (email, password) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    return data.data.user;
  }
  throw new Error(data.message);
};

// 2. Verificar autenticação
const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

// 3. Obter token
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// 4. Fazer requisições autenticadas
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (response.status === 401) {
    // Token expirado, tentar renovar
    await refreshToken();
    // Repetir requisição
    return apiCall(endpoint, options);
  }

  return response.json();
};
```

### Roteamento Baseado em Perfil
```javascript
const getRoutesByRole = (userRole) => {
  const routes = {
    ADMIN: [
      { path: '/admin/dashboard', component: AdminDashboard },
      { path: '/admin/users', component: UserManagement },
      { path: '/admin/system', component: SystemConfig }
    ],
    SUPPLIER: [
      { path: '/supplier/dashboard', component: SupplierDashboard },
      { path: '/supplier/biddings', component: AvailableBiddings },
      { path: '/supplier/proposals', component: MyProposals }
    ],
    PUBLIC_ENTITY: [
      { path: '/buyer/dashboard', component: BuyerDashboard },
      { path: '/buyer/biddings', component: MyBiddings },
      { path: '/buyer/proposals', component: ReceivedProposals }
    ],
    CITIZEN: [
      { path: '/citizen/dashboard', component: CitizenDashboard },
      { path: '/citizen/biddings', component: InterestedBiddings }
    ],
    AUDITOR: [
      { path: '/auditor/dashboard', component: AuditorDashboard },
      { path: '/auditor/reports', component: AuditReports }
    ]
  };

  return routes[userRole] || [];
};
```

### Componente de Proteção de Rota
```javascript
const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/forbidden" />;
  }

  return children;
};
```

## Próximos Passos

1. Implementar notificações por email
2. Adicionar autenticação de dois fatores
3. Implementar API de webhooks
4. Adicionar mais relatórios especializados
5. Implementar cache avançado
6. Adicionar testes de carga
