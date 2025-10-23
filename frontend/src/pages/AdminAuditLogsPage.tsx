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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Search,
  Refresh,
  Visibility,
  FilterList,
  Download,
  DateRange,
  Person,
  Edit,
  Delete,
  Add,
  Warning,
  Info,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../config/api';

const DRAWER_WIDTH = 280;

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  userName: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const AdminAuditLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

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

  const getSeverityColor = (severity: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (severity) {
      case 'LOW':
        return 'info';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return <Info />;
      case 'MEDIUM':
        return <Warning />;
      case 'HIGH':
        return <Error />;
      case 'CRITICAL':
        return <Error />;
      default:
        return <Info />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE') || action.includes('REGISTER')) return <Add />;
    if (action.includes('UPDATE') || action.includes('EDIT')) return <Edit />;
    if (action.includes('DELETE') || action.includes('REMOVE')) return <Delete />;
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return <Person />;
    if (action.includes('APPROVE') || action.includes('ACCEPT')) return <CheckCircle />;
    return <Info />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Carregar logs
  useEffect(() => {
    loadLogs();
  }, [page, rowsPerPage, search, actionFilter, entityTypeFilter, severityFilter, userFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });

      if (search) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);
      if (entityTypeFilter) params.append('entityType', entityTypeFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (userFilter) params.append('userId', userFilter);

      const response = await apiCall.get<AuditLogsResponse>(`/admin/audit-logs?${params.toString()}`);
      if (response.success && response.data) {
        setLogs(response.data.logs);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleActionFilterChange = (event: any) => {
    setActionFilter(event.target.value);
    setPage(0);
  };

  const handleEntityTypeFilterChange = (event: any) => {
    setEntityTypeFilter(event.target.value);
    setPage(0);
  };

  const handleSeverityFilterChange = (event: any) => {
    setSeverityFilter(event.target.value);
    setPage(0);
  };

  const handleUserFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserFilter(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  const handleExportLogs = async () => {
    try {
      const params = new URLSearchParams({
        search,
        action: actionFilter,
        entityType: entityTypeFilter,
        severity: severityFilter,
        userId: userFilter,
        format: 'csv',
      });

      const response = await fetch(`/api/v1/admin/audit-logs/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
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
            Logs de Auditoria - LicitaBrasil
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
              Logs de Auditoria
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitore todas as ações realizadas na plataforma
            </Typography>
          </Box>

          {/* Filtros e Busca */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Buscar logs"
                    variant="outlined"
                    value={search}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Ação</InputLabel>
                    <Select
                      value={actionFilter}
                      label="Ação"
                      onChange={handleActionFilterChange}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      <MenuItem value="CREATE">Criar</MenuItem>
                      <MenuItem value="UPDATE">Atualizar</MenuItem>
                      <MenuItem value="DELETE">Excluir</MenuItem>
                      <MenuItem value="LOGIN">Login</MenuItem>
                      <MenuItem value="LOGOUT">Logout</MenuItem>
                      <MenuItem value="APPROVE">Aprovar</MenuItem>
                      <MenuItem value="REJECT">Rejeitar</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Entidade</InputLabel>
                    <Select
                      value={entityTypeFilter}
                      label="Entidade"
                      onChange={handleEntityTypeFilterChange}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      <MenuItem value="User">Usuário</MenuItem>
                      <MenuItem value="Bidding">Licitação</MenuItem>
                      <MenuItem value="Proposal">Proposta</MenuItem>
                      <MenuItem value="Contract">Contrato</MenuItem>
                      <MenuItem value="System">Sistema</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Severidade</InputLabel>
                    <Select
                      value={severityFilter}
                      label="Severidade"
                      onChange={handleSeverityFilterChange}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      <MenuItem value="LOW">Baixa</MenuItem>
                      <MenuItem value="MEDIUM">Média</MenuItem>
                      <MenuItem value="HIGH">Alta</MenuItem>
                      <MenuItem value="CRITICAL">Crítica</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    fullWidth
                    label="Usuário"
                    variant="outlined"
                    value={userFilter}
                    onChange={handleUserFilterChange}
                    placeholder="Email ou ID"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={loadLogs}
                    sx={{ height: 56 }}
                  >
                    Atualizar
                  </Button>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleExportLogs}
                >
                  Exportar CSV
                </Button>
              </Box>
            </CardContent>
          </Card>

          {loading && <LinearProgress sx={{ mb: 3 }} />}

          {/* Tabela de Logs */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Registros de Auditoria
                </Typography>
                <Chip label={`${totalCount} registros`} color="primary" />
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data/Hora</TableCell>
                      <TableCell>Usuário</TableCell>
                      <TableCell>Ação</TableCell>
                      <TableCell>Entidade</TableCell>
                      <TableCell>Severidade</TableCell>
                      <TableCell>IP</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(log.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {log.userName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.userEmail}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getActionIcon(log.action)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {formatAction(log.action)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.entityType}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getSeverityIcon(log.severity)}
                            label={log.severity}
                            color={getSeverityColor(log.severity)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {log.ipAddress}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(log)}
                            title="Ver detalhes"
                          >
                            <Visibility />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Linhas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                }
              />
            </CardContent>
          </Card>

          {/* Dialog de Detalhes do Log */}
          <Dialog
            open={detailsDialogOpen}
            onClose={() => setDetailsDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1, color: 'primary.main' }} />
                Detalhes do Log de Auditoria
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedLog && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Informações Básicas
                    </Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">ID do Log</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {selectedLog.id}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Data/Hora</Typography>
                        <Typography variant="body2">
                          {formatDate(selectedLog.timestamp)}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Ação</Typography>
                        <Typography variant="body2">
                          {formatAction(selectedLog.action)}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Tipo de Entidade</Typography>
                        <Typography variant="body2">
                          {selectedLog.entityType}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">ID da Entidade</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {selectedLog.entityId}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Informações do Usuário
                    </Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Nome</Typography>
                        <Typography variant="body2">
                          {selectedLog.userName}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Email</Typography>
                        <Typography variant="body2">
                          {selectedLog.userEmail}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">ID do Usuário</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {selectedLog.userId}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Endereço IP</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {selectedLog.ipAddress}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Severidade</Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            icon={getSeverityIcon(selectedLog.severity)}
                            label={selectedLog.severity}
                            color={getSeverityColor(selectedLog.severity)}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      User Agent
                    </Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {selectedLog.userAgent}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Detalhes Adicionais
                    </Typography>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <pre style={{
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>
                Fechar
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminAuditLogsPage;
