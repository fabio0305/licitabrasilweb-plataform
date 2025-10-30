import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const TestAuthPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const testApiCall = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Token no localStorage:', token ? token.substring(0, 50) + '...' : 'Não encontrado');
      
      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
    } catch (error) {
      console.error('Erro na API:', error);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Teste de Autenticação
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Estado da Autenticação:</Typography>
          <Typography>isLoading: {isLoading ? 'true' : 'false'}</Typography>
          <Typography>isAuthenticated: {isAuthenticated ? 'true' : 'false'}</Typography>
          <Typography>user: {user ? JSON.stringify(user, null, 2) : 'null'}</Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">LocalStorage:</Typography>
          <Typography>accessToken: {localStorage.getItem('accessToken') ? 'Presente' : 'Ausente'}</Typography>
          <Typography>refreshToken: {localStorage.getItem('refreshToken') ? 'Presente' : 'Ausente'}</Typography>
          <Typography>user: {localStorage.getItem('user') ? 'Presente' : 'Ausente'}</Typography>
        </CardContent>
      </Card>

      <Button variant="contained" onClick={testApiCall}>
        Testar API Call
      </Button>
    </Box>
  );
};

export default TestAuthPage;
