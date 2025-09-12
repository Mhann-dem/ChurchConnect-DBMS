import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import useAuth from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../shared/LoadingSpinner';

// Lazy load components for better performance
const KeyboardShortcuts = lazy(() => import('../shared/KeyboardShortcuts'));
const NotificationCenter = lazy(() => import('../shared/NotificationCenter'));

// Enhanced Error Boundary Component with better error reporting
const AdminErrorFallback = ({ error, resetError }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Log error to monitoring service
    console.error('Admin Layout Error:', error);
    
    // Report to error tracking service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }
  }, [error]);

  const handleRetry = useCallback(() => {
    resetError();
    showToast('Retrying...', 'info');
  }, [resetError, showToast]);

  const handleGoToDashboard = useCallback(() => {
    resetError();
    navigate('/admin/dashboard', { replace: true });
  }, [resetError, navigate]);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="errorBoundary" role="alert" aria-live="assertive">
      <div className="errorContent">
        <div className="errorIcon" aria-hidden="true">⚠️</div>
        <h2>Something went wrong</h2>
        <p>We're sorry, but something unexpected happened in the admin panel.</p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="errorDetails">
            <summary>Error Details (Development)</summary>
            <pre>{error?.message}</pre>
            <pre>{error?.stack}</pre>
          </details>
        )}
        
        <div className="errorActions">
          <button 
            onClick={handleRetry}
            className="errorButton primary"
            type="button"
          >
            Try Again
          </button>
          <button 
            onClick={handleGoToDashboard}
            className="errorButton secondary"
            type="button"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={handleReload}
            className="errorButton secondary"
            type="button"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced loading component
const AdminLoadingScreen = ({ message = 'Loading ChurchConnect...' }) => (
  <div className="loadingContainer" role="status" aria-live="polite">
    <div className="loadingContent">
      <div className="loadingLogo">
        <div className="logoSpinner">
          <span className="logoText">CC</span>
        </div>
        <div className="loadingRings">
          <div className="ring ring1"></div>
          <div className="ring ring2"></div>
          <div className="ring ring3"></div>
        </div>
      </div>
      
      <div className="loadingText">
        <h1>ChurchConnect</h1>
        <p>Administrative Dashboard</p>
        <div className="loadingProgress">
          <div className="progressBar">
            <div className="progressFill"></div>
          </div>
          <span className="progressText">{message}</span>
        </div>
      </div>
    </div>
  </div>
);

// Main AdminLayout Component
const AdminLayout = () => {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  
  // Hooks
  const { user, isLoading, hasPermission, logout } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Memoize permission check for performance
  const canAccessAdmin = useMemo(() => {
    if (!user) return false;
    
    const adminRoles = ['admin', 'super_admin'];
    return adminRoles.includes(user.role) || hasPermission('access_admin');
  }, [user, hasPermission]);

  // Enhanced responsive detection with debouncing
  const checkScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const mobile = width < 768;
    const tablet = width >= 768 && width < 1024;

    setIsMobile(mobile);
    setIsTablet(tablet);
    
    // Auto-close sidebar on mobile
    if (mobile && sidebarOpen) {
      setSidebarOpen(false);
    }
    
    // Smart auto-collapse logic
    if (tablet && !isCollapsed) {
      setIsCollapsed(true);
    } else if (width >= 1400 && isCollapsed && !mobile) {
      setIsCollapsed(false);
    }
  }, [sidebarOpen, isCollapsed]);

  // Debounced resize handler
  const debouncedResize = useMemo(() => {
    let timeoutId;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkScreenSize, 150);
    };
  }, [checkScreenSize]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connection restored', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Connection lost. Some features may be limited.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Responsive setup
  useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [checkScreenSize, debouncedResize]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        // Auto-save logic could go here
        console.log('Page hidden with unsaved changes');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUnsavedChanges]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent shortcuts when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      // Global shortcuts
      switch (true) {
        case e.ctrlKey && e.key === 'b':
          e.preventDefault();
          if (!isMobile) {
            setIsCollapsed(!isCollapsed);
          } else {
            setSidebarOpen(!sidebarOpen);
          }
          break;

        case e.key === 'Escape':
          if (sidebarOpen) {
            setSidebarOpen(false);
          } else if (keyboardShortcutsOpen) {
            setKeyboardShortcutsOpen(false);
          }
          break;

        case e.ctrlKey && e.key === '/':
          e.preventDefault();
          setKeyboardShortcutsOpen(true);
          break;

        case e.ctrlKey && e.key === 'k':
          e.preventDefault();
          // Open command palette (implement later)
          showToast('Command palette coming soon!', 'info');
          break;

        case e.altKey && e.key === 'd':
          e.preventDefault();
          navigate('/admin/dashboard');
          break;

        case e.altKey && e.key === 'm':
          e.preventDefault();
          navigate('/admin/members');
          break;

        case e.altKey && e.key === 'g':
          e.preventDefault();
          navigate('/admin/groups');
          break;

        case e.altKey && e.key === 'p':
          e.preventDefault();
          navigate('/admin/pledges');
          break;

        case e.altKey && e.key === 'r':
          e.preventDefault();
          navigate('/admin/reports');
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed, sidebarOpen, isMobile, keyboardShortcutsOpen, navigate, showToast]);

  // Auto logout on extended inactivity
  useEffect(() => {
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        showToast('Session expired due to inactivity', 'warning');
        logout();
        navigate('/admin/login');
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [logout, navigate, showToast]);

  // Handlers
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleSidebarCollapse = useCallback((collapsed) => {
    setIsCollapsed(collapsed);
  }, []);

  // Loading state
  if (isLoading) {
    return <AdminLoadingScreen message="Authenticating..." />;
  }

  // Permission check - redirect if user doesn't have admin access
  if (!canAccessAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // Calculate sidebar width
  const sidebarWidth = isCollapsed ? 72 : 280;
  const effectiveWidth = isMobile ? 0 : (isTablet ? 64 : sidebarWidth);

  return (
    <ErrorBoundary FallbackComponent={AdminErrorFallback} onError={(error, errorInfo) => {
      console.error('Admin Layout Error:', error, errorInfo);
    }}>
      <div 
        className={`
          adminLayout 
          ${settings?.theme === 'dark' ? 'dark' : ''} 
          ${isMobile ? 'mobile' : ''} 
          ${isTablet ? 'tablet' : ''}
          ${!isOnline ? 'offline' : ''}
        `}
        data-sidebar-open={sidebarOpen}
        data-sidebar-collapsed={isCollapsed}
        data-testid="admin-layout"
      >
        {/* Offline indicator */}
        {!isOnline && (
          <div className="offlineIndicator" role="alert">
            <span>You are offline. Some features may be limited.</span>
          </div>
        )}

        {/* Enhanced Sidebar */}
        <div 
          className={`sidebarContainer ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'open' : ''}`}
          style={{ '--sidebar-width': `${effectiveWidth}px` }}
        >
          <Suspense fallback={<LoadingSpinner size="sm" />}>
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={closeSidebar}
              onCollapseChange={handleSidebarCollapse}
              isMobile={isMobile}
              isTablet={isTablet}
              isCollapsed={isCollapsed}
              currentPath={location.pathname}
            />
          </Suspense>
        </div>

        {/* Main Application Area */}
        <div 
          className={`mainApplication ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`} 
          style={{
            marginLeft: effectiveWidth,
            transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Enhanced Header */}
          <Header 
            onMenuClick={toggleSidebar}
            user={user}
            sidebarOpen={sidebarOpen}
            isAdmin={true}
            isMobile={isMobile}
            isCollapsed={isCollapsed}
            hasUnsavedChanges={hasUnsavedChanges}
            isOnline={isOnline}
          />

          {/* Main Content with Error Boundary */}
          <main 
            className="mainContent"
            role="main"
            aria-label="Admin dashboard content"
            id="main-content"
          >
            {/* Breadcrumbs */}
            <div className="breadcrumbsContainer">
              <Breadcrumbs currentPath={location.pathname} />
            </div>

            {/* Page Header with Context */}
            <div className="pageHeader">
              <div className="pageTitleSection">
                <h1 className="pageTitle">
                  {getPageTitle(location.pathname)}
                </h1>
                <p className="pageDescription">
                  {getPageDescription(location.pathname)}
                </p>
              </div>
              
              <div className="pageActions">
                <button 
                  className="actionButton secondary"
                  title="Keyboard shortcuts (Ctrl+/)"
                  onClick={() => setKeyboardShortcutsOpen(true)}
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Help
                </button>
              </div>
            </div>

            {/* Content Area with Skip Link */}
            <div className="contentArea">
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              
              <div className="contentCard">
                <ErrorBoundary 
                  FallbackComponent={AdminErrorFallback}
                  onReset={() => window.location.reload()}
                >
                  <Suspense fallback={
                    <div className="contentLoading">
                      <LoadingSpinner size="lg" />
                      <p>Loading page content...</p>
                    </div>
                  }>
                    <Outlet context={{ 
                      setHasUnsavedChanges, 
                      isMobile, 
                      isTablet,
                      isOnline,
                      user
                    }} />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          </main>
        </div>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="mobileOverlay"
            onClick={closeSidebar}
            role="button"
            tabIndex="0"
            aria-label="Close sidebar"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closeSidebar();
              }
            }}
          />
        )}

        {/* Lazy-loaded components */}
        <Suspense fallback={null}>
          {keyboardShortcutsOpen && (
            <KeyboardShortcuts 
              isOpen={keyboardShortcutsOpen}
              onClose={() => setKeyboardShortcutsOpen(false)}
            />
          )}
          
          <NotificationCenter user={user} />
        </Suspense>

        {/* Focus trap for accessibility */}
        <div 
          className="focus-trap"
          tabIndex={0}
          onFocus={() => {
            const firstFocusable = document.querySelector('.sidebar-nav a, .header button, .main-content [tabindex]:not([tabindex="-1"])');
            firstFocusable?.focus();
          }}
        />
      </div>
    </ErrorBoundary>
  );
};

// Enhanced helper functions with better route mapping
const getPageTitle = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const route = segments[segments.length - 1] || 'dashboard';
  
  const titleMap = {
    'dashboard': 'Dashboard Overview',
    'members': 'Member Management',
    'groups': 'Ministry Groups',
    'pledges': 'Pledge & Donations',
    'reports': 'Reports & Analytics',
    'settings': 'System Settings',
    'events': 'Event Management',
    'profile': 'User Profile',
    'notifications': 'Notifications',
    'help': 'Help Center'
  };
  
  return titleMap[route] || 'Admin Panel';
};

const getPageDescription = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const route = segments[segments.length - 1] || 'dashboard';
  
  const descriptionMap = {
    'dashboard': 'Monitor church activities and key metrics',
    'members': 'Manage member records, profiles, and information',
    'groups': 'Organize ministry groups and small group management',
    'pledges': 'Track financial commitments and donation management',
    'reports': 'Generate comprehensive reports and view analytics',
    'settings': 'Configure system preferences and administrative options',
    'events': 'Plan and manage church events and activities',
    'profile': 'Manage your account settings and preferences',
    'notifications': 'View and manage system notifications',
    'help': 'Get help and access documentation'
  };
  
  return descriptionMap[route] || 'Administrative interface for church management';
};

// Add display name for debugging
AdminLayout.displayName = 'AdminLayout';

export default React.memo(AdminLayout);