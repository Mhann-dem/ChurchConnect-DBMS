import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';

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
    'login': 'Login'
  };

  const generateBreadcrumbs = () => {
    if (pathnames.length === 0) return null;

    return pathnames.map((pathname, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      const displayName = breadcrumbNameMap[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);

      return (
        <React.Fragment key={routeTo}>
          <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
          {isLast ? (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
              {displayName}
            </span>
          ) : (
            <Link 
              to={routeTo} 
              className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150 capitalize"
            >
              {displayName}
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
      className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400" 
      aria-label="Breadcrumb"
    >
      <Link 
        to="/admin/dashboard" 
        className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150"
        title="Go to Dashboard"
      >
        <HomeIcon className="h-4 w-4" />
        <span className="ml-1 font-medium">Dashboard</span>
      </Link>
      {generateBreadcrumbs()}
    </nav>
  );
};

export default Breadcrumbs;