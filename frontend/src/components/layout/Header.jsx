// src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Navigation } from './Navigation';
import styles from './Layout.module.css';
import logo from '../../assets/images/logo.png';

const Header = ({ isAdmin = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Navigation links for different user types
  const getNavigationLinks = () => {
    if (isAdmin) {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
        { name: 'Members', path: '/admin/members', icon: '👥' },
        { name: 'Groups', path: '/admin/groups', icon: '🏢' },
        { name: 'Pledges', path: '/admin/pledges', icon: '💰' },
        { name: 'Reports', path: '/admin/reports', icon: '📈' },
        { name: 'Settings', path: '/admin/settings', icon: '⚙️' }
      ];
    } else {
      return [
        { name: 'Home', path: '/', icon: '🏠' },
        { name: 'Member Registration', path: '/form', icon: '📝' },
        { name: 'Events', path: '/events', icon: '📅' },
        { name: 'Ministries', path: '/ministries', icon: '🙏' },
        { name: 'Contact', path: '/contact', icon: '📧' }
      ];
    }
  };

  const navigationLinks = getNavigationLinks();

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''} ${isAdmin ? styles.admin : styles.public}`}>
        <div className={styles.headerContainer}>
          {/* Brand/Logo Section */}
          <div className={styles.brandContainer}>
            <Link 
              to={isAdmin ? '/admin/dashboard' : '/'} 
              className={styles.logoLink}
              onClick={closeMobileMenu}
            >
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

          {/* Desktop Navigation */}
          {!isAdmin && (
            <nav className={styles.mainNav}>
              <Navigation />
            </nav>
          )}

          {/* Admin Dashboard Link - Only show when admin is logged in */}
          {user && isAdmin && (
            <nav className={styles.adminNav}>
              <Link 
                to="/admin/dashboard" 
                className={`${styles.adminDashboardLink} ${
                  location.pathname === '/admin/dashboard' ? styles.active : ''
                }`}
              >
                <svg className={styles.dashboardIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9"></rect>
                  <rect x="14" y="3" width="7" height="5"></rect>
                  <rect x="14" y="12" width="7" height="9"></rect>
                  <rect x="3" y="16" width="7" height="5"></rect>
                </svg>
                <span>Admin Dashboard</span>
              </Link>
            </nav>
          )}

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuBtn}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>

          {/* User Section */}
          <div className={styles.userSection}>
            {user ? (
              <div className={styles.userMenu}>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.firstName} 
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span className={styles.avatarText}>
                        {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className={styles.userDetails}>
                    <span className={styles.userName}>
                      Welcome, {user.firstName}
                    </span>
                    {user.role && (
                      <span className={styles.userRole}>
                        {user.role}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className={styles.logoutButton}
                  aria-label="Logout"
                >
                  <svg className={styles.logoutIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
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
                </div>
              )
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.open : ''}`}
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <div className={styles.mobileMenuBrand}>
            <img 
              src={logo} 
              alt="ChurchConnect" 
              className={styles.mobileMenuLogo}
              width="32"
              height="32"
            />
            <div className={styles.mobileMenuTitle}>
              <span className={styles.mobileMenuTitleText}>ChurchConnect</span>
              <span className={styles.mobileMenuSubtitle}>
                {isAdmin ? 'Admin Portal' : 'Member Portal'}
              </span>
            </div>
          </div>
          <button
            className={styles.mobileCloseBtn}
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className={styles.mobileMenuNav}>
          {/* Admin Dashboard - Highlighted for admin users */}
          {user && isAdmin && (
            <div className={styles.adminDashboardSection}>
              <Link
                to="/admin/dashboard"
                className={`${styles.adminDashboardMobileLink} ${
                  location.pathname === '/admin/dashboard' ? styles.active : ''
                }`}
                onClick={closeMobileMenu}
              >
                <svg className={styles.mobileMenuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9"></rect>
                  <rect x="14" y="3" width="7" height="5"></rect>
                  <rect x="14" y="12" width="7" height="9"></rect>
                  <rect x="3" y="16" width="7" height="5"></rect>
                </svg>
                <span className={styles.mobileMenuText}>Admin Dashboard</span>
                <svg className={styles.mobileMenuArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </Link>
              <div className={styles.menuDivider}></div>
            </div>
          )}

          <ul className={styles.mobileMenuList}>
            {navigationLinks.map((link, index) => (
              <li key={link.path} className={styles.mobileMenuItem}>
                <Link
                  to={link.path}
                  className={`${styles.mobileMenuLink} ${
                    location.pathname === link.path ? styles.active : ''
                  }`}
                  onClick={closeMobileMenu}
                >
                  <span className={styles.mobileMenuIcon}>{link.icon}</span>
                  <span className={styles.mobileMenuText}>{link.name}</span>
                  <svg 
                    className={styles.mobileMenuArrow} 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Menu Footer */}
        <div className={styles.mobileMenuFooter}>
          {user ? (
            <div className={styles.mobileUserSection}>
              <div className={styles.mobileUserInfo}>
                <div className={styles.mobileUserAvatar}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.firstName} />
                  ) : (
                    <span>{user.firstName?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className={styles.mobileUserDetails}>
                  <span className={styles.mobileUserName}>{user.firstName} {user.lastName}</span>
                  <span className={styles.mobileUserRole}>{user.role || 'Member'}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className={styles.mobileLogoutBtn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          ) : (
            !isAdmin && (
              <div className={styles.mobileAuthSection}>
                <Link 
                  to="/admin/login" 
                  className={styles.mobileAdminLink}
                  onClick={closeMobileMenu}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7l-10-5z" />
                  </svg>
                  Admin Portal
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default Header;