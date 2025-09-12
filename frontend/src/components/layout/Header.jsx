import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Navigation } from './Navigation';
import styles from './Layout.module.css';
import logo from '../../assets/images/logo.png';

const Header = ({ isAdmin = false, onMenuClick, user: userProp, sidebarOpen, isCollapsed, isMobile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [lastAdminPath, setLastAdminPath] = useState('/admin/dashboard');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Use passed user prop or fallback to auth user
  const currentUser = userProp || user;

  // Memoize expensive computations
  const isAdminOnPublicPage = useMemo(() => 
    currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && 
    !location.pathname.startsWith('/admin'), 
    [currentUser, location.pathname]
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
      if (event.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
        if (showNotifications) {
          setShowNotifications(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, showNotifications]);

  // Fetch notifications for admin users
  useEffect(() => {
    if (isAdmin && currentUser) {
      // This would normally fetch from your notification service
      setNotifications([
        { id: 1, title: 'New member registered', message: 'John Doe has joined', time: '5 mins ago', unread: true },
        { id: 2, title: 'Event reminder', message: 'Sunday service starts in 1 hour', time: '1 hour ago', unread: false },
        { id: 3, title: 'Pledge received', message: '$500 donation received', time: '2 hours ago', unread: true }
      ]);
    }
  }, [isAdmin, currentUser]);

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

  const toggleNotifications = useCallback(() => {
    setShowNotifications(!showNotifications);
  }, [showNotifications]);

  // Updated navigation links for different user types - FIXED URLs
  const getNavigationLinks = () => {
    if (isAdmin) {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
        { name: 'Members', path: '/admin/members', icon: '👥' },
        { name: 'Families', path: '/admin/families', icon: '🏠' },
        { name: 'Groups', path: '/admin/groups', icon: '👨‍👩‍👧‍👦' },
        { name: 'Events', path: '/admin/events', icon: '📅' },
        { name: 'Pledges', path: '/admin/pledges', icon: '💰' },
        { name: 'Reports', path: '/admin/reports', icon: '📈' },
        { name: 'Settings', path: '/admin/settings', icon: '⚙️' }
      ];
    } else {
      return [
        { name: 'Home', path: '/', icon: '🏠' },
        { name: 'Member Registration', path: '/register', icon: '📝' },
        { name: 'Events', path: '/events', icon: '📅' },
        { name: 'Ministries', path: '/ministries', icon: '🙏' },
        { name: 'Contact', path: '/contact', icon: '📧' }
      ];
    }
  };

  const navigationLinks = getNavigationLinks();
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      <header 
        className={`${styles.header} ${isScrolled ? styles.scrolled : ''} ${isAdmin ? styles.admin : styles.public}`}
        role="banner"
      >
        <div className={styles.headerContainer}>
          {/* Mobile Menu Button - Only show for non-admin or when sidebar not present */}
          {(!isAdmin || isMobile) && (
            <button
              className={`${styles.mobileMenuBtn} ${isAdmin ? styles.adminMobileBtn : ''}`}
              onClick={isAdmin && onMenuClick ? onMenuClick : toggleMobileMenu}
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
          )}

          {/* Brand/Logo Section */}
          <div className={`${styles.brandContainer} ${isAdmin && !isMobile ? styles.adminBrand : ''}`}>
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

          {/* Admin Header Info - Show when not mobile */}
          {isAdmin && !isMobile && (
            <div className={styles.adminHeaderInfo}>
              <div className={styles.breadcrumbsContainer}>
                <div className={styles.currentPage}>
                  {getCurrentPageTitle(location.pathname)}
                </div>
                <div className={styles.pageDescription}>
                  {getCurrentPageDescription(location.pathname)}
                </div>
              </div>
            </div>
          )}

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

          {/* User Section */}
          <div className={`${styles.userSection} ${isAdmin ? styles.adminUserSection : ''}`}>
            {currentUser ? (
              <div className={styles.userMenu}>
                {/* Admin Notifications - Only for admin users */}
                {isAdmin && (
                  <div className={styles.notificationsContainer}>
                    <button
                      onClick={toggleNotifications}
                      className={`${styles.notificationBtn} ${unreadCount > 0 ? styles.hasUnread : ''}`}
                      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      {unreadCount > 0 && (
                        <span className={styles.notificationBadge}>{unreadCount}</span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className={styles.notificationsDropdown}>
                        <div className={styles.notificationsHeader}>
                          <h3>Notifications</h3>
                          <button 
                            onClick={() => setShowNotifications(false)}
                            className={styles.closeBtn}
                            aria-label="Close notifications"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                        <div className={styles.notificationsList}>
                          {notifications.length > 0 ? (
                            notifications.map(notification => (
                              <div 
                                key={notification.id} 
                                className={`${styles.notificationItem} ${notification.unread ? styles.unread : ''}`}
                              >
                                <div className={styles.notificationContent}>
                                  <div className={styles.notificationTitle}>{notification.title}</div>
                                  <div className={styles.notificationMessage}>{notification.message}</div>
                                  <div className={styles.notificationTime}>{notification.time}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className={styles.noNotifications}>
                              <p>No notifications</p>
                            </div>
                          )}
                        </div>
                        <div className={styles.notificationsFooter}>
                          <Link to="/admin/notifications" onClick={() => setShowNotifications(false)}>
                            View all notifications
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

                {/* User Info */}
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar} role="img" aria-label={`${currentUser.first_name}'s avatar`}>
                    {currentUser.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt={`${currentUser.first_name}'s avatar`} 
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span className={styles.avatarText}>
                        {currentUser.first_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  {(!isAdmin || !isMobile) && (
                    <div className={styles.userDetails}>
                      <span className={styles.userName}>
                        {isAdmin ? `${currentUser.first_name} ${currentUser.last_name}` : `Welcome, ${currentUser.first_name}`}
                      </span>
                      {currentUser.role && (
                        <span className={styles.userRole}>
                          {currentUser.role}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Actions Dropdown for Admins */}
                {isAdmin && !isMobile && (
                  <div className={styles.quickActionsDropdown}>
                    <button 
                      className={styles.quickActionsBtn}
                      aria-label="Quick admin actions"
                      aria-haspopup="true"
                      onClick={() => {/* Toggle dropdown */}}
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
          {currentUser ? (
            <div className={styles.mobileUserSection}>
              <div className={styles.mobileUserInfo}>
                <div className={styles.mobileUserAvatar} role="img" aria-label={`${currentUser.first_name}'s avatar`}>
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={`${currentUser.first_name}'s avatar`} />
                  ) : (
                    <span>{currentUser.first_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className={styles.mobileUserDetails}>
                  <span className={styles.mobileUserName}>{currentUser.first_name} {currentUser.last_name}</span>
                  <span className={styles.mobileUserRole}>{currentUser.role || 'Member'}</span>
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

      {/* Notifications Overlay */}
      {showNotifications && (
        <div 
          className={styles.notificationsOverlay}
          onClick={() => setShowNotifications(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

// Helper functions for page titles and descriptions
const getCurrentPageTitle = (pathname) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  const titleMap = {
    'dashboard': 'Dashboard',
    'members': 'Members',
    'families': 'Families', 
    'groups': 'Groups',
    'events': 'Events',
    'pledges': 'Pledges',
    'reports': 'Reports',
    'settings': 'Settings',
    'new': 'Create New',
    'edit': 'Edit',
    'view': 'View Details'
  };
  
  return titleMap[lastSegment] || 'Admin Panel';
};

const getCurrentPageDescription = (pathname) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  const descriptionMap = {
    'dashboard': 'System overview and statistics',
    'members': 'Church member management',
    'families': 'Family unit management',
    'groups': 'Ministry and small groups',
    'events': 'Church events and activities',
    'pledges': 'Financial commitments tracking',
    'reports': 'Analytics and insights',
    'settings': 'System configuration'
  };
  
  return descriptionMap[lastSegment] || 'Administrative interface';
};

export default Header;