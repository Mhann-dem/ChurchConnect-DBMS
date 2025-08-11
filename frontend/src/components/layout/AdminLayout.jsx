import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { Sidebar } from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import useAuth from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, isLoading } = useAuth();
  const { settings } = useSettings();

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile when screen size changes
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleSidebarCollapse = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  // Add loading state to prevent premature rendering
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Calculate main content margin based on sidebar state
  const getMainContentClass = () => {
    if (isMobile) {
      return 'lg:ml-0'; // No margin on mobile
    }
    return isCollapsed ? 'lg:ml-16' : 'lg:ml-64';
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${settings?.theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        onCollapseChange={handleSidebarCollapse}
      />

      {/* Main Content Wrapper */}
      <div className={`transition-all duration-300 ease-in-out ${getMainContentClass()}`}>
        {/* Header */}
        <Header 
          onMenuClick={toggleSidebar}
          user={user}
          sidebarOpen={sidebarOpen}
          isAdmin={true}
        />

        {/* Main Content Area */}
        <main className="min-h-screen">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <div className="mb-6">
              <Breadcrumbs />
            </div>

            {/* Page Content */}
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
};

export default AdminLayout;