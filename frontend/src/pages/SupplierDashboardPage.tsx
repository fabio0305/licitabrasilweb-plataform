import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Business,
  Search,
  Star,
  Help,
  Info,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  Notifications,
  ArrowForward,
  Lightbulb,
  Assignment,
  ShoppingCart,
  People,
  Receipt,
  Folder,
  AttachMoney,
  CheckCircle,
  Schedule,
  Send,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserStatus } from '../types';

const DRAWER_WIDTH = 280;

const SupplierDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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

  // Menu items organizados por seções
  const menuItems = [
    {
      section: 'Painel',
      items: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/supplier-dashboard' },
      ]
    },
    {
      section: 'Processos',
      items: [
        { text: 'Pesquisar Licitações', icon: <Search />, path: '/biddings' },
        { text: 'Licitações Sugeridas', icon: <Lightbulb />, path: '/supplier/suggested' },
        { text: 'Minhas Propostas', icon: <Assignment />, path: '/supplier/proposals' },
        { text: 'Favoritos', icon: <Star />, path: '/supplier/favorites' },
      ]
    },
    {
      section: 'Marketplace',
      items: [
        { text: 'Pedidos', icon: <ShoppingCart />, path: '/supplier/orders' },
      ]
    },
    {
      section: 'Meus Dados',
      items: [
        { text: 'Dados do Fornecedor', icon: <Business />, path: '/supplier/profile' },
        { text: 'Faturas', icon: <Receipt />, path: '/supplier/invoices' },
        { text: 'Usuários', icon: <People />, path: '/supplier/users' },
        { text: 'Minha Biblioteca', icon: <Folder />, path: '/supplier/library' },
      ]
    },
    {
      section: 'Links Úteis',
      items: [
        { text: 'Ajuda do Sistema', icon: <Help />, path: '/help' },
        { text: 'Avisos e Informações', icon: <Info />, path: '/notices' },
      ]
    }
  ];

  // Estatísticas do fornecedor
  const supplierStats = [
    { label: 'Propostas Enviadas', value: '47', icon: <Send />, color: 'primary.main' },
    { label: 'Em Análise', value: '12', icon: <Schedule />, color: 'warning.main' },
    { label: 'Aprovadas', value: '23', icon: <CheckCircle />, color: 'success.main' },
    { label: 'Favoritos', value: '156', icon: <Star />, color: 'secondary.main' },
  ];

  if (!user) {
    return null;
  }

  // TEMPORÁRIO: Para teste, permitir qualquer usuário acessar
  // TODO: Remover após implementar verificação específica de SUPPLIER

  const drawer = (
    <Box>
      {/* Logo/Header da Sidebar */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Fornecedor
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.firstName} {user.lastName}
        </Typography>
      </Box>

      {/* Menu Items */}
      {menuItems.map((section, sectionIndex) => (
        <Box key={sectionIndex}>
          <Typography 
            variant="overline" 
            sx={{ 
              px: 2, 
              py: 1, 
              display: 'block', 
              fontWeight: 'bold',
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}
          >
            {section.section}
          </Typography>
          <List dense>
            {section.items.map((item, itemIndex) => (
              <ListItem 
                key={itemIndex}
                onClick={() => navigate(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white'
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </ListItem>
            ))}
          </List>
          {sectionIndex < menuItems.length - 1 && <Divider sx={{ my: 1 }} />}
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Header */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'white',
          color: 'primary.main',
          borderBottom: '1px solid',
          borderColor: 'divider'
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
            LicitaBrasil - Dashboard Fornecedor
          </Typography>

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>

          <IconButton onClick={handleMenuOpen} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user.firstName.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => { navigate('/supplier/profile'); handleMenuClose(); }}>
              Meu Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>Sair</MenuItem>
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
          ModalProps={{ keepMounted: true }}
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
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              top: '64px',
              height: 'calc(100vh - 64px)',
              borderRight: '1px solid',
              borderColor: 'divider'
            },
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
              <Chip label="Fornecedor" color="primary" variant="outlined" />
              <Chip 
                label={getStatusLabel(user.status)} 
                color={getStatusColor(user.status)} 
                variant="filled" 
              />
            </Box>
            <Typography variant="body1" color="text.secondary">
              Gerencie suas propostas, acompanhe licitações e expanda seus negócios na plataforma LicitaBrasil.
            </Typography>
          </Box>

          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {supplierStats.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(44, 63, 50, 0.1)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ color: stat.color, mb: 1, fontSize: 40 }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Quick Actions */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Ações Rápidas
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Search />}
                        onClick={() => navigate('/biddings')}
                        sx={{
                          py: 1.5,
                          bgcolor: 'primary.main',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }}
                      >
                        Pesquisar Licitações
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Assignment />}
                        onClick={() => navigate('/supplier/proposals')}
                        sx={{ py: 1.5 }}
                      >
                        Minhas Propostas
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Lightbulb />}
                        onClick={() => navigate('/supplier/suggested')}
                        sx={{ py: 1.5 }}
                      >
                        Sugestões
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Star />}
                        onClick={() => navigate('/supplier/favorites')}
                        sx={{ py: 1.5 }}
                      >
                        Favoritos
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Status da Conta
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Perfil de Fornecedor
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {user.firstName} {user.lastName}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Status da Conta
                    </Typography>
                    <Chip
                      label={getStatusLabel(user.status)}
                      color={getStatusColor(user.status)}
                      variant="filled"
                      size="small"
                    />
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Business />}
                    onClick={() => navigate('/supplier/profile')}
                    sx={{ mt: 2 }}
                  >
                    Gerenciar Perfil
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Licitações Sugeridas */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Licitações Sugeridas para Você
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/supplier/suggested')}
                  sx={{ color: 'primary.main' }}
                >
                  Ver Todas
                </Button>
              </Box>
              <Grid container spacing={2}>
                {[1, 2, 3].map((item) => (
                  <Grid size={{ xs: 12, md: 4 }} key={item}>
                    <Paper
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(44, 63, 50, 0.1)'
                        }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Pregão Eletrônico nº {item}23/2025
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Aquisição de equipamentos de informática para órgão público...
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip label="Tecnologia" size="small" color="primary" variant="outlined" />
                        <Typography variant="caption" color="text.secondary">
                          Prazo: 5 dias
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Propostas Recentes */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Propostas Recentes
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/supplier/proposals')}
                  sx={{ color: 'primary.main' }}
                >
                  Ver Todas
                </Button>
              </Box>
              <Grid container spacing={2}>
                {[
                  { id: 1, title: 'Pregão nº 045/2025', status: 'Em Análise', color: 'warning' },
                  { id: 2, title: 'Pregão nº 032/2025', status: 'Aprovada', color: 'success' },
                  { id: 3, title: 'Pregão nº 028/2025', status: 'Enviada', color: 'info' },
                ].map((proposal) => (
                  <Grid size={{ xs: 12, md: 4 }} key={proposal.id}>
                    <Paper
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(44, 63, 50, 0.1)'
                        }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {proposal.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Proposta enviada em 15/10/2025
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={proposal.status}
                          size="small"
                          color={proposal.color as any}
                          variant="filled"
                        />
                        <Typography variant="caption" color="text.secondary">
                          R$ 45.000,00
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Marketplace e Recursos */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Marketplace
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Gerencie seus pedidos e vendas no marketplace LicitaBrasil.
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <ShoppingCart sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>8</Typography>
                        <Typography variant="caption" color="text.secondary">Pedidos Ativos</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <AttachMoney sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>R$ 125k</Typography>
                        <Typography variant="caption" color="text.secondary">Vendas do Mês</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ShoppingCart />}
                    onClick={() => navigate('/supplier/orders')}
                    sx={{ mt: 2 }}
                  >
                    Acessar Marketplace
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Recursos e Documentos
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Acesse sua biblioteca de documentos e recursos úteis.
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        fullWidth
                        variant="text"
                        startIcon={<Folder />}
                        onClick={() => navigate('/supplier/library')}
                        sx={{ justifyContent: 'flex-start', mb: 1 }}
                      >
                        Minha Biblioteca
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        fullWidth
                        variant="text"
                        startIcon={<Receipt />}
                        onClick={() => navigate('/supplier/invoices')}
                        sx={{ justifyContent: 'flex-start', mb: 1 }}
                      >
                        Faturas e Pagamentos
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        fullWidth
                        variant="text"
                        startIcon={<People />}
                        onClick={() => navigate('/supplier/users')}
                        sx={{ justifyContent: 'flex-start', mb: 1 }}
                      >
                        Gerenciar Usuários
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        fullWidth
                        variant="text"
                        startIcon={<Help />}
                        onClick={() => navigate('/help')}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        Central de Ajuda
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default SupplierDashboardPage;
