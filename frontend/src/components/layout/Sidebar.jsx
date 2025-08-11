import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  DocumentChartBarIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: HomeIcon,
    permission: null,
    description: 'Overview and stats'
  },
  {
    name: 'Members',
    href: '/admin/members',
    icon: UsersIcon,
    permission: 'view_members',
    description: 'Manage church members'
  },
  {
    name: 'Groups',
    href: '/admin/groups',
    icon: UserGroupIcon,
    permission: 'view_groups',
    description: 'Ministry groups'
  },
  {
    name: 'Pledges',
    href: '/admin/pledges',
    icon: CurrencyDollarIcon,
    permission: 'view_pledges',
    description: 'Financial pledges'
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: DocumentChartBarIcon,
    permission: 'view_reports',
    description: 'Analytics and reports'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: CogIcon,
    permission: 'admin_settings',
    description: 'System configuration'
  }
];

export const Sidebar = ({ isOpen, onClose, onCollapseChange }) => {
  const { logout, hasPermission, user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onCollapseChange) {
      onCollapseChange(newCollapsed);
    }
  };

  const filteredNavigationItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  // Calculate sidebar classes
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
    bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 dark:border-gray-700
    ${isCollapsed && !isMobile ? 'w-16' : 'w-64'}
    ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
  `;

  const showLabels = !isCollapsed || isMobile;

  return (
    <div className={sidebarClasses}>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center min-w-0">
          <img 
            src="/assets/images/logo.png" 
            alt="ChurchConnect" 
            className="h-8 w-8 flex-shrink-0"
            onError={(e) => {
              e.target.src = '/assets/images/icons/church.svg';
            }}
          />
          {showLabels && (
            <span className="ml-3 text-lg font-bold truncate">
              ChurchConnect
            </span>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-1">
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className="p-1 hover:bg-blue-500 rounded-md transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </button>
          )}
          
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-500 rounded-md transition-colors"
              title="Close sidebar"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {filteredNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
                         (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive: linkActive }) => `
                group flex items-center px-3 py-3 text-sm font-medium rounded-lg 
                transition-all duration-200 relative
                ${isActive || linkActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }
                ${isCollapsed && !isMobile ? 'justify-center' : ''}
              `}
              onClick={() => {
                if (isMobile) {
                  onClose();
                }
              }}
              title={isCollapsed && !isMobile ? item.name : ''}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${showLabels ? 'mr-3' : ''}`} />
              
              {showLabels && (
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{item.name}</span>
                  {item.description && !isCollapsed && (
                    <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.description}
                    </span>
                  )}
                </div>
              )}
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Help Section */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
        <NavLink
          to="/help"
          className={`
            group flex items-center px-3 py-3 text-sm font-medium rounded-lg
            text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800
            transition-all duration-200
            ${isCollapsed && !isMobile ? 'justify-center' : ''}
          `}
          title={isCollapsed && !isMobile ? 'Help' : ''}
        >
          <QuestionMarkCircleIcon className={`h-5 w-5 flex-shrink-0 ${showLabels ? 'mr-3' : ''}`} />
          {showLabels && <span>Help & Support</span>}
        </NavLink>
      </div>

      {/* User Section */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
        {showLabels && user && (
          <div className="flex items-center px-3 py-3 mb-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 flex-shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role}
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`
            group w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg
            text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20
            transition-all duration-200
            ${isCollapsed && !isMobile ? 'justify-center' : ''}
          `}
          title={isCollapsed && !isMobile ? 'Logout' : ''}
        >
          <ArrowLeftOnRectangleIcon className={`h-5 w-5 flex-shrink-0 ${showLabels ? 'mr-3' : ''}`} />
          {showLabels && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;