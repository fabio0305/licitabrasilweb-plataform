import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  ArrowBack,
  CalendarToday,
  AttachMoney,
  Business,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Bidding, BiddingStatus, BiddingType, BiddingFilters } from '../types';
import { apiCall } from '../config/api';

const BiddingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [biddings, setBiddings] = useState<Bidding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BiddingFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
    type: undefined,
  });
  const [totalPages, setTotalPages] = useState(0);

  const statusLabels = {
    [BiddingStatus.DRAFT]: 'Rascunho',
    [BiddingStatus.PUBLISHED]: 'Publicada',
    [BiddingStatus.OPEN]: 'Aberta',
    [BiddingStatus.CLOSED]: 'Fechada',
    [BiddingStatus.CANCELLED]: 'Cancelada',
    [BiddingStatus.AWARDED]: 'Adjudicada',
  };

  const statusColors = {
    [BiddingStatus.DRAFT]: 'default' as const,
    [BiddingStatus.PUBLISHED]: 'info' as const,
    [BiddingStatus.OPEN]: 'success' as const,
    [BiddingStatus.CLOSED]: 'warning' as const,
    [BiddingStatus.CANCELLED]: 'error' as const,
    [BiddingStatus.AWARDED]: 'primary' as const,
  };

  const typeLabels = {
    [BiddingType.PREGAO_ELETRONICO]: 'Pregão Eletrônico',
    [BiddingType.CONCORRENCIA]: 'Concorrência',
    [BiddingType.TOMADA_PRECOS]: 'Tomada de Preços',
    [BiddingType.CONVITE]: 'Convite',
    [BiddingType.CONCURSO]: 'Concurso',
    [BiddingType.LEILAO]: 'Leilão',
  };

  const fetchBiddings = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.type) queryParams.append('type', filters.type);

      const response = await apiCall.get(`/biddings/public?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        setBiddings(response.data.biddings || []);
        setTotalPages(response.data.pagination?.totalPages || 0);
      } else {
        setError('Erro ao carregar licitações');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar licitações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiddings();
  }, [filters]);

  const handleFilterChange = (field: keyof BiddingFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : value, // Reset page when other filters change
    }));
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    fetchBiddings();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Licitações Públicas
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Filters */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} />
              Filtros
            </Typography>
            
            <Box component="form" onSubmit={handleSearch}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Buscar licitações"
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status || ''}
                      label="Status"
                      onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={filters.type || ''}
                      label="Tipo"
                      onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                    >
                      <MenuItem value="">Todos</MenuItem>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ height: 56 }}
                  >
                    Buscar
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            <Typography variant="h6" gutterBottom>
              {biddings.length} licitação(ões) encontrada(s)
            </Typography>

            <Grid container spacing={3}>
              {biddings.map((bidding) => (
                <Grid item xs={12} key={bidding.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box flex={1}>
                          <Typography variant="h6" gutterBottom>
                            {bidding.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Nº {bidding.biddingNumber}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip
                            label={statusLabels[bidding.status]}
                            color={statusColors[bidding.status]}
                            size="small"
                          />
                          <Chip
                            label={typeLabels[bidding.type]}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Box>

                      <Typography variant="body2" paragraph>
                        {bidding.description}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Box display="flex" alignItems="center">
                            <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Valor Estimado
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(bidding.estimatedValue)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Box display="flex" alignItems="center">
                            <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Abertura
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatDate(bidding.openingDate)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Box display="flex" alignItems="center">
                            <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Fechamento
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {formatDate(bidding.closingDate)}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Box display="flex" alignItems="center">
                            <Business sx={{ mr: 1, color: 'text.secondary' }} />
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Órgão
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {bidding.publicEntity?.name || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>

                      <Box display="flex" justifyContent="flex-end">
                        <Button
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => navigate(`/biddings/${bidding.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={filters.page || 1}
                  onChange={(_, page) => handleFilterChange('page', page)}
                  color="primary"
                />
              </Box>
            )}

            {biddings.length === 0 && (
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary">
                  Nenhuma licitação encontrada
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tente ajustar os filtros de busca
                </Typography>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default BiddingsPage;
