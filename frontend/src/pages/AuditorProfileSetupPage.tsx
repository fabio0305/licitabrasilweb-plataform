import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Person,
  Business,
  Badge,
  School,
  Phone,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import InputMask from 'react-input-mask';
import { useAuth } from '../contexts/AuthContext';
import { AuditorProfileSetupForm } from '../types';
import axios from 'axios';

const schema: yup.ObjectSchema<AuditorProfileSetupForm> = yup.object({
  cpf: yup
    .string()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX')
    .required('CPF é obrigatório'),
  institution: yup
    .string()
    .min(2, 'Órgão/Instituição deve ter pelo menos 2 caracteres')
    .required('Órgão/Instituição é obrigatório'),
  professionalRegistry: yup
    .string()
    .min(3, 'Registro profissional deve ter pelo menos 3 caracteres')
    .required('Registro profissional é obrigatório'),
  specialization: yup
    .string()
    .min(2, 'Especialização deve ter pelo menos 2 caracteres')
    .required('Especialização é obrigatória'),
  professionalPhone: yup
    .string()
    .matches(/^\(\d{2}\)\s\d{1}\s\d{4}-\d{4}$/, 'Telefone deve estar no formato (XX) 9 XXXX-XXXX')
    .required('Telefone profissional é obrigatório'),
});

const AuditorProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AuditorProfileSetupForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      cpf: '',
      institution: '',
      professionalRegistry: '',
      specialization: '',
      professionalPhone: '',
    },
  });

  // Verificar se o usuário é AUDITOR
  if (!user || user.role !== 'AUDITOR') {
    navigate('/dashboard');
    return null;
  }

  const onSubmit = async (data: AuditorProfileSetupForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Para auditores, vamos apenas atualizar o perfil do usuário com informações adicionais
      // já que não há tabela específica para auditores
      const response = await axios.put('/api/v1/auth/me', {
        ...data,
        profileCompleted: true,
      });
      
      if (response.data.success) {
        setSuccess('Perfil de auditor configurado com sucesso!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao configurar perfil de auditor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Configuração do Perfil Auditor
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Complete suas informações profissionais para acessar funcionalidades de auditoria
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Dados Pessoais */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Dados Pessoais
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="cpf"
                control={control}
                render={({ field }) => (
                  <InputMask
                    mask="999.999.999-99"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    {(inputProps: any) => (
                      <TextField
                        {...inputProps}
                        fullWidth
                        label="CPF"
                        placeholder="XXX.XXX.XXX-XX"
                        error={!!errors.cpf}
                        helperText={errors.cpf?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </InputMask>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="professionalPhone"
                control={control}
                render={({ field }) => (
                  <InputMask
                    mask="(99) 9 9999-9999"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    {(inputProps: any) => (
                      <TextField
                        {...inputProps}
                        fullWidth
                        label="Telefone Profissional"
                        placeholder="(XX) 9 XXXX-XXXX"
                        error={!!errors.professionalPhone}
                        helperText={errors.professionalPhone?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </InputMask>
                )}
              />
            </Grid>

            {/* Dados Profissionais */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Dados Profissionais
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="institution"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Órgão/Instituição Vinculada"
                    placeholder="Ex: Tribunal de Contas da União, Controladoria Geral..."
                    error={!!errors.institution}
                    helperText={errors.institution?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="professionalRegistry"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Número de Registro Profissional"
                    placeholder="Ex: CRC 123456, OAB 78910, etc."
                    error={!!errors.professionalRegistry}
                    helperText={errors.professionalRegistry?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Badge color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="specialization"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Especialização/Área de Atuação"
                    placeholder="Ex: Auditoria Contábil, Controle Interno, Licitações..."
                    error={!!errors.specialization}
                    helperText={errors.specialization?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <School color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Informações Adicionais */}
            <Grid size={{ xs: 12 }}>
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Informação:</strong> Como auditor, você terá acesso a funcionalidades especiais de auditoria, 
                  incluindo visualização de logs de sistema, relatórios detalhados e dados privados para fins de fiscalização.
                </Typography>
              </Alert>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Responsabilidade:</strong> O acesso às informações de auditoria deve ser usado exclusivamente 
                  para fins profissionais e em conformidade com as normas do seu órgão de origem.
                </Typography>
              </Alert>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={() => navigate('/dashboard')}
              startIcon={<ArrowBack />}
              disabled={isLoading}
            >
              Voltar ao Dashboard
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              {isLoading ? 'Salvando...' : 'Concluir Configuração'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AuditorProfileSetupPage;
