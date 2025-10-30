import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  PersonAdd,
  CheckCircle,
  Error,
  ArrowForward,
  Login,
  Security,
  Speed,
  VerifiedUser,
  Home,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import InputMask from 'react-input-mask';
import { isValidCpf, cpfMask, formatCpf } from '../utils/cpfValidation';
import { apiCall } from '../config/api';

interface CpfValidationForm {
  cpf: string;
}

const schema: yup.ObjectSchema<CpfValidationForm> = yup.object({
  cpf: yup
    .string()
    .required('CPF é obrigatório')
    .test('cpf-valid', 'CPF inválido', (value) => {
      if (!value) return false;
      return isValidCpf(value);
    }),
});

interface ExistingUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

const CpfValidationPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingUser, setExistingUser] = useState<ExistingUser | null>(null);
  const [validationStep, setValidationStep] = useState<'input' | 'validating' | 'result'>('input');
  const [rateLimitError, setRateLimitError] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CpfValidationForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      cpf: '',
    },
  });

  const cpfValue = watch('cpf');

  const onSubmit = async (data: CpfValidationForm) => {
    try {
      setError(null);
      setSuccess(null);
      setRateLimitError(false);
      setIsLoading(true);
      setValidationStep('validating');

      console.log('🚀 Iniciando validação de CPF:', data.cpf);

      // Formatar CPF para garantir que está no formato correto (XXX.XXX.XXX-XX)
      const formattedCpf = formatCpf(data.cpf);
      console.log('📝 CPF formatado:', formattedCpf);

      // Usando fetch diretamente para bypass do axios
      const fetchResponse = await fetch('/api/v1/auth/validate-cpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf: formattedCpf })
      });

      console.log('✅ Fetch Response Status:', fetchResponse.status);

      if (fetchResponse.status === 429) {
        console.log('⚠️ Rate limit exceeded');
        setRateLimitError(true);
        setError('Muitas tentativas de validação. Tente novamente em alguns minutos.');
        setValidationStep('result');
        return;
      }

      if (!fetchResponse.ok) {
        console.log('❌ HTTP Error:', fetchResponse.status, fetchResponse.statusText);

        // Para erro 409 (CPF já cadastrado), processar a resposta JSON
        if (fetchResponse.status === 409) {
          try {
            const errorResponse = await fetchResponse.json();
            console.log('📋 Resposta de erro 409:', errorResponse);

            if (errorResponse.data?.user) {
              setExistingUser(errorResponse.data.user);
              setError(errorResponse.message || 'CPF já cadastrado');
            } else {
              setError(errorResponse.message || 'CPF já cadastrado');
            }
            setValidationStep('result');
            return;
          } catch (jsonError) {
            console.error('Erro ao processar resposta JSON:', jsonError);
            setError('CPF já cadastrado');
            setValidationStep('result');
            return;
          }
        }

        // Para outros erros HTTP
        setError(`Erro HTTP: ${fetchResponse.status}`);
        setValidationStep('result');
        return;
      }

      const response = await fetchResponse.json();
      console.log('✅ Resposta recebida:', response);

      if (response.success && response.data) {
        if (response.data.isRegistered) {
          // CPF já cadastrado
          console.log('⚠️ CPF já cadastrado:', response.data.user);
          setExistingUser(response.data.user);
          setError('CPF já cadastrado');
        } else {
          // CPF válido e disponível
          console.log('🎉 CPF válido e disponível');
          setSuccess('CPF válido! Redirecionando para o cadastro...');
          setTimeout(() => {
            navigate('/register', { state: { cpf: data.cpf } });
          }, 1500);
        }
      } else if (response.success === false && response.data?.isRegistered === true) {
        // CPF já cadastrado (formato alternativo)
        console.log('⚠️ CPF já cadastrado (formato alternativo):', response.data.user);
        setExistingUser(response.data.user);
        setError('CPF já cadastrado');
      } else if (response.error?.code === 'VALIDATION_ERROR') {
        console.log('❌ CPF inválido');
        setError('CPF inválido segundo algoritmo da Receita Federal');
      } else {
        console.log('❌ Resposta inesperada:', response);
        setError('Resposta inesperada do servidor');
      }
      setValidationStep('result');
    } catch (err: any) {
      setValidationStep('result');

      console.log('🔥 ERRO CAPTURADO - Tipo:', typeof err);
      console.log('🔥 ERRO CAPTURADO - Detalhes:', {
        hasResponse: !!err.response,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        name: err.name,
        code: err.code,
        isAxiosError: err.isAxiosError,
        config: err.config?.url
      });

      if (err.response?.status === 429) {
        setRateLimitError(true);
        setError('Muitas tentativas de validação. Tente novamente em alguns minutos.');
      } else if (err.response?.status === 409) {
        const userData = err.response.data.data?.user;
        if (userData) {
          setExistingUser(userData);
          setError('CPF já cadastrado');
        } else {
          setError('CPF já cadastrado');
        }
      } else if (err.response?.data?.error?.code === 'VALIDATION_ERROR') {
        setError('CPF inválido segundo algoritmo da Receita Federal');
      } else {
        console.error('🔥 Erro na validação de CPF:', err);
        setError(err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Erro ao validar CPF');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setValidationStep('input');
    setError(null);
    setSuccess(null);
    setExistingUser(null);
    setRateLimitError(false);
  };

  const steps = ['Inserir CPF', 'Validar', 'Resultado'];

  const benefits = [
    {
      icon: <Security sx={{ fontSize: 24, color: 'primary.main' }} />,
      title: 'Seguro e Confiável',
      description: 'Validação oficial seguindo padrões da Receita Federal'
    },
    {
      icon: <Speed sx={{ fontSize: 24, color: 'primary.main' }} />,
      title: 'Processo Rápido',
      description: 'Validação em tempo real, sem burocracias'
    },
    {
      icon: <VerifiedUser sx={{ fontSize: 24, color: 'primary.main' }} />,
      title: 'Dados Protegidos',
      description: 'Suas informações são criptografadas e seguras'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2C3F32 0%, #1a2b1f 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header com navegação */}
      <Box sx={{ p: 2 }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              startIcon={<Home />}
              onClick={() => navigate('/')}
              sx={{
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Início
            </Button>
            <Typography variant="h6" sx={{ color: 'white', flexGrow: 1 }}>
              LicitaBrasil
            </Typography>
            <Chip
              label="🇧🇷 Plataforma Oficial"
              sx={{
                bgcolor: 'rgba(247, 213, 42, 0.2)',
                color: 'secondary.main',
                border: '1px solid',
                borderColor: 'secondary.main'
              }}
            />
          </Stack>
        </Container>
      </Box>

      {/* Conteúdo principal */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 4 }}>
        <Container maxWidth="md">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
            {/* Coluna da esquerda - Informações */}
            <Box sx={{ flex: 1, color: 'white', textAlign: { xs: 'center', md: 'left' } }}>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  mb: 3,
                  fontSize: { xs: '2rem', md: '3rem' }
                }}
              >
                Validação de CPF
              </Typography>
              <Typography
                variant="h6"
                sx={{ mb: 4, opacity: 0.9 }}
              >
                Primeiro passo para criar sua conta na plataforma LicitaBrasil
              </Typography>

              {/* Benefícios */}
              <Stack spacing={2} sx={{ mb: 4 }}>
                {benefits.map((benefit, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {benefit.icon}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {benefit.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>

              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                ✓ Validação em tempo real • ✓ Dados seguros • ✓ Processo simplificado
              </Typography>
            </Box>

            {/* Coluna da direita - Formulário */}
            <Box sx={{ flex: 1, width: '100%', maxWidth: 500 }}>
              <Paper
                elevation={24}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Header do formulário */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <PersonAdd
                    sx={{
                      fontSize: 48,
                      color: 'primary.main',
                      mb: 2
                    }}
                  />
                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    sx={{
                      fontWeight: 'bold',
                      color: 'primary.main',
                    }}
                  >
                    Validar CPF
                  </Typography>

                  {/* Stepper */}
                  <Stepper
                    activeStep={
                      validationStep === 'input' ? 0 :
                      validationStep === 'validating' ? 1 : 2
                    }
                    alternativeLabel
                    sx={{ mb: 3 }}
                  >
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                {/* Formulário */}
                {validationStep === 'input' && (
                  <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Controller
                      name="cpf"
                      control={control}
                      render={({ field }) => (
                        <InputMask
                          mask={cpfMask}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        >
                          {(inputProps: any) => (
                            <TextField
                              {...inputProps}
                              fullWidth
                              label="CPF"
                              variant="outlined"
                              error={!!errors.cpf}
                              helperText={errors.cpf?.message || 'Digite seu CPF para continuar'}
                              placeholder="000.000.000-00"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <PersonAdd color="primary" />
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ mb: 3 }}
                            />
                          )}
                        </InputMask>
                      )}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isLoading || !cpfValue || !!errors.cpf}
                      endIcon={<ArrowForward />}
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        mb: 3,
                        bgcolor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Continuar
                    </Button>

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      Ao continuar, você concorda com nossos{' '}
                      <Link href="#" color="primary">Termos de Uso</Link>
                    </Typography>
                  </Box>
                )}

                {/* Loading */}
                {validationStep === 'validating' && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={60} sx={{ mb: 3, color: 'primary.main' }} />
                    <Typography variant="h6" gutterBottom>
                      Validando CPF...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verificando se o CPF já está cadastrado na plataforma
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        ✓ Validando formato do CPF<br/>
                        ✓ Verificando algoritmo da Receita Federal<br/>
                        ✓ Consultando base de dados
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Resultado */}
                {validationStep === 'result' && (
                  <Box>
                    {/* Sucesso */}
                    {success && (
                      <Card sx={{ mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <CheckCircle sx={{ fontSize: 48, mb: 2 }} />
                          <Typography variant="h6" gutterBottom>
                            CPF Válido!
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            Seu CPF foi validado com sucesso.
                          </Typography>
                          <Typography variant="body2">
                            Redirecionando para o formulário de cadastro...
                          </Typography>
                        </CardContent>
                      </Card>
                    )}

                    {/* Erro - Rate Limit */}
                    {rateLimitError && (
                      <Alert severity="warning" sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Muitas tentativas
                        </Typography>
                        <Typography variant="body2">
                          Por segurança, limite de tentativas atingido. Aguarde alguns minutos antes de tentar novamente.
                        </Typography>
                      </Alert>
                    )}

                    {/* Erro - CPF já cadastrado */}
                    {error && existingUser && !rateLimitError && (
                      <Card sx={{ mb: 3, bgcolor: 'warning.light' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Error sx={{ mr: 1, color: 'warning.dark' }} />
                            <Typography variant="h6" color="warning.dark">
                              CPF já cadastrado
                            </Typography>
                          </Box>

                          <Stack spacing={1}>
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              startIcon={<Login />}
                              component={RouterLink}
                              to="/login"
                            >
                              Fazer Login
                            </Button>
                            <Button
                              fullWidth
                              variant="outlined"
                              color="primary"
                              component={RouterLink}
                              to="/forgot-password"
                            >
                              Recuperar Senha
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    )}

                    {/* Erro - CPF inválido ou outros erros */}
                    {error && !existingUser && !rateLimitError && (
                      <Alert severity="error" sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Erro na validação
                        </Typography>
                        <Typography variant="body2">
                          {error}
                        </Typography>
                      </Alert>
                    )}

                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleStartOver}
                      sx={{ mb: 2 }}
                      disabled={rateLimitError}
                    >
                      {rateLimitError ? 'Aguarde alguns minutos' : 'Tentar Novamente'}
                    </Button>
                  </Box>
                )}

                {/* Links */}
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Já possui uma conta?{' '}
                    <Link component={RouterLink} to="/login" color="primary">
                      Fazer login
                    </Link>
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default CpfValidationPage;
