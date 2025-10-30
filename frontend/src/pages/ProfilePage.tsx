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
  Button,
  TextField,
  Paper,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  Badge,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, UserStatus } from '../types';
import { useUserIP } from '../hooks/useUserIP';
import { apiCall } from '../config/api';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const ipInfo = useUserIP();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.SUPPLIER]: 'Fornecedor',
      [UserRole.PUBLIC_ENTITY]: 'Órgão Público',
      [UserRole.AUDITOR]: 'Auditor',
      [UserRole.CITIZEN]: 'Cidadão',
    };
    return labels[role];
  };

  const getStatusLabel = (status: UserStatus) => {
    const labels = {
      [UserStatus.ACTIVE]: 'Ativo',
      [UserStatus.INACTIVE]: 'Inativo',
      [UserStatus.PENDING]: 'Pendente',
      [UserStatus.SUSPENDED]: 'Suspenso',
    };
    return labels[status];
  };

  const getStatusColor = (status: UserStatus) => {
    const colors = {
      [UserStatus.ACTIVE]: 'success' as const,
      [UserStatus.INACTIVE]: 'default' as const,
      [UserStatus.PENDING]: 'warning' as const,
      [UserStatus.SUSPENDED]: 'error' as const,
    };
    return colors[status];
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      console.log('🚀 Salvando perfil:', formData);

      const fetchResponse = await fetch('/api/v1/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      });

      console.log('✅ Profile Response Status:', fetchResponse.status);

      if (!fetchResponse.ok) {
        const errorResponse = await fetchResponse.json();
        console.log('❌ Error Response:', errorResponse);
        throw new Error(errorResponse.error?.message || errorResponse.message || `Erro HTTP: ${fetchResponse.status}`);
      }

      const response = await fetchResponse.json();
      console.log('✅ Perfil salvo:', response);

      if (response.success) {
        updateUser(response.data.user);
        setEditing(false);
        alert('Perfil atualizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      alert(error.message || 'Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    });
    setEditing(false);
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Typography variant="h6" color="error">
          Usuário não encontrado
        </Typography>
      </Container>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Meu Perfil
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Profile Header */}
        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                mr: 3
              }}
            >
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" gutterBottom>
                {user.firstName} {user.lastName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip 
                  label={getRoleLabel(user.role)} 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  label={getStatusLabel(user.status)} 
                  color={getStatusColor(user.status)} 
                  variant="filled" 
                />
              </Box>
            </Box>
            <Button
              variant={editing ? "outlined" : "contained"}
              startIcon={editing ? <Cancel /> : <Edit />}
              onClick={editing ? handleCancel : () => setEditing(true)}
              color={editing ? "inherit" : "primary"}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </Button>
          </Box>
        </Paper>

        {/* Profile Information */}
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Informações Pessoais
                  </Typography>
                  {editing && (
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSave}
                      disabled={loading}
                      sx={{ ml: 'auto' }}
                    >
                      Salvar
                    </Button>
                  )}
                </Box>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Nome"
                      value={editing ? formData.firstName : user.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!editing}
                      variant={editing ? "outlined" : "filled"}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Sobrenome"
                      value={editing ? formData.lastName : user.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={!editing}
                      variant={editing ? "outlined" : "filled"}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={user.email}
                      disabled
                      variant="filled"
                      helperText="O email não pode ser alterado"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Telefone"
                      value={editing ? formData.phone : (user.phone || 'Não informado')}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editing}
                      variant={editing ? "outlined" : "filled"}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Information */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Badge sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Informações da Conta
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Perfil
                  </Typography>
                  <Typography variant="body1">
                    {getRoleLabel(user.role)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip 
                    label={getStatusLabel(user.status)} 
                    color={getStatusColor(user.status)} 
                    size="small"
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Membro desde
                  </Typography>
                  <Typography variant="body1">
                    {user.createdAt ?
                      new Date(user.createdAt).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) :
                      'Data não disponível'
                    }
                  </Typography>
                </Box>

                {user.lastLoginAt && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Último acesso
                      </Typography>
                      <Typography variant="body1">
                        {new Date(user.lastLoginAt).toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>
                  </>
                )}

                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Endereço IP atual
                  </Typography>
                  {ipInfo.loading ? (
                    <Typography variant="body1" color="text.secondary">
                      Carregando...
                    </Typography>
                  ) : ipInfo.error ? (
                    <Typography variant="body1" color="error">
                      {ipInfo.error}
                    </Typography>
                  ) : (
                    <Box>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {ipInfo.ip}
                      </Typography>
                      {(ipInfo.city || ipInfo.region || ipInfo.country) && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {[ipInfo.city, ipInfo.region, ipInfo.country].filter(Boolean).join(', ')}
                        </Typography>
                      )}
                      {ipInfo.isp && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Provedor: {ipInfo.isp}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProfilePage;
