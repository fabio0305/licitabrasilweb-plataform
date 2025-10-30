import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface ConfigItem {
  value: any;
  type: string;
  description: string;
}

interface SystemConfig {
  [key: string]: ConfigItem;
}

const AdminSettingsPageSimple: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [configs, setConfigs] = useState<SystemConfig>({});
  const [loading, setLoading] = useState(false);

  console.log('🔍 AdminSettingsPageSimple - Debug Info:', {
    user: user,
    userRole: user?.role,
    authLoading: authLoading,
    loading: loading,
    configsKeys: Object.keys(configs),
    timestamp: new Date().toISOString()
  });

  const loadConfigs = async () => {
    try {
      setLoading(true);
      console.log('🚀 Carregando configurações...');

      const fetchResponse = await fetch('/api/v1/admin/config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      console.log('✅ Config Response Status:', fetchResponse.status);

      if (fetchResponse.ok) {
        const response = await fetchResponse.json();
        console.log('✅ Configurações recebidas:', response);
        
        if (response.success && response.data) {
          setConfigs(response.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadConfigs();
    }
  }, [user]);

  // Mostrar loading enquanto a autenticação está sendo verificada
  if (authLoading) {
    console.log('⏳ AdminSettingsPageSimple - Aguardando autenticação...');
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Verificando autenticação...</Typography>
      </Container>
    );
  }

  if (!user) {
    console.log('❌ AdminSettingsPageSimple - Usuário não autenticado');
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Usuário não autenticado.
        </Alert>
      </Container>
    );
  }

  if (user.role !== 'ADMIN') {
    console.log('❌ AdminSettingsPageSimple - Usuário não é admin:', user.role);
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Acesso negado. Esta página é restrita a administradores.
        </Alert>
      </Container>
    );
  }

  console.log('✅ AdminSettingsPageSimple - Renderizando página principal');

  const renderConfigField = (key: string, config: ConfigItem) => {
    if (config.type === 'boolean') {
      return (
        <FormControlLabel
          control={
            <Switch
              checked={config.value}
              onChange={(e) => {
                setConfigs(prev => ({
                  ...prev,
                  [key]: { ...config, value: e.target.checked }
                }));
              }}
            />
          }
          label={config.description}
        />
      );
    }
    
    return (
      <TextField
        fullWidth
        label={config.description}
        value={config.value}
        type={config.type === 'number' ? 'number' : 'text'}
        onChange={(e) => {
          const value = config.type === 'number' ? Number(e.target.value) : e.target.value;
          setConfigs(prev => ({
            ...prev,
            [key]: { ...config, value }
          }));
        }}
        size="small"
      />
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        ⚙️ Configurações do Sistema (Versão Simplificada)
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ✅ Status da Página
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Usuário:</strong> {user.email}<br/>
            <strong>Role:</strong> {user.role}<br/>
            <strong>Loading:</strong> {loading ? 'Sim' : 'Não'}<br/>
            <strong>Total Configurações:</strong> {Object.keys(configs).length}<br/>
            <strong>Timestamp:</strong> {new Date().toISOString()}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={loadConfigs}
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Recarregar Configurações'}
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {Object.keys(configs).length > 0 && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              📋 Configurações Gerais ({Object.keys(configs).length} itens)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.entries(configs).slice(0, 5).map(([key, config]) => (
                <Box key={key}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                  {renderConfigField(key, config)}
                  <Typography variant="caption" color="text.secondary">
                    Tipo: {config.type}
                  </Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>ℹ️ Informação:</strong> Esta é uma versão simplificada da página de configurações 
          para debug. Se esta página funciona, o problema está na complexidade da página original.
        </Typography>
      </Alert>
    </Container>
  );
};

export default AdminSettingsPageSimple;
