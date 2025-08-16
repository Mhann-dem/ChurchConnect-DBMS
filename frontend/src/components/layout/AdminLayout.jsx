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
      
      // Auto-collapse on smaller desktop screens
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1280) {
        setIsCollapsed(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-md flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold">CC</span>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-gray-50 ${settings?.theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar - Fixed positioning for desktop, mobile overlay for mobile */}
      <div className={`
        ${isMobile ? 'fixed' : 'fixed lg:relative'} 
        inset-y-0 left-0 z-30 
        ${isCollapsed && !isMobile ? 'w-16' : 'w-60'}
        bg-white border-r border-gray-200 shadow-sm
        transition-all duration-200 ease-in-out
        ${isMobile 
          ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full')
          : 'translate-x-0'
        }
        h-screen overflow-hidden
      `}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
          onCollapseChange={handleSidebarCollapse}
        />
      </div>

      {/* Main Content Area - Flex-grow to take remaining space */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <Header 
            onMenuClick={toggleSidebar}
            user={user}
            sidebarOpen={sidebarOpen}
            isAdmin={true}
          />
        </div>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <div className="mb-6">
              <Breadcrumbs />
            </div>

            {/* Page Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default AdminLayout;