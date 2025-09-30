# Guia de Integração Frontend - LicitaBrasil Web

## 🚀 Visão Geral

Este guia fornece instruções completas para integrar o frontend com a API do LicitaBrasil Web. Inclui SDK JavaScript, exemplos para React e Vue.js, e melhores práticas de implementação.

## 📦 SDK JavaScript

### Instalação

```bash
# Copiar o SDK para seu projeto
cp frontend-sdk/licitabrasil-sdk.js src/services/
```

### Configuração Básica

```javascript
import LicitaBrasilSDK from './services/licitabrasil-sdk.js';

const sdk = new LicitaBrasilSDK({
  baseURL: 'http://localhost:3001/api/v1',
  timeout: 10000,
  retryAttempts: 3,
  onTokenRefresh: (tokens) => {
    console.log('Tokens renovados automaticamente');
  },
  onAuthError: (error) => {
    console.error('Erro de autenticação:', error);
    // Redirecionar para login
  },
  onNetworkError: (error) => {
    console.error('Erro de rede:', error);
    // Mostrar mensagem de erro
  }
});
```

## 🔐 Autenticação

### Login
```javascript
try {
  const user = await sdk.login('admin@licitabrasil.com', 'Test123!@#');
  console.log('Usuário logado:', user);
} catch (error) {
  console.error('Erro no login:', error.message);
}
```

### Registro
```javascript
try {
  const user = await sdk.register({
    email: 'novo@usuario.com',
    password: 'MinhaSenga123!',
    firstName: 'João',
    lastName: 'Silva',
    phone: '(11) 99999-9999',
    role: 'CITIZEN'
  });
  console.log('Usuário registrado:', user);
} catch (error) {
  console.error('Erro no registro:', error.message);
}
```

### Verificar Autenticação
```javascript
if (sdk.isAuthenticated()) {
  const profile = await sdk.getProfile();
  console.log('Usuário autenticado:', profile);
}
```

## 📊 Dashboards por Perfil

### Dashboard do Administrador
```javascript
if (user.role === 'ADMIN') {
  const dashboard = await sdk.getAdminDashboard();
  // dashboard.statistics, dashboard.recentActivity, etc.
}
```

### Dashboard do Fornecedor
```javascript
if (user.role === 'SUPPLIER') {
  const dashboard = await sdk.getSupplierDashboard();
  // dashboard.availableBiddings, dashboard.myProposals, etc.
}
```

### Dashboard do Comprador
```javascript
if (user.role === 'PUBLIC_ENTITY') {
  const dashboard = await sdk.getBuyerDashboard();
  // dashboard.myBiddings, dashboard.receivedProposals, etc.
}
```

### Dashboard de Transparência
```javascript
// Disponível para todos os usuários (incluindo não autenticados)
const dashboard = await sdk.getTransparencyDashboard();
// dashboard.statistics, dashboard.recentBiddings, etc.
```

## 📋 Licitações

### Listar Licitações Públicas
```javascript
const biddings = await sdk.getBiddings({
  page: 1,
  limit: 10,
  search: 'tecnologia',
  status: 'OPEN',
  city: 'São Paulo',
  minValue: 10000,
  maxValue: 100000
});

console.log('Licitações:', biddings.biddings);
console.log('Paginação:', biddings.pagination);
```

### Licitações Disponíveis (Fornecedor)
```javascript
// Apenas para fornecedores autenticados
const availableBiddings = await sdk.getAvailableBiddings({
  page: 1,
  limit: 10,
  categoryId: 'categoria-id'
});
```

## 📄 Contratos

### Listar Contratos Públicos
```javascript
const contracts = await sdk.getContracts({
  page: 1,
  limit: 10,
  search: 'construção',
  status: 'ACTIVE',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

### Meus Contratos (Fornecedor)
```javascript
const myContracts = await sdk.getMyContracts();
```

## 🏗️ Integração com React

### Configuração do Context
```jsx
import { AuthProvider } from './examples/react-example.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

### Hook de Autenticação
```jsx
import { useAuth } from './examples/react-example.jsx';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return (
    <div>
      <h1>Bem-vindo, {user.firstName}!</h1>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

## 🎯 Integração com Vue.js

### Configuração do Plugin
```javascript
import { createLicitaBrasilApp } from './examples/vue-example.js';

const app = createLicitaBrasilApp({
  baseURL: 'http://localhost:3001/api/v1'
});

app.mount('#app');
```

### Composable de Autenticação
```javascript
import { useAuth } from './examples/vue-example.js';

export default {
  setup() {
    const { user, login, logout, isAuthenticated } = useAuth();
    
    return {
      user,
      login,
      logout,
      isAuthenticated
    };
  }
}
```

## 🔒 Controle de Acesso

### Verificação de Roles
```javascript
const hasAccess = (userRole, requiredRole) => {
  const roleHierarchy = {
    'ADMIN': 5,
    'AUDITOR': 4,
    'PUBLIC_ENTITY': 3,
    'SUPPLIER': 2,
    'CITIZEN': 1
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Uso
if (hasAccess(user.role, 'SUPPLIER')) {
  // Mostrar conteúdo para fornecedores ou superior
}
```

### Rotas Protegidas
```javascript
// React Router
<Route path="/admin" element={
  <ProtectedRoute requiredRole="ADMIN">
    <AdminPanel />
  </ProtectedRoute>
} />

// Vue Router
{
  path: '/admin',
  component: AdminPanel,
  beforeEnter: (to, from, next) => {
    if (user.role === 'ADMIN') {
      next();
    } else {
      next('/unauthorized');
    }
  }
}
```

## 📱 Responsividade e UX

### Loading States
```javascript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await sdk.getBiddings();
    // Processar dados
  } catch (error) {
    // Tratar erro
  } finally {
    setLoading(false);
  }
};

return loading ? <Spinner /> : <DataComponent />;
```

### Error Handling
```javascript
const [error, setError] = useState(null);

try {
  await sdk.someOperation();
} catch (err) {
  setError(err.message);
  // Mostrar toast de erro
  toast.error(err.message);
}
```

### Paginação
```javascript
const [pagination, setPagination] = useState({
  page: 1,
  limit: 10,
  total: 0
});

const loadPage = async (page) => {
  const result = await sdk.getBiddings({ page, limit: pagination.limit });
  setPagination(result.pagination);
};
```

## 🎨 Componentes Recomendados

### Card de Licitação
```jsx
const BiddingCard = ({ bidding }) => (
  <div className="bidding-card">
    <h3>{bidding.title}</h3>
    <div className="bidding-info">
      <span className={`status ${bidding.status.toLowerCase()}`}>
        {bidding.status}
      </span>
      <span className="value">
        R$ {bidding.estimatedValue?.toLocaleString()}
      </span>
    </div>
    <p className="entity">{bidding.publicEntity?.name}</p>
    <div className="dates">
      <span>Abertura: {formatDate(bidding.openingDate)}</span>
      <span>Fechamento: {formatDate(bidding.closingDate)}</span>
    </div>
  </div>
);
```

### Filtros de Busca
```jsx
const BiddingFilters = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    city: '',
    minValue: '',
    maxValue: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="filters">
      <input
        type="text"
        placeholder="Buscar..."
        value={filters.search}
        onChange={(e) => setFilters({...filters, search: e.target.value})}
      />
      <select
        value={filters.status}
        onChange={(e) => setFilters({...filters, status: e.target.value})}
      >
        <option value="">Todos os status</option>
        <option value="OPEN">Aberta</option>
        <option value="CLOSED">Fechada</option>
      </select>
      <button type="submit">Filtrar</button>
    </form>
  );
};
```

## 🔧 Configurações Avançadas

### Interceptadores de Requisição
```javascript
// O SDK já inclui interceptadores automáticos para:
// - Adicionar token de autenticação
// - Renovar token automaticamente
// - Retry em caso de falha de rede
// - Log de requisições
```

### Cache Local
```javascript
// Implementar cache simples
const cache = new Map();

const getCachedData = async (key, fetchFn, ttl = 5 * 60 * 1000) => {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

// Uso
const biddings = await getCachedData(
  'public-biddings',
  () => sdk.getBiddings(),
  5 * 60 * 1000 // 5 minutos
);
```

## 🚀 Deploy e Produção

### Variáveis de Ambiente
```env
# Frontend
REACT_APP_API_URL=https://api.licitabrasilweb.com.br/api/v1
REACT_APP_WS_URL=wss://api.licitabrasilweb.com.br

# Vue.js
VUE_APP_API_URL=https://api.licitabrasilweb.com.br/api/v1
VUE_APP_WS_URL=wss://api.licitabrasilweb.com.br
```

### Build para Produção
```bash
# React
npm run build

# Vue.js
npm run build

# Servir arquivos estáticos
npx serve -s build -l 3000
```

## 📚 Recursos Adicionais

### Documentação da API
- **Swagger UI**: http://localhost:3001/api-docs
- **Postman Collection**: Disponível no repositório

### Exemplos Completos
- **React**: `frontend-sdk/examples/react-example.jsx`
- **Vue.js**: `frontend-sdk/examples/vue-example.js`
- **Vanilla JS**: `frontend-sdk/licitabrasil-sdk.js`

### Suporte
- Consulte a documentação da API para detalhes dos endpoints
- Verifique os logs do navegador para debugging
- Use o modo desenvolvimento para informações detalhadas

---

**Desenvolvido para LicitaBrasil Web Platform**  
Integração frontend completa com autenticação, autorização e funcionalidades específicas por perfil.
