import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserCircleIcon,
  XMarkIcon,
  HomeIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';

const Header = ({ onMenuClick, user, sidebarOpen = false, isAdmin = true, isPublic = false, isMobile = false, isCollapsed = false }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard Overview';
    if (path.includes('/members')) return 'Member Management';
    if (path.includes('/groups')) return 'Group Management';
    if (path.includes('/pledges')) return 'Pledge Management';
    if (path.includes('/reports')) return 'Reports & Analytics';
    if (path.includes('/settings')) return 'System Settings';
    return 'Admin Panel';
  };

  const getPageDescription = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Key metrics and insights';
    if (path.includes('/members')) return 'Manage church members';
    if (path.includes('/groups')) return 'Manage ministry groups';
    if (path.includes('/pledges')) return 'Track donations and pledges';
    if (path.includes('/reports')) return 'View detailed analytics';
    if (path.includes('/settings')) return 'Configure system settings';
    return 'Administrative functions';
  };

  // Public navigation items
  const publicNavigation = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Join Us', href: '/register', icon: '👥' },
    { name: 'Events', href: '/events', icon: '📅' },
    { name: 'Ministries', href: '/ministries', icon: '⛪' },
    { name: 'Contact', href: '/contact', icon: '📞' },
    { name: 'Feedback', href: '/feedback', icon: '💬' },
  ];

  // Mock notifications
  const notifications = [
    { id: 1, type: 'member', title: 'New Member Registration', message: 'John Doe has registered', time: '2 min ago', unread: true },
    { id: 2, type: 'pledge', title: 'Pledge Update', message: 'Monthly pledge target reached', time: '1 hour ago', unread: true },
    { id: 3, type: 'system', title: 'System Update', message: 'Database backup completed', time: '3 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Public header for non-admin pages
  if (!isAdmin || isPublic) {
    return (
      <header className="bg-white shadow-xl border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-white font-bold text-xl">CC</span>
                </div>
                <div className="ml-4">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-gray-900">Church</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Connect</span>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">Connecting Faith & Community</div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {publicNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap group
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:shadow-md transform hover:scale-105'
                      }
                    `}
                  >
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Admin Dashboard Link */}
              {user && (
                <Link
                  to="/admin/dashboard"
                  className="hidden md:flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="mr-2">🛠️</span>
                  Admin Panel
                </Link>
              )}

              {/* Desktop Auth */}
              <div className="hidden md:flex items-center space-x-4">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-3 border border-blue-200">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Welcome back, {user.first_name}!
                        </div>
                        <div className="text-xs text-gray-500">{user.role || 'Member'}</div>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center text-sm text-red-600 hover:text-red-700 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 border border-red-200 hover:border-red-300 font-semibold"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link 
                    to="/admin/login"
                    className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span className="mr-2">🔐</span>
                    Admin Login
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                {showMobileMenu ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setShowMobileMenu(false)}
              />
              
              <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-2xl z-50 lg:hidden transform transition-transform duration-300">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">CC</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">ChurchConnect</h2>
                  </div>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-all duration-200"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <nav className="p-6 space-y-3">
                  {publicNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200
                          ${isActive 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="mr-4 text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    );
                  })}

                  {/* Admin Panel Link for Mobile */}
                  {user && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center px-4 py-4 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 mt-6"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <span className="mr-4 text-lg">🛠️</span>
                      Admin Panel
                    </Link>
                  )}
                </nav>

                {/* Mobile User Section */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center px-4 py-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md">
                          {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          handleLogout();
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center justify-center bg-gradient-to-r from-red-50 to-red-100 text-red-600 px-4 py-4 rounded-xl text-sm font-semibold hover:from-red-100 hover:to-red-200 transition-all duration-200 border border-red-200"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <Link 
                      to="/admin/login"
                      className="flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-4 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <span className="mr-2">🔐</span>
                      Admin Login
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </header>
    );
  }

  // Admin header
  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-b border-slate-700 h-20">
      <div className="px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left Section */}
          <div className="flex items-center space-x-6">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 border border-slate-600"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Page Title and Breadcrumb Info */}
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white">
                {getPageTitle()}
              </h1>
              <p className="text-sm text-slate-400 hidden sm:block">
                {getPageDescription()}
              </p>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-xl mx-8 hidden lg:block">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="search"
                placeholder="Search members, groups, reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 backdrop-blur-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Quick Add Button */}
            <Link
              to="/admin/members/new"
              className="hidden sm:flex items-center bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              <span className="hidden md:inline">Add Member</span>
            </Link>

            {/* Back to Public Site Link */}
            <Link
              to="/"
              className="hidden xl:flex items-center px-4 py-3 text-sm font-semibold text-slate-300 hover:text-emerald-400 hover:bg-emerald-600/10 rounded-xl transition-all duration-200 border border-slate-600 hover:border-emerald-500/30"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Public Site
            </Link>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 border border-slate-600 hover:border-slate-500"
              >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 backdrop-blur-sm">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Notifications</h3>
                      <span className="text-xs text-slate-400">{unreadCount} unread</span>
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`px-4 py-3 hover:bg-slate-700/50 border-l-4 ${notification.unread ? 'border-blue-500 bg-blue-500/5' : 'border-transparent'} transition-all duration-200`}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{notification.title}</p>
                            <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="px-4 py-3 border-t border-slate-700">
                    <button className="w-full text-center text-sm text-blue-400 hover:text-blue-300 font-semibold">
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 border border-slate-600 hover:border-slate-500"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-white">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-xs text-slate-400">{user?.role || 'Admin'}</div>
                </div>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {/* Enhanced User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-72 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 backdrop-blur-sm">
                  <div className="px-4 py-4 border-b border-slate-700 bg-gradient-to-r from-blue-600/10 to-indigo-600/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div className="text-xs text-slate-400">{user?.email}</div>
                        <div className="text-xs text-blue-400 font-semibold mt-1">{user?.role || 'Administrator'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      to="/admin/profile"
                      className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserCircleIcon className="w-5 h-5 mr-3" />
                      Profile Settings
                    </Link>
                    
                    <Link
                      to="/admin/settings"
                      className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <CogIcon className="w-5 h-5 mr-3" />
                      Admin Settings
                    </Link>
                    
                    <Link
                      to="/"
                      className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <HomeIcon className="w-5 h-5 mr-3" />
                      View Public Site
                    </Link>
                    
                    <div className="border-t border-slate-700 my-2"></div>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-600/10 hover:text-red-300 transition-all duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;