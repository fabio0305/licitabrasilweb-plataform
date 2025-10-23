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
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';
import {
  AccountBalance,
  LocationOn,
  Phone,
  Language,
  Person,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import InputMask from 'react-input-mask';
import { useAuth } from '../contexts/AuthContext';
import { PublicEntityProfileSetupForm } from '../types';
import axios from 'axios';

const schema: yup.ObjectSchema<PublicEntityProfileSetupForm> = yup.object({
  name: yup
    .string()
    .min(2, 'Nome do órgão deve ter pelo menos 2 caracteres')
    .required('Nome do órgão é obrigatório'),
  cnpj: yup
    .string()
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX')
    .required('CNPJ é obrigatório'),
  entityType: yup
    .string()
    .oneOf(['Municipal', 'Estadual', 'Federal'], 'Tipo de entidade inválido')
    .required('Tipo de entidade é obrigatório'),
  sphere: yup
    .string()
    .oneOf(['Executivo', 'Legislativo', 'Judiciário'], 'Esfera inválida')
    .required('Esfera é obrigatória'),
  address: yup
    .string()
    .min(5, 'Endereço deve ter pelo menos 5 caracteres')
    .required('Endereço é obrigatório'),
  city: yup
    .string()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .required('Cidade é obrigatória'),
  state: yup
    .string()
    .length(2, 'Estado deve ter 2 caracteres')
    .required('Estado é obrigatório'),
  zipCode: yup
    .string()
    .matches(/^\d{5}-\d{3}$/, 'CEP deve estar no formato XXXXX-XXX')
    .required('CEP é obrigatório'),
  phone: yup
    .string()
    .matches(/^\(\d{2}\)\s\d{1}\s\d{4}-\d{4}$/, 'Telefone deve estar no formato (XX) 9 XXXX-XXXX')
    .required('Telefone é obrigatório'),
  website: yup
    .string()
    .url('Website deve ser uma URL válida')
    .optional(),
  legalRepresentativeName: yup
    .string()
    .min(2, 'Nome do responsável deve ter pelo menos 2 caracteres')
    .required('Nome do responsável legal é obrigatório'),
  legalRepresentativeCpf: yup
    .string()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX')
    .required('CPF do responsável legal é obrigatório'),
  legalRepresentativePosition: yup
    .string()
    .min(2, 'Cargo deve ter pelo menos 2 caracteres')
    .required('Cargo do responsável legal é obrigatório'),
});

const steps = ['Dados do Órgão', 'Endereço', 'Responsável Legal'];

const entityTypes = ['Municipal', 'Estadual', 'Federal'];
const spheres = ['Executivo', 'Legislativo', 'Judiciário'];

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const PublicEntityProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<PublicEntityProfileSetupForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      cnpj: '',
      entityType: '',
      sphere: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      website: '',
      legalRepresentativeName: '',
      legalRepresentativeCpf: '',
      legalRepresentativePosition: '',
    },
  });

  // Verificar se o usuário é PUBLIC_ENTITY
  if (!user || user.role !== 'PUBLIC_ENTITY') {
    navigate('/dashboard');
    return null;
  }

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(activeStep);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const getFieldsForStep = (step: number): (keyof PublicEntityProfileSetupForm)[] => {
    switch (step) {
      case 0:
        return ['name', 'cnpj', 'entityType', 'sphere', 'phone', 'website'];
      case 1:
        return ['address', 'city', 'state', 'zipCode'];
      case 2:
        return ['legalRepresentativeName', 'legalRepresentativeCpf', 'legalRepresentativePosition'];
      default:
        return [];
    }
  };

  const onSubmit = async (data: PublicEntityProfileSetupForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/v1/public-entities', data);
      
      if (response.data.success) {
        setSuccess('Perfil do órgão público criado com sucesso!');
        setTimeout(() => {
          navigate('/public-entity-dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar perfil do órgão público');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Dados do Órgão/Entidade
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nome do Órgão/Entidade"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountBalance color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="cnpj"
                control={control}
                render={({ field }) => (
                  <InputMask
                    mask="99.999.999/9999-99"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    {(inputProps: any) => (
                      <TextField
                        {...inputProps}
                        fullWidth
                        label="CNPJ"
                        placeholder="XX.XXX.XXX/XXXX-XX"
                        error={!!errors.cnpj}
                        helperText={errors.cnpj?.message}
                      />
                    )}
                  </InputMask>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="phone"
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
                        label="Telefone Institucional"
                        placeholder="(XX) 9 XXXX-XXXX"
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
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

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="entityType"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.entityType}>
                    <InputLabel>Tipo de Entidade</InputLabel>
                    <Select
                      {...field}
                      label="Tipo de Entidade"
                    >
                      {entityTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.entityType && (
                      <FormHelperText>{errors.entityType.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="sphere"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.sphere}>
                    <InputLabel>Esfera</InputLabel>
                    <Select
                      {...field}
                      label="Esfera"
                    >
                      {spheres.map((sphere) => (
                        <MenuItem key={sphere} value={sphere}>
                          {sphere}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.sphere && (
                      <FormHelperText>{errors.sphere.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="website"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Website Oficial (opcional)"
                    placeholder="https://www.orgao.gov.br"
                    error={!!errors.website}
                    helperText={errors.website?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Language color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Endereço Institucional
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
                    label="Endereço Completo"
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
                    label="Cidade"
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
                    <InputLabel>Estado</InputLabel>
                    <Select
                      {...field}
                      label="Estado"
                    >
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
                    label="CEP"
                    placeholder="XXXXX-XXX"
                    error={!!errors.zipCode}
                    helperText={errors.zipCode?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Responsável Legal
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Dados do responsável legal pelo órgão/entidade
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Controller
                name="legalRepresentativeName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nome Completo do Responsável"
                    error={!!errors.legalRepresentativeName}
                    helperText={errors.legalRepresentativeName?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="legalRepresentativeCpf"
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
                        label="CPF do Responsável"
                        placeholder="XXX.XXX.XXX-XX"
                        error={!!errors.legalRepresentativeCpf}
                        helperText={errors.legalRepresentativeCpf?.message}
                      />
                    )}
                  </InputMask>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="legalRepresentativePosition"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Cargo/Função"
                    placeholder="Ex: Prefeito, Secretário, Diretor..."
                    error={!!errors.legalRepresentativePosition}
                    helperText={errors.legalRepresentativePosition?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Configuração do Perfil Órgão Público
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Complete as informações do seu órgão para criar e gerenciar licitações
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

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
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={() => navigate('/dashboard')}
              startIcon={<ArrowBack />}
              disabled={isLoading}
            >
              Voltar ao Dashboard
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep > 0 && (
                <Button onClick={handleBack} disabled={isLoading}>
                  Anterior
                </Button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {isLoading ? 'Salvando...' : 'Concluir Cadastro'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PublicEntityProfileSetupPage;
