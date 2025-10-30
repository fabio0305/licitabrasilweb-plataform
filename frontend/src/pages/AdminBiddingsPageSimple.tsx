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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface BiddingData {
  id: string;
  title: string;
  status: string;
  type: string;
}

const AdminBiddingsPageSimple: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [biddings, setBiddings] = useState<BiddingData[]>([]);
  const [loading, setLoading] = useState(false);

  console.log('🔍 AdminBiddingsPageSimple - Debug Info:', {
    user: user,
    userRole: user?.role,
    authLoading: authLoading,
    loading: loading,
    biddings: biddings,
    timestamp: new Date().toISOString()
  });

  const loadBiddings = async () => {
    try {
      setLoading(true);
      console.log('🚀 Carregando licitações...');

      const fetchResponse = await fetch('/api/v1/admin/biddings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      console.log('✅ Response Status:', fetchResponse.status);

      if (fetchResponse.ok) {
        const response = await fetchResponse.json();
        console.log('✅ Resposta recebida:', response);
        
        if (response.success && response.data) {
          setBiddings(response.data.biddings || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar licitações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadBiddings();
    }
  }, [user]);

  // Mostrar loading enquanto a autenticação está sendo verificada
  if (authLoading) {
    console.log('⏳ AdminBiddingsPageSimple - Aguardando autenticação...');
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Verificando autenticação...</Typography>
      </Container>
    );
  }

  if (!user) {
    console.log('❌ AdminBiddingsPageSimple - Usuário não autenticado');
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Usuário não autenticado.
        </Alert>
      </Container>
    );
  }

  if (user.role !== 'ADMIN') {
    console.log('❌ AdminBiddingsPageSimple - Usuário não é admin:', user.role);
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          Acesso negado. Esta página é restrita a administradores.
        </Alert>
      </Container>
    );
  }

  console.log('✅ AdminBiddingsPageSimple - Renderizando página principal');

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        📋 Gerenciamento de Licitações (Versão Simplificada)
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
            <strong>Total Licitações:</strong> {biddings.length}<br/>
            <strong>Timestamp:</strong> {new Date().toISOString()}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={loadBiddings}
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Recarregar Licitações'}
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tipo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {biddings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {loading ? 'Carregando...' : 'Nenhuma licitação encontrada'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              biddings.map((bidding) => (
                <TableRow key={bidding.id}>
                  <TableCell>{bidding.id}</TableCell>
                  <TableCell>{bidding.title}</TableCell>
                  <TableCell>{bidding.status}</TableCell>
                  <TableCell>{bidding.type}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>ℹ️ Informação:</strong> Esta é uma versão simplificada da página de licitações 
          para debug. Se esta página funciona, o problema está na complexidade da página original.
        </Typography>
      </Alert>
    </Container>
  );
};

export default AdminBiddingsPageSimple;
