import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import useAuth from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

// Error Boundary Component
class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="errorBoundary">
          <div className="errorContent">
            <div className="errorIcon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened in the admin panel.</p>
            <details className="errorDetails">
              <summary>Error Details</summary>
              <pre>{this.state.error && this.state.error.toString()}</pre>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>
            <div className="errorActions">
              <button 
                onClick={() => window.location.reload()} 
                className="errorButton primary"
              >
                Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/admin/dashboard'} 
                className="errorButton secondary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { user, isLoading, hasPermission } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  // Memoize permission check
  const canAccessAdmin = useMemo(() => {
    return user && (
      user.role === 'admin' || 
      user.role === 'super_admin' || 
      hasPermission('access_admin')
    );
  }, [user, hasPermission]);

  // Enhanced responsive detection
  const checkScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const mobile = width < 768;
    const tablet = width >= 768 && width < 1024;
    const desktop = width >= 1024;

    setIsMobile(mobile);
    setIsTablet(tablet);
    
    if (mobile && sidebarOpen) {
      setSidebarOpen(false);
    }
    
    // Smart auto-collapse logic
    if (tablet) {
      setIsCollapsed(true);
    } else if (desktop && width >= 1400) {
      setIsCollapsed(false);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [checkScreenSize]);

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle sidebar with Ctrl+B
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        if (!isMobile) {
          setIsCollapsed(!isCollapsed);
        } else {
          setSidebarOpen(!sidebarOpen);
        }
      }
      
      // Close sidebar with Escape
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed, sidebarOpen, isMobile]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleSidebarCollapse = useCallback((collapsed) => {
    setIsCollapsed(collapsed);
  }, []);

  // Loading state with enhanced spinner
  if (isLoading) {
    return (
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
          
          <div className="loadingSpinner">
            <div className="spinner"></div>
          </div>
          
          <div className="loadingText">
            <h1>Loading ChurchConnect</h1>
            <p>Administrative Dashboard</p>
            <div className="loadingDots">
              <span className="dot dot1"></span>
              <span className="dot dot2"></span>
              <span className="dot dot3"></span>
            </div>
            <div className="loadingProgress">
              <div className="progressBar">
                <div className="progressFill"></div>
              </div>
              <span className="progressText">Preparing your workspace...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Permission check - redirect if user doesn't have admin access
  if (!canAccessAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const sidebarWidth = isCollapsed ? 72 : 280;
  const tabletSidebarWidth = isTablet ? 64 : sidebarWidth;

  return (
    <AdminErrorBoundary>
      <div 
        className={`adminLayout ${settings?.theme === 'dark' ? 'dark' : ''} ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`}
        data-sidebar-open={sidebarOpen}
        data-sidebar-collapsed={isCollapsed}
      >
        {/* Enhanced Sidebar */}
        <div 
          className={`sidebarContainer ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'open' : ''}`}
          style={{
            '--sidebar-width': `${isTablet ? tabletSidebarWidth : sidebarWidth}px`
          }}
        >
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={closeSidebar}
            onCollapseChange={handleSidebarCollapse}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </div>

        {/* Main Application Area */}
        <div 
          className={`mainApplication ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`} 
          style={{
            marginLeft: isMobile ? 0 : `${isTablet ? tabletSidebarWidth : sidebarWidth}px`,
            transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          
          {/* Enhanced Header */}
          <div className="headerContainer">
            <Header 
              onMenuClick={toggleSidebar}
              user={user}
              sidebarOpen={sidebarOpen}
              isAdmin={true}
              isMobile={isMobile}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* Enhanced Main Content */}
          <main 
            className="mainContent"
            role="main"
            aria-label="Admin dashboard content"
          >
            <div className="contentWrapper">
              
              {/* Enhanced Breadcrumbs */}
              <div className="breadcrumbsContainer">
                <div className="breadcrumbsCard">
                  <Breadcrumbs />
                </div>
              </div>

              {/* Page Title and Actions */}
              <div className="pageHeader">
                <div className="pageTitleSection">
                  <h1 className="pageTitle">
                    {getPageTitle(location.pathname)}
                  </h1>
                  <p className="pageDescription">
                    {getPageDescription(location.pathname)}
                  </p>
                </div>
                
                {/* Quick Actions */}
                <div className="pageActions">
                  <button 
                    className="actionButton secondary"
                    title="Keyboard shortcuts: Ctrl+B to toggle sidebar"
                    onClick={() => {/* Open help modal */}}
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

              {/* Enhanced Content Area with Error Boundary */}
              <div className="contentArea">
                <div className="contentCard">
                  <AdminErrorBoundary>
                    <Outlet context={{ 
                      setHasUnsavedChanges, 
                      isMobile, 
                      isTablet 
                    }} />
                  </AdminErrorBoundary>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Enhanced Mobile Overlay */}
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

        {/* Keyboard Shortcuts Help */}
        <div className="keyboardShortcuts" aria-hidden="true">
          <div className="shortcutHint">
            Press <kbd>Ctrl</kbd> + <kbd>B</kbd> to toggle sidebar
          </div>
        </div>
      </div>
    </AdminErrorBoundary>
  );
};

// Helper functions for page titles and descriptions
const getPageTitle = (pathname) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  const titleMap = {
    'dashboard': 'Dashboard',
    'members': 'Members',
    'groups': 'Groups',
    'pledges': 'Pledges',
    'reports': 'Reports',
    'settings': 'Settings',
    'events': 'Events',
    'new': 'Create New',
    'edit': 'Edit',
    'view': 'View Details'
  };
  
  return titleMap[lastSegment] || 'Admin Panel';
};

const getPageDescription = (pathname) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  const descriptionMap = {
    'dashboard': 'Overview of your church management system',
    'members': 'Manage church members and their information',
    'groups': 'Organize and manage ministry groups',
    'pledges': 'Track donations and financial commitments',
    'reports': 'Generate insights and analytics',
    'settings': 'Configure system preferences and options',
    'events': 'Manage church events and activities'
  };
  
  return descriptionMap[lastSegment] || 'Administrative interface';
};

export default AdminLayout;