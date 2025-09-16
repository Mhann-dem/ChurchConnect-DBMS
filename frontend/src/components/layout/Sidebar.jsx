import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  DocumentChartBarIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: HomeIcon,
    permission: 'view_dashboard',
    description: 'Overview & Analytics'
  },
  {
    name: 'Members',
    href: '/admin/members',
    icon: UsersIcon,
    permission: 'view_members',
    description: 'Church Members'
  },
  {
    name: 'Families',
    href: '/admin/families',
    icon: BuildingOfficeIcon,
    permission: 'view_families',
    description: 'Family Units'
  },
  {
    name: 'Groups',
    href: '/admin/groups',
    icon: UserGroupIcon,
    permission: 'view_groups',
    description: 'Ministry Groups'
  },
  {
    name: 'Events',
    href: '/admin/events',
    icon: CalendarDaysIcon,
    permission: 'view_events',
    description: 'Church Events'
  },
  {
    name: 'Pledges',
    href: '/admin/pledges',
    icon: CurrencyDollarIcon,
    permission: 'view_pledges',
    description: 'Financial Pledges'
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: DocumentChartBarIcon,
    permission: 'view_reports',
    description: 'Analytics & Reports'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Cog6ToothIcon,
    permission: 'admin_settings',
    description: 'System Settings'
  }
];

// Enhanced quick action items - now includes Events
const quickActionItems = [
  {
    name: 'Add Member',
    href: '/admin/members?action=create',
    icon: UserPlusIcon,
    color: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    description: 'New member'
  },
  {
    name: 'Create Event', // Events now included
    href: '/admin/events?action=create',
    icon: CalendarDaysIcon,
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    description: 'New event'
  },
  {
    name: 'Add Family',
    href: '/admin/families?action=create',
    icon: BuildingOfficeIcon,
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    description: 'New family'
  },
  {
    name: 'Create Group',
    href: '/admin/groups?action=create',
    icon: UserGroupIcon,
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    description: 'New group'
  },
  {
    name: 'Record Pledge',
    href: '/admin/pledges?action=create',
    icon: CurrencyDollarIcon,
    color: '#ef4444',
    bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    description: 'New pledge'
  }
];

export const Sidebar = ({ 
  isOpen, 
  onClose, 
  onCollapseChange, 
  isMobile, 
  isCollapsed,
  sidebarWidth = 280
}) => {
  const { logout, hasPermission, user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [stats, setStats] = useState({
    members: 0,
    families: 0,
    groups: 0,
    events: 0,
    pledges: 0
  });

  const isDark = settings?.theme === 'dark';

  // Fetch sidebar stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
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
    if (!isMobile && onCollapseChange) {
      onCollapseChange(!isCollapsed);
    }
  };

  // Update navigation items with stats badges
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
          return stats.events > 0 ? `${stats.events}` : null;
        case 'Pledges':
          return stats.pledges > 0 ? `${stats.pledges}` : null;
        default:
          return null;
      }
    })()
  }));

  const filteredNavigationItems = navigationItemsWithStats.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  // Enhanced styles
  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: isMobile ? '320px' : (isCollapsed ? '72px' : `${sidebarWidth}px`),
    background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
    borderRight: '1px solid rgba(148, 163, 184, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: isMobile ? 1000 : 50,
    boxShadow: isMobile 
      ? '8px 0 32px rgba(0, 0, 0, 0.4)' 
      : isCollapsed 
        ? '2px 0 8px rgba(0, 0, 0, 0.15)' 
        : '4px 0 24px rgba(0, 0, 0, 0.15)',
    transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isCollapsed && !isMobile ? '16px 12px' : '20px 24px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    minHeight: '72px',
    background: 'rgba(255, 255, 255, 0.02)'
  };

  const brandStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: isCollapsed && !isMobile ? '0' : '12px',
    color: 'white',
    textDecoration: 'none',
    transition: 'all 0.3s ease'
  };

  const logoStyle = {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
    flexShrink: 0
  };

  const textContainerStyle = {
    display: isCollapsed && !isMobile ? 'none' : 'flex',
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
    flexShrink: 0
  };

  const navStyle = {
    flex: 1,
    padding: isCollapsed && !isMobile ? '16px 8px' : '20px 16px',
    overflowY: 'auto',
    overflowX: 'hidden'
  };

  // Quick Actions - Always visible, different layouts for collapsed/expanded
  const quickActionsStyle = {
    marginBottom: isCollapsed && !isMobile ? '24px' : '28px'
  };

  const quickActionsSectionTitleStyle = {
    fontSize: '10px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    paddingLeft: isCollapsed && !isMobile ? '0' : '12px',
    textAlign: isCollapsed && !isMobile ? 'center' : 'left',
    display: isCollapsed && !isMobile ? 'none' : 'block' // Hide title when collapsed
  };

  // For collapsed state - show as icon grid
  const collapsedQuickActionsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    justifyItems: 'center'
  };

  const collapsedQuickActionStyle = (item) => ({
    width: '28px',
    height: '28px',
    background: item.bgGradient,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    position: 'relative',
    cursor: 'pointer'
  });

  // For expanded state - show as buttons
  const expandedQuickActionStyle = (item) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: item.bgGradient,
    color: 'white',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    marginBottom: '6px',
    cursor: 'pointer'
  });

  const navListStyle = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  };

  const getNavItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: isCollapsed && !isMobile ? '12px 8px' : '12px 16px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    color: isActive ? '#ffffff' : '#cbd5e1',
    background: isActive 
      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(29, 78, 216, 0.9) 100%)'
      : 'transparent',
    transition: 'all 0.3s ease',
    position: 'relative',
    justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
    border: `1px solid ${isActive ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
    boxShadow: isActive ? '0 4px 16px rgba(59, 130, 246, 0.2)' : 'none'
  });

  const iconStyle = {
    width: '18px',
    height: '18px',
    flexShrink: 0
  };

  const navContentStyle = {
    display: isCollapsed && !isMobile ? 'none' : 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: 0
  };

  const badgeStyle = (badge) => ({
    fontSize: '10px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    whiteSpace: 'nowrap'
  });

  const tooltipStyle = {
    position: 'absolute',
    left: '80px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(75, 85, 99, 0.3)',
    pointerEvents: 'none'
  };

  const footerStyle = {
    padding: isCollapsed && !isMobile ? '16px 8px' : '20px 16px',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const userSectionStyle = {
    display: isCollapsed && !isMobile ? 'none' : 'block',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    marginBottom: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const userAvatarStyle = {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    flexShrink: 0
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
    color: '#94a3b8'
  };

  const logoutButtonStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: isCollapsed && !isMobile ? '12px 8px' : '12px 16px',
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    fontSize: '13px',
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
        <Link to="/admin/dashboard" style={brandStyle}>
          <div style={logoStyle}>
            <img 
              src="/logo.png" 
              alt="CC" 
              style={{
                width: '24px',
                height: '24px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div 
              style={{
                display: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              CC
            </div>
          </div>
          
          <div style={textContainerStyle}>
            <div style={titleStyle}>ChurchConnect</div>
            <div style={subtitleStyle}>Admin Panel</div>
          </div>
        </Link>
        
        <div style={{ display: 'flex', gap: '8px' }}>
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
        {/* Quick Actions - Always Visible */}
        <div style={quickActionsStyle}>
          <h3 style={quickActionsSectionTitleStyle}>Quick Actions</h3>
          
          {isCollapsed && !isMobile ? (
            // Collapsed view - Icon grid with tooltips
            <div style={collapsedQuickActionsStyle}>
              {quickActionItems.slice(0, 4).map((action) => {
                const Icon = action.icon;
                return (
                  <Link 
                    key={action.name}
                    to={action.href}
                    style={collapsedQuickActionStyle(action)}
                    title={`${action.name} - ${action.description}`}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)';
                      e.target.style.boxShadow = `0 4px 16px ${action.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <Icon style={{ width: '14px', height: '14px', color: 'white' }} />
                  </Link>
                );
              })}
            </div>
          ) : (
            // Expanded view - Full buttons
            <div>
              {quickActionItems.slice(0, 4).map((action) => {
                const Icon = action.icon;
                return (
                  <Link 
                    key={action.name}
                    to={action.href}
                    style={expandedQuickActionStyle(action)}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = `0 8px 24px ${action.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <Icon style={{ width: '16px', height: '16px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{action.name}</span>
                      <span style={{ fontSize: '10px', opacity: 0.8 }}>{action.description}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div>
          {(!isCollapsed || isMobile) && (
            <h3 style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
              paddingLeft: '12px'
            }}>
              Navigation
            </h3>
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
                    <div style={navContentStyle}>
                      <span>{item.name}</span>
                      {item.badge && (
                        <span style={badgeStyle(item.badge)}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </NavLink>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && !isMobile && hoveredItem === item.name && (
                    <div style={tooltipStyle}>
                      <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#d1d5db' }}>
                        {item.description}
                      </div>
                      {item.badge && (
                        <div style={{ 
                          marginTop: '4px', 
                          fontSize: '9px', 
                          color: '#22c55e',
                          padding: '2px 6px',
                          background: 'rgba(34, 197, 94, 0.1)',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
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
        {/* User Section */}
        {(!isCollapsed || isMobile) && user && (
          <div style={userSectionStyle}>
            <div style={userInfoStyle}>
              <div style={userAvatarStyle}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div style={userDetailsStyle}>
                <div style={userNameStyle}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={userRoleStyle}>
                  {user?.role || 'Administrator'}
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
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
        >
          <ArrowLeftOnRectangleIcon style={iconStyle} />
          {(!isCollapsed || isMobile) && (
            <span>Sign Out</span>
          )}
        </button>
      </div>

      <style jsx>{`
        nav::-webkit-scrollbar {
          width: 4px;
        }
        
        nav::-webkit-scrollbar-track {
          background: transparent;
        }
        
        nav::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 2px;
        }
        
        nav::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;