// ============================================================================
// PAGES/PUBLIC/NOTFOUNDPAGE.JSX
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout';
import { Button } from '../../components/ui';
import styles from './PublicPages.module.css';

const NotFoundPage = () => {
  return (
    <PublicLayout>
      <div className={styles.notFoundPage}>
        <div className={styles.container}>
          <div className={styles.notFoundContent}>
            <div className={styles.notFoundIcon}>
              <span className={styles.errorCode}>404</span>
            </div>
            
            <h1 className={styles.notFoundTitle}>Page Not Found</h1>
            
            <p className={styles.notFoundDescription}>
              Sorry, the page you're looking for doesn't exist or has been moved.
            </p>
            
            <div className={styles.notFoundActions}>
              <Link to="/">
                <Button variant="primary">Go to Home</Button>
              </Link>
              <Link to="/register">
                <Button variant="outline">Register</Button>
              </Link>
            </div>
            
            <div className={styles.helpLinks}>
              <p>Looking for something specific?</p>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/register">Member Registration</Link></li>
                <li><Link to="/admin/login">Admin Login</Link></li>
                <li><Link to="/help">Help Center</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default NotFoundPage;