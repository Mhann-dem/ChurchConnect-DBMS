// src/components/layout/Breadcrumbs.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';

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
      const displayName = breadcrumbNameMap[pathname] || pathname;

      return (
        <React.Fragment key={routeTo}>
          <span className={styles.breadcrumbSeparator}>/</span>
          {isLast ? (
            <span className={styles.breadcrumbCurrent}>{displayName}</span>
          ) : (
            <Link to={routeTo} className={styles.breadcrumbLink}>
              {displayName}
            </Link>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <Link to="/" className={styles.breadcrumbLink}>
        Home
      </Link>
      {generateBreadcrumbs()}
    </nav>
  );
};

export default Breadcrumbs; 
