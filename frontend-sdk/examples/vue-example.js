/**
 * Exemplo de integração com Vue.js 3
 * Demonstra como usar o LicitaBrasil SDK em uma aplicação Vue
 */

import { createApp, ref, reactive, computed, onMounted } from 'vue';
import LicitaBrasilSDK from '../licitabrasil-sdk.js';

// Plugin para Vue.js
const LicitaBrasilPlugin = {
  install(app, options = {}) {
    const sdk = new LicitaBrasilSDK({
      baseURL: options.baseURL || 'http://localhost:3001/api/v1',
      ...options
    });

    // Disponibilizar o SDK globalmente
    app.config.globalProperties.$licitabrasil = sdk;
    app.provide('licitabrasil', sdk);
  }
};

// Composable para autenticação
export function useAuth() {
  const user = ref(null);
  const loading = ref(true);
  const error = ref(null);

  // Injetar o SDK
  const sdk = inject('licitabrasil');

  const isAuthenticated = computed(() => !!user.value);

  const initializeAuth = async () => {
    try {
      loading.value = true;
      sdk.loadTokensFromStorage();
      
      if (sdk.isAuthenticated()) {
        const profile = await sdk.getProfile();
        user.value = profile.user;
      }
    } catch (err) {
      console.error('Erro ao inicializar autenticação:', err);
      sdk.clearTokens();
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const login = async (email, password) => {
    try {
      loading.value = true;
      error.value = null;
      const userData = await sdk.login(email, password);
      user.value = userData;
      return userData;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (userData) => {
    try {
      loading.value = true;
      error.value = null;
      const newUser = await sdk.register(userData);
      user.value = newUser;
      return newUser;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await sdk.logout();
    } catch (err) {
      console.error('Erro no logout:', err);
    } finally {
      user.value = null;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await sdk.updateProfile(profileData);
      user.value = updatedUser.user;
      return updatedUser;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    initializeAuth,
    login,
    register,
    logout,
    updateProfile,
    sdk
  };
}

// Composable para licitações
export function useBiddings() {
  const biddings = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({});

  const sdk = inject('licitabrasil');

  const loadBiddings = async (filters = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await sdk.getBiddings(filters);
      biddings.value = response.biddings || [];
      pagination.value = response.pagination || {};
    } catch (err) {
      error.value = err.message;
      console.error('Erro ao carregar licitações:', err);
    } finally {
      loading.value = false;
    }
  };

  const loadAvailableBiddings = async (filters = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await sdk.getAvailableBiddings(filters);
      biddings.value = response.biddings || [];
      pagination.value = response.pagination || {};
    } catch (err) {
      error.value = err.message;
      console.error('Erro ao carregar licitações disponíveis:', err);
    } finally {
      loading.value = false;
    }
  };

  return {
    biddings: readonly(biddings),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    loadBiddings,
    loadAvailableBiddings
  };
}

// Componente de Login
export const LoginComponent = {
  template: `
    <div class="login-form">
      <h2>Login</h2>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email:</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">Senha:</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            required
          />
        </div>
        
        <button type="submit" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </div>
  `,
  setup() {
    const form = reactive({
      email: '',
      password: ''
    });

    const { login, loading, error } = useAuth();

    const handleLogin = async () => {
      try {
        await login(form.email, form.password);
      } catch (err) {
        // Erro já tratado no composable
      }
    };

    return {
      form,
      loading,
      error,
      handleLogin
    };
  }
};

// Componente de Dashboard
export const DashboardComponent = {
  template: `
    <div class="dashboard">
      <h1>Dashboard - {{ user?.role }}</h1>
      
      <div class="user-info">
        <p>Bem-vindo, {{ user?.firstName }} {{ user?.lastName }}</p>
        <p>Email: {{ user?.email }}</p>
        <p>Status: {{ user?.status }}</p>
      </div>
      
      <div v-if="loading" class="loading">
        Carregando dashboard...
      </div>
      
      <div v-else-if="dashboardData" class="dashboard-content">
        <pre>{{ JSON.stringify(dashboardData, null, 2) }}</pre>
      </div>
      
      <button @click="logout" class="logout-btn">
        Sair
      </button>
    </div>
  `,
  setup() {
    const { user, logout, sdk } = useAuth();
    const dashboardData = ref(null);
    const loading = ref(true);

    const loadDashboard = async () => {
      if (!user.value) return;

      try {
        let data;
        switch (user.value.role) {
          case 'ADMIN':
            data = await sdk.getAdminDashboard();
            break;
          case 'SUPPLIER':
            data = await sdk.getSupplierDashboard();
            break;
          case 'PUBLIC_ENTITY':
            data = await sdk.getBuyerDashboard();
            break;
          case 'CITIZEN':
          case 'AUDITOR':
            data = await sdk.getTransparencyDashboard();
            break;
          default:
            data = await sdk.getTransparencyDashboard();
        }
        dashboardData.value = data;
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadDashboard();
    });

    return {
      user,
      dashboardData,
      loading,
      logout
    };
  }
};

// Componente de Lista de Licitações
export const BiddingsListComponent = {
  template: `
    <div class="biddings-list">
      <h2>Licitações</h2>
      
      <div class="filters">
        <input
          type="text"
          placeholder="Buscar licitações..."
          v-model="searchTerm"
          @input="handleSearch"
        />
      </div>
      
      <div v-if="loading" class="loading">
        Carregando licitações...
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-else class="biddings-grid">
        <div
          v-for="bidding in biddings"
          :key="bidding.id"
          class="bidding-card"
        >
          <h3>{{ bidding.title }}</h3>
          <p>Número: {{ bidding.biddingNumber }}</p>
          <p>Status: {{ bidding.status }}</p>
          <p>Valor Estimado: R$ {{ formatCurrency(bidding.estimatedValue) }}</p>
          <p>Órgão: {{ bidding.publicEntity?.name }}</p>
        </div>
      </div>
      
      <div v-if="biddings.length === 0 && !loading" class="no-results">
        Nenhuma licitação encontrada.
      </div>
      
      <!-- Paginação -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          v-for="page in pagination.totalPages"
          :key="page"
          @click="changePage(page)"
          :class="{ active: page === pagination.page }"
        >
          {{ page }}
        </button>
      </div>
    </div>
  `,
  setup() {
    const { user } = useAuth();
    const { biddings, loading, error, pagination, loadBiddings, loadAvailableBiddings } = useBiddings();
    
    const searchTerm = ref('');
    const filters = reactive({
      page: 1,
      limit: 10,
      search: ''
    });

    const handleSearch = debounce(() => {
      filters.search = searchTerm.value;
      filters.page = 1;
      loadData();
    }, 500);

    const changePage = (page) => {
      filters.page = page;
      loadData();
    };

    const loadData = () => {
      if (user.value && user.value.role === 'SUPPLIER') {
        loadAvailableBiddings(filters);
      } else {
        loadBiddings(filters);
      }
    };

    const formatCurrency = (value) => {
      return value ? value.toLocaleString('pt-BR') : '0';
    };

    // Função debounce simples
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    onMounted(() => {
      loadData();
    });

    return {
      biddings,
      loading,
      error,
      pagination,
      searchTerm,
      handleSearch,
      changePage,
      formatCurrency
    };
  }
};

// Aplicação principal
export const createLicitaBrasilApp = (config = {}) => {
  const app = createApp({
    template: `
      <div class="app">
        <div v-if="!isAuthenticated">
          <LoginComponent />
        </div>
        <div v-else>
          <DashboardComponent />
          <BiddingsListComponent />
        </div>
      </div>
    `,
    setup() {
      const { isAuthenticated, initializeAuth } = useAuth();

      onMounted(() => {
        initializeAuth();
      });

      return {
        isAuthenticated
      };
    }
  });

  // Registrar plugin
  app.use(LicitaBrasilPlugin, config);

  // Registrar componentes
  app.component('LoginComponent', LoginComponent);
  app.component('DashboardComponent', DashboardComponent);
  app.component('BiddingsListComponent', BiddingsListComponent);

  return app;
};
