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

        console.log('🔍 AuthContext - Inicializando autenticação:', {
          hasToken: !!token,
          hasStoredUser: !!storedUser,
          tokenLength: token?.length || 0
        });

        if (token && storedUser) {
          // Verificar se o token ainda é válido fazendo uma requisição para o perfil
          try {
            console.log('🚀 AuthContext - Verificando token com /auth/me');
            const response = await apiCall.get<{ user: User }>('/auth/me');
            console.log('✅ AuthContext - Resposta /auth/me:', response.success);

            if (response.success && response.data) {
              console.log('✅ AuthContext - Usuário autenticado:', response.data.user.email, response.data.user.role);
              setUser(response.data.user);
              // Atualizar dados do usuário no localStorage se necessário
              localStorage.setItem('user', JSON.stringify(response.data.user));
            }
          } catch (error) {
            console.log('❌ AuthContext - Token inválido, limpando dados:', error);
            // Token inválido, limpar dados
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        } else {
          console.log('❌ AuthContext - Sem token ou usuário armazenado');
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        console.log('✅ AuthContext - Finalizando inicialização, setIsLoading(false)');
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

      // Remover confirmPassword antes de enviar para o backend
      const { confirmPassword, ...dataToSend } = userData;

      console.log('🚀 Iniciando registro de usuário:', { ...dataToSend, password: '[HIDDEN]' });

      // Usando fetch diretamente para bypass do axios
      const fetchResponse = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      console.log('✅ Register Response Status:', fetchResponse.status);

      if (fetchResponse.status === 429) {
        console.log('⚠️ Rate limit exceeded');
        throw new Error('Muitas tentativas de registro. Tente novamente em alguns minutos.');
      }

      if (!fetchResponse.ok) {
        console.log('❌ HTTP Error:', fetchResponse.status, fetchResponse.statusText);

        // Tentar ler a resposta de erro
        try {
          const errorResponse = await fetchResponse.json();
          console.log('❌ Error Response:', errorResponse);
          throw new Error(errorResponse.error?.message || errorResponse.message || `Erro HTTP: ${fetchResponse.status}`);
        } catch (jsonError) {
          throw new Error(`Erro HTTP: ${fetchResponse.status} - ${fetchResponse.statusText}`);
        }
      }

      const response = await fetchResponse.json();
      console.log('✅ Resposta recebida:', response);

      if (!response.success) {
        throw new Error(response.error?.message || 'Erro ao registrar usuário');
      }

      console.log('🎉 Usuário registrado com sucesso');
    } catch (error: any) {
      console.log('🔥 ERRO no registro:', error);
      throw error;
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
