import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CitizenDashboardPage from './pages/CitizenDashboardPage';
import SupplierDashboardPage from './pages/SupplierDashboardPage';
import BiddingsPage from './pages/BiddingsPage';
import BiddingDetailPage from './pages/BiddingDetailPage';
import ProtectedRoute from './components/ProtectedRoute';

// Tema customizado LicitaBrasil - Cores Oficiais da Plataforma
// CORES OFICIAIS: Primária #2C3F32 (Verde Escuro) | Secundária #F7D52A (Amarelo)
const theme = createTheme({
  palette: {
    primary: {
      main: '#2C3F32', // Verde escuro principal - COR OFICIAL LICITABRASIL
      light: '#4A6B50', // Verde mais claro (calculado)
      dark: '#1A2A1F', // Verde mais escuro (calculado)
      contrastText: '#FFFFFF', // Texto branco para contraste
    },
    secondary: {
      main: '#F7D52A', // Amarelo secundário - COR OFICIAL LICITABRASIL
      light: '#F9E055', // Amarelo mais claro (calculado)
      dark: '#D5B800', // Amarelo mais escuro (calculado)
      contrastText: '#2C3F32', // Texto verde escuro para contraste
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/biddings" element={<BiddingsPage />} />
            <Route path="/biddings/:id" element={<BiddingDetailPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen-dashboard"
              element={
                <ProtectedRoute>
                  <CitizenDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier-dashboard"
              element={
                <ProtectedRoute>
                  <SupplierDashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
