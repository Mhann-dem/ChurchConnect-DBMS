// src/components/layout/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Navigation } from './Navigation';
import styles from './Layout.module.css';
import logo from '../../assets/images/logo.png';

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
        <div className={styles.brandContainer}>
          <Link to={isAdmin ? '/admin/dashboard' : '/'} className={styles.logoLink}>
            <img 
              src={logo} 
              alt="ChurchConnect" 
              className={styles.logoImg}
              width="40"
              height="40"
            />
            <div className={styles.logoText}>
              <span className={styles.logoPrimary}>Church</span>
              <span className={styles.logoSecondary}>Connect</span>
            </div>
          </Link>
        </div>

        {!isAdmin && (
          <nav className={styles.mainNav}>
            <Navigation />
          </nav>
        )}

        <div className={styles.userSection}>
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>Welcome, {user.firstName}</span>
                {user.avatar && (
                  <img 
                    src={user.avatar} 
                    alt={user.firstName} 
                    className={styles.userAvatar}
                  />
                )}
              </div>
              <button 
                onClick={handleLogout} 
                className={styles.logoutButton}
                aria-label="Logout"
              >
                <svg className={styles.logoutIcon} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 012 2v2h-2V4H5v16h9v-2h2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2h9z" />
                </svg>
                <span className={styles.logoutText}>Logout</span>
              </button>
            </div>
          ) : (
            !isAdmin && (
              <div className={styles.authLinks}>
                <Link 
                  to="/admin/login" 
                  className={styles.adminLoginLink}
                >
                  Admin Portal
                </Link>
                <Link 
                  to="/login" 
                  className={styles.loginLink}
                >
                  Member Login
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