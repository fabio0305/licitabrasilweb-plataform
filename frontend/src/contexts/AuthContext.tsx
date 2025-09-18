import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, LoginForm, RegisterForm } from '../types';
import { apiCall } from '../config/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Verificar se há um usuário logado ao inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          // Verificar se o token ainda é válido fazendo uma requisição para o perfil
          try {
            const response = await apiCall.get<{ user: User }>('/auth/me');
            if (response.success && response.data) {
              setUser(response.data.user);
              // Atualizar dados do usuário no localStorage se necessário
              localStorage.setItem('user', JSON.stringify(response.data.user));
            }
          } catch (error) {
            // Token inválido, limpar dados
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginForm) => {
    try {
      setIsLoading(true);
      const response = await apiCall.post<AuthResponse>('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { user: userData, tokens } = response.data;
        
        // Salvar tokens e dados do usuário
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
      } else {
        throw new Error(response.error?.message || 'Erro ao fazer login');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterForm) => {
    try {
      setIsLoading(true);
      const response = await apiCall.post('/auth/register', userData);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Erro ao registrar usuário');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || error.message || 'Erro ao registrar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Fazer logout no servidor (opcional, pode falhar se o token já expirou)
    apiCall.post('/auth/logout').catch(() => {
      // Ignorar erros de logout no servidor
    });

    // Limpar dados locais
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
