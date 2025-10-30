import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Avatar,
  Typography,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Badge,
  CalendarToday,
  Login,
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material';
import { User, UserRole, UserStatus } from '../types';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  onUserUpdated?: () => void;
}

interface UserDetails extends User {
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  supplier?: {
    id: string;
    companyName: string;
    cnpj: string;
    isActive: boolean;
    verifiedAt?: string;
  };
  publicEntity?: {
    id: string;
    name: string;
    cnpj: string;
    entityType: string;
    isActive: boolean;
    verifiedAt?: string;
  };
  auditLogs?: Array<{
    id: string;
    action: string;
    resource: string;
    createdAt: string;
  }>;
  sessions?: Array<{
    id: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    expiresAt: string;
  }>;
  _count?: {
    auditLogs: number;
    sessions: number;
  };
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  open,
  onClose,
  userId,
  onUserUpdated,
}) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Carregar dados do usuário
  const loadUserDetails = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data.user);
          setEditData({
            firstName: data.data.user.firstName,
            lastName: data.data.user.lastName,
            email: data.data.user.email,
            phone: data.data.user.phone || '',
          });
        } else {
          setError('Erro ao carregar dados do usuário');
        }
      } else {
        setError('Erro ao carregar dados do usuário');
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      setError('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data.user);
          setEditing(false);
          onUserUpdated?.();
        } else {
          setError(data.error?.message || 'Erro ao salvar alterações');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || 'Erro ao salvar alterações');
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setError('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    if (user) {
      setEditData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
      });
    }
    setEditing(false);
    setError(null);
  };

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open && userId) {
      loadUserDetails();
    }
  }, [open, userId]);

  // Função para obter ícone do role
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Badge color="error" />;
      case UserRole.SUPPLIER:
        return <Person color="primary" />;
      case UserRole.PUBLIC_ENTITY:
        return <Person color="secondary" />;
      case UserRole.AUDITOR:
        return <Person color="warning" />;
      case UserRole.CITIZEN:
        return <Person color="info" />;
      default:
        return <Person />;
    }
  };

  // Função para obter label do role
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

  // Função para obter cor do status
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'success';
      case UserStatus.INACTIVE:
        return 'default';
      case UserStatus.PENDING:
        return 'warning';
      case UserStatus.SUSPENDED:
        return 'error';
      default:
        return 'default';
    }
  };

  // Função para obter label do status
  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'Ativo';
      case UserStatus.INACTIVE:
        return 'Inativo';
      case UserStatus.PENDING:
        return 'Pendente';
      case UserStatus.SUSPENDED:
        return 'Suspenso';
      default:
        return status;
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Person />
          <Typography variant="h6">
            {editing ? 'Editar Usuário' : 'Perfil do Usuário'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {user && !loading && (
          <Box sx={{ pt: 2 }}>
            {/* Cabeçalho do perfil */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mr: 3,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" gutterBottom>
                  {user.firstName} {user.lastName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={getRoleLabel(user.role)}
                    size="small"
                    color="primary"
                  />
                  <Chip
                    label={getStatusLabel(user.status)}
                    size="small"
                    color={getStatusColor(user.status) as any}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Membro desde {formatDate(user.createdAt)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Dados básicos */}
            <Typography variant="h6" gutterBottom>
              Dados Básicos
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={editing ? editData.firstName : user.firstName}
                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Sobrenome"
                  value={editing ? editData.lastName : user.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  disabled={!editing}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editing ? editData.email : user.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={editing ? editData.phone : (user.phone || 'Não informado')}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
            </Grid>

            {!editing && (
              <>
                <Divider sx={{ mb: 3 }} />

                {/* Informações adicionais */}
                <Typography variant="h6" gutterBottom>
                  Informações Adicionais
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Data de Cadastro
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(user.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Login sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Último Login
                        </Typography>
                        <Typography variant="body1">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca fez login'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Perfis específicos */}
                {(user.supplier || user.publicEntity) && (
                  <>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="h6" gutterBottom>
                      Perfis Específicos
                    </Typography>

                    {user.supplier && (
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Fornecedor
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Empresa:</strong> {user.supplier.companyName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>CNPJ:</strong> {user.supplier.cnpj}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Status:</strong> {user.supplier.isActive ? 'Ativo' : 'Inativo'}
                        </Typography>
                        {user.supplier.verifiedAt && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Verificado em:</strong> {formatDate(user.supplier.verifiedAt)}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {user.publicEntity && (
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Órgão Público
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Nome:</strong> {user.publicEntity.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>CNPJ:</strong> {user.publicEntity.cnpj}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Tipo:</strong> {user.publicEntity.entityType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Status:</strong> {user.publicEntity.isActive ? 'Ativo' : 'Inativo'}
                        </Typography>
                        {user.publicEntity.verifiedAt && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Verificado em:</strong> {formatDate(user.publicEntity.verifiedAt)}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </>
                )}

                {/* Estatísticas */}
                {user._count && (
                  <>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="h6" gutterBottom>
                      Estatísticas
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                          <Typography variant="h4" color="primary.contrastText">
                            {user._count.auditLogs}
                          </Typography>
                          <Typography variant="body2" color="primary.contrastText">
                            Logs de Auditoria
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                          <Typography variant="h4" color="secondary.contrastText">
                            {user._count.sessions}
                          </Typography>
                          <Typography variant="body2" color="secondary.contrastText">
                            Sessões Ativas
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </>
                )}

                {/* Últimas atividades */}
                {user.auditLogs && user.auditLogs.length > 0 && (
                  <>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="h6" gutterBottom>
                      Últimas Atividades
                    </Typography>

                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {user.auditLogs.map((log) => (
                        <Box key={log.id} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                          <Typography variant="body2">
                            <strong>{log.action}</strong> em {log.resource}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(log.createdAt)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
        
        {user && !editing && (
          <Button
            onClick={() => setEditing(true)}
            color="primary"
            variant="outlined"
            startIcon={<Edit />}
          >
            Editar
          </Button>
        )}

        {editing && (
          <>
            <Button
              onClick={handleCancelEdit}
              color="inherit"
              startIcon={<Cancel />}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              color="primary"
              variant="contained"
              startIcon={<Save />}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserProfileModal;
