import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  DocumentChartBarIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  GlobeAltIcon,
  PlusIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

const navigationItems = [
  {
    name: 'Members',
    href: '/admin/members',
    icon: UsersIcon,
    permission: 'view_members',
    badge: '1,248',
    description: 'Church Member Management'
  },
  {
    name: 'Groups',
    href: '/admin/groups',
    icon: UserGroupIcon,
    permission: 'view_groups',
    badge: '23',
    description: 'Ministry & Small Groups'
  },
  {
    name: 'Events',
    href: '/admin/events',
    icon: BellIcon,
    permission: 'view_events',
    badge: '8',
    description: 'Church Events & Activities'
  },
  {
    name: 'Pledges',
    href: '/admin/pledges',
    icon: CurrencyDollarIcon,
    permission: 'view_pledges',
    badge: 'New',
    description: 'Donations & Financial Commitments'
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: DocumentChartBarIcon,
    permission: 'view_reports',
    badge: null,
    description: 'Analytics & Insights'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: CogIcon,
    permission: 'admin_settings',
    badge: null,
    description: 'System Configuration'
  }
];

export const Sidebar = ({ isOpen, onClose, onCollapseChange }) => {
  const { logout, hasPermission, user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const isDark = settings?.theme === 'dark';

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        setIsCollapsed(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const filteredNavigationItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: isMobile && !isOpen ? '-280px' : 0,
    height: '100vh',
    width: isCollapsed ? '64px' : '280px',
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    borderRight: '1px solid rgba(148, 163, 184, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 50,
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isCollapsed ? '16px 12px' : '20px 24px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    minHeight: '72px'
  };

  const brandStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'white',
    textDecoration: 'none',
    transition: 'opacity 0.2s ease'
  };

  const logoStyle = {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  };

  const textStyle = {
    display: isCollapsed ? 'none' : 'flex',
    flexDirection: 'column',
    gap: '2px'
  };

  const titleStyle = {
    fontSize: '16px',
    fontWeight: '700',
    color: 'white',
    lineHeight: '1.2'
  };

  const subtitleStyle = {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500'
  };

  const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const controlButtonStyle = {
    width: '28px',
    height: '28px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '6px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(8px)'
  };

  const navStyle = {
    flex: 1,
    padding: isCollapsed ? '16px 8px' : '24px 16px',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent'
  };

  const sectionStyle = {
    marginBottom: '24px'
  };

  const sectionTitleStyle = {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
    paddingLeft: isCollapsed ? '0' : '12px',
    display: isCollapsed ? 'none' : 'block'
  };

  const quickActionStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: isCollapsed ? '10px 8px' : '12px 16px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
    justifyContent: isCollapsed ? 'center' : 'flex-start'
  };

  const navListStyle = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const getNavItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: isCollapsed ? '12px 8px' : '12px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    color: isActive ? '#ffffff' : '#cbd5e1',
    background: isActive 
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(29, 78, 216, 0.9) 100%)'
      : 'transparent',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
    border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
    boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none',
    justifyContent: isCollapsed ? 'center' : 'flex-start'
  });

  const iconStyle = {
    width: '18px',
    height: '18px',
    flexShrink: 0
  };

  const navContentStyle = {
    display: isCollapsed ? 'none' : 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '2px'
  };

  const labelContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const badgeStyle = (badge) => ({
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '10px',
    background: badge === 'New' 
      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
      : 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  });

  const descriptionStyle = {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '400'
  };

  const tooltipStyle = {
    position: 'absolute',
    left: '72px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#1f2937',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(75, 85, 99, 0.3)',
    pointerEvents: 'none'
  };

  const footerStyle = {
    padding: isCollapsed ? '16px 8px' : '20px 16px',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const footerLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: isCollapsed ? '10px 8px' : '10px 16px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
    color: '#94a3b8',
    transition: 'all 0.2s ease',
    justifyContent: isCollapsed ? 'center' : 'flex-start'
  };

  const userSectionStyle = {
    display: isCollapsed ? 'none' : 'block',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    marginBottom: '8px'
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const userAvatarStyle = {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white'
  };

  const userDetailsStyle = {
    flex: 1,
    minWidth: 0
  };

  const userNameStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '2px'
  };

  const userRoleStyle = {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '4px'
  };

  const userStatusStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    color: '#22c55e'
  };

  const statusIndicatorStyle = {
    width: '6px',
    height: '6px',
    background: '#22c55e',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  };

  const logoutButtonStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: isCollapsed ? '12px 8px' : '12px 16px',
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    justifyContent: isCollapsed ? 'center' : 'flex-start'
  };

  return (
    <div style={sidebarStyle}>
      {/* Header */}
      <div style={headerStyle}>
        {(!isCollapsed || isMobile) && (
          <Link to="/" style={brandStyle}>
            <div style={logoStyle}>
              <img 
                src="/logo.png" 
                alt="ChurchConnect" 
                style={{
                  width: '20px',
                  height: '20px',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span 
                style={{
                  display: 'none',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white'
                }}
              >
                CC
              </span>
            </div>
            <div style={textStyle}>
              <div style={titleStyle}>ChurchConnect</div>
              <div style={subtitleStyle}>Admin Panel</div>
            </div>
          </Link>
        )}
        
        {isCollapsed && !isMobile && (
          <div style={logoStyle}>
            <img 
              src="/logo.png" 
              alt="ChurchConnect" 
              style={{
                width: '20px',
                height: '20px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span 
              style={{
                display: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              CC
            </span>
          </div>
        )}
        
        <div style={controlsStyle}>
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              style={controlButtonStyle}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = '#94a3b8';
              }}
            >
              {isCollapsed ? (
                <ChevronRightIcon style={{ width: '14px', height: '14px' }} />
              ) : (
                <ChevronLeftIcon style={{ width: '14px', height: '14px' }} />
              )}
            </button>
          )}
          
          {isMobile && (
            <button 
              onClick={onClose} 
              style={controlButtonStyle}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                e.target.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = '#94a3b8';
              }}
            >
              <XMarkIcon style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={navStyle}>
        {/* Quick Actions Section */}
        {(!isCollapsed || isMobile) && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link 
                to="/admin/members/new" 
                style={{...quickActionStyle, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'}}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 16px rgba(5, 150, 105, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(5, 150, 105, 0.3)';
                }}
              >
                <PlusIcon style={iconStyle} />
                {!isCollapsed && 'Add New Member'}
              </Link>
              
              <Link 
                to="/admin/groups/new" 
                style={{...quickActionStyle, background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'}}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 16px rgba(124, 58, 237, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.3)';
                }}
              >
                <UserGroupIcon style={iconStyle} />
                {!isCollapsed && 'Create Group'}
              </Link>

              <Link 
                to="/admin/pledges/new" 
                style={{...quickActionStyle, background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'}}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 16px rgba(220, 38, 38, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.3)';
                }}
              >
                <CurrencyDollarIcon style={iconStyle} />
                {!isCollapsed && 'Record Pledge'}
              </Link>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <div style={sectionStyle}>
          {(!isCollapsed || isMobile) && (
            <h3 style={sectionTitleStyle}>Navigation</h3>
          )}
          
          <ul style={navListStyle}>
            {filteredNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                             location.pathname.startsWith(item.href);
              
              return (
                <li key={item.name} style={{ position: 'relative' }}>
                  <NavLink
                    to={item.href}
                    style={getNavItemStyle(isActive)}
                    onClick={() => isMobile && onClose()}
                    title={isCollapsed && !isMobile ? item.name : ''}
                    onMouseEnter={(e) => {
                      setHoveredItem(item.name);
                      if (!isActive) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.target.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      setHoveredItem(null);
                      if (!isActive) {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#cbd5e1';
                      }
                    }}
                  >
                    <Icon style={iconStyle} />
                    {(!isCollapsed || isMobile) && (
                      <div style={navContentStyle}>
                        <div style={labelContainerStyle}>
                          <span>{item.name}</span>
                          {item.badge && (
                            <span style={badgeStyle(item.badge)}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div style={descriptionStyle}>{item.description}</div>
                      </div>
                    )}
                  </NavLink>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && !isMobile && hoveredItem === item.name && (
                    <div style={tooltipStyle}>
                      <div style={{ fontWeight: '600', marginBottom: '2px' }}>{item.name}</div>
                      <div style={{ fontSize: '10px', color: '#d1d5db' }}>{item.description}</div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div style={footerStyle}>
        {/* Public Site Link */}
        <Link 
          to="/" 
          style={footerLinkStyle}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            e.target.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#94a3b8';
          }}
        >
          <GlobeAltIcon style={iconStyle} />
          {(!isCollapsed || isMobile) && (
            <div style={navContentStyle}>
              <div>Public Site</div>
              <div style={descriptionStyle}>Visit Homepage</div>
            </div>
          )}
        </Link>

        {/* Help Link */}
        <NavLink 
          to="/help" 
          style={footerLinkStyle}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            e.target.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.color = '#94a3b8';
          }}
        >
          <QuestionMarkCircleIcon style={iconStyle} />
          {(!isCollapsed || isMobile) && (
            <div style={navContentStyle}>
              <div>Help & Support</div>
              <div style={descriptionStyle}>Get assistance</div>
            </div>
          )}
        </NavLink>

        {/* User Section */}
        {(!isCollapsed || isMobile) && user && (
          <div style={userSectionStyle}>
            <div style={userInfoStyle}>
              <div style={userAvatarStyle}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div style={userDetailsStyle}>
                <div style={userNameStyle}>{user?.first_name} {user?.last_name}</div>
                <div style={userRoleStyle}>{user?.role || 'Administrator'}</div>
                <div style={userStatusStyle}>
                  <div style={statusIndicatorStyle}></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout} 
          style={logoutButtonStyle}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.1)';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
        >
          <ArrowLeftOnRectangleIcon style={iconStyle} />
          {(!isCollapsed || isMobile) && (
            <div style={navContentStyle}>
              <div>Sign Out</div>
              <div style={descriptionStyle}>Logout securely</div>
            </div>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Sidebar;