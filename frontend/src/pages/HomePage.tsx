import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Stack,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Business,
  AccountBalance,
  Gavel,
  Visibility,
  Menu as MenuIcon,
  TrendingUp,
  Security,
  Speed,
  CheckCircle,
  People,
  Assessment,
  CloudDone,
  Support,
  ArrowForward,
  PlayArrow,
  Phone,
  Email,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from '../components/NotificationCenter';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  // Dados de estatísticas (simulados)
  const stats = [
    { number: '10.000+', label: 'Licitações Publicadas' },
    { number: '5.000+', label: 'Fornecedores Cadastrados' },
    { number: '500+', label: 'Órgãos Públicos' },
    { number: 'R$ 2B+', label: 'Volume Negociado' },
  ];

  // Funcionalidades principais
  const features = [
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Segurança Total',
      description: 'Plataforma com certificação de segurança e criptografia de ponta a ponta'
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Processo Ágil',
      description: 'Reduza o tempo de licitação em até 70% com nossa automação inteligente'
    },
    {
      icon: <Assessment sx={{ fontSize: 40 }} />,
      title: 'Relatórios Completos',
      description: 'Dashboards e relatórios em tempo real para tomada de decisão'
    },
    {
      icon: <CloudDone sx={{ fontSize: 40 }} />,
      title: '100% Digital',
      description: 'Processo completamente digital, sem papel, sustentável e eficiente'
    },
  ];

  // Benefícios para diferentes perfis
  const benefits = [
    {
      title: 'Para Órgãos Públicos',
      items: [
        'Redução de custos operacionais',
        'Maior transparência nos processos',
        'Conformidade com a Lei 14.133/21',
        'Relatórios automáticos de auditoria'
      ]
    },
    {
      title: 'Para Fornecedores',
      items: [
        'Acesso a mais oportunidades',
        'Processo de participação simplificado',
        'Notificações em tempo real',
        'Histórico completo de participações'
      ]
    },
    {
      title: 'Para a Sociedade',
      items: [
        'Total transparência dos processos',
        'Acompanhamento cidadão',
        'Dados abertos e acessíveis',
        'Controle social efetivo'
      ]
    }
  ];

  return (
    <Box>
      {/* Header Moderno */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'white',
          color: 'primary.main',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mr: 4
                }}
              >
                LicitaBrasil
              </Typography>

              {!isMobile && (
                <Stack direction="row" spacing={3}>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/biddings')}
                    sx={{ fontWeight: 500 }}
                  >
                    Licitações
                  </Button>
                  <Button
                    color="inherit"
                    sx={{ fontWeight: 500 }}
                  >
                    Soluções
                  </Button>
                  <Button
                    color="inherit"
                    sx={{ fontWeight: 500 }}
                  >
                    Sobre
                  </Button>
                </Stack>
              )}
            </Box>

            {isAuthenticated ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <NotificationCenter />
                <Button
                  color="inherit"
                  onClick={() => navigate('/dashboard')}
                  sx={{ fontWeight: 500 }}
                >
                  Dashboard
                </Button>
                <IconButton color="inherit" onClick={handleMenuOpen}>
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => navigate('/dashboard')}>
                    Meu Perfil
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    Sair
                  </MenuItem>
                </Menu>
              </Stack>
            ) : (
              <Stack direction="row" spacing={2}>
                <Button
                  color="inherit"
                  onClick={() => navigate('/login')}
                  sx={{ fontWeight: 500 }}
                >
                  Entrar
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate('/register')}
                  sx={{
                    fontWeight: 600,
                    px: 3,
                    borderRadius: 2
                  }}
                >
                  Cadastrar Grátis
                </Button>
              </Stack>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section Moderno - Cores Oficiais LicitaBrasil */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2C3F32 0%, #4A6B50 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3,
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Chip
                  label="🇧🇷 Plataforma 100% Brasileira"
                  sx={{
                    mb: 3,
                    bgcolor: 'rgba(247, 213, 42, 0.2)',
                    color: 'secondary.main',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: 'secondary.main'
                  }}
                />

                <Typography
                  variant="h1"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                    lineHeight: 1.1,
                    mb: 3
                  }}
                >
                  A Revolução Digital das{' '}
                  <Box component="span" sx={{ color: 'secondary.main' }}>
                    Licitações Públicas
                  </Box>
                </Typography>

                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    fontWeight: 400,
                    fontSize: { xs: '1.2rem', md: '1.5rem' },
                    lineHeight: 1.4
                  }}
                >
                  Conectamos órgãos públicos e fornecedores em uma plataforma segura,
                  transparente e 100% conforme a Lei 14.133/21
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ mb: 4 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    sx={{
                      bgcolor: 'secondary.main',
                      color: 'primary.main',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      '&:hover': {
                        bgcolor: 'secondary.dark',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(247, 213, 42, 0.3)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => navigate('/biddings')}
                  >
                    Explorar Licitações
                  </Button>

                  {!isAuthenticated && (
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<PlayArrow />}
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        fontSize: '1.1rem',
                        '&:hover': {
                          borderColor: 'secondary.main',
                          bgcolor: 'rgba(247, 213, 42, 0.1)',
                          color: 'secondary.main',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => navigate('/register')}
                    >
                      Começar Gratuitamente
                    </Button>
                  )}
                </Stack>

                {/* Estatísticas em destaque */}
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  {stats.map((stat, index) => (
                    <Grid size={{ xs: 6, sm: 3 }} key={index}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 800,
                            color: 'secondary.main',
                            fontSize: { xs: '1.5rem', md: '2rem' }
                          }}
                        >
                          {stat.number}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            opacity: 0.8,
                            fontSize: { xs: '0.8rem', md: '0.9rem' }
                          }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  display: { xs: 'none', md: 'block' },
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* Placeholder para ilustração/imagem */}
                <Paper
                  elevation={20}
                  sx={{
                    p: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 4,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <Box sx={{ color: 'primary.main', textAlign: 'center' }}>
                    <Assessment sx={{ fontSize: 80, mb: 2, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Dashboard em Tempo Real
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Acompanhe todas as licitações, propostas e contratos em uma interface intuitiva
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section Moderno */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' },
              color: 'primary.main',
              mb: 2
            }}
          >
            Por que escolher a LicitaBrasil?
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            Uma plataforma completa que revoluciona o processo de licitações públicas no Brasil
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(44, 63, 50, 0.1)',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Seção de Portais */}
        <Box sx={{ mt: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            textAlign="center"
            gutterBottom
            sx={{
              mb: 6,
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            Portais Especializados
          </Typography>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 4,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  bgcolor: 'primary.main',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 15px 30px rgba(44, 63, 50, 0.3)'
                  }
                }}
              >
                <Business sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                  Portal do Fornecedor
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
                  Cadastro, habilitação, participação em licitações e acompanhamento em tempo real
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'secondary.main',
                    color: 'primary.main',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'secondary.dark' }
                  }}
                >
                  Saiba Mais
                </Button>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 4,
                  border: '2px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <AccountBalance sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                  Portal do Órgão Público
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Criação de licitações, publicação de editais, avaliação de propostas e gestão de contratos
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  Saiba Mais
                </Button>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 4,
                  border: '2px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Visibility sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                  Portal da Transparência
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Consulta pública, dados abertos, acompanhamento cidadão e estatísticas
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  Saiba Mais
                </Button>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 4,
                  border: '2px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Gavel sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                  Sistema Administrativo
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Gestão de usuários, configurações, auditoria e relatórios gerenciais
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  Saiba Mais
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Benefits Section Moderno */}
      <Box sx={{ bgcolor: 'grey.50', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '3rem' },
                color: 'primary.main',
                mb: 2
              }}
            >
              Benefícios para Todos
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                maxWidth: 600,
                mx: 'auto',
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}
            >
              Nossa plataforma oferece vantagens específicas para cada tipo de usuário
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 15px 30px rgba(0,0,0,0.1)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    color="primary.main"
                    sx={{ fontWeight: 600, mb: 3 }}
                  >
                    {benefit.title}
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {benefit.items.map((item, itemIndex) => (
                      <ListItem key={itemIndex} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle sx={{ color: 'secondary.main', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{
                            variant: 'body1',
                            sx: { fontWeight: 500 }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Seção de Depoimentos/Números */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' },
              color: 'primary.main',
              mb: 2
            }}
          >
            Resultados que Falam por Si
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            Números que comprovam a eficiência da nossa plataforma
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 3,
                height: '100%'
              }}
            >
              <TrendingUp sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                70%
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Redução no tempo de processo
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'secondary.main',
                color: 'primary.main',
                borderRadius: 3,
                height: '100%'
              }}
            >
              <People sx={{ fontSize: 50, mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                98%
              </Typography>
              <Typography variant="body1">
                Satisfação dos usuários
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 3,
                height: '100%'
              }}
            >
              <Security sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: 'primary.main' }}>
                100%
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Conformidade legal garantida
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px solid',
                borderColor: 'divider',
                borderRadius: 3,
                height: '100%'
              }}
            >
              <Support sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: 'primary.main' }}>
                24/7
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Suporte especializado
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Call to Action Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' },
              mb: 3
            }}
          >
            Pronto para Revolucionar suas{' '}
            <Box component="span" sx={{ color: 'secondary.main' }}>
              Licitações?
            </Box>
          </Typography>

          <Typography
            variant="h6"
            sx={{
              mb: 4,
              opacity: 0.9,
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            Junte-se a milhares de órgãos públicos e fornecedores que já confiam na LicitaBrasil
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: 'secondary.main',
                color: 'primary.main',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'secondary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(247, 213, 42, 0.3)'
                },
                transition: 'all 0.3s ease'
              }}
              onClick={() => navigate('/register')}
            >
              Cadastrar Gratuitamente
            </Button>

            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.1rem',
                '&:hover': {
                  borderColor: 'secondary.main',
                  bgcolor: 'rgba(247, 213, 42, 0.1)',
                  color: 'secondary.main'
                }
              }}
              onClick={() => navigate('/biddings')}
            >
              Explorar Licitações
            </Button>
          </Stack>

          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            ✓ Cadastro gratuito • ✓ Sem compromisso • ✓ Suporte especializado
          </Typography>
        </Container>
      </Box>

      {/* Footer Moderno */}
      <Box sx={{ bgcolor: '#1A2A1F', color: 'white', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Logo e Descrição */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                variant="h4"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  color: 'secondary.main'
                }}
              >
                LicitaBrasil
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  opacity: 0.8,
                  lineHeight: 1.6
                }}
              >
                A plataforma que revoluciona as licitações públicas no Brasil,
                conectando órgãos públicos e fornecedores de forma transparente e eficiente.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip
                  label="🇧🇷 100% Brasileiro"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(247, 213, 42, 0.2)',
                    color: 'secondary.main',
                    border: '1px solid',
                    borderColor: 'secondary.main'
                  }}
                />
                <Chip
                  label="Lei 14.133/21"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                />
              </Stack>
            </Grid>

            {/* Links Rápidos */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: 'secondary.main'
                }}
              >
                Plataforma
              </Typography>
              <Stack spacing={1}>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                  onClick={() => navigate('/biddings')}
                >
                  Licitações
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  Fornecedores
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  Órgãos Públicos
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  Transparência
                </Button>
              </Stack>
            </Grid>

            {/* Recursos */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: 'secondary.main'
                }}
              >
                Recursos
              </Typography>
              <Stack spacing={1}>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  Documentação
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  Tutoriais
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  Suporte
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  FAQ
                </Button>
              </Stack>
            </Grid>

            {/* Empresa */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: 'secondary.main'
                }}
              >
                Empresa
              </Typography>
              <Stack spacing={1}>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  Sobre Nós
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  Carreiras
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  Imprensa
                </Button>
                <Button
                  color="inherit"
                  sx={{
                    justifyContent: 'flex-start',
                    p: 0,
                    minWidth: 'auto',
                    opacity: 0.8,
                    '&:hover': { opacity: 1, color: 'secondary.main' }
                  }}
                >
                  Contato
                </Button>
              </Stack>
            </Grid>

            {/* Contato */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: 'secondary.main'
                }}
              >
                Contato
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    contato@licitabrasil.com.br
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    (11) 3000-0000
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    São Paulo, SP
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Copyright */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
              © 2024 LicitaBrasil Web Platform. Todos os direitos reservados.
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>
              Desenvolvido para modernizar e transformar o processo de licitações públicas no Brasil
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
