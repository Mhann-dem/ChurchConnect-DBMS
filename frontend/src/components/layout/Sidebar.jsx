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
    badge: null
  },
  {
    name: 'Members',
    href: '/admin/members',
    icon: UsersIcon,
    permission: 'view_members',
    badge: null
  },
  {
    name: 'Groups',
    href: '/admin/groups',
    icon: UserGroupIcon,
    permission: 'view_groups',
    badge: null
  },
  {
    name: 'Pledges',
    href: '/admin/pledges',
    icon: CurrencyDollarIcon,
    permission: 'view_pledges',
    badge: null
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: DocumentChartBarIcon,
    permission: 'view_reports',
    badge: null
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: CogIcon,
    permission: 'admin_settings',
    badge: null
  }
];

export const Sidebar = ({ isOpen, onClose, onCollapseChange }) => {
  const { logout, hasPermission, user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        setIsCollapsed(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const filteredNavigationItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-sm">CC</span>
            </div>
            <span className="ml-2 text-sm font-semibold text-gray-900">ChurchConnect</span>
          </div>
        )}
        
        {isCollapsed && !isMobile && (
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center mx-auto">
            <span className="text-white font-semibold text-sm">CC</span>
          </div>
        )}
        
        <div className="flex items-center">
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronLeftIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          {isMobile && (
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation - Scrollable middle section */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${isCollapsed && !isMobile ? 'justify-center' : ''}
                  `}
                  onClick={() => isMobile && onClose()}
                  title={isCollapsed && !isMobile ? item.name : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {(!isCollapsed || isMobile) && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                  {item.badge && (!isCollapsed || isMobile) && (
                    <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Help Link */}
      <div className="px-3 py-2 border-t border-gray-200 flex-shrink-0">
        <NavLink
          to="/help"
          className={`
            group flex items-center px-3 py-2 text-sm font-medium rounded-md
            text-gray-600 hover:bg-gray-50 hover:text-gray-900
            ${isCollapsed && !isMobile ? 'justify-center' : ''}
          `}
          title={isCollapsed && !isMobile ? 'Help' : ''}
        >
          <QuestionMarkCircleIcon className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && (
            <span className="ml-3">Help</span>
          )}
        </NavLink>
      </div>

      {/* User Section - Fixed at bottom */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        {(!isCollapsed || isMobile) && user && (
          <div className="flex items-center px-3 py-2 mb-2">
            <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-xs font-medium">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="ml-2 min-w-0 flex-1">
              <div className="text-xs font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.role || 'Admin'}
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
            text-gray-700 hover:bg-gray-100 hover:text-gray-900
            ${isCollapsed && !isMobile ? 'justify-center' : ''}
          `}
          title={isCollapsed && !isMobile ? 'Logout' : ''}
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && (
            <span className="ml-3">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;