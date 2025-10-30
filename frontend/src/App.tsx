import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import RegisterPage from './pages/RegisterPage';
import CpfValidationPage from './pages/CpfValidationPage';
import DashboardPage from './pages/DashboardPage';
import CitizenDashboardPage from './pages/CitizenDashboardPage';
import SupplierDashboardPage from './pages/SupplierDashboardPage';
import PublicEntityDashboardPage from './pages/PublicEntityDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminBiddingsPage from './pages/AdminBiddingsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage';
import TestAdminPage from './pages/TestAdminPage';
import AdminBiddingsPageSimple from './pages/AdminBiddingsPageSimple';
import AdminSettingsPageSimple from './pages/AdminSettingsPageSimple';
import UnauthorizedPage from './pages/UnauthorizedPage';
import BiddingsPage from './pages/BiddingsPage';
import BiddingDetailPage from './pages/BiddingDetailPage';
import ProfilePage from './pages/ProfilePage';
import UserSettingsPage from './pages/UserSettingsPage';
import SupplierProfileSetupPage from './pages/SupplierProfileSetupPage';
import PublicEntityProfileSetupPage from './pages/PublicEntityProfileSetupPage';
import CitizenProfileSetupPage from './pages/CitizenProfileSetupPage';
import AuditorProfileSetupPage from './pages/AuditorProfileSetupPage';
import TestAuthPage from './pages/TestAuthPage';
import ProfileDebugPage from './pages/ProfileDebugPage';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';

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
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/validar-cpf" element={<CpfValidationPage />} />
            <Route path="/cadastro/validar-cpf" element={<CpfValidationPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/biddings" element={<BiddingsPage />} />
            <Route path="/biddings/:id" element={<BiddingDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<UserSettingsPage />} />
            <Route path="/test-auth" element={<TestAuthPage />} />
            <Route path="/debug-profile" element={<ProfileDebugPage />} />
            <Route
              path="/profile-setup/supplier"
              element={
                <ProtectedRoute requiredRoles={[UserRole.SUPPLIER]}>
                  <SupplierProfileSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-setup/public-entity"
              element={
                <ProtectedRoute requiredRoles={[UserRole.PUBLIC_ENTITY]}>
                  <PublicEntityProfileSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-setup/citizen"
              element={
                <ProtectedRoute requiredRoles={[UserRole.CITIZEN]}>
                  <CitizenProfileSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-setup/auditor"
              element={
                <ProtectedRoute requiredRoles={[UserRole.AUDITOR]}>
                  <AuditorProfileSetupPage />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/public-entity-dashboard"
              element={
                <ProtectedRoute>
                  <PublicEntityDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/biddings"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <AdminBiddingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <AdminReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <AdminAuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/test"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <TestAdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/biddings-simple"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <AdminBiddingsPageSimple />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings-simple"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <AdminSettingsPageSimple />
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
