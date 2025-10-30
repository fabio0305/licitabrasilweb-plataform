import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('🔍 ProtectedRoute - Debug Info:', {
    pathname: location.pathname,
    isAuthenticated: isAuthenticated,
    isLoading: isLoading,
    user: user,
    userRole: user?.role,
    requiredRoles: requiredRoles
  });

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    console.log('⏳ ProtectedRoute - Mostrando loading...');
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute - Não autenticado, redirecionando para login');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Verificar roles se especificados
  if (requiredRoles && requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    console.log('🔍 ProtectedRoute - Verificando role:', {
      userRole: user.role,
      requiredRoles: requiredRoles,
      hasRequiredRole: hasRequiredRole
    });

    if (!hasRequiredRole) {
      console.log('❌ ProtectedRoute - Role não autorizada, redirecionando para unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('✅ ProtectedRoute - Renderizando children');
  return <>{children}</>;
};

export default ProtectedRoute;
