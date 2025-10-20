import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
} from '@mui/material';
import {
  AccountCircle,
  Business,
  AccountBalance,
  Gavel,
  Assignment,
  TrendingUp,
  Notifications,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, UserStatus } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success';
      case UserStatus.PENDING:
        return 'warning';
      case UserStatus.SUSPENDED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Ativo';
      case UserStatus.PENDING:
        return 'Pendente';
      case UserStatus.SUSPENDED:
        return 'Suspenso';
      case UserStatus.INACTIVE:
        return 'Inativo';
      default:
        return status;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.SUPPLIER:
        return 'Fornecedor';
      case UserRole.PUBLIC_ENTITY:
        return 'Órgão Público';
      case UserRole.AUDITOR:
        return 'Auditor';
      case UserRole.CITIZEN:
        return 'Cidadão';
      default:
        return role;
    }
  };

  // Redirecionar usuários para dashboards específicas
  useEffect(() => {
    if (user && user.role === UserRole.CITIZEN) {
      navigate('/citizen-dashboard', { replace: true });
    } else if (user && user.role === UserRole.SUPPLIER) {
      navigate('/supplier-dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Se for CITIZEN ou SUPPLIER, não renderizar nada enquanto redireciona
  if (user.role === UserRole.CITIZEN || user.role === UserRole.SUPPLIER) {
    return null;
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Licita Brasil Web - Dashboard
          </Typography>
          
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>
          
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              Meu Perfil
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              Configurações
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Bem-vindo, {user.firstName}!
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              label={getRoleLabel(user.role)} 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              label={getStatusLabel(user.status)} 
              color={getStatusColor(user.status)} 
              variant="outlined" 
            />
          </Box>
        </Box>

        {/* Status Alert */}
        {user.status === UserStatus.PENDING && (
          <Card sx={{ mb: 4, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conta Pendente de Aprovação
              </Typography>
              <Typography variant="body2">
                Sua conta está aguardando aprovação. Você receberá um email quando sua conta for ativada.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Cards */}
        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccountCircle sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Meu Perfil
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gerencie suas informações pessoais e configurações de conta
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Role-specific Cards */}

          {user.role === UserRole.PUBLIC_ENTITY && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Business sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Minhas Licitações
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gerencie suas licitações criadas e em andamento
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Assignment sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Contratos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Visualize e gerencie seus contratos ativos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {user.role === UserRole.ADMIN && (
            <>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccountBalance sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Administração
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Gerencie usuários, configurações e sistema
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Relatórios
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Visualize estatísticas e relatórios do sistema
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Quick Actions */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ações Rápidas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Esta seção será implementada com ações específicas baseadas no seu perfil de usuário.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardPage;
