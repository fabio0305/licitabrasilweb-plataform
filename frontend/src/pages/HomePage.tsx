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
} from '@mui/material';
import {
  Business,
  AccountBalance,
  Gavel,
  Visibility,
  Login,
  PersonAdd,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from '../components/NotificationCenter';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Licita Brasil Web
          </Typography>
          
          <Button color="inherit" onClick={() => navigate('/biddings')}>
            Licitações
          </Button>

          {isAuthenticated ? (
            <>
              <Button color="inherit" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <NotificationCenter />
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
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')} startIcon={<Login />}>
                Entrar
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')} startIcon={<PersonAdd />}>
                Cadastrar
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Plataforma Digital de Compras Públicas
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4, opacity: 0.9 }}>
            Modernizando e transformando o processo de licitações no Brasil
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, fontSize: '1.2rem', opacity: 0.8 }}>
            Conectamos entidades governamentais a fornecedores de forma transparente, 
            segura e eficiente, seguindo a Nova Lei de Licitações (Lei nº 14.133/21)
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                mr: 2,
                mb: 2,
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' }
              }}
              onClick={() => navigate('/biddings')}
            >
              Ver Licitações
            </Button>

            {!isAuthenticated ? (
              <>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    mr: 2,
                    mb: 2,
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  onClick={() => navigate('/register')}
                >
                  Cadastrar-se
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    mb: 2,
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  onClick={() => navigate('/login')}
                >
                  Fazer Login
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                size="large"
                sx={{
                  mb: 2,
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
                onClick={() => navigate('/dashboard')}
              >
                Acessar Dashboard
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
          Funcionalidades Principais
        </Typography>
        
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Business sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Portal do Fornecedor
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cadastro, habilitação, participação em licitações e acompanhamento em tempo real
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <AccountBalance sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Portal do Órgão Público
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Criação de licitações, publicação de editais, avaliação de propostas e gestão de contratos
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Visibility sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Portal da Transparência
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Consulta pública, dados abertos, acompanhamento cidadão e estatísticas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Gavel sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Sistema Administrativo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gestão de usuários, configurações, auditoria e relatórios gerenciais
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
            Por que escolher a Licita Brasil Web?
          </Typography>
          
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box textAlign="center">
                <Typography variant="h5" component="h3" gutterBottom color="primary.main">
                  Transparência Total
                </Typography>
                <Typography variant="body1">
                  Todos os processos são públicos e auditáveis, garantindo total transparência
                  nas compras públicas
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box textAlign="center">
                <Typography variant="h5" component="h3" gutterBottom color="primary.main">
                  Conformidade Legal
                </Typography>
                <Typography variant="body1">
                  Totalmente alinhada com a Nova Lei de Licitações (Lei nº 14.133/21)
                  e demais normas aplicáveis
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box textAlign="center">
                <Typography variant="h5" component="h3" gutterBottom color="primary.main">
                  Eficiência e Agilidade
                </Typography>
                <Typography variant="body1">
                  Processos digitalizados que reduzem burocracias e aceleram
                  todo o ciclo de vida das licitações
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="body1" gutterBottom>
            © 2024 Licita Brasil Web - Plataforma Digital de Compras Públicas
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Desenvolvido para modernizar e transformar o processo de licitações no Brasil
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
