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
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  LinearProgress,
  Alert,
  Snackbar,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
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
  Save,
  Refresh,
  ExpandMore,
  Email,
  Sms,
  Payment,
  Cloud,
  Lock,
  Palette,
  Language,
  Schedule,
  Storage,
  Backup,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../config/api';

const DRAWER_WIDTH = 280;

interface SystemConfig {
  [key: string]: {
    value: any;
    type: 'string' | 'number' | 'boolean' | 'json';
    description: string;
  };
}

interface ConfigSection {
  title: string;
  icon: React.ReactNode;
  configs: string[];
}

const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const theme = useTheme();

  console.log('🔍 AdminSettingsPage - Debug Info:', {
    user: user,
    userRole: user?.role,
    authLoading: authLoading,
    timestamp: new Date().toISOString()
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [configs, setConfigs] = useState<SystemConfig>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Seções de configuração
  const configSections: ConfigSection[] = [
    {
      title: 'Configurações Gerais',
      icon: <Settings />,
      configs: ['platform_name', 'platform_description', 'contact_email', 'support_phone']
    },
    {
      title: 'Notificações',
      icon: <Notifications />,
      configs: ['email_notifications', 'sms_notifications', 'push_notifications', 'notification_frequency']
    },
    {
      title: 'Licitações',
      icon: <Gavel />,
      configs: ['bidding_auto_approval', 'min_bidding_duration', 'max_bidding_duration', 'proposal_deadline_hours']
    },
    {
      title: 'Usuários',
      icon: <People />,
      configs: ['user_auto_approval', 'max_login_attempts', 'session_timeout', 'password_min_length']
    },
    {
      title: 'Segurança',
      icon: <Security />,
      configs: ['two_factor_auth', 'password_complexity', 'audit_log_retention', 'ip_whitelist']
    },
    {
      title: 'Integração',
      icon: <Cloud />,
      configs: ['api_rate_limit', 'webhook_enabled', 'external_auth', 'backup_frequency']
    }
  ];

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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  // Carregar configurações
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await apiCall.get('/admin/config');
      if (response.success && response.data?.config) {
        setConfigs(response.data.config);
        console.log('⚙️ Configurações carregadas:', response.data.config);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setSnackbarMessage('Erro ao carregar configurações');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value
      }
    }));
  };

  const handleSaveConfigs = async () => {
    try {
      setSaving(true);

      // Converter configs para o formato esperado pelo backend
      const configsToSave = Object.entries(configs).reduce((acc, [key, config]) => {
        acc[key] = {
          value: config.value,
          type: config.type,
          description: config.description
        };
        return acc;
      }, {} as Record<string, any>);

      console.log('💾 Salvando configurações:', configsToSave);

      const response = await apiCall.put('/admin/config', { configs: configsToSave });
      if (response.success) {
        setSnackbarMessage('Configurações salvas com sucesso!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        // Recarregar configurações para garantir sincronização
        await loadConfigs();
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setSnackbarMessage('Erro ao salvar configurações');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const renderConfigField = (key: string, config: SystemConfig[string]) => {
    switch (config.type) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={config.value}
                onChange={(e) => handleConfigChange(key, e.target.checked)}
              />
            }
            label={config.description}
          />
        );
      case 'number':
        return (
          <TextField
            fullWidth
            label={config.description}
            type="number"
            value={config.value}
            onChange={(e) => handleConfigChange(key, Number(e.target.value))}
            variant="outlined"
            size="small"
          />
        );
      case 'json':
        return (
          <TextField
            fullWidth
            label={config.description}
            multiline
            rows={3}
            value={JSON.stringify(config.value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleConfigChange(key, parsed);
              } catch {
                // Ignore invalid JSON while typing
              }
            }}
            variant="outlined"
            size="small"
          />
        );
      default:
        return (
          <TextField
            fullWidth
            label={config.description}
            value={config.value}
            onChange={(e) => handleConfigChange(key, e.target.value)}
            variant="outlined"
            size="small"
          />
        );
    }
  };

  // Mostrar loading enquanto a autenticação está sendo verificada
  if (authLoading) {
    console.log('⏳ AdminSettingsPage - Aguardando autenticação...');
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Verificando autenticação...</Typography>
      </Container>
    );
  }

  if (!user) {
    console.log('❌ AdminSettingsPage - Usuário não autenticado');
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
          <Typography variant="overline" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}>
            {section.section}
          </Typography>
          <List>
            {section.items.map((item) => (
              <ListItem
                key={item.text}
                onClick={() => navigate(item.path)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: location.pathname === item.path ? 'primary.main' : 'transparent',
                  color: location.pathname === item.path ? 'white' : 'inherit',
                  '&:hover': {
                    backgroundColor: location.pathname === item.path ? 'primary.dark' : 'grey.100',
                  },
                  mx: 1,
                  borderRadius: 1,
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          backgroundColor: 'primary.main',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Configurações do Sistema - LicitaBrasil
          </Typography>

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>

          <IconButton
            color="inherit"
            onClick={handleMenuClick}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user.firstName.charAt(0)}
            </Avatar>
          </IconButton>

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

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />

        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Configurações do Sistema
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure parâmetros globais da plataforma
            </Typography>
          </Box>

          {/* Controles */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Configurações Globais
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={loadConfigs}
                    disabled={loading}
                  >
                    Recarregar
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveConfigs}
                    disabled={saving || loading}
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {loading && <LinearProgress sx={{ mb: 3 }} />}

          {/* Seções de Configuração */}
          {!loading && Object.keys(configs).length === 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Nenhuma configuração foi carregada. Verifique a conexão com o servidor.
            </Alert>
          )}

          {!loading && Object.keys(configs).length > 0 && (
            <Box>
              {configSections.map((section) => {
                console.log(`🔧 Renderizando seção: ${section.title}`, {
                  configs: section.configs,
                  availableConfigs: section.configs.map(key => ({ key, exists: !!configs[key] }))
                });
                return (
                <Accordion key={section.title} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {section.icon}
                      <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold' }}>
                        {section.title}
                      </Typography>
                      <Chip
                        label={section.configs.length}
                        size="small"
                        sx={{ ml: 2 }}
                        color="primary"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      {section.configs.map((configKey) => {
                        const config = configs[configKey];
                        if (!config) {
                          console.log(`❌ Config não encontrada: ${configKey}`);
                          return null;
                        }

                        return (
                          <Grid size={{ xs: 12, md: 6 }} key={configKey}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                {configKey.replace(/_/g, ' ').toUpperCase()}
                              </Typography>
                              {renderConfigField(configKey, config)}
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Tipo: {config.type} | Chave: {configKey}
                              </Typography>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                );
              })}

              {/* Configurações Avançadas */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Lock />
                    <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold' }}>
                      Configurações Avançadas
                    </Typography>
                    <Chip label="Avançado" size="small" sx={{ ml: 2 }} color="warning" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Atenção:</strong> Estas configurações são avançadas e podem afetar o funcionamento da plataforma.
                      Altere apenas se souber o que está fazendo.
                    </Typography>
                  </Alert>
                  <Grid container spacing={3}>
                    {Object.entries(configs)
                      .filter(([key]) => !configSections.some(section => section.configs.includes(key)))
                      .map(([configKey, config]) => (
                        <Grid size={{ xs: 12, md: 6 }} key={configKey}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                              {configKey.replace(/_/g, ' ').toUpperCase()}
                            </Typography>
                            {renderConfigField(configKey, config)}
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Tipo: {config.type} | Chave: {configKey}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          {/* Informações do Sistema */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Informações do Sistema
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">Versão da Plataforma</Typography>
                  <Typography variant="h6">v1.0.0</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">Última Atualização</Typography>
                  <Typography variant="h6">22/10/2025</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">Ambiente</Typography>
                  <Chip label="Produção" color="success" size="small" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip label="Online" color="success" size="small" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Container>

        {/* Snackbar para feedback */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default AdminSettingsPage;
