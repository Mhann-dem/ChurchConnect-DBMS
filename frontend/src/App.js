import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import { useTheme } from './context/ThemeContext';
import { useToast } from './context/ToastContext';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';

// Shared components
import LoadingSpinner from './components/shared/LoadingSpinner';
import Toast from './components/shared/Toast';

// Lazy-loaded components for better performance
const HomePage = lazy(() => import('./pages/public/HomePage'));
const RegistrationPage = lazy(() => import('./pages/public/RegistrationPage'));
const ThankYouPage = lazy(() => import('./pages/public/ThankYouPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));
const HelpCenter = lazy(() => import('./pages/help/HelpCenter'));

// Admin components
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const MembersPage = lazy(() => import('./pages/admin/MembersPage'));
const MemberDetailPage = lazy(() => import('./pages/admin/MemberDetailPage'));
const GroupsPage = lazy(() => import('./pages/admin/GroupsPage'));
const GroupDetailPage = lazy(() => import('./pages/admin/GroupDetailPage'));
const PledgesPage = lazy(() => import('./pages/admin/PledgesPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

// Public route wrapper (redirects authenticated users to admin)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : children;
};

// Admin route wrapper
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

// Main App component
function App() {
  const { theme } = useTheme();
  const { toasts } = useToast();
  const location = useLocation();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Track page views for analytics (optional)
  useEffect(() => {
    // Add your analytics tracking here
    console.log('Page view:', location.pathname);
  }, [location]);

  // Determine if current path is admin-related
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="app">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes - Primary focus for church members */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="register" element={<RegistrationPage />} />
            <Route path="thank-you" element={<ThankYouPage />} />
            <Route path="help" element={<HelpCenter />} />
          </Route>

          {/* Authentication Routes - Clean, separate from main navigation */}
          <Route path="/admin/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/admin/forgot-password" element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } />
          <Route path="/admin/reset-password" element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          } />

          {/* Admin Routes - Protected and feature-rich */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* Member Management */}
            <Route path="members" element={<MembersPage />} />
            <Route path="members/:id" element={<MemberDetailPage />} />
            
            {/* Group Management */}
            <Route path="groups" element={<GroupsPage />} />
            <Route path="groups/:id" element={<GroupDetailPage />} />
            
            {/* Pledge Management */}
            <Route path="pledges" element={<PledgesPage />} />
            
            {/* Reports */}
            <Route path="reports" element={<ReportsPage />} />
            
            {/* Settings */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Global Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>

      {/* Accessibility Skip Links */}
      <div className="skip-links">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {isAdminPath && (
          <a href="#admin-nav" className="skip-link">
            Skip to navigation
          </a>
        )}
      </div>
    </div>
  );
}

export default App;