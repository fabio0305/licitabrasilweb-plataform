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
  AccountBalance,
  Gavel,
  Add,
  Inbox,
  CheckCircle,
  Assessment,
  People,
  Folder,
  Help,
  Info,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  Notifications,
  ArrowForward,
  Archive,
  BarChart,
  Store,
  TrendingUp,
  PendingActions,
  Description,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserStatus } from '../types';

const DRAWER_WIDTH = 280;

const PublicEntityDashboardPage: React.FC = () => {
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
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/public-entity-dashboard' },
      ]
    },
    {
      section: 'Licitações',
      items: [
        { text: 'Minhas Licitações', icon: <Gavel />, path: '/public-entity/biddings' },
        { text: 'Criar Nova Licitação', icon: <Add />, path: '/public-entity/biddings/new' },
        { text: 'Propostas Recebidas', icon: <Inbox />, path: '/public-entity/proposals' },
        { text: 'Licitações Encerradas', icon: <Archive />, path: '/public-entity/biddings/closed' },
      ]
    },
    {
      section: 'Gestão',
      items: [
        { text: 'Fornecedores Cadastrados', icon: <Store />, path: '/public-entity/suppliers' },
        { text: 'Contratos', icon: <Description />, path: '/public-entity/contracts' },
        { text: 'Relatórios', icon: <Assessment />, path: '/public-entity/reports' },
      ]
    },
    {
      section: 'Meus Dados',
      items: [
        { text: 'Dados do Órgão', icon: <AccountBalance />, path: '/public-entity/profile' },
        { text: 'Usuários', icon: <People />, path: '/public-entity/users' },
        { text: 'Documentos', icon: <Folder />, path: '/public-entity/documents' },
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

  // Estatísticas do órgão público
  const publicEntityStats = [
    { label: 'Licitações Ativas', value: '18', icon: <Gavel />, color: 'primary.main' },
    { label: 'Propostas Pendentes', value: '45', icon: <PendingActions />, color: 'warning.main' },
    { label: 'Encerradas no Mês', value: '12', icon: <CheckCircle />, color: 'success.main' },
    { label: 'Fornecedores', value: '234', icon: <Store />, color: 'info.main' },
  ];

  if (!user) {
    return null;
  }

  // TEMPORÁRIO: Para teste, permitir qualquer usuário acessar
  // TODO: Remover após implementar verificação específica de PUBLIC_ENTITY

  const drawer = (
    <Box>
      {/* Logo/Header da Sidebar */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Órgão Público
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
            LicitaBrasil - Dashboard Órgão Público
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
            <MenuItem onClick={() => { navigate('/public-entity/profile'); handleMenuClose(); }}>
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
              <Chip label="Órgão Público" color="primary" variant="outlined" />
              <Chip
                label={getStatusLabel(user.status)}
                color={getStatusColor(user.status)}
                variant="filled"
              />
            </Box>
            <Typography variant="body1" color="text.secondary">
              Gerencie suas licitações, analise propostas e conduza processos licitatórios transparentes e eficientes.
            </Typography>
          </Box>

          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {publicEntityStats.map((stat, index) => (
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
                        startIcon={<Add />}
                        onClick={() => navigate('/public-entity/biddings/new')}
                        sx={{
                          py: 1.5,
                          bgcolor: 'primary.main',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }}
                      >
                        Nova Licitação
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Inbox />}
                        onClick={() => navigate('/public-entity/proposals')}
                        sx={{ py: 1.5 }}
                      >
                        Ver Propostas
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Gavel />}
                        onClick={() => navigate('/public-entity/biddings')}
                        sx={{ py: 1.5 }}
                      >
                        Minhas Licitações
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Assessment />}
                        onClick={() => navigate('/public-entity/reports')}
                        sx={{ py: 1.5 }}
                      >
                        Relatórios
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
                    Status do Órgão
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Órgão Público
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
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Processos Ativos
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      18 Licitações
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AccountBalance />}
                    onClick={() => navigate('/public-entity/profile')}
                    sx={{ mt: 2 }}
                  >
                    Gerenciar Perfil
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Licitações Ativas */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Licitações Ativas
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/public-entity/biddings')}
                  sx={{ color: 'primary.main' }}
                >
                  Ver Todas
                </Button>
              </Box>
              <Grid container spacing={2}>
                {[
                  { id: 1, title: 'Pregão Eletrônico nº 045/2025', category: 'Tecnologia', proposals: 12, deadline: '5 dias' },
                  { id: 2, title: 'Pregão Eletrônico nº 046/2025', category: 'Serviços', proposals: 8, deadline: '3 dias' },
                  { id: 3, title: 'Pregão Eletrônico nº 047/2025', category: 'Materiais', proposals: 15, deadline: '7 dias' },
                ].map((bidding) => (
                  <Grid size={{ xs: 12, md: 4 }} key={bidding.id}>
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
                        {bidding.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Categoria: {bidding.category}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip label={`${bidding.proposals} propostas`} size="small" color="info" variant="outlined" />
                        <Typography variant="caption" color="text.secondary">
                          Prazo: {bidding.deadline}
                        </Typography>
                      </Box>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/public-entity/biddings/${bidding.id}`)}
                        sx={{ mt: 1 }}
                      >
                        Gerenciar
                      </Button>
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
                  onClick={() => navigate('/public-entity/proposals')}
                  sx={{ color: 'primary.main' }}
                >
                  Ver Todas
                </Button>
              </Box>
              <Grid container spacing={2}>
                {[
                  { id: 1, supplier: 'TechSolutions Ltda', bidding: 'Pregão nº 045/2025', value: 'R$ 85.000,00', status: 'Pendente', color: 'warning' },
                  { id: 2, supplier: 'ServiTech Corp', bidding: 'Pregão nº 046/2025', value: 'R$ 45.000,00', status: 'Analisando', color: 'info' },
                  { id: 3, supplier: 'MaterialPro S.A.', bidding: 'Pregão nº 047/2025', value: 'R$ 120.000,00', status: 'Aprovada', color: 'success' },
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
                        {proposal.supplier}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {proposal.bidding}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                        {proposal.value}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={proposal.status}
                          size="small"
                          color={proposal.color as any}
                          variant="filled"
                        />
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => navigate(`/public-entity/proposals/${proposal.id}`)}
                        >
                          Analisar
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Gestão e Relatórios */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Gestão de Fornecedores
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Gerencie fornecedores cadastrados e contratos ativos.
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Store sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>234</Typography>
                        <Typography variant="caption" color="text.secondary">Fornecedores</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Description sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>67</Typography>
                        <Typography variant="caption" color="text.secondary">Contratos Ativos</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Store />}
                    onClick={() => navigate('/public-entity/suppliers')}
                    sx={{ mt: 2 }}
                  >
                    Gerenciar Fornecedores
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Relatórios e Análises
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Acompanhe métricas e gere relatórios de desempenho.
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <TrendingUp sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>R$ 2.1M</Typography>
                        <Typography variant="caption" color="text.secondary">Volume Mensal</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <BarChart sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>95%</Typography>
                        <Typography variant="caption" color="text.secondary">Taxa Sucesso</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={() => navigate('/public-entity/reports')}
                    sx={{ mt: 2 }}
                  >
                    Ver Relatórios
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recursos e Documentos */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Recursos e Documentos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Acesse documentos, templates e recursos úteis para licitações.
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button
                    fullWidth
                    variant="text"
                    startIcon={<Folder />}
                    onClick={() => navigate('/public-entity/documents')}
                    sx={{
                      justifyContent: 'flex-start',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.light',
                        color: 'white'
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Documentos
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Templates e editais
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button
                    fullWidth
                    variant="text"
                    startIcon={<People />}
                    onClick={() => navigate('/public-entity/users')}
                    sx={{
                      justifyContent: 'flex-start',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.light',
                        color: 'white'
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Usuários
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Equipe do órgão
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button
                    fullWidth
                    variant="text"
                    startIcon={<Help />}
                    onClick={() => navigate('/help')}
                    sx={{
                      justifyContent: 'flex-start',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.light',
                        color: 'white'
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Ajuda
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tutoriais e suporte
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button
                    fullWidth
                    variant="text"
                    startIcon={<Info />}
                    onClick={() => navigate('/notices')}
                    sx={{
                      justifyContent: 'flex-start',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.light',
                        color: 'white'
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        Avisos
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Informações importantes
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicEntityDashboardPage;
