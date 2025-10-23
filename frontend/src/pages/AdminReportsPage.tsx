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
  TextField,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Alert,
  useTheme,
  Paper,
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
  Download,
  DateRange,
  TrendingUp,
  PieChart,
  BarChart,
  ShowChart,
  TableChart,
  FileDownload,
  Print,
  Refresh,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../config/api';

const DRAWER_WIDTH = 280;

interface ReportData {
  users: {
    total: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    growth: Array<{ month: string; count: number }>;
  };
  biddings: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalValue: number;
    avgValue: number;
    growth: Array<{ month: string; count: number; value: number }>;
  };
  proposals: {
    total: number;
    byStatus: Record<string, number>;
    avgPerBidding: number;
    successRate: number;
  };
  contracts: {
    total: number;
    totalValue: number;
    avgValue: number;
    byStatus: Record<string, number>;
  };
}

const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30days');
  const [reportType, setReportType] = useState('overview');

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Carregar dados dos relatórios
  useEffect(() => {
    loadReportData();
  }, [dateRange, reportType]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateRange,
        type: reportType,
      });

      const response = await apiCall.get(`/admin/reports?${params.toString()}`);
      if (response.success && response.data) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const params = new URLSearchParams({
        dateRange,
        type: reportType,
        format,
      });

      const response = await fetch(`/api/v1/admin/reports/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${reportType}_${dateRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  const handlePrintReport = () => {
    window.print();
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
  if (user.role !== 'ADMIN') {
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
            Relatórios Avançados - LicitaBrasil
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
              Relatórios Avançados
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Análises detalhadas e estatísticas da plataforma
            </Typography>
          </Box>

          {/* Filtros e Controles */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Período</InputLabel>
                    <Select
                      value={dateRange}
                      label="Período"
                      onChange={(e) => setDateRange(e.target.value)}
                    >
                      <MenuItem value="last7days">Últimos 7 dias</MenuItem>
                      <MenuItem value="last30days">Últimos 30 dias</MenuItem>
                      <MenuItem value="last90days">Últimos 90 dias</MenuItem>
                      <MenuItem value="last6months">Últimos 6 meses</MenuItem>
                      <MenuItem value="lastyear">Último ano</MenuItem>
                      <MenuItem value="allyear">Todo o período</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Relatório</InputLabel>
                    <Select
                      value={reportType}
                      label="Tipo de Relatório"
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <MenuItem value="overview">Visão Geral</MenuItem>
                      <MenuItem value="users">Usuários</MenuItem>
                      <MenuItem value="biddings">Licitações</MenuItem>
                      <MenuItem value="proposals">Propostas</MenuItem>
                      <MenuItem value="contracts">Contratos</MenuItem>
                      <MenuItem value="financial">Financeiro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={loadReportData}
                    sx={{ height: 56 }}
                  >
                    Atualizar
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<FileDownload />}
                      onClick={() => handleExportReport('pdf')}
                      size="small"
                    >
                      PDF
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<FileDownload />}
                      onClick={() => handleExportReport('excel')}
                      size="small"
                    >
                      Excel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<FileDownload />}
                      onClick={() => handleExportReport('csv')}
                      size="small"
                    >
                      CSV
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Print />}
                      onClick={handlePrintReport}
                      size="small"
                    >
                      Imprimir
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {loading && <LinearProgress sx={{ mb: 3 }} />}

          {/* Relatórios */}
          {reportData && (
            <>
              {/* Resumo Executivo */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Resumo Executivo
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'white', textAlign: 'center' }}>
                        <People sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {reportData.users.total}
                        </Typography>
                        <Typography variant="body2">
                          Total de Usuários
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', color: 'white', textAlign: 'center' }}>
                        <Gavel sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {reportData.biddings.total}
                        </Typography>
                        <Typography variant="body2">
                          Total de Licitações
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.light', color: 'white', textAlign: 'center' }}>
                        <Assessment sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {reportData.proposals.total}
                        </Typography>
                        <Typography variant="body2">
                          Total de Propostas
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.light', color: 'white', textAlign: 'center' }}>
                        <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                          {formatCurrency(reportData.biddings.totalValue)}
                        </Typography>
                        <Typography variant="body2">
                          Valor Total Licitado
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Gráficos e Análises */}
              <Grid container spacing={3}>
                {/* Usuários por Perfil */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        <PieChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Usuários por Perfil
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {Object.entries(reportData.users.byRole).map(([role, count]) => (
                          <Box key={role} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">{role}</Typography>
                            <Chip label={count} size="small" color="primary" />
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Licitações por Status */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Licitações por Status
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {Object.entries(reportData.biddings.byStatus).map(([status, count]) => (
                          <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">{status}</Typography>
                            <Chip label={count} size="small" color="success" />
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Métricas de Performance */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        <ShowChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Métricas de Performance
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body2">Taxa de Sucesso das Propostas</Typography>
                          <Typography variant="h6" color="success.main">
                            {formatPercentage(reportData.proposals.successRate)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body2">Média de Propostas por Licitação</Typography>
                          <Typography variant="h6" color="info.main">
                            {reportData.proposals.avgPerBidding.toFixed(1)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body2">Valor Médio das Licitações</Typography>
                          <Typography variant="h6" color="warning.main">
                            {formatCurrency(reportData.biddings.avgValue)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Resumo de Contratos */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        <TableChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Resumo de Contratos
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body2">Total de Contratos</Typography>
                          <Typography variant="h6" color="primary.main">
                            {reportData.contracts.total}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body2">Valor Total Contratado</Typography>
                          <Typography variant="h6" color="success.main">
                            {formatCurrency(reportData.contracts.totalValue)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="body2">Valor Médio dos Contratos</Typography>
                          <Typography variant="h6" color="info.main">
                            {formatCurrency(reportData.contracts.avgValue)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default AdminReportsPage;
