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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Autocomplete,
  Grid,

} from '@mui/material';
import {
  Person,
  LocationOn,
  Work,
  Interests,
  ArrowBack,
  CheckCircle,
  CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import InputMask from 'react-input-mask';
import { useAuth } from '../contexts/AuthContext';
import { CitizenProfileSetupForm } from '../types';
import axios from 'axios';

const schema: yup.ObjectSchema<CitizenProfileSetupForm> = yup.object({
  cpf: yup
    .string()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX')
    .required('CPF é obrigatório'),
  dateOfBirth: yup
    .string()
    .required('Data de nascimento é obrigatória'),
  profession: yup
    .string()
    .optional(),
  address: yup
    .string()
    .optional(),
  city: yup
    .string()
    .optional(),
  state: yup
    .string()
    .optional(),
  zipCode: yup
    .string()
    .matches(/^\d{5}-\d{3}$/, 'CEP deve estar no formato XXXXX-XXX')
    .optional(),
  interests: yup
    .array()
    .of(yup.string().required())
    .min(1, 'Selecione pelo menos uma área de interesse')
    .required('Áreas de interesse são obrigatórias'),
});

const availableInterests = [
  'Obras Públicas',
  'Tecnologia da Informação',
  'Saúde',
  'Educação',
  'Transporte',
  'Segurança Pública',
  'Meio Ambiente',
  'Cultura',
  'Esporte e Lazer',
  'Assistência Social',
  'Infraestrutura',
  'Serviços Gerais',
  'Material de Escritório',
  'Equipamentos',
  'Alimentação',
  'Limpeza e Conservação',
];

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const CitizenProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },

  } = useForm<CitizenProfileSetupForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      cpf: '',
      dateOfBirth: '',
      profession: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      interests: [],
    },
  });

  // Verificar se o usuário é CITIZEN
  if (!user || user.role !== 'CITIZEN') {
    navigate('/dashboard');
    return null;
  }

  const onSubmit = async (data: CitizenProfileSetupForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/v1/citizens', data);
      
      if (response.data.success) {
        setSuccess('Perfil de cidadão criado com sucesso!');
        setTimeout(() => {
          navigate('/citizen-dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar perfil de cidadão');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Configuração do Perfil Cidadão
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Complete suas informações para acompanhar licitações e exercer o controle social
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
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Data de Nascimento"
                    type="date"
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth?.message}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="profession"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Profissão (opcional)"
                    placeholder="Ex: Engenheiro, Professor, Advogado..."
                    error={!!errors.profession}
                    helperText={errors.profession?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Work color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Endereço */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Endereço (opcional)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Essas informações nos ajudam a mostrar licitações relevantes da sua região
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Endereço Completo (opcional)"
                    placeholder="Rua, Avenida, Número, Complemento"
                    error={!!errors.address}
                    helperText={errors.address?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Cidade (opcional)"
                    error={!!errors.city}
                    helperText={errors.city?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                name="state"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.state}>
                    <InputLabel>Estado (opcional)</InputLabel>
                    <Select
                      {...field}
                      label="Estado (opcional)"
                    >
                      <MenuItem value="">
                        <em>Selecione...</em>
                      </MenuItem>
                      {brazilianStates.map((state) => (
                        <MenuItem key={state} value={state}>
                          {state}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.state && (
                      <FormHelperText>{errors.state.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Controller
                name="zipCode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CEP (opcional)"
                    placeholder="XXXXX-XXX"
                    error={!!errors.zipCode}
                    helperText={errors.zipCode?.message}
                  />
                )}
              />
            </Grid>

            {/* Áreas de Interesse */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Áreas de Interesse
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selecione as áreas que você tem interesse em acompanhar. Isso nos ajudará a personalizar as informações para você.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="interests"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={availableInterests}
                    value={field.value}
                    onChange={(_, newValue) => field.onChange(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={option}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Áreas de Interesse"
                        placeholder="Selecione suas áreas de interesse..."
                        error={!!errors.interests}
                        helperText={errors.interests?.message}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <Interests color="action" />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )}
              />
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
              {isLoading ? 'Salvando...' : 'Concluir Cadastro'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CitizenProfileSetupPage;
