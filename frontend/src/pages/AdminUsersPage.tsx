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
  InputAdornment,
  IconButton as MuiIconButton,
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
  VpnKey,
  Add,
  Visibility,
  VisibilityOff,
  PlayArrow,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserStatus, UserRole } from '../types';
import { apiCall } from '../config/api';
import { isValidCpf, formatCpf, cleanCpf } from '../utils/cpfValidation';
import { formatPhone, cleanPhone } from '../utils/phoneValidation';
import InputMask from 'react-input-mask';
import UserProfileModal from '../components/UserProfileModal';

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
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [newUserData, setNewUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
    role: UserRole.CITIZEN
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

  const handleProfileClick = () => {
    setAnchorEl(null);
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    setAnchorEl(null);
    navigate('/admin/settings');
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

      console.log('🚀 Carregando usuários:', `/api/v1/admin/users?${params.toString()}`);

      const fetchResponse = await fetch(`/api/v1/admin/users?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      console.log('✅ Users Response Status:', fetchResponse.status);

      if (!fetchResponse.ok) {
        console.log('❌ HTTP Error:', fetchResponse.status, fetchResponse.statusText);
        return;
      }

      const response = await fetchResponse.json();
      console.log('✅ Usuários recebidos:', response);

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
      console.log('🚀 Aprovando usuário:', userId);

      const fetchResponse = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status: UserStatus.ACTIVE })
      });

      console.log('✅ Approve Response Status:', fetchResponse.status);

      if (fetchResponse.ok) {
        const response = await fetchResponse.json();
        if (response.success) {
          loadUsers();
        }
      }
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      console.log('🚀 Rejeitando usuário:', userId);

      const fetchResponse = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status: UserStatus.INACTIVE })
      });

      console.log('✅ Reject Response Status:', fetchResponse.status);

      if (fetchResponse.ok) {
        const response = await fetchResponse.json();
        if (response.success) {
          loadUsers();
        }
      }
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      console.log('🚀 Suspendendo usuário:', userId);

      const fetchResponse = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status: UserStatus.SUSPENDED })
      });

      console.log('✅ Suspend Response Status:', fetchResponse.status);

      if (fetchResponse.ok) {
        const response = await fetchResponse.json();
        if (response.success) {
          loadUsers();
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      }
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    try {
      console.log('🚀 Removendo suspensão do usuário:', userId);

      const fetchResponse = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status: UserStatus.ACTIVE })
      });

      console.log('✅ Unsuspend Response Status:', fetchResponse.status);

      if (fetchResponse.ok) {
        const response = await fetchResponse.json();
        if (response.success) {
          loadUsers();
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      }
    } catch (error) {
      console.error('Erro ao remover suspensão do usuário:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      console.log('🚀 Excluindo usuário:', userId);

      const fetchResponse = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      console.log('✅ Delete Response Status:', fetchResponse.status);

      if (fetchResponse.ok) {
        const response = await fetchResponse.json();
        console.log('✅ Delete Response:', response);

        if (response.success) {
          console.log('✅ Usuário excluído com sucesso, recarregando lista...');
          await loadUsers();
          setConfirmDialog({ ...confirmDialog, open: false });

          // Mostrar feedback de sucesso
          alert('Usuário excluído com sucesso!');
        } else {
          console.error('❌ Erro na resposta:', response);
          alert(`Erro ao excluir usuário: ${response.message || 'Erro desconhecido'}`);
        }
      } else {
        const errorResponse = await fetchResponse.json();
        console.error('❌ Erro HTTP:', fetchResponse.status, errorResponse);
        alert(`Erro ao excluir usuário: ${errorResponse.error?.message || errorResponse.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      alert('Erro de conexão ao excluir usuário. Verifique sua conexão e tente novamente.');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserForReset) return;

    if (newPassword !== confirmNewPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    if (newPassword.length < 8) {
      alert('A senha deve ter pelo menos 8 caracteres!');
      return;
    }

    try {
      console.log('🚀 Resetando senha do usuário:', selectedUserForReset.id);

      const fetchResponse = await fetch(`/api/v1/admin/users/${selectedUserForReset.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ newPassword: newPassword })
      });

      console.log('✅ Reset Password Response Status:', fetchResponse.status);

      if (!fetchResponse.ok) {
        const errorResponse = await fetchResponse.json();
        console.log('❌ Error Response:', errorResponse);
        throw new Error(errorResponse.error?.message || errorResponse.message || `Erro HTTP: ${fetchResponse.status}`);
      }

      const response = await fetchResponse.json();
      console.log('✅ Senha resetada:', response);

      if (response.success) {
        alert('Senha alterada com sucesso!');
        setResetPasswordDialogOpen(false);
        setSelectedUserForReset(null);
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      alert(error.message || 'Erro ao alterar senha. Tente novamente.');
    }
  };

  const openResetPasswordDialog = (user: User) => {
    setSelectedUserForReset(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setResetPasswordDialogOpen(true);
  };

  const openProfileModal = (userId: string) => {
    setSelectedUserForProfile(userId);
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setSelectedUserForProfile(null);
  };

  const handleCreateUser = async () => {
    // Validações
    if (!newUserData.email || !newUserData.firstName || !newUserData.lastName ||
        !newUserData.phone || !newUserData.cpf || !newUserData.password || !newUserData.confirmPassword) {
      alert('Todos os campos são obrigatórios!');
      return;
    }

    if (newUserData.password !== newUserData.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    if (newUserData.password.length < 8) {
      alert('A senha deve ter pelo menos 8 caracteres!');
      return;
    }

    // Validar CPF
    const cleanedCpf = cleanCpf(newUserData.cpf);
    if (cleanedCpf.length !== 11) {
      alert('CPF deve ter 11 dígitos!');
      return;
    }

    if (!isValidCpf(cleanedCpf)) {
      alert('CPF inválido! Verifique os dígitos verificadores.');
      return;
    }

    try {
      // Primeiro validar se o CPF já existe
      const formattedCpf = formatCpf(cleanedCpf);
      console.log('🚀 Validando CPF:', formattedCpf);

      const cpfValidationResponse = await fetch('/api/v1/auth/validate-cpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf: formattedCpf })
      });

      console.log('✅ CPF Validation Response Status:', cpfValidationResponse.status);

      if (cpfValidationResponse.ok) {
        const cpfValidation = await cpfValidationResponse.json();
        console.log('✅ CPF Validation:', cpfValidation);

        if (cpfValidation.success && cpfValidation.data?.isRegistered) {
          alert('Este CPF já está cadastrado na plataforma!');
          return;
        }
      }

      // Criar usuário
      const { confirmPassword, ...userData } = newUserData;

      // Formatar dados antes de enviar (backend espera dados formatados)
      const dataToSend = {
        ...userData,
        cpf: formattedCpf,
        phone: userData.phone // Manter formatação do telefone
      };

      console.log('🚀 Criando usuário:', { ...dataToSend, password: '[HIDDEN]' });

      const fetchResponse = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(dataToSend)
      });

      console.log('✅ Create User Response Status:', fetchResponse.status);

      if (!fetchResponse.ok) {
        const errorResponse = await fetchResponse.json();
        console.log('❌ Error Response:', errorResponse);

        // Extrair mensagem de erro específica
        let errorMessage = 'Erro ao criar usuário. Tente novamente.';

        if (errorResponse.error?.message) {
          errorMessage = errorResponse.error.message;
        } else if (errorResponse.message) {
          errorMessage = errorResponse.message;
        } else if (fetchResponse.status === 409) {
          errorMessage = 'Dados já cadastrados na plataforma (CPF ou email duplicado)';
        } else {
          errorMessage = `Erro HTTP: ${fetchResponse.status}`;
        }

        throw new Error(errorMessage);
      }

      const response = await fetchResponse.json();
      console.log('✅ Usuário criado:', response);

      if (response.success) {
        alert('Usuário criado com sucesso!');
        setCreateUserDialogOpen(false);
        setNewUserData({
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          cpf: '',
          password: '',
          confirmPassword: '',
          role: UserRole.CITIZEN
        });
        loadUsers();
      }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      // Extrair mensagem de erro específica da resposta
      const errorMessage = error.message || error.response?.data?.error?.message || error.response?.data?.message || 'Erro ao criar usuário. Tente novamente.';
      alert(errorMessage);
    }
  };

  const openConfirmDialog = (title: string, message: string, action: () => void) => {
    console.log('🔍 Abrindo dialog de confirmação:', { title, message });
    setConfirmDialog({
      open: true,
      title,
      message,
      action,
    });
  };

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
            <MenuItem onClick={handleProfileClick}>
              Meu Perfil
            </MenuItem>
            <MenuItem onClick={handleSettingsClick}>
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
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Gerenciamento de Usuários
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Visualize, aprove e gerencie todos os usuários da plataforma LicitaBrasil.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateUserDialogOpen(true)}
              sx={{ mt: 1 }}
            >
              Criar Usuário
            </Button>
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
                      <TableRow
                        key={userItem.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          }
                        }}
                        onClick={() => openProfileModal(userItem.id)}
                      >
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
                          <Box
                            sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}
                            onClick={(e) => e.stopPropagation()}
                          >
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
                            {userItem.status === UserStatus.ACTIVE && (
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
                            {userItem.status === UserStatus.SUSPENDED && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => openConfirmDialog(
                                  'Remover Suspensão',
                                  `Tem certeza que deseja remover a suspensão de ${userItem.firstName} ${userItem.lastName}?`,
                                  () => handleUnsuspendUser(userItem.id)
                                )}
                                title="Remover Suspensão"
                              >
                                <PlayArrow />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => openResetPasswordDialog(userItem)}
                              title="Resetar Senha"
                            >
                              <VpnKey />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                console.log('🗑️ Botão deletar clicado para usuário:', userItem.id, userItem.firstName, userItem.lastName);
                                openConfirmDialog(
                                  'Excluir Usuário',
                                  `Tem certeza que deseja excluir permanentemente ${userItem.firstName} ${userItem.lastName}? Esta ação não pode ser desfeita.`,
                                  () => handleDeleteUser(userItem.id)
                                );
                              }}
                              title="Excluir"
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
            onClick={() => {
              console.log('✅ Botão confirmar clicado, executando ação...');
              confirmDialog.action();
            }}
            color="error"
            variant="contained"
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Criar Usuário */}
      <Dialog
        open={createUserDialogOpen}
        onClose={() => setCreateUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={newUserData.firstName}
                  onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Sobrenome"
                  value={newUserData.lastName}
                  onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InputMask
                  mask="(99) 9 9999-9999"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                >
                  {(inputProps: any) => (
                    <TextField
                      {...inputProps}
                      fullWidth
                      label="Telefone"
                      placeholder="(XX) 9 XXXX-XXXX"
                    />
                  )}
                </InputMask>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <InputMask
                  mask="999.999.999-99"
                  value={newUserData.cpf}
                  onChange={(e) => setNewUserData({ ...newUserData, cpf: e.target.value })}
                >
                  {(inputProps: any) => (
                    <TextField
                      {...inputProps}
                      fullWidth
                      label="CPF"
                      placeholder="XXX.XXX.XXX-XX"
                    />
                  )}
                </InputMask>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Senha"
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  helperText="Mínimo 8 caracteres"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Confirmar Senha"
                  type="password"
                  value={newUserData.confirmPassword}
                  onChange={(e) => setNewUserData({ ...newUserData, confirmPassword: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Perfil</InputLabel>
                  <Select
                    value={newUserData.role}
                    label="Perfil"
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                  >
                    <MenuItem value={UserRole.CITIZEN}>Cidadão</MenuItem>
                    <MenuItem value={UserRole.SUPPLIER}>Fornecedor</MenuItem>
                    <MenuItem value={UserRole.PUBLIC_ENTITY}>Órgão Público</MenuItem>
                    <MenuItem value={UserRole.AUDITOR}>Auditor</MenuItem>
                    <MenuItem value={UserRole.ADMIN}>Administrador</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateUserDialogOpen(false)}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateUser}
            color="primary"
            variant="contained"
          >
            Criar Usuário
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Reset de Senha */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={() => setResetPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Alterar Senha - {selectedUserForReset?.firstName} {selectedUserForReset?.lastName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Nova Senha"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="Mínimo 8 caracteres"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Confirmar Nova Senha"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setResetPasswordDialogOpen(false)}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleResetPassword}
            color="primary"
            variant="contained"
          >
            Alterar Senha
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Perfil do Usuário */}
      <UserProfileModal
        open={profileModalOpen}
        onClose={closeProfileModal}
        userId={selectedUserForProfile}
        onUserUpdated={loadUsers}
      />
    </Box>
  );
};

export default AdminUsersPage;
