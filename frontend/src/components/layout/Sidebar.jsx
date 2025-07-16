import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  DocumentReportIcon, 
  CogIcon,
  QuestionMarkCircleIcon,
  LogoutIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: HomeIcon,
    permission: null
  },
  {
    name: 'Members',
    href: '/admin/members',
    icon: UsersIcon,
    permission: 'view_members'
  },
  {
    name: 'Groups',
    href: '/admin/groups',
    icon: UserGroupIcon,
    permission: 'view_groups'
  },
  {
    name: 'Pledges',
    href: '/admin/pledges',
    icon: CurrencyDollarIcon,
    permission: 'view_pledges'
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: DocumentReportIcon,
    permission: 'view_reports'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: CogIcon,
    permission: 'admin_settings'
  }
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { logout, hasPermission, user } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const filteredNavigationItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-44'
      } lg:translate-x-0`}>
        
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600 text-white">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="ChurchConnect" 
              className="h-8 w-8 mr-2"
            />
            {isOpen && <span className="text-xl font-bold">ChurchConnect</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {filteredNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                             (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  `}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {isOpen && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {/* Help */}
            <NavLink
              to="/help"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
            >
              <QuestionMarkCircleIcon className="h-5 w-5 mr-3" />
              {isOpen && <span>Help</span>}
            </NavLink>

            {/* User Info & Logout */}
            {isOpen && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-3">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <div>
                    <div className="font-medium">{user?.first_name} {user?.last_name}</div>
                    <div className="text-xs text-gray-500">{user?.role}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900 rounded-lg"
                >
                  <LogoutIcon className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;