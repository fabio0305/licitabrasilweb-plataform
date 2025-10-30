import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Stack,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Email, ArrowBack } from '@mui/icons-material';

interface ForgotPasswordForm {
  email: string;
}

const schema: yup.ObjectSchema<ForgotPasswordForm> = yup.object({
  email: yup
    .string()
    .required('Email é obrigatório')
    .email('Email deve ter um formato válido'),
});

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);

      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao solicitar recuperação de senha');
      }

      setSuccess(result.message || 'Se o email existir, você receberá instruções para redefinir sua senha');
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar recuperação de senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3} alignItems="center">
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              LicitaBrasil Web
            </Typography>
            <Typography variant="h5" component="h2" sx={{ opacity: 0.9 }}>
              Recuperação de Senha
            </Typography>
          </Box>

          <Paper
            elevation={24}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Email sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h1" gutterBottom>
                Esqueceu sua senha?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Digite seu email para receber instruções de recuperação
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={isLoading}
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                )}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 2, mb: 3, py: 1.5 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Enviar Instruções'
                )}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Link component={RouterLink} to="/login" variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <ArrowBack fontSize="small" />
                  Voltar para o Login
                </Link>
              </Box>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Não tem uma conta?{' '}
                  <Link component={RouterLink} to="/register" variant="body2">
                    Cadastre-se aqui
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
