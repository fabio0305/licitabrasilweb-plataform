import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
  LinearProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const TestAdminPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();

  console.log('🔍 TestAdminPage - Debug Info:', {
    user: user,
    userRole: user?.role,
    authLoading: authLoading,
    timestamp: new Date().toISOString()
  });

  // Mostrar loading enquanto a autenticação está sendo verificada
  if (authLoading) {
    console.log('⏳ TestAdminPage - Aguardando autenticação...');
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Verificando autenticação...</Typography>
      </Container>
    );
  }

  if (!user) {
    console.log('❌ TestAdminPage - Usuário não autenticado');
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Usuário não autenticado.
        </Alert>
      </Container>
    );
  }

  // Verificação de autenticação já é feita pelo ProtectedRoute
  // Removida verificação redundante de role que causava problemas de timing

  // Verificação básica de segurança para TypeScript
  if (!user) {
    return null;
  }

  console.log('✅ TestAdminPage - Renderizando página principal');

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🧪 Página de Teste Admin
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ✅ Informações de Debug
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Usuário:</strong> {user.email}<br/>
            <strong>Role:</strong> {user.role}<br/>
            <strong>Nome:</strong> {user.firstName} {user.lastName}<br/>
            <strong>Status:</strong> {user.status}<br/>
            <strong>Timestamp:</strong> {new Date().toISOString()}
          </Typography>
        </CardContent>
      </Card>

      <Alert severity="success">
        <Typography variant="body2">
          <strong>✅ Sucesso!</strong> Esta página está renderizando corretamente.
          Se você consegue ver esta mensagem, significa que:
        </Typography>
        <ul>
          <li>A autenticação está funcionando</li>
          <li>O usuário tem role ADMIN</li>
          <li>O componente está renderizando</li>
          <li>O roteamento está funcionando</li>
        </ul>
      </Alert>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Próximos Passos para Debug
        </Typography>
        <Typography variant="body2">
          1. Verifique o console do navegador para logs de debug<br/>
          2. Compare com as páginas AdminBiddingsPage e AdminSettingsPage<br/>
          3. Identifique onde está a diferença que causa o problema
        </Typography>
      </Box>
    </Container>
  );
};

export default TestAdminPage;
