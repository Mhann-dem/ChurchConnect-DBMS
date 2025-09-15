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

// Enhanced Error Boundary Component
const AdminErrorFallback = ({ error, resetError }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.error('Admin Layout Error:', error);
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '32px'
        }}>
          ⚠️
        </div>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          Something went wrong
        </h2>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '32px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          We're sorry, but something unexpected happened in the admin panel.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details style={{
            background: '#f3f4f6',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
              Error Details (Development)
            </summary>
            <pre style={{
              fontSize: '12px',
              color: '#ef4444',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {error?.message}
            </pre>
          </details>
        )}
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleRetry}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Try Again
          </button>
          <button 
            onClick={handleGoToDashboard}
            style={{
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced loading component
const AdminLoadingScreen = ({ message = 'Loading ChurchConnect...' }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '32px'
    }}>
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2
        }}>
          CC
        </div>
        
        {/* Animated rings */}
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              animation: `pulse 2s infinite ${i * 0.5}s`,
              transform: `scale(${1 + i * 0.2})`
            }}
          />
        ))}
      </div>
      
      <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ChurchConnect
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#94a3b8',
          marginBottom: '16px'
        }}>
          Administrative Dashboard
        </p>
        
        <div style={{
          width: '200px',
          height: '4px',
          background: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: '2px',
            animation: 'progress 2s infinite'
          }} />
        </div>
        
        <span style={{
          fontSize: '14px',
          color: '#64748b'
        }}>
          {message}
        </span>
      </div>
    </div>
    
    <style jsx>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      
      @keyframes progress {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

// Main AdminLayout Component with Fixed Layout
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
    
    if (mobile && sidebarOpen) {
      setSidebarOpen(false);
    }
    
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

  // Permission check
  if (!canAccessAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // Calculate sidebar width
  const sidebarWidth = isCollapsed ? 72 : 280;
  const effectiveWidth = isMobile ? 0 : (isTablet ? 64 : sidebarWidth);

  return (
    <ErrorBoundary FallbackComponent={AdminErrorFallback}>
      <div style={{
        display: 'flex',
        height: '100vh',
        background: '#f8fafc',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Offline indicator */}
        {!isOnline && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, #f59e0b, #d97706)',
            color: 'white',
            padding: '8px 16px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 9998
          }}>
            You are offline. Some features may be limited.
          </div>
        )}

        {/* Sidebar Container */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: isMobile && !sidebarOpen ? `-${sidebarWidth}px` : 0,
          height: '100vh',
          width: `${sidebarWidth}px`,
          zIndex: isMobile ? 1000 : 100,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <Suspense fallback={<div style={{ width: sidebarWidth, height: '100vh', background: '#1e293b' }} />}>
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
        <div style={{
          flex: 1,
          marginLeft: effectiveWidth,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}>
          {/* Header - Overlapping with Sidebar */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: effectiveWidth,
            right: 0,
            height: '80px',
            zIndex: 90,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
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
          </div>

          {/* Main Content */}
          <main style={{
            flex: 1,
            paddingTop: '80px', // Account for fixed header
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Breadcrumbs */}
            <div style={{
              padding: '16px 24px 0',
              background: 'white'
            }}>
              <Breadcrumbs currentPath={location.pathname} />
            </div>

            {/* Page Header with Context */}
            <div style={{
              padding: '24px',
              background: 'white',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    {getPageTitle(location.pathname)}
                  </h1>
                  <p style={{
                    fontSize: '16px',
                    color: '#6b7280'
                  }}>
                    {getPageDescription(location.pathname)}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setKeyboardShortcutsOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.color = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.color = '#374151';
                    }}
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
            </div>

            {/* Content Area */}
            <div style={{
              flex: 1,
              padding: '24px',
              background: '#f8fafc'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                minHeight: 'calc(100vh - 200px)',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}>
                <ErrorBoundary 
                  FallbackComponent={AdminErrorFallback}
                  onReset={() => window.location.reload()}
                >
                  <Suspense fallback={
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '400px',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #e5e7eb',
                        borderTop: '3px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading page content...</p>
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
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              cursor: 'pointer'
            }}
            onClick={closeSidebar}
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
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </ErrorBoundary>
  );
};

// Helper functions
const getPageTitle = (pathname) => {
  const segments = pathname.split('/').filter(Boolean);
  const route = segments[segments.length - 1] || 'dashboard';
  
  const titleMap = {
    'dashboard': 'Dashboard Overview',
    'members': 'Member Management',
    'families': 'Family Management',
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
    'families': 'Manage family units and household information',
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

AdminLayout.displayName = 'AdminLayout';

export default React.memo(AdminLayout);