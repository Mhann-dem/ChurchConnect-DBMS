import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import Footer from './Footer';
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
      if (window.innerWidth < 1400 && window.innerWidth >= 1024) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          {/* Enhanced Loading Logo */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <span className="text-white font-black text-3xl">CC</span>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-30 animate-ping"></div>
          </div>
          
          {/* Enhanced Loading Spinner */}
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-indigo-400 mx-auto animate-spin" style={{ animationDelay: '0.15s', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-2 rounded-full h-12 w-12 border-4 border-transparent border-t-purple-400 mx-auto animate-spin" style={{ animationDelay: '0.3s', animationDuration: '2s' }}></div>
          </div>
          
          {/* Enhanced Loading Text */}
          <div className="space-y-3">
            <h1 className="text-white font-bold text-2xl animate-pulse">Loading ChurchConnect</h1>
            <p className="text-blue-300 text-lg font-medium">Administrative Dashboard</p>
            <div className="flex items-center justify-center space-x-1 text-slate-400">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 ${settings?.theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar - Enhanced positioning and styling */}
      <div className={`
        ${isMobile ? 'fixed' : 'fixed lg:relative'} 
        inset-y-0 left-0 z-50 
        ${isCollapsed && !isMobile ? 'w-20' : 'w-80'}
        transition-all duration-300 ease-in-out
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

      {/* Main Content Area - Enhanced layout and styling */}
      <div className={`flex-1 flex flex-col min-h-screen ${
        !isMobile ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-80') : ''
      } transition-all duration-300 ease-in-out`}>
        
        {/* Header - Enhanced with better positioning */}
        <div className="sticky top-0 z-40">
          <Header 
            onMenuClick={toggleSidebar}
            user={user}
            sidebarOpen={sidebarOpen}
            isAdmin={true}
            isMobile={isMobile}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Main Content - Enhanced scrolling and spacing */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-6 py-8 sm:px-8 lg:px-10 max-w-7xl">
              {/* Enhanced Breadcrumbs */}
              <div className="mb-6">
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200/80 hover:shadow-xl transition-all duration-200">
                  <Breadcrumbs />
                </div>
              </div>

              {/* Enhanced Page Content Container */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden hover:shadow-3xl transition-all duration-300">
                {/* Content Header with Gradient */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 px-8 py-6 border-b border-gray-200/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Content Area</h2>
                      <p className="text-sm text-gray-600">Manage your church administration efficiently</p>
                    </div>
                  </div>
                </div>
                
                {/* Main Content Body */}
                <div className="p-8 lg:p-10">
                  <Outlet />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Footer for Admin */}
          <div className="mt-auto">
            <Footer isAdmin={true} />
          </div>
        </main>
      </div>

      {/* Enhanced Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-all duration-300"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default AdminLayout;