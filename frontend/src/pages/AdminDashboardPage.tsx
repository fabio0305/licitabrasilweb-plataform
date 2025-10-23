import React, { useState, useEffect } from 'react';
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
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Paper,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People,
  Gavel,
  Assessment,
  Settings,
  Security,
  Menu as MenuIcon,
  Notifications,
  MoreVert,
  CheckCircle,
  Cancel,
  PendingActions,
  TrendingUp,
  ArrowForward,
  Warning,
  Info,
  SupervisorAccount,
  Business,
  AccountBalance,
  PersonAdd,
  BarChart,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserStatus, UserRole } from '../types';
import { apiCall } from '../config/api';

const DRAWER_WIDTH = 280;

interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  activeBiddings: number;
  totalBiddings: number;
  usersByRole: {
    [key in UserRole]: number;
  };
}

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Menu lateral para administradores
  const menuItems = [
    {
      section: 'Painel',
      items: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
      ]
    },
    {
      section: 'Gerenciamento',
      items: [
        { text: 'Usuários', icon: <People />, path: '/admin/users' },
        { text: 'Licitações', icon: <Gavel />, path: '/admin/biddings' },
        { text: 'Relatórios', icon: <Assessment />, path: '/admin/reports' },
      ]
    },
    {
      section: 'Sistema',
      items: [
        { text: 'Configurações', icon: <Settings />, path: '/admin/settings' },
        { text: 'Logs de Auditoria', icon: <Security />, path: '/admin/audit-logs' },
      ]
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success';
      case UserStatus.PENDING:
        return 'warning';
      case UserStatus.INACTIVE:
        return 'default';
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
      case UserStatus.INACTIVE:
        return 'Inativo';
      case UserStatus.SUSPENDED:
        return 'Suspenso';
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

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <SupervisorAccount />;
      case UserRole.SUPPLIER:
        return <Business />;
      case UserRole.PUBLIC_ENTITY:
        return <AccountBalance />;
      case UserRole.AUDITOR:
        return <Security />;
      case UserRole.CITIZEN:
        return <PersonAdd />;
      default:
        return <People />;
    }
  };

  // Carregar dados do dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Carregar estatísticas
        const statsResponse = await apiCall.get('/admin/statistics');
        if (statsResponse.success) {
          const apiStats = statsResponse.data.statistics;
          // Mapear dados da API para a interface esperada pelo frontend
          const mappedStats: AdminStats = {
            totalUsers: apiStats.users.total,
            pendingUsers: apiStats.users.pending,
            activeBiddings: apiStats.biddings.open,
            totalBiddings: apiStats.biddings.total,
            usersByRole: apiStats.users.byRole
          };
          setStats(mappedStats);
        }

        // Carregar usuários pendentes
        const usersResponse = await apiCall.get('/admin/users?status=PENDING&limit=5');
        if (usersResponse.success) {
          setPendingUsers(usersResponse.data.users);
        } else {
          console.error('Erro ao carregar usuários pendentes:', usersResponse.error);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Em caso de erro, definir valores padrão para evitar tela em branco
        setStats({
          totalUsers: 0,
          pendingUsers: 0,
          activeBiddings: 0,
          totalBiddings: 0,
          usersByRole: {
            [UserRole.ADMIN]: 0,
            [UserRole.SUPPLIER]: 0,
            [UserRole.PUBLIC_ENTITY]: 0,
            [UserRole.AUDITOR]: 0,
            [UserRole.CITIZEN]: 0,
          }
        });
        setPendingUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await apiCall.put(`/admin/users/${userId}/status`, {
        status: UserStatus.ACTIVE
      });
      
      if (response.success) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        // Atualizar estatísticas
        if (stats) {
          setStats({
            ...stats,
            pendingUsers: stats.pendingUsers - 1
          });
        }
      }
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const response = await apiCall.put(`/admin/users/${userId}/status`, {
        status: UserStatus.INACTIVE
      });
      
      if (response.success) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        // Atualizar estatísticas
        if (stats) {
          setStats({
            ...stats,
            pendingUsers: stats.pendingUsers - 1
          });
        }
      }
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Usuário não autenticado.
        </Alert>
      </Container>
    );
  }

  // @ts-ignore
  if (user.role !== UserRole.ADMIN) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Acesso negado. Esta página é restrita a administradores.
        </Alert>
      </Container>
    );
  }

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      {menuItems.map((section) => (
        <Box key={section.section}>
          <Typography
            variant="overline"
            sx={{
              px: 2,
              py: 1,
              display: 'block',
              color: 'text.secondary',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}
          >
            {section.section}
          </Typography>
          <List>
            {section.items.map((item) => (
              <ListItem
                key={item.text}
                onClick={() => navigate(item.path)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  backgroundColor: location.pathname === item.path ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Painel Administrativo - LicitaBrasil
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

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          bgcolor: 'grey.50',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Container maxWidth="xl">
          {/* Welcome Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Bem-vindo, {user.firstName}!
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label="Administrador" color="primary" variant="outlined" />
              <Chip 
                label={getStatusLabel(user.status)} 
                color={getStatusColor(user.status)} 
                variant="filled" 
              />
            </Box>
            <Typography variant="body1" color="text.secondary">
              Gerencie usuários, monitore atividades e configure a plataforma LicitaBrasil.
            </Typography>
          </Box>

          {loading && <LinearProgress sx={{ mb: 4 }} />}

          {/* Estatísticas Principais */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <People sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                          {stats.totalUsers}
                        </Typography>
                        <Typography color="text.secondary">
                          Total de Usuários
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PendingActions sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                          {stats.pendingUsers}
                        </Typography>
                        <Typography color="text.secondary">
                          Aguardando Aprovação
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Gavel sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                          {stats.activeBiddings}
                        </Typography>
                        <Typography color="text.secondary">
                          Licitações Ativas
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BarChart sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                      <Box>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                          {stats.totalBiddings}
                        </Typography>
                        <Typography color="text.secondary">
                          Total de Licitações
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Usuários por Perfil */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      Usuários por Perfil
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(stats.usersByRole).map(([role, count]) => (
                        <Grid size={{ xs: 6 }} key={role}>
                          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            {getRoleIcon(role as UserRole)}
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {count}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getRoleLabel(role as UserRole)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                      Ações Rápidas
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<People />}
                          onClick={() => navigate('/admin/users')}
                          sx={{ height: 60 }}
                        >
                          Gerenciar Usuários
                        </Button>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Gavel />}
                          onClick={() => navigate('/admin/biddings')}
                          sx={{ height: 60 }}
                        >
                          Gerenciar Licitações
                        </Button>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Assessment />}
                          onClick={() => navigate('/admin/reports')}
                          sx={{ height: 60 }}
                        >
                          Relatórios
                        </Button>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<Settings />}
                          onClick={() => navigate('/admin/settings')}
                          sx={{ height: 60 }}
                        >
                          Configurações
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Usuários Pendentes de Aprovação */}
          {pendingUsers.length > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Usuários Aguardando Aprovação
                  </Typography>
                  <Button
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/admin/users?status=PENDING')}
                    sx={{ color: 'primary.main' }}
                  >
                    Ver Todos
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Perfil</TableCell>
                        <TableCell>Data de Cadastro</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getRoleIcon(user.role)}
                              label={getRoleLabel(user.role)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApproveUser(user.id)}
                                title="Aprovar"
                              >
                                <CheckCircle />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRejectUser(user.id)}
                                title="Rejeitar"
                              >
                                <Cancel />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Alertas e Notificações */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Alertas do Sistema
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {stats && stats.pendingUsers > 0 && (
                      <Alert severity="warning" icon={<Warning />}>
                        {stats.pendingUsers} usuário{stats.pendingUsers > 1 ? 's' : ''} aguardando aprovação
                      </Alert>
                    )}
                    <Alert severity="info" icon={<Info />}>
                      Sistema funcionando normalmente
                    </Alert>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Atividades Recentes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Últimas atividades administrativas serão exibidas aqui.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Security />}
                      onClick={() => navigate('/admin/audit-logs')}
                      fullWidth
                    >
                      Ver Logs de Auditoria
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
