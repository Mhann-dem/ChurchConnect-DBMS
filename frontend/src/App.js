import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import { useTheme } from './context/ThemeContext';
import { useToast } from './context/ToastContext';
import { HelmetProvider } from 'react-helmet-async';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';

// Shared components
import LoadingSpinner from './components/shared/LoadingSpinner';
import Toast from './components/shared/Toast';

// FIXED: Import the debug tool properly
import MembersDebugTool from './components/debug/MembersDebugTool';
import PublicEventsPage from './pages/public/EventsPage';

// Lazy-loaded components
const HomePage = lazy(() => import('./pages/public/HomePage'));
const RegistrationPage = lazy(() => import('./pages/public/RegistrationPage'));
const ThankYouPage = lazy(() => import('./pages/public/ThankYouPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));
const HelpCenter = lazy(() => import('./pages/help/HelpCenter'));
const FAQ = lazy(() => import('./pages/help/FAQ'));

// Additional public pages
const MinistriesPage = lazy(() => import('./pages/public/MinistriesPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const CookiesPage = lazy(() => import('./pages/public/CookiesPage'));
const FeedbackPage = lazy(() => import('./pages/public/FeedbackPage'));
const SitemapPage = lazy(() => import('./pages/public/SitemapPage'));
const AccessibilityPage = lazy(() => import('./pages/public/AccessibilityPage'));

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

// FIXED: Add the missing AdminEventsPage import
const AdminEventsPage = lazy(() => import('./pages/admin/EventsPage'));

// NEW: Add FamiliesPage import
const FamiliesPage = lazy(() => import('./pages/admin/FamiliesPage'));


const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : children;
};

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

  // Track page views for analytics
  useEffect(() => {
    console.log('Page view:', location.pathname);
  }, [location]);

  // Determine if current path is admin-related
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <HelmetProvider>
      <div className="app">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* FIXED: Add debug route at the top level */}
            <Route path="/debug/members" element={<MembersDebugTool />} />
            
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              
              {/* Registration Routes */}
              <Route path="register" element={<RegistrationPage />} />
              <Route path="form" element={<RegistrationPage />} />
              <Route path="member-registration" element={<RegistrationPage />} />
              
              {/* Help & Support Routes */}
              <Route path="help" element={<HelpCenter />} />
              <Route path="help/faq" element={<FAQ />} />
              <Route path="faq" element={<FAQ />} />
              
              {/* Church Information Pages */}
              <Route path="events" element={<PublicEventsPage />} />
              <Route path="ministries" element={<MinistriesPage />} />
              
              {/* Feedback & Support */}
              <Route path="feedback" element={<FeedbackPage />} />
              
              {/* Legal Pages */}
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="cookies" element={<CookiesPage />} />
              
              {/* Utility Pages */}
              <Route path="sitemap" element={<SitemapPage />} />
              <Route path="accessibility" element={<AccessibilityPage />} />
              
              {/* Success Page */}
              <Route path="thank-you" element={<ThankYouPage />} />
              <Route path="registration-success" element={<ThankYouPage />} />
            </Route>

            {/* Authentication Routes */}
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

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* Events route - FIXED: Removed duplicate */}
              <Route path="events" element={<AdminEventsPage />} />
              
              {/* Families Management */}
              <Route path="families/*" element={<FamiliesPage />} />
              
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

            {/* Redirects */}
            <Route path="/registration" element={<Navigate to="/register" replace />} />
            <Route path="/join" element={<Navigate to="/register" replace />} />
            <Route path="/signup" element={<Navigate to="/register" replace />} />
            <Route path="/contact" element={<Navigate to="/help" replace />} />
            <Route path="/support" element={<Navigate to="/help" replace />} />

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
    </HelmetProvider>
  );
}

export default App;