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
  Divider,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';

import {
  ArrowBack,
  CalendarToday,
  AttachMoney,
  Business,
  LocationOn,
  Description,
  Assignment,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { Bidding, BiddingStatus, BiddingType } from '../types';
import { apiCall } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const BiddingDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [bidding, setBidding] = useState<Bidding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchBidding = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await apiCall.get(`/biddings/public/${id}`);
        
        if (response.success && response.data) {
          setBidding(response.data.bidding);
        } else {
          setError('Licitação não encontrada');
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar licitação');
      } finally {
        setLoading(false);
      }
    };

    fetchBidding();
  }, [id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canParticipate = () => {
    return isAuthenticated && 
           user?.role === 'SUPPLIER' && 
           bidding?.status === BiddingStatus.OPEN;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !bidding) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'Licitação não encontrada'}
        </Alert>
        <Button onClick={() => navigate('/biddings')} sx={{ mt: 2 }}>
          Voltar para Licitações
        </Button>
      </Container>
    );
  }

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/biddings')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Detalhes da Licitação
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Info */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {bidding.title}
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nº {bidding.biddingNumber}
                </Typography>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={statusLabels[bidding.status]}
                  color={statusColors[bidding.status]}
                />
                <Chip
                  label={typeLabels[bidding.type]}
                  variant="outlined"
                />
              </Box>
            </Box>

            <Typography variant="body1" paragraph>
              {bidding.description}
            </Typography>

            {canParticipate() && (
              <Box mt={3}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(`/biddings/${bidding.id}/participate`)}
                >
                  Participar da Licitação
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          {/* Informações Principais */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informações Principais
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoney />
                    </ListItemIcon>
                    <ListItemText
                      primary="Valor Estimado"
                      secondary={formatCurrency(bidding.estimatedValue)}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <CalendarToday />
                    </ListItemIcon>
                    <ListItemText
                      primary="Data de Abertura"
                      secondary={formatDate(bidding.openingDate)}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText
                      primary="Data de Fechamento"
                      secondary={formatDate(bidding.closingDate)}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Business />
                    </ListItemIcon>
                    <ListItemText
                      primary="Órgão Público"
                      secondary={bidding.publicEntity?.name || 'N/A'}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText
                      primary="Local de Entrega"
                      secondary={bidding.deliveryLocation}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText
                      primary="Prazo de Entrega"
                      secondary={bidding.deliveryDeadline}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Requisitos */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assignment sx={{ mr: 1 }} />
                  Requisitos
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                  {bidding.requirements}
                </Typography>
              </CardContent>
            </Card>

            {/* Critérios de Avaliação */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  Critérios de Avaliação
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                  {bidding.evaluationCriteria}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Status Timeline */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status da Licitação
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CheckCircle 
                      color={bidding.publishedAt ? 'success' : 'disabled'} 
                      sx={{ mr: 2 }} 
                    />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Publicada
                      </Typography>
                      {bidding.publishedAt && (
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(bidding.publishedAt)}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" mb={2}>
                    <CheckCircle 
                      color={bidding.status === BiddingStatus.OPEN ? 'success' : 'disabled'} 
                      sx={{ mr: 2 }} 
                    />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Aberta para Propostas
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(bidding.openingDate)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" mb={2}>
                    <CheckCircle 
                      color={[BiddingStatus.CLOSED, BiddingStatus.AWARDED].includes(bidding.status) ? 'success' : 'disabled'} 
                      sx={{ mr: 2 }} 
                    />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Fechada
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(bidding.closingDate)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center">
                    <CheckCircle 
                      color={bidding.status === BiddingStatus.AWARDED ? 'success' : 'disabled'} 
                      sx={{ mr: 2 }} 
                    />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        Adjudicada
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Categorias */}
            {bidding.categories && bidding.categories.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Categorias
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {bidding.categories.map((category) => (
                      <Chip
                        key={category.id}
                        label={category.name}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default BiddingDetailPage;
