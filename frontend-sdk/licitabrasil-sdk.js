/**
 * LicitaBrasil Web SDK
 * Cliente JavaScript para integração com a API do LicitaBrasil
 * 
 * @version 1.0.0
 * @author LicitaBrasil Team
 */

class LicitaBrasilSDK {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://localhost:3001/api/v1';
    this.timeout = config.timeout || 10000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    
    // Tokens de autenticação
    this.accessToken = null;
    this.refreshToken = null;
    
    // Callbacks para eventos
    this.onTokenRefresh = config.onTokenRefresh || null;
    this.onAuthError = config.onAuthError || null;
    this.onNetworkError = config.onNetworkError || null;
    
    // Configurar interceptadores
    this.setupInterceptors();
  }

  // Configurar interceptadores para requisições
  setupInterceptors() {
    // Interceptador para adicionar token automaticamente
    this.requestInterceptor = (config) => {
      if (this.accessToken) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${this.accessToken}`
        };
      }
      return config;
    };

    // Interceptador para tratar respostas e renovar token
    this.responseInterceptor = async (response, originalRequest) => {
      if (response.status === 401 && this.refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          await this.refreshAccessToken();
          return this.makeRequest(originalRequest);
        } catch (error) {
          this.handleAuthError(error);
          throw error;
        }
      }
      
      return response;
    };
  }

  // Fazer requisição HTTP com retry automático
  async makeRequest(config) {
    const requestConfig = this.requestInterceptor({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...config
    });

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseURL}${requestConfig.url}`, {
          ...requestConfig,
          signal: controller.signal,
          body: requestConfig.data ? JSON.stringify(requestConfig.data) : undefined
        });

        clearTimeout(timeoutId);

        // Processar resposta através do interceptador
        const processedResponse = await this.responseInterceptor(response, requestConfig);
        
        if (!processedResponse.ok) {
          const errorData = await processedResponse.json();
          throw new Error(errorData.error?.message || 'Erro na requisição');
        }

        return await processedResponse.json();
      } catch (error) {
        if (attempt === this.retryAttempts) {
          this.handleNetworkError(error);
          throw error;
        }
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  // Métodos de autenticação
  async login(email, password) {
    try {
      const response = await this.makeRequest({
        url: '/auth/login',
        method: 'POST',
        data: { email, password }
      });

      if (response.success) {
        this.setTokens(response.data.tokens);
        return response.data.user;
      }
      
      throw new Error(response.error?.message || 'Erro no login');
    } catch (error) {
      throw new Error(`Login falhou: ${error.message}`);
    }
  }

  async register(userData) {
    try {
      const response = await this.makeRequest({
        url: '/auth/register',
        method: 'POST',
        data: userData
      });

      if (response.success) {
        this.setTokens(response.data.tokens);
        return response.data.user;
      }
      
      throw new Error(response.error?.message || 'Erro no registro');
    } catch (error) {
      throw new Error(`Registro falhou: ${error.message}`);
    }
  }

  async logout() {
    try {
      await this.makeRequest({
        url: '/auth/logout',
        method: 'POST'
      });
    } catch (error) {
      console.warn('Erro no logout:', error.message);
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('Refresh token não disponível');
    }

    try {
      const response = await this.makeRequest({
        url: '/auth/refresh',
        method: 'POST',
        data: { refreshToken: this.refreshToken }
      });

      if (response.success) {
        this.setTokens(response.data.tokens);
        if (this.onTokenRefresh) {
          this.onTokenRefresh(response.data.tokens);
        }
        return response.data.tokens;
      }
      
      throw new Error('Falha ao renovar token');
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  // Métodos específicos por perfil
  async getProfile() {
    const response = await this.makeRequest({
      url: '/auth/profile'
    });
    return response.data;
  }

  async updateProfile(profileData) {
    const response = await this.makeRequest({
      url: '/auth/profile',
      method: 'PUT',
      data: profileData
    });
    return response.data;
  }

  // Dashboard methods
  async getAdminDashboard() {
    const response = await this.makeRequest({
      url: '/admin/dashboard'
    });
    return response.data;
  }

  async getSupplierDashboard() {
    const response = await this.makeRequest({
      url: '/supplier-dashboard/dashboard'
    });
    return response.data;
  }

  async getBuyerDashboard() {
    const response = await this.makeRequest({
      url: '/buyers/dashboard'
    });
    return response.data;
  }

  async getTransparencyDashboard() {
    const response = await this.makeRequest({
      url: '/transparency/dashboard'
    });
    return response.data;
  }

  // Bidding methods
  async getBiddings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await this.makeRequest({
      url: `/transparency/biddings${queryString ? '?' + queryString : ''}`
    });
    return response.data;
  }

  async getBiddingById(id) {
    const response = await this.makeRequest({
      url: `/biddings/${id}`
    });
    return response.data;
  }

  async getAvailableBiddings(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await this.makeRequest({
      url: `/supplier-dashboard/biddings/available${queryString ? '?' + queryString : ''}`
    });
    return response.data;
  }

  // Contract methods
  async getContracts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await this.makeRequest({
      url: `/transparency/contracts${queryString ? '?' + queryString : ''}`
    });
    return response.data;
  }

  async getMyContracts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await this.makeRequest({
      url: `/supplier-dashboard/contracts${queryString ? '?' + queryString : ''}`
    });
    return response.data;
  }

  // Proposal methods
  async getMyProposals(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await this.makeRequest({
      url: `/supplier-dashboard/proposals${queryString ? '?' + queryString : ''}`
    });
    return response.data;
  }

  async createProposal(proposalData) {
    const response = await this.makeRequest({
      url: '/proposals',
      method: 'POST',
      data: proposalData
    });
    return response.data;
  }

  // Citizen methods
  async createCitizenProfile(citizenData) {
    const response = await this.makeRequest({
      url: '/citizens',
      method: 'POST',
      data: citizenData
    });
    return response.data;
  }

  async getCitizenProfile() {
    const response = await this.makeRequest({
      url: '/citizens/profile/me'
    });
    return response.data;
  }

  async getInterestedBiddings() {
    const response = await this.makeRequest({
      url: '/citizens/biddings/interested'
    });
    return response.data;
  }

  // Utility methods
  setTokens(tokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    
    // Salvar no localStorage se disponível
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('licitabrasil_access_token', tokens.accessToken);
      localStorage.setItem('licitabrasil_refresh_token', tokens.refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    // Remover do localStorage se disponível
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('licitabrasil_access_token');
      localStorage.removeItem('licitabrasil_refresh_token');
    }
  }

  loadTokensFromStorage() {
    if (typeof localStorage !== 'undefined') {
      this.accessToken = localStorage.getItem('licitabrasil_access_token');
      this.refreshToken = localStorage.getItem('licitabrasil_refresh_token');
    }
  }

  isAuthenticated() {
    return !!this.accessToken;
  }

  // Event handlers
  handleAuthError(error) {
    if (this.onAuthError) {
      this.onAuthError(error);
    }
  }

  handleNetworkError(error) {
    if (this.onNetworkError) {
      this.onNetworkError(error);
    }
  }
}

// Versão TypeScript das interfaces
const TypeScriptInterfaces = `
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPPLIER' | 'PUBLIC_ENTITY' | 'CITIZEN' | 'AUDITOR';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface BiddingFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  city?: string;
  state?: string;
  minValue?: number;
  maxValue?: number;
}

interface SDKConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onTokenRefresh?: (tokens: Tokens) => void;
  onAuthError?: (error: Error) => void;
  onNetworkError?: (error: Error) => void;
}
`;

// Export para diferentes ambientes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LicitaBrasilSDK;
  module.exports.TypeScriptInterfaces = TypeScriptInterfaces;
} else if (typeof window !== 'undefined') {
  window.LicitaBrasilSDK = LicitaBrasilSDK;
}
