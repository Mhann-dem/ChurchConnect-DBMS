import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';
import { 
  UsersIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  CogIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbNameMap = {
    'admin': 'Admin',
    'dashboard': 'Dashboard',
    'members': 'Members',
    'groups': 'Groups',
    'pledges': 'Pledges',
    'reports': 'Reports',
    'settings': 'Settings',
    'form': 'Member Registration',
    'help': 'Help Center',
    'login': 'Login',
    'new': 'New',
    'edit': 'Edit',
    'view': 'View'
  };

  const breadcrumbIconMap = {
    'admin': HomeIcon,
    'dashboard': ChartBarIcon,
    'members': UsersIcon,
    'groups': UserGroupIcon,
    'pledges': CurrencyDollarIcon,
    'reports': DocumentChartBarIcon,
    'settings': CogIcon,
    'help': QuestionMarkCircleIcon,
    'form': UserIcon
  };

  const breadcrumbDescriptionMap = {
    'admin': 'Administrative functions',
    'dashboard': 'System overview & analytics',
    'members': 'Church member management',
    'groups': 'Ministry & small groups',
    'pledges': 'Donations & financial tracking',
    'reports': 'Analytics & insights',
    'settings': 'System configuration',
    'help': 'Support & assistance',
    'form': 'Register new members'
  };

  const generateBreadcrumbs = () => {
    if (pathnames.length === 0) return null;

    return pathnames.map((pathname, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      const displayName = breadcrumbNameMap[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);
      const Icon = breadcrumbIconMap[pathname];
      const description = breadcrumbDescriptionMap[pathname];

      return (
        <React.Fragment key={routeTo}>
          <ChevronRightIcon className="h-4 w-4 text-slate-400 mx-3 flex-shrink-0" />
          {isLast ? (
            <div className="flex items-center space-x-3">
              {Icon && (
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm">
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {displayName}
                </span>
                {description && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
                    {description}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <Link 
              to={routeTo} 
              className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all duration-200 group rounded-lg p-1"
            >
              {Icon && (
                <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-blue-50 dark:bg-slate-700 dark:group-hover:bg-blue-900/30 transition-colors duration-200">
                  <Icon className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400" />
                </div>
              )}
              <span className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {displayName}
              </span>
            </Link>
          )}
        </React.Fragment>
      );
    });
  };

  // Don't show breadcrumbs on the dashboard home page
  if (pathnames.length === 0 || (pathnames.length === 2 && pathnames[1] === 'dashboard')) {
    return null;
  }

  return (
    <nav 
      className="flex items-center text-sm" 
      aria-label="Breadcrumb"
    >
      {/* Enhanced Home/Dashboard Link */}
      <Link 
        to="/admin/dashboard" 
        className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all duration-200 group rounded-lg p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        title="Go to Dashboard"
      >
        <div className="p-1.5 rounded-lg bg-blue-50 group-hover:bg-blue-100 dark:bg-blue-900/30 dark:group-hover:bg-blue-800/50 transition-colors duration-200">
          <HomeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">Dashboard</span>
      </Link>
      
      {/* Breadcrumb Items */}
      {generateBreadcrumbs()}
      
      {/* Current Page Context - Show on larger screens */}
      {pathnames.length > 1 && breadcrumbDescriptionMap[pathnames[pathnames.length - 1]] && (
        <div className="hidden lg:flex items-center ml-6 pl-6 border-l border-slate-200 dark:border-slate-600">
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600">
            {breadcrumbDescriptionMap[pathnames[pathnames.length - 1]]}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Breadcrumbs;