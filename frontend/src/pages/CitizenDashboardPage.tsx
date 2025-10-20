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
  AccountBalance,
  Gavel,
  Search,
  Star,
  Help,
  Info,
  Policy,
  Description,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  Notifications,
  TrendingUp,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserStatus } from '../types';

const DRAWER_WIDTH = 280;

const CitizenDashboardPage: React.FC = () => {
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

  // Dados simulados para estatísticas públicas
  const publicStats = [
    { label: 'Licitações Ativas', value: '1.234', icon: <Gavel /> },
    { label: 'Órgãos Cadastrados', value: '567', icon: <AccountBalance /> },
    { label: 'Fornecedores', value: '8.901', icon: <Business /> },
    { label: 'Volume Total', value: 'R$ 2.1B', icon: <TrendingUp /> },
  ];

  // Menu lateral para cidadãos
  const menuItems = [
    {
      section: 'Painel',
      items: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/citizen-dashboard' },
      ]
    },
    {
      section: 'Processos',
      items: [
        { text: 'Pesquisar Licitações', icon: <Search />, path: '/biddings' },
        { text: 'Favoritos', icon: <Star />, path: '/citizen/favorites' },
      ]
    },
    {
      section: 'Meus Dados',
      items: [
        { text: 'Cadastrar como Fornecedor', icon: <Business />, path: '/register?role=supplier' },
        { text: 'Cadastrar Organização', icon: <AccountBalance />, path: '/register?role=public_entity' },
      ]
    },
    {
      section: 'Links Úteis',
      items: [
        { text: 'Ajuda do Sistema', icon: <Help />, path: '/help' },
        { text: 'Avisos e Informações', icon: <Info />, path: '/notices' },
        { text: 'Política de Privacidade', icon: <Policy />, path: '/privacy' },
        { text: 'Termos de Uso', icon: <Description />, path: '/terms' },
      ]
    }
  ];

  const drawer = (
    <Box>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Portal do Cidadão
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          LicitaBrasil
        </Typography>
      </Box>
      
      {menuItems.map((section, sectionIndex) => (
        <Box key={sectionIndex}>
          <Typography 
            variant="overline" 
            sx={{ 
              px: 2, 
              py: 1, 
              display: 'block',
              color: 'text.secondary',
              fontWeight: 600,
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
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                />
              </ListItem>
            ))}
          </List>
          {sectionIndex < menuItems.length - 1 && <Divider sx={{ my: 1 }} />}
        </Box>
      ))}
    </Box>
  );

  if (!user) {
    return null;
  }

  // TEMPORÁRIO: Para teste, permitir qualquer usuário acessar
  // TODO: Remover após implementar CITIZEN no backend

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
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            LicitaBrasil - Portal do Cidadão
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
              top: 64,
              height: 'calc(100vh - 64px)'
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
          mt: 8
        }}
      >
        <Container maxWidth="lg">
          {/* Welcome Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Bem-vindo, {user.firstName}!
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Chip 
                label="Cidadão" 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={getStatusLabel(user.status)} 
                color={getStatusColor(user.status)} 
                variant="outlined" 
              />
            </Box>
            <Typography variant="body1" color="text.secondary">
              Acompanhe licitações públicas, monitore gastos governamentais e exerça seu direito de controle social.
            </Typography>
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

          {/* Estatísticas Públicas */}
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Transparência em Números
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {publicStats.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(44, 63, 50, 0.1)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 1, fontSize: 40 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Funcionalidades para Cidadãos */}
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            O que você pode fazer
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(44, 63, 50, 0.15)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Search sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Pesquisar Licitações
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Explore todas as licitações públicas em andamento, consulte editais,
                    acompanhe prazos e monitore o processo de compras governamentais.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/biddings')}
                    sx={{ fontWeight: 600 }}
                  >
                    Explorar Licitações
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Star sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Acompanhar Favoritos
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Marque licitações de seu interesse como favoritas e receba
                    notificações sobre atualizações, prazos e resultados.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/citizen/favorites')}
                    sx={{ fontWeight: 600 }}
                  >
                    Ver Favoritos
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Upgrade de Perfil */}
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Quer participar ativamente?
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  bgcolor: 'secondary.main',
                  color: 'primary.main',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 15px 30px rgba(247, 213, 42, 0.3)'
                  }
                }}
              >
                <Business sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Torne-se Fornecedor
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>
                  Cadastre sua empresa e participe de licitações públicas.
                  Expanda seus negócios com o setor público.
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                  onClick={() => navigate('/register?role=supplier')}
                >
                  Cadastrar Empresa
                </Button>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 15px 30px rgba(44, 63, 50, 0.2)'
                  }
                }}
              >
                <AccountBalance sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Cadastrar Órgão Público
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Representa um órgão público? Cadastre sua instituição e
                  publique licitações na plataforma.
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                  onClick={() => navigate('/register?role=public_entity')}
                >
                  Cadastrar Órgão
                </Button>
              </Paper>
            </Grid>
          </Grid>

          {/* Links Úteis */}
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Recursos e Informações
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => navigate('/help')}
              >
                <CardContent>
                  <Help sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Ajuda
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tutoriais e guias para usar a plataforma
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => navigate('/notices')}
              >
                <CardContent>
                  <Info sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Avisos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Informações importantes e atualizações
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => navigate('/privacy')}
              >
                <CardContent>
                  <Policy sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Privacidade
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Política de privacidade e proteção de dados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => navigate('/terms')}
              >
                <CardContent>
                  <Description sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Termos
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Termos de uso da plataforma
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default CitizenDashboardPage;
