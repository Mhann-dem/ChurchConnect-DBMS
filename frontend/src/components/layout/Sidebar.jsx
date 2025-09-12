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
  BellIcon,
  UserPlusIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  ChartPieIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: HomeIcon,
    permission: 'view_dashboard',
    badge: null,
    description: 'Overview & Statistics'
  },
  {
    name: 'Members',
    href: '/admin/members',
    icon: UsersIcon,
    permission: 'view_members',
    badge: null, // Will be populated dynamically
    description: 'Church Member Management'
  },
  {
    name: 'Families',
    href: '/admin/families',
    icon: BuildingOfficeIcon,
    permission: 'view_families',
    badge: null, // Will be populated dynamically
    description: 'Family Management'
  },
  {
    name: 'Groups',
    href: '/admin/groups',
    icon: UserGroupIcon,
    permission: 'view_groups',
    badge: null, // Will be populated dynamically
    description: 'Ministry & Small Groups'
  },
  {
    name: 'Events',
    href: '/admin/events',
    icon: CalendarDaysIcon,
    permission: 'view_events',
    badge: null, // Will be populated dynamically
    description: 'Church Events & Activities'
  },
  {
    name: 'Pledges',
    href: '/admin/pledges',
    icon: CurrencyDollarIcon,
    permission: 'view_pledges',
    badge: null, // Will be populated dynamically
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
    icon: Cog6ToothIcon,
    permission: 'admin_settings',
    badge: null,
    description: 'System Configuration'
  }
];

// Quick action items with correct URLs
const quickActionItems = [
  {
    name: 'Add Member',
    href: '/admin/members?action=create',
    icon: UserPlusIcon,
    color: 'from-blue-500 to-indigo-500',
    description: 'Register new member'
  },
  {
    name: 'Add Family',
    href: '/admin/families?action=create',
    icon: BuildingOfficeIcon,
    color: 'from-green-500 to-teal-500',
    description: 'Create family unit'
  },
  {
    name: 'Create Group',
    href: '/admin/groups?action=create',
    icon: UserGroupIcon,
    color: 'from-purple-500 to-violet-500',
    description: 'Ministry/small group'
  },
  {
    name: 'Create Event',
    href: '/admin/events?action=create',
    icon: CalendarDaysIcon,
    color: 'from-orange-500 to-red-500',
    description: 'Church activity'
  },
  {
    name: 'Record Pledge',
    href: '/admin/pledges?action=create',
    icon: CurrencyDollarIcon,
    color: 'from-yellow-500 to-orange-500',
    description: 'Financial commitment'
  }
];

export const Sidebar = ({ isOpen, onClose, onCollapseChange, isMobile, isTablet }) => {
  const { logout, hasPermission, user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [stats, setStats] = useState({
    members: 0,
    families: 0,
    groups: 0,
    events: 0,
    pledges: 0
  });

  const isDark = settings?.theme === 'dark';

  // Auto-collapse logic
  useEffect(() => {
    if (isTablet && !isMobile) {
      setIsCollapsed(true);
    } else if (!isTablet && !isMobile && window.innerWidth >= 1400) {
      setIsCollapsed(false);
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  // Fetch sidebar stats
  useEffect(() => {
    // This would normally fetch from your dashboard service
    // For now, using placeholder data
    const fetchStats = async () => {
      try {
        // const statsData = await dashboardService.getSidebarStats();
        // setStats(statsData);
        
        // Placeholder data
        setStats({
          members: 1248,
          families: 312,
          groups: 23,
          events: 8,
          pledges: 156
        });
      } catch (error) {
        console.warn('Failed to fetch sidebar stats:', error);
      }
    };

    fetchStats();
  }, []);

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

  // Update navigation items with stats
  const navigationItemsWithStats = navigationItems.map(item => ({
    ...item,
    badge: (() => {
      switch (item.name) {
        case 'Members':
          return stats.members > 0 ? stats.members.toLocaleString() : null;
        case 'Families':
          return stats.families > 0 ? stats.families.toLocaleString() : null;
        case 'Groups':
          return stats.groups > 0 ? stats.groups.toString() : null;
        case 'Events':
          return stats.events > 0 ? `${stats.events} upcoming` : null;
        case 'Pledges':
          return stats.pledges > 0 ? `${stats.pledges} active` : null;
        default:
          return item.badge;
      }
    })()
  }));

  const filteredNavigationItems = navigationItemsWithStats.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: isMobile && !isOpen ? '-320px' : 0,
    height: '100vh',
    width: isCollapsed && !isMobile ? '72px' : '320px',
    background: isDark 
      ? 'linear-gradient(180deg, #111827 0%, #030712 100%)'
      : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    borderRight: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(148, 163, 184, 0.1)'}`,
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 50,
    boxShadow: isMobile ? '8px 0 32px rgba(0, 0, 0, 0.3)' : '4px 0 24px rgba(0, 0, 0, 0.12)',
    backdropFilter: 'blur(20px)'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isCollapsed && !isMobile ? '20px 16px' : '24px 24px',
    borderBottom: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(148, 163, 184, 0.1)'}`,
    minHeight: '80px',
    background: 'rgba(255, 255, 255, 0.02)'
  };

  const brandStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    color: 'white',
    textDecoration: 'none',
    transition: 'all 0.3s ease'
  };

  const logoStyle = {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
    border: '2px solid rgba(59, 130, 246, 0.2)'
  };

  const textStyle = {
    display: isCollapsed && !isMobile ? 'none' : 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    lineHeight: '1.2',
    letterSpacing: '-0.025em'
  };

  const subtitleStyle = {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500'
  };

  const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const controlButtonStyle = {
    width: '32px',
    height: '32px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(8px)'
  };

  const navStyle = {
    flex: 1,
    padding: isCollapsed && !isMobile ? '20px 12px' : '24px 20px',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent'
  };

  const sectionStyle = {
    marginBottom: '32px'
  };

  const sectionTitleStyle = {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    paddingLeft: isCollapsed && !isMobile ? '0' : '16px',
    display: isCollapsed && !isMobile ? 'none' : 'block'
  };

  const quickActionStyle = (color) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: isCollapsed && !isMobile ? '12px 8px' : '16px 20px',
    background: `linear-gradient(135deg, ${color})`,
    color: 'white',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
    marginBottom: '8px'
  });

  const navListStyle = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  };

  const getNavItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: isCollapsed && !isMobile ? '16px 12px' : '16px 20px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    color: isActive ? '#ffffff' : '#cbd5e1',
    background: isActive 
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(29, 78, 216, 0.9) 100%)'
      : 'transparent',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
    boxShadow: isActive ? '0 8px 24px rgba(59, 130, 246, 0.3)' : 'none',
    justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start'
  });

  const iconStyle = {
    width: '20px',
    height: '20px',
    flexShrink: 0
  };

  const navContentStyle = {
    display: isCollapsed && !isMobile ? 'none' : 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '4px'
  };

  const labelContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  };

  const badgeStyle = (badge) => ({
    fontSize: '10px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '12px',
    background: badge?.includes('upcoming') || badge?.includes('active')
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      : 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    whiteSpace: 'nowrap'
  });

  const descriptionStyle = {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '400'
  };

  const tooltipStyle = {
    position: 'absolute',
    left: '84px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: '#1f2937',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(75, 85, 99, 0.3)',
    pointerEvents: 'none',
    backdropFilter: 'blur(8px)'
  };

  const footerStyle = {
    padding: isCollapsed && !isMobile ? '20px 12px' : '24px 20px',
    borderTop: `1px solid ${isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(148, 163, 184, 0.1)'}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'rgba(255, 255, 255, 0.02)'
  };

  const footerLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: isCollapsed && !isMobile ? '12px 8px' : '12px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
    color: '#94a3b8',
    transition: 'all 0.3s ease',
    justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start'
  };

  const userSectionStyle = {
    display: isCollapsed && !isMobile ? 'none' : 'block',
    padding: '16px 20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    marginBottom: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const userAvatarStyle = {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    border: '2px solid rgba(139, 92, 246, 0.3)'
  };

  const userDetailsStyle = {
    flex: 1,
    minWidth: 0
  };

  const userNameStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '4px'
  };

  const userRoleStyle = {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '6px'
  };

  const userStatusStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#22c55e'
  };

  const statusIndicatorStyle = {
    width: '8px',
    height: '8px',
    background: '#22c55e',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  };

  const logoutButtonStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: isCollapsed && !isMobile ? '16px 8px' : '16px 20px',
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start'
  };

  return (
    <div style={sidebarStyle}>
      {/* Header */}
      <div style={headerStyle}>
        {(!isCollapsed || isMobile) && (
          <Link to="/admin/dashboard" style={brandStyle}>
            <div style={logoStyle}>
              <img 
                src="/logo.png" 
                alt="ChurchConnect" 
                style={{
                  width: '24px',
                  height: '24px',
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
                  fontSize: '16px',
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
          <Link to="/admin/dashboard" style={{...logoStyle, textDecoration: 'none'}}>
            <img 
              src="/logo.png" 
              alt="ChurchConnect" 
              style={{
                width: '24px',
                height: '24px',
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
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              CC
            </span>
          </Link>
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
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = '#94a3b8';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {isCollapsed ? (
                <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
              ) : (
                <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
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
              <XMarkIcon style={{ width: '16px', height: '16px' }} />
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
              {quickActionItems.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link 
                    key={action.name}
                    to={action.href} 
                    style={quickActionStyle(action.color)}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                    }}
                  >
                    <Icon style={iconStyle} />
                    {(!isCollapsed || isMobile) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{action.name}</span>
                        <span style={{ fontSize: '11px', opacity: 0.8 }}>{action.description}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
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
                             location.pathname.startsWith(item.href + '/');
              
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
                        e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.color = '#ffffff';
                        e.target.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      setHoveredItem(null);
                      if (!isActive) {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#cbd5e1';
                        e.target.style.transform = 'translateX(0)';
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
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.name}</div>
                      <div style={{ fontSize: '10px', color: '#d1d5db' }}>{item.description}</div>
                      {item.badge && (
                        <div style={{ marginTop: '4px', fontSize: '9px', color: '#22c55e' }}>
                          {item.badge}
                        </div>
                      )}
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
          title={isCollapsed && !isMobile ? 'Visit Public Site' : ''}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
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
        <Link 
          to="/admin/help" 
          style={footerLinkStyle}
          title={isCollapsed && !isMobile ? 'Help & Support' : ''}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
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
        </Link>

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
          title={isCollapsed && !isMobile ? 'Sign Out' : ''}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.1)';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            e.target.style.transform = 'translateY(0)';
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
        
        /* Custom scrollbar */
        nav::-webkit-scrollbar {
          width: 6px;
        }
        
        nav::-webkit-scrollbar-track {
          background: transparent;
        }
        
        nav::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }
        
        nav::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;