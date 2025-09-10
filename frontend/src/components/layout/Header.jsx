// src/components/layout/Header.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Navigation } from './Navigation';
import styles from './Layout.module.css';
import logo from '../../assets/images/logo.png';

const Header = ({ isAdmin = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [lastAdminPath, setLastAdminPath] = useState('/admin/dashboard');

  // Memoize expensive computations
  const isAdminOnPublicPage = useMemo(() => 
    user && (user.role === 'admin' || user.role === 'super_admin') && 
    !location.pathname.startsWith('/admin'), 
    [user, location.pathname]
  );

  // Remember last admin page visited
  useEffect(() => {
    if (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') {
      setLastAdminPath(location.pathname);
    }
  }, [location.pathname]);

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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleLogout = useCallback(async () => {
    try {
      setIsNavigating(true);
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsNavigating(false);
    }
  }, [logout]);

  const handleAdminDashboardClick = useCallback((e) => {
    e.preventDefault();
    setIsNavigating(true);
    
    // Navigate to last visited admin page or dashboard
    setTimeout(() => {
      navigate(lastAdminPath);
      setIsNavigating(false);
    }, 150);
  }, [navigate, lastAdminPath]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Updated navigation links for different user types - FIXED URLs
  const getNavigationLinks = () => {
    if (isAdmin) {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
        { name: 'Members', path: '/admin/members', icon: '👥' },
        { name: 'Families', path: '/admin/families', icon: '🏠' },
        { name: 'Groups', path: '/admin/groups', icon: '🏢' },
        { name: 'Events', path: '/admin/events', icon: '📅' },
        { name: 'Pledges', path: '/admin/pledges', icon: '💰' },
        { name: 'Reports', path: '/admin/reports', icon: '📈' },
        { name: 'Settings', path: '/admin/settings', icon: '⚙️' }
      ];
    } else {
      return [
        { name: 'Home', path: '/', icon: '🏠' },
        { name: 'Member Registration', path: '/registration', icon: '📝' },
        { name: 'Events', path: '/events', icon: '📅' },
        { name: 'Ministries', path: '/ministries', icon: '🙏' },
        { name: 'Contact', path: '/contact', icon: '📧' }
      ];
    }
  };

  const navigationLinks = getNavigationLinks();

  return (
    <>
      <header 
        className={`${styles.header} ${isScrolled ? styles.scrolled : ''} ${isAdmin ? styles.admin : styles.public}`}
        role="banner"
      >
        <div className={styles.headerContainer}>
          {/* Brand/Logo Section */}
          <div className={styles.brandContainer}>
            <Link 
              to={isAdmin ? '/admin/dashboard' : '/'} 
              className={styles.logoLink}
              onClick={closeMobileMenu}
              aria-label={`Go to ${isAdmin ? 'admin dashboard' : 'homepage'}`}
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
            <nav className={styles.mainNav} role="navigation" aria-label="Main navigation">
              <Navigation />
            </nav>
          )}

          {/* Context Indicator for Admin on Public Site */}
          {isAdminOnPublicPage && (
            <div className={styles.contextIndicator} role="status" aria-live="polite">
              <span className={styles.contextLabel}>Viewing as Public User</span>
              <div className={styles.contextBadge}>Admin Mode</div>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuBtn}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
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
              aria-hidden="true"
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
                {/* Admin Dashboard Button - Show when admin is on public site */}
                {isAdminOnPublicPage && (
                  <button
                    onClick={handleAdminDashboardClick}
                    className={`${styles.adminDashboardButton} ${isNavigating ? styles.loading : ''}`}
                    disabled={isNavigating}
                    aria-label={`Go to admin dashboard${lastAdminPath !== '/admin/dashboard' ? ' (last visited: ' + lastAdminPath.split('/').pop() + ')' : ''}`}
                    title={`Return to ${lastAdminPath === '/admin/dashboard' ? 'Dashboard' : lastAdminPath.split('/').pop()}`}
                  >
                    {isNavigating ? (
                      <div className={styles.loadingSpinner} aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeDasharray="32" 
                            strokeDashoffset="32"
                          >
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              values="0 12 12;360 12 12"
                              dur="1s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        </svg>
                      </div>
                    ) : (
                      <svg className={styles.dashboardIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="9"></rect>
                        <rect x="14" y="3" width="7" height="5"></rect>
                        <rect x="14" y="12" width="7" height="9"></rect>
                        <rect x="3" y="16" width="7" height="5"></rect>
                      </svg>
                    )}
                    <span>Admin Dashboard</span>
                    {lastAdminPath !== '/admin/dashboard' && (
                      <span className={styles.returnPath}>({lastAdminPath.split('/').pop()})</span>
                    )}
                  </button>
                )}

                {/* User Info - Show only when not admin on public site */}
                {!isAdminOnPublicPage && (
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar} role="img" aria-label={`${user.firstName}'s avatar`}>
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={`${user.firstName}'s avatar`} 
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
                )}

                {/* Quick Actions Dropdown for Admins */}
                {(user.role === 'admin' || user.role === 'super_admin') && !isAdminOnPublicPage && (
                  <div className={styles.quickActions}>
                    <button 
                      className={styles.quickActionsBtn}
                      aria-label="Quick admin actions"
                      aria-haspopup="true"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </button>
                  </div>
                )}

                <button 
                  onClick={handleLogout} 
                  className={`${styles.logoutButton} ${isNavigating ? styles.loading : ''}`}
                  disabled={isNavigating}
                  aria-label="Logout from your account"
                >
                  {isNavigating ? (
                    <div className={styles.loadingSpinner} aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeDasharray="32" 
                          strokeDashoffset="32"
                        >
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="0 12 12;360 12 12"
                            dur="1s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      </svg>
                    </div>
                  ) : (
                    <svg className={styles.logoutIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16,17 21,12 16,7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  )}
                  <span className={styles.logoutText}>Logout</span>
                </button>
              </div>
            ) : (
              !isAdmin && (
                <div className={styles.authLinks}>
                  <Link 
                    to="/admin/login" 
                    className={styles.adminLoginLink}
                    aria-label="Access admin portal"
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
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu - UPDATED WITH CORRECT LINKS */}
      <nav 
        id="mobile-menu"
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}
        role="navigation"
        aria-label="Mobile navigation menu"
        aria-hidden={!isMobileMenuOpen}
      >
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
            aria-label="Close mobile menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.mobileMenuContent}>
          {/* Context indicator for mobile */}
          {isAdminOnPublicPage && (
            <div className={styles.mobileContextIndicator} role="status" aria-live="polite">
              <span className={styles.contextIcon}>👁️</span>
              <div className={styles.contextInfo}>
                <span className={styles.contextTitle}>Viewing Public Site</span>
                <span className={styles.contextSubtitle}>You're logged in as admin</span>
              </div>
            </div>
          )}

          {/* Admin Dashboard - Highlighted for admin users on public site */}
          {isAdminOnPublicPage && (
            <div className={styles.adminDashboardSection}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAdminDashboardClick(e);
                  closeMobileMenu();
                }}
                className={`${styles.adminDashboardMobileLink} ${isNavigating ? styles.loading : ''}`}
                disabled={isNavigating}
                aria-label={`Return to admin dashboard${lastAdminPath !== '/admin/dashboard' ? ' (last page: ' + lastAdminPath.split('/').pop() + ')' : ''}`}
              >
                {isNavigating ? (
                  <div className={styles.loadingSpinner} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeDasharray="32" 
                        strokeDashoffset="32"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0 12 12;360 12 12"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                  </div>
                ) : (
                  <svg className={styles.mobileMenuIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="9"></rect>
                    <rect x="14" y="3" width="7" height="5"></rect>
                    <rect x="14" y="12" width="7" height="9"></rect>
                    <rect x="3" y="16" width="7" height="5"></rect>
                  </svg>
                )}
                <div className={styles.linkContent}>
                  <span className={styles.mobileMenuText}>Admin Dashboard</span>
                  {lastAdminPath !== '/admin/dashboard' && (
                    <span className={styles.returnPath}>Return to {lastAdminPath.split('/').pop()}</span>
                  )}
                </div>
                <svg className={styles.mobileMenuArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
              <div className={styles.menuDivider} aria-hidden="true"></div>
            </div>
          )}

          <ul className={styles.mobileMenuList} role="list">
            {navigationLinks.map((link, index) => (
              <li key={link.path} className={styles.mobileMenuItem} role="listitem">
                <Link
                  to={link.path}
                  className={`${styles.mobileMenuLink} ${
                    location.pathname === link.path ? styles.active : ''
                  }`}
                  onClick={closeMobileMenu}
                  aria-current={location.pathname === link.path ? 'page' : undefined}
                >
                  <span className={styles.mobileMenuIcon} aria-hidden="true">{link.icon}</span>
                  <span className={styles.mobileMenuText}>{link.name}</span>
                  <svg 
                    className={styles.mobileMenuArrow} 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Menu Footer */}
        <div className={styles.mobileMenuFooter}>
          {user ? (
            <div className={styles.mobileUserSection}>
              <div className={styles.mobileUserInfo}>
                <div className={styles.mobileUserAvatar} role="img" aria-label={`${user.firstName}'s avatar`}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={`${user.firstName}'s avatar`} />
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
                className={`${styles.mobileLogoutBtn} ${isNavigating ? styles.loading : ''}`}
                disabled={isNavigating}
                aria-label="Logout from your account"
              >
                {isNavigating ? (
                  <div className={styles.loadingSpinner} aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeDasharray="32" 
                        strokeDashoffset="32"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="0 12 12;360 12 12"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                  </div>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                )}
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
                  aria-label="Access admin portal"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7l-10-5z" />
                  </svg>
                  Admin Portal
                </Link>
              </div>
            )
          )}
        </div>
      </nav>
    </>
  );
};

export default Header;