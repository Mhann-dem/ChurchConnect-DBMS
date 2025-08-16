import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';

const Header = ({ onMenuClick, user, sidebarOpen = false, isAdmin = true, isPublic = false }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/members')) return 'Members Management';
    if (path.includes('/groups')) return 'Groups Management';
    if (path.includes('/pledges')) return 'Pledges & Donations';
    if (path.includes('/reports')) return 'Reports & Analytics';
    if (path.includes('/settings')) return 'System Settings';
    return 'Admin Panel';
  };

  // Public navigation items
  const publicNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Join Us', href: '/register' },
    { name: 'Events', href: '/events' },
    { name: 'Ministries', href: '/ministries' },
    { name: 'Contact', href: '/contact' },
    { name: 'Feedback', href: '/feedback' },
  ];

  // Admin navigation items for large screens
  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard' },
    { name: 'Members', href: '/admin/members' },
    { name: 'Groups', href: '/admin/groups' },
    { name: 'Pledges', href: '/admin/pledges' },
    { name: 'Reports', href: '/admin/reports' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  // Public header for non-admin pages
  if (!isAdmin || isPublic) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CC</span>
                </div>
                <div className="ml-3">
                  <span className="text-xl font-bold text-blue-600">Church</span>
                  <span className="text-xl font-bold text-gray-700">Connect</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Horizontal Display */}
            <nav className="hidden md:flex items-center space-x-1">
              {publicNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Desktop Auth */}
              <div className="hidden md:flex items-center space-x-3">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-medium">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </div>
                      <span className="text-sm text-gray-700">
                        {user.first_name}
                      </span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link 
                    to="/admin/login"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Admin Login
                  </Link>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                {showMobileMenu ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Popup */}
          {showMobileMenu && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm"
                onClick={() => setShowMobileMenu(false)}
              />
              
              <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">CC</span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">ChurchConnect</h2>
                  </div>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <nav className="p-4 space-y-1">
                  {publicNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                          ${isActive 
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="mr-3 text-lg">
                          {item.name === 'Home' && '🏠'}
                          {item.name === 'Join Us' && '👥'}
                          {item.name === 'Events' && '📅'}
                          {item.name === 'Ministries' && '⛪'}
                          {item.name === 'Contact' && '📞'}
                          {item.name === 'Feedback' && '💬'}
                        </span>
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center px-4 py-3 bg-white rounded-lg border border-gray-200">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-medium">
                          {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
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
                        className="w-full bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  ) : (
                    <Link 
                      to="/admin/login"
                      className="block w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium text-center hover:bg-blue-700 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      🔐 Admin Login
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

  // Admin header - Now includes horizontal navigation on large screens
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16">
      <div className="px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Page Title - Only show on mobile/tablet */}
            <div className="lg:hidden">
              <h1 className="text-lg font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>

            {/* Desktop Navigation - Horizontal Display */}
            <nav className="hidden lg:flex items-center space-x-1">
              {adminNavigation.map((item) => {
                const isActive = location.pathname === item.href || 
                               (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center - Search (Hidden on smaller screens when nav is visible) */}
          <div className="flex-1 max-w-md mx-4 hidden xl:block">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Quick Add Button */}
            <Link
              to="/admin/members/new"
              className="hidden sm:inline-flex bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Add Member
            </Link>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-xs font-medium">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-900">
                  {user?.first_name}
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <Link
                    to="/admin/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logout
                  </button>
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