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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
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
  FilterList,
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  SupervisorAccount,
  Business,
  AccountBalance,
  PersonAdd,
  Refresh,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserStatus, UserRole } from '../types';
import { apiCall } from '../config/api';

const DRAWER_WIDTH = 280;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    action: () => {},
  });

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

  // Carregar usuários
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });

      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await apiCall.get(`/admin/users?${params.toString()}`);
      
      if (response.success) {
        setUsers(response.data.users);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, rowsPerPage, search, roleFilter, statusFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleRoleFilterChange = (event: any) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await apiCall.put(`/admin/users/${userId}/status`, {
        status: UserStatus.ACTIVE
      });
      
      if (response.success) {
        loadUsers();
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
        loadUsers();
      }
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const response = await apiCall.put(`/admin/users/${userId}/status`, {
        status: UserStatus.SUSPENDED
      });
      
      if (response.success) {
        loadUsers();
      }
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await apiCall.delete(`/admin/users/${userId}`);
      
      if (response.success) {
        loadUsers();
        setConfirmDialog({ ...confirmDialog, open: false });
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const openConfirmDialog = (title: string, message: string, action: () => void) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      action,
    });
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
            Gerenciamento de Usuários
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
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Gerenciamento de Usuários
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Visualize, aprove e gerencie todos os usuários da plataforma LicitaBrasil.
            </Typography>
          </Box>

          {/* Filtros e Busca */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Buscar usuários"
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
                    <InputLabel>Perfil</InputLabel>
                    <Select
                      value={roleFilter}
                      label="Perfil"
                      onChange={handleRoleFilterChange}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {Object.values(UserRole).map((role) => (
                        <MenuItem key={role} value={role}>
                          {getRoleLabel(role)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                      {Object.values(UserStatus).map((status) => (
                        <MenuItem key={status} value={status}>
                          {getStatusLabel(status)}
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
                    onClick={loadUsers}
                    sx={{ height: 56 }}
                  >
                    Atualizar
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabela de Usuários */}
          <Card>
            <CardContent>
              {loading && <LinearProgress sx={{ mb: 2 }} />}

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Perfil</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Data de Cadastro</TableCell>
                      <TableCell>Último Login</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {userItem.firstName.charAt(0)}{userItem.lastName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {userItem.firstName} {userItem.lastName}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{userItem.email}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(userItem.role)}
                            label={getRoleLabel(userItem.role)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(userItem.status)}
                            color={getStatusColor(userItem.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(userItem.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {userItem.lastLoginAt
                            ? new Date(userItem.lastLoginAt).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            {userItem.status === UserStatus.PENDING && (
                              <>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproveUser(userItem.id)}
                                  title="Aprovar"
                                >
                                  <CheckCircle />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRejectUser(userItem.id)}
                                  title="Rejeitar"
                                >
                                  <Cancel />
                                </IconButton>
                              </>
                            )}
                            {userItem.status === UserStatus.ACTIVE && userItem.role !== UserRole.ADMIN && (
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => openConfirmDialog(
                                  'Suspender Usuário',
                                  `Tem certeza que deseja suspender ${userItem.firstName} ${userItem.lastName}?`,
                                  () => handleSuspendUser(userItem.id)
                                )}
                                title="Suspender"
                              >
                                <Cancel />
                              </IconButton>
                            )}
                            {userItem.role !== UserRole.ADMIN && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openConfirmDialog(
                                  'Excluir Usuário',
                                  `Tem certeza que deseja excluir permanentemente ${userItem.firstName} ${userItem.lastName}? Esta ação não pode ser desfeita.`,
                                  () => handleDeleteUser(userItem.id)
                                )}
                                title="Excluir"
                              >
                                <Delete />
                              </IconButton>
                            )}
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
                count={total}
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
        </Container>
      </Box>

      {/* Dialog de Confirmação */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmDialog.action}
            color="error"
            variant="contained"
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsersPage;
