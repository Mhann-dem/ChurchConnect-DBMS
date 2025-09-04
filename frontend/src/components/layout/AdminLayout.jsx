import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import useAuth from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, isLoading } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      
      // Smart auto-collapse based on screen size
      if (window.innerWidth < 1200 && window.innerWidth >= 1024) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1400) {
        setIsCollapsed(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleSidebarCollapse = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  if (isLoading) {
    return (
      <div className="loadingContainer">
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
          </div>
        </div>
      </div>
    );
  }

  const sidebarWidth = isCollapsed ? 72 : 280;

  return (
    <div className={`adminLayout ${settings?.theme === 'dark' ? 'dark' : ''}`}>
      {/* Enhanced Sidebar */}
      <div className={`sidebarContainer ${isMobile ? 'mobile' : ''} ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
          onCollapseChange={handleSidebarCollapse}
        />
      </div>

      {/* Main Application Area */}
      <div className={`mainApplication ${isMobile ? 'mobile' : ''}`} style={{
        marginLeft: isMobile ? 0 : `${sidebarWidth}px`
      }}>
        
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
        <main className="mainContent">
          <div className="contentWrapper">
            
            {/* Enhanced Breadcrumbs */}
            <div className="breadcrumbsContainer">
              <div className="breadcrumbsCard">
                <Breadcrumbs />
              </div>
            </div>

            {/* Enhanced Content Area */}
            <div className="contentArea">
              <div className="contentCard">
                <Outlet />
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
        />
      )}
    </div>
  );
};

export default AdminLayout;