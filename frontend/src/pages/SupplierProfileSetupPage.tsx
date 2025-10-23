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
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Language,
  Category,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import InputMask from 'react-input-mask';
import { useAuth } from '../contexts/AuthContext';
import { SupplierProfileSetupForm } from '../types';
import api from '../config/api';

const schema: yup.ObjectSchema<SupplierProfileSetupForm> = yup.object({
  companyName: yup
    .string()
    .min(2, 'Razão Social deve ter pelo menos 2 caracteres')
    .required('Razão Social é obrigatória'),
  tradeName: yup
    .string()
    .optional(),
  cnpj: yup
    .string()
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX')
    .required('CNPJ é obrigatório'),
  stateRegistration: yup
    .string()
    .optional(),
  municipalRegistration: yup
    .string()
    .optional(),
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
  description: yup
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  categories: yup
    .array()
    .of(yup.string().required())
    .min(1, 'Selecione pelo menos uma categoria')
    .required('Categorias são obrigatórias'),
});

const steps = ['Dados da Empresa', 'Endereço', 'Categorias'];

const availableCategories = [
  'Tecnologia da Informação',
  'Construção Civil',
  'Serviços Gerais',
  'Material de Escritório',
  'Equipamentos',
  'Consultoria',
  'Manutenção',
  'Alimentação',
  'Transporte',
  'Segurança',
];

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const SupplierProfileSetupPage: React.FC = () => {
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

  } = useForm<SupplierProfileSetupForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      companyName: '',
      tradeName: '',
      cnpj: '',
      stateRegistration: '',
      municipalRegistration: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      website: '',
      description: '',
      categories: [],
    },
  });

  // Verificar se o usuário é SUPPLIER
  if (!user || user.role !== 'SUPPLIER') {
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

  const getFieldsForStep = (step: number): (keyof SupplierProfileSetupForm)[] => {
    switch (step) {
      case 0:
        return ['companyName', 'tradeName', 'cnpj', 'stateRegistration', 'municipalRegistration', 'phone', 'website', 'description'];
      case 1:
        return ['address', 'city', 'state', 'zipCode'];
      case 2:
        return ['categories'];
      default:
        return [];
    }
  };

  const onSubmit = async (data: SupplierProfileSetupForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/suppliers', data);

      if (response.data.success) {
        setSuccess('Perfil de fornecedor criado com sucesso!');
        setTimeout(() => {
          navigate('/supplier-dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar perfil de fornecedor');
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
                Dados da Empresa
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Controller
                name="companyName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Razão Social"
                    error={!!errors.companyName}
                    helperText={errors.companyName?.message}
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

            <Grid size={{ xs: 12 }}>
              <Controller
                name="tradeName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nome Fantasia (opcional)"
                    error={!!errors.tradeName}
                    helperText={errors.tradeName?.message}
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
                        label="Telefone Comercial"
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
                name="stateRegistration"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Inscrição Estadual (opcional)"
                    error={!!errors.stateRegistration}
                    helperText={errors.stateRegistration?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="municipalRegistration"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Inscrição Municipal (opcional)"
                    error={!!errors.municipalRegistration}
                    helperText={errors.municipalRegistration?.message}
                  />
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
                    label="Website (opcional)"
                    placeholder="https://www.exemplo.com.br"
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

            <Grid size={{ xs: 12 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Descrição da Empresa (opcional)"
                    placeholder="Descreva brevemente sua empresa e principais atividades..."
                    error={!!errors.description}
                    helperText={errors.description?.message}
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
                Endereço da Empresa
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
                  <InputMask
                    mask="99999-999"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    {(inputProps: any) => (
                      <TextField
                        {...inputProps}
                        fullWidth
                        label="CEP"
                        placeholder="XXXXX-XXX"
                        error={!!errors.zipCode}
                        helperText={errors.zipCode?.message}
                      />
                    )}
                  </InputMask>
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
                Categorias de Atuação
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selecione as categorias que melhor descrevem os produtos/serviços que sua empresa oferece
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Controller
                name="categories"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={availableCategories}
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
                        label="Categorias de Atuação"
                        placeholder="Selecione as categorias..."
                        error={!!errors.categories}
                        helperText={errors.categories?.message}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <Category color="action" />
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
            Configuração do Perfil Fornecedor
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Complete as informações da sua empresa para participar de licitações
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

export default SupplierProfileSetupPage;
