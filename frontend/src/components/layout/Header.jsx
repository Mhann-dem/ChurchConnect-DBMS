// src/components/layout/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Navigation } from './Navigation';
import styles from './Layout.module.css';

const Header = ({ isAdmin = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div className={styles.headerLeft}>
          <Link to={isAdmin ? '/admin/dashboard' : '/'} className={styles.logo}>
            <img src="/assets/images/logo.png" alt="ChurchConnect" />
            <span>ChurchConnect</span>
          </Link>
        </div>

        <div className={styles.headerCenter}>
          {!isAdmin && <Navigation />}
        </div>

        <div className={styles.headerRight}>
          {isAdmin && user ? (
            <div className={styles.adminActions}>
              <span className={styles.welcomeText}>Welcome, {user.firstName}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </div>
          ) : (
            !isAdmin && (
              <div className={styles.publicActions}>
                <Link to="/admin/login" className={styles.adminLink}>
                  Admin Login
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 
