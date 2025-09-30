/**
 * Exemplo de integração com React
 * Demonstra como usar o LicitaBrasil SDK em uma aplicação React
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import LicitaBrasilSDK from '../licitabrasil-sdk.js';

// Context para autenticação
const AuthContext = createContext();

// Provider de autenticação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sdk] = useState(() => new LicitaBrasilSDK({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
    onTokenRefresh: (tokens) => {
      console.log('Tokens renovados automaticamente');
    },
    onAuthError: (error) => {
      console.error('Erro de autenticação:', error);
      setUser(null);
    },
    onNetworkError: (error) => {
      console.error('Erro de rede:', error);
    }
  }));

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Carregar tokens do localStorage
      sdk.loadTokensFromStorage();
      
      if (sdk.isAuthenticated()) {
        // Verificar se o token ainda é válido
        const profile = await sdk.getProfile();
        setUser(profile.user);
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
      sdk.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const userData = await sdk.login(email, password);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const newUser = await sdk.register(userData);
      setUser(newUser);
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await sdk.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await sdk.updateProfile(profileData);
      setUser(updatedUser.user);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    sdk,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Componente de login
export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Login</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Senha:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
};

// Componente de dashboard baseado no role do usuário
export const Dashboard = () => {
  const { user, sdk } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;

    try {
      let data;
      switch (user.role) {
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
      setDashboardData(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard - {user.role}</h1>
      <div className="user-info">
        <p>Bem-vindo, {user.firstName} {user.lastName}</p>
        <p>Email: {user.email}</p>
        <p>Status: {user.status}</p>
      </div>
      
      {dashboardData && (
        <div className="dashboard-content">
          {/* Renderizar conteúdo específico do dashboard */}
          <pre>{JSON.stringify(dashboardData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Componente para listar licitações
export const BiddingsList = () => {
  const [biddings, setBiddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: ''
  });
  const { sdk, user } = useAuth();

  useEffect(() => {
    loadBiddings();
  }, [filters]);

  const loadBiddings = async () => {
    try {
      let data;
      if (user && user.role === 'SUPPLIER') {
        data = await sdk.getAvailableBiddings(filters);
      } else {
        data = await sdk.getBiddings(filters);
      }
      setBiddings(data.biddings || []);
    } catch (error) {
      console.error('Erro ao carregar licitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters({
      ...filters,
      search: e.target.value,
      page: 1
    });
  };

  if (loading) {
    return <div className="loading">Carregando licitações...</div>;
  }

  return (
    <div className="biddings-list">
      <h2>Licitações</h2>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Buscar licitações..."
          value={filters.search}
          onChange={handleSearch}
        />
      </div>
      
      <div className="biddings-grid">
        {biddings.map((bidding) => (
          <div key={bidding.id} className="bidding-card">
            <h3>{bidding.title}</h3>
            <p>Número: {bidding.biddingNumber}</p>
            <p>Status: {bidding.status}</p>
            <p>Valor Estimado: R$ {bidding.estimatedValue?.toLocaleString()}</p>
            <p>Órgão: {bidding.publicEntity?.name}</p>
          </div>
        ))}
      </div>
      
      {biddings.length === 0 && (
        <div className="no-results">
          Nenhuma licitação encontrada.
        </div>
      )}
    </div>
  );
};

// Componente de rota protegida
export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Verificando autenticação...</div>;
  }

  if (!user) {
    return <LoginForm />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="unauthorized">
        <h2>Acesso Negado</h2>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return children;
};

// Exemplo de uso completo
export const App = () => {
  return (
    <AuthProvider>
      <div className="app">
        <ProtectedRoute>
          <Dashboard />
          <BiddingsList />
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
};
