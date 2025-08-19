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
  ChartBarIcon,
  PlusIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: ChartBarIcon,
    permission: null,
    badge: null,
    description: 'Overview & Analytics'
  },
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

  const sidebarClasses = `
    flex flex-col h-full shadow-2xl border-r transition-all duration-300
    ${isDark 
      ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-slate-700' 
      : 'bg-gradient-to-b from-white via-gray-50 to-white border-gray-200'
    }
  `;

  const headerClasses = `
    flex items-center justify-between h-20 px-6 border-b flex-shrink-0 transition-all duration-300
    ${isDark 
      ? 'border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900' 
      : 'border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'
    }
  `;

  return (
    <div className={sidebarClasses}>
      {/* Header */}
      <div className={headerClasses}>
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl">CC</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline space-x-1">
                  <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Church
                  </span>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                    Connect
                  </span>
                </div>
                <div className={`text-xs font-medium tracking-wider uppercase ${
                  isDark ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  Admin Panel
                </div>
              </div>
            </Link>
          </div>
        )}
        
        {isCollapsed && !isMobile && (
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
            <span className="text-white font-bold text-xl">CC</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              className={`
                p-2.5 rounded-lg transition-all duration-200 border
                ${isDark 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700 border-slate-600 hover:border-slate-500' 
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-gray-300 hover:border-gray-400'
                }
              `}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="w-5 h-5" />
              ) : (
                <ChevronLeftIcon className="w-5 h-5" />
              )}
            </button>
          )}
          
          {isMobile && (
            <button
              onClick={onClose}
              className={`
                p-2.5 rounded-lg transition-all duration-200
                ${isDark 
                  ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/30' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }
              `}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`
        flex-1 px-4 py-6 overflow-y-auto scrollbar-thin
        ${isDark 
          ? 'scrollbar-track-slate-800 scrollbar-thumb-slate-600' 
          : 'scrollbar-track-gray-100 scrollbar-thumb-gray-300'
        }
      `}>
        <div className="space-y-6">
          {/* Quick Actions Section */}
          {(!isCollapsed || isMobile) && (
            <div>
              <h3 className={`
                text-xs font-semibold uppercase tracking-wider mb-3 px-3
                ${isDark ? 'text-slate-500' : 'text-gray-500'}
              `}>
                Quick Actions
              </h3>
              <Link
                to="/admin/members/new"
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 group"
              >
                <PlusIcon className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                Add New Member
              </Link>
            </div>
          )}

          {/* Main Navigation */}
          <div className="space-y-2">
            {(!isCollapsed || isMobile) && (
              <h3 className={`
                text-xs font-semibold uppercase tracking-wider mb-4 px-3
                ${isDark ? 'text-slate-500' : 'text-gray-500'}
              `}>
                Navigation
              </h3>
            )}
            
            {filteredNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                             (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <div key={item.name} className="relative">
                  <NavLink
                    to={item.href}
                    className={({ isActive: active }) => {
                      const baseClasses = `
                        group flex items-center px-4 py-4 text-sm font-semibold rounded-xl
                        transition-all duration-200 transform hover:scale-105 relative overflow-hidden border
                        ${isCollapsed && !isMobile ? 'justify-center' : ''}
                      `;
                      
                      if (active || isActive) {
                        return baseClasses + (isDark 
                          ? ' bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border-blue-500' 
                          : ' bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg border-blue-400'
                        );
                      }
                      
                      return baseClasses + (isDark 
                        ? ' text-slate-300 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 hover:text-white border-transparent hover:border-slate-600' 
                        : ' text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:text-gray-900 border-transparent hover:border-gray-300'
                      );
                    }}
                    onClick={() => isMobile && onClose()}
                    title={isCollapsed && !isMobile ? item.name : ''}
                    onMouseEnter={() => setHoveredItem(item.name)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-white rounded-r-full"></div>
                    )}
                    
                    <div className="flex items-center space-x-4 relative z-10">
                      <div className="relative">
                        <Icon className="w-6 h-6 flex-shrink-0" />
                        {isActive && (
                          <div className="absolute -inset-1 bg-white/20 rounded-lg animate-pulse"></div>
                        )}
                      </div>
                      
                      {(!isCollapsed || isMobile) && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold truncate">{item.name}</span>
                            {item.badge && (
                              <span className={`
                                text-xs px-2 py-1 rounded-full font-bold ml-2
                                ${item.badge === 'New' 
                                  ? 'bg-emerald-500 text-white' 
                                  : isDark 
                                    ? 'bg-slate-600 text-slate-200' 
                                    : 'bg-gray-200 text-gray-700'
                                }
                              `}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-xs opacity-75 truncate mt-1">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </div>
                  </NavLink>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && !isMobile && hoveredItem === item.name && (
                    <div className={`
                      absolute left-full ml-3 px-4 py-3 text-sm rounded-xl shadow-2xl z-50 whitespace-nowrap border
                      ${isDark 
                        ? 'bg-slate-900 text-white border-slate-700' 
                        : 'bg-white text-gray-900 border-gray-200'
                      }
                    `}>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs opacity-75 mt-1">{item.description}</div>
                      <div className={`
                        absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-4 h-4 rotate-45
                        ${isDark 
                          ? 'bg-slate-900 border-l border-b border-slate-700' 
                          : 'bg-white border-l border-b border-gray-200'
                        }
                      `}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Public Site Link */}
      <div className={`
        px-4 py-3 border-t flex-shrink-0
        ${isDark ? 'border-slate-700' : 'border-gray-200'}
      `}>
        <Link
          to="/"
          className={`
            group flex items-center px-4 py-3 text-sm font-semibold rounded-xl
            transition-all duration-200 transform hover:scale-105 border
            ${isCollapsed && !isMobile ? 'justify-center' : ''}
            ${isDark 
              ? 'text-slate-300 hover:bg-gradient-to-r hover:from-emerald-600/20 hover:to-emerald-700/20 hover:text-emerald-400 border-transparent hover:border-emerald-500/30' 
              : 'text-gray-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 hover:text-emerald-600 border-transparent hover:border-emerald-300'
            }
          `}
          title={isCollapsed && !isMobile ? 'Visit Public Site' : ''}
        >
          <GlobeAltIcon className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && (
            <div className="ml-3">
              <div className="font-semibold">Public Site</div>
              <div className="text-xs opacity-75">Visit Homepage</div>
            </div>
          )}
        </Link>
      </div>

      {/* Help Link */}
      <div className={`
        px-4 py-2 border-t flex-shrink-0
        ${isDark ? 'border-slate-700' : 'border-gray-200'}
      `}>
        <NavLink
          to="/help"
          className={`
            group flex items-center px-4 py-3 text-sm font-semibold rounded-xl
            transition-all duration-200 transform hover:scale-105 border
            ${isCollapsed && !isMobile ? 'justify-center' : ''}
            ${isDark 
              ? 'text-slate-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-purple-700/20 hover:text-purple-400 border-transparent hover:border-purple-500/30' 
              : 'text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-600 border-transparent hover:border-purple-300'
            }
          `}
          title={isCollapsed && !isMobile ? 'Get Help' : ''}
        >
          <QuestionMarkCircleIcon className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && (
            <div className="ml-3">
              <div className="font-semibold">Help & Support</div>
              <div className="text-xs opacity-75">Get assistance</div>
            </div>
          )}
        </NavLink>
      </div>

      {/* User Section - Fixed at bottom */}
      <div className={`
        p-4 border-t flex-shrink-0
        ${isDark 
          ? 'border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900' 
          : 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100'
        }
      `}>
        {(!isCollapsed || isMobile) && user && (
          <div className={`
            flex items-center px-4 py-4 mb-4 backdrop-blur-sm rounded-xl border shadow-lg
            ${isDark 
              ? 'bg-slate-800/50 border-slate-600' 
              : 'bg-white/80 border-gray-200'
            }
          `}>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="ml-4 min-w-0 flex-1">
              <div className={`
                text-sm font-bold truncate
                ${isDark ? 'text-white' : 'text-gray-900'}
              `}>
                {user?.first_name} {user?.last_name}
              </div>
              <div className={`
                text-xs truncate
                ${isDark ? 'text-slate-400' : 'text-gray-500'}
              `}>
                {user?.role || 'Administrator'}
              </div>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                <div className="text-xs text-emerald-500 font-medium">Online</div>
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center px-4 py-4 text-sm font-semibold rounded-xl
            transition-all duration-200 transform hover:scale-105 border
            ${isCollapsed && !isMobile ? 'justify-center' : ''}
            ${isDark 
              ? 'text-red-400 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-700/20 hover:text-red-300 border-red-500/30 hover:border-red-400' 
              : 'text-red-500 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600 border-red-300 hover:border-red-400'
            }
          `}
          title={isCollapsed && !isMobile ? 'Logout' : ''}
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && (
            <div className="ml-3 text-left">
              <div className="font-semibold">Sign Out</div>
              <div className="text-xs opacity-75">Logout securely</div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;