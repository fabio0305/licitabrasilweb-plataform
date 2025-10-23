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
  Edit,
  Delete,
  Visibility,
  FilterList,
  Add,
  CheckCircle,
  Cancel,
  Warning,
  Info,
  TrendingUp,
  Schedule,
  MonetizationOn,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BiddingStatus, BiddingType } from '../types';
import { apiCall } from '../config/api';

const DRAWER_WIDTH = 280;

interface BiddingData {
  id: string;
  title: string;
  description: string;
  type: BiddingType;
  status: BiddingStatus;
  estimatedValue: number;
  openingDate: string;
  closingDate: string;
  publicEntity: {
    id: string;
    companyName: string;
  };
  _count: {
    proposals: number;
  };
  createdAt: string;
}

interface BiddingsResponse {
  biddings: BiddingData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface BiddingStats {
  total: number;
  open: number;
  closed: number;
  draft: number;
  cancelled: number;
  totalValue: number;
  avgProposals: number;
}

const AdminBiddingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [biddings, setBiddings] = useState<BiddingData[]>([]);
  const [stats, setStats] = useState<BiddingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedBidding, setSelectedBidding] = useState<BiddingData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const getStatusLabel = (status: BiddingStatus) => {
    switch (status) {
      case BiddingStatus.DRAFT:
        return 'Rascunho';
      case BiddingStatus.PUBLISHED:
        return 'Publicada';
      case BiddingStatus.OPEN:
        return 'Aberta';
      case BiddingStatus.CLOSED:
        return 'Fechada';
      case BiddingStatus.CANCELLED:
        return 'Cancelada';
      case BiddingStatus.AWARDED:
        return 'Adjudicada';
      default:
        return status;
    }
  };

  const getStatusColor = (status: BiddingStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case BiddingStatus.DRAFT:
        return 'default';
      case BiddingStatus.PUBLISHED:
        return 'info';
      case BiddingStatus.OPEN:
        return 'success';
      case BiddingStatus.CLOSED:
        return 'warning';
      case BiddingStatus.CANCELLED:
        return 'error';
      case BiddingStatus.AWARDED:
        return 'primary';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: BiddingType) => {
    switch (type) {
      case BiddingType.PREGAO_ELETRONICO:
        return 'Pregão Eletrônico';
      case BiddingType.CONCORRENCIA:
        return 'Concorrência';
      case BiddingType.TOMADA_PRECOS:
        return 'Tomada de Preços';
      case BiddingType.CONVITE:
        return 'Convite';
      default:
        return type;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Carregar dados
  useEffect(() => {
    loadBiddings();
    loadStats();
  }, [page, rowsPerPage, search, statusFilter, typeFilter]);

  const loadBiddings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });

      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await apiCall.get<BiddingsResponse>(`/admin/biddings?${params.toString()}`);
      if (response.success && response.data) {
        setBiddings(response.data.biddings);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Erro ao carregar licitações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiCall.get('/admin/statistics');
      if (response.success && response.data?.statistics?.biddings) {
        setStats(response.data.statistics.biddings);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleTypeFilterChange = (event: any) => {
    setTypeFilter(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewBidding = (bidding: BiddingData) => {
    navigate(`/biddings/${bidding.id}`);
  };

  const handleEditBidding = (bidding: BiddingData) => {
    // Implementar edição de licitação
    console.log('Editar licitação:', bidding.id);
  };

  const handleDeleteBidding = (bidding: BiddingData) => {
    setSelectedBidding(bidding);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedBidding) return;

    try {
      const response = await apiCall.delete(`/admin/biddings/${selectedBidding.id}`);
      if (response.success) {
        setBiddings(prev => prev.filter(b => b.id !== selectedBidding.id));
        setDeleteDialogOpen(false);
        setSelectedBidding(null);
        loadStats(); // Recarregar estatísticas
      }
    } catch (error) {
      console.error('Erro ao excluir licitação:', error);
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
            Gerenciamento de Licitações - LicitaBrasil
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
              Gerenciamento de Licitações
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gerencie todas as licitações da plataforma
            </Typography>
          </Box>

          {/* Estatísticas */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Gavel sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stats.total}
                    </Typography>
                    <Typography color="text.secondary">
                      Total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stats.open}
                    </Typography>
                    <Typography color="text.secondary">
                      Abertas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Schedule sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stats.closed}
                    </Typography>
                    <Typography color="text.secondary">
                      Fechadas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Cancel sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stats.cancelled}
                    </Typography>
                    <Typography color="text.secondary">
                      Canceladas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <MonetizationOn sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                      {formatCurrency(stats.totalValue)}
                    </Typography>
                    <Typography color="text.secondary">
                      Valor Total
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stats.avgProposals.toFixed(1)}
                    </Typography>
                    <Typography color="text.secondary">
                      Média Propostas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Filtros e Busca */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Buscar licitações"
                    variant="outlined"
                    value={search}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={handleStatusFilterChange}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {Object.values(BiddingStatus).map((status) => (
                        <MenuItem key={status} value={status}>
                          {getStatusLabel(status)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={typeFilter}
                      label="Tipo"
                      onChange={handleTypeFilterChange}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {Object.values(BiddingType).map((type) => (
                        <MenuItem key={type} value={type}>
                          {getTypeLabel(type)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={loadBiddings}
                    sx={{ height: 56 }}
                  >
                    Atualizar
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabela de Licitações */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Licitações Cadastradas
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/biddings/new')}
                >
                  Nova Licitação
                </Button>
              </Box>

              {loading && <LinearProgress sx={{ mb: 2 }} />}

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Título</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Órgão</TableCell>
                      <TableCell>Valor Estimado</TableCell>
                      <TableCell>Propostas</TableCell>
                      <TableCell>Data Abertura</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {biddings.map((bidding) => (
                      <TableRow key={bidding.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {bidding.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {bidding.description.length > 50
                                ? `${bidding.description.substring(0, 50)}...`
                                : bidding.description}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getTypeLabel(bidding.type)}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(bidding.status)}
                            color={getStatusColor(bidding.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {bidding.publicEntity.companyName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(bidding.estimatedValue)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={bidding._count.proposals}
                            color="info"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(bidding.openingDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewBidding(bidding)}
                              title="Visualizar"
                            >
                              <Visibility />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEditBidding(bidding)}
                              title="Editar"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteBidding(bidding)}
                              title="Excluir"
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
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

          {/* Dialog de Confirmação de Exclusão */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
          >
            <DialogTitle>
              <Warning sx={{ color: 'warning.main', mr: 1, verticalAlign: 'middle' }} />
              Confirmar Exclusão
            </DialogTitle>
            <DialogContent>
              <Typography>
                Tem certeza que deseja excluir a licitação "{selectedBidding?.title}"?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Esta ação não pode ser desfeita e todas as propostas relacionadas também serão excluídas.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmDelete} color="error" variant="contained">
                Excluir
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminBiddingsPage;
