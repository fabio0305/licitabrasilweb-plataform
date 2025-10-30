import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Alert,
  Paper,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileDebugPage: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const updateDebugInfo = () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      setDebugInfo({
        timestamp: new Date().toISOString(),
        isAuthenticated,
        isLoading,
        hasUser: !!user,
        hasToken: !!token,
        hasStoredUser: !!storedUser,
        userFromContext: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status
        } : null,
        storedUserData: storedUser ? JSON.parse(storedUser) : null,
        tokenLength: token ? token.length : 0,
      });
    };

    updateDebugInfo();
    
    // Atualizar debug info a cada segundo
    const interval = setInterval(updateDebugInfo, 1000);
    
    return () => clearInterval(interval);
  }, [user, isAuthenticated, isLoading]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const testApiCall = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('API Test Result:', data);
      alert(`API Test: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('API Test Error:', error);
      alert(`API Test Error: ${error}`);
    }
  };

  return (
    <Box>
      {/* Header com teste do perfil */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Profile Debug Page
          </Typography>
          
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>
          
          {/* Teste do Avatar - com fallback */}
          {user ? (
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user.firstName?.charAt(0) || 'U'}{user.lastName?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          ) : (
            <IconButton color="inherit" disabled>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.500' }}>
                ?
              </Avatar>
            </IconButton>
          )}
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => navigate('/profile')}>Perfil</MenuItem>
            <MenuItem onClick={handleLogout}>Sair</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Debug do Sistema de Autenticação
        </Typography>

        {/* Status de Loading */}
        {isLoading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Sistema de autenticação carregando...
          </Alert>
        )}

        {/* Status de Autenticação */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status da Autenticação
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip
                    label={`Autenticado: ${isAuthenticated ? 'SIM' : 'NÃO'}`}
                    color={isAuthenticated ? 'success' : 'error'}
                  />
                  <Chip
                    label={`Carregando: ${isLoading ? 'SIM' : 'NÃO'}`}
                    color={isLoading ? 'warning' : 'success'}
                  />
                  <Chip
                    label={`Usuário: ${user ? 'PRESENTE' : 'AUSENTE'}`}
                    color={user ? 'success' : 'error'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ações de Teste
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button variant="outlined" onClick={testApiCall}>
                    Testar API /auth/me
                  </Button>
                  <Button variant="outlined" onClick={() => window.location.reload()}>
                    Recarregar Página
                  </Button>
                  <Button variant="outlined" onClick={() => setDebugInfo({...debugInfo, timestamp: new Date().toISOString()})}>
                    <Refresh /> Atualizar Debug
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Informações de Debug */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Informações de Debug
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </Paper>
          </CardContent>
        </Card>

        {/* Informações do Usuário */}
        {user && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dados do Usuário Atual
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mr: 2 }}>
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email} - {user.role}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default ProfileDebugPage;
