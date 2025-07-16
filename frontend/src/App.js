import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';

// Layout Components
import { PublicLayout } from './components/layout';
import { AdminLayout } from './components/layout';

// Public Pages
import { HomePage, RegistrationPage, ThankYouPage, NotFoundPage } from './pages/public';

// Auth Pages
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from './pages/auth';

// Admin Pages
import { 
  DashboardPage, 
  MembersPage, 
  MemberDetailPage, 
  GroupsPage, 
  GroupDetailPage, 
  PledgesPage, 
  ReportsPage, 
  SettingsPage 
} from './pages/admin';

// Help Pages
import { HelpCenter, FAQ, Tutorials } from './pages/help';

// Components
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

// Styles
import './styles/globals.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <SettingsProvider>
              <Router>
                <div className="App">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<PublicLayout />}>
                      <Route index element={<HomePage />} />
                      <Route path="form" element={<RegistrationPage />} />
                      <Route path="thank-you" element={<ThankYouPage />} />
                      <Route path="help" element={<HelpCenter />} />
                      <Route path="faq" element={<FAQ />} />
                      <Route path="tutorials" element={<Tutorials />} />
                    </Route>

                    {/* Auth Routes */}
                    <Route path="/auth">
                      <Route path="login" element={<LoginPage />} />
                      <Route path="forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="reset-password" element={<ResetPasswordPage />} />
                    </Route>

                    {/* Admin Routes - Protected */}
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<Navigate to="/admin/dashboard" replace />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      
                      {/* Members Routes */}
                      <Route path="members" element={<MembersPage />} />
                      <Route path="members/:id" element={<MemberDetailPage />} />
                      
                      {/* Groups Routes */}
                      <Route path="groups" element={<GroupsPage />} />
                      <Route path="groups/:id" element={<GroupDetailPage />} />
                      
                      {/* Pledges Routes */}
                      <Route path="pledges" element={<PledgesPage />} />
                      
                      {/* Reports Routes */}
                      <Route path="reports" element={<ReportsPage />} />
                      
                      {/* Settings Routes */}
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    {/* 404 Route */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </div>
              </Router>
            </SettingsProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;