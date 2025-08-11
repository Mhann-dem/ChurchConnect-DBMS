import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';

const Header = ({ onMenuClick, user, sidebarOpen = false, isAdmin = true, isPublic = false }) => {
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/members')) return 'Members';
    if (path.includes('/groups')) return 'Groups';
    if (path.includes('/pledges')) return 'Pledges';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/settings')) return 'Settings';
    return 'Admin Panel';
  };

  // Public header for non-admin pages
  if (!isAdmin || isPublic) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="/assets/images/logo.png" 
                  alt="ChurchConnect" 
                  className="h-8 w-8"
                  onError={(e) => {
                    e.target.src = '/assets/images/icons/church.svg';
                  }}
                />
                <div className="ml-3">
                  <span className="text-xl font-bold text-blue-600">Church</span>
                  <span className="text-xl font-bold text-gray-700">Connect</span>
                </div>
              </Link>
            </div>

            {/* Public Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Home
              </Link>
              <Link to="/register" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Join Us
              </Link>
              <Link to="/events" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Events
              </Link>
              <Link to="/ministries" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Ministries
              </Link>
              <Link to="/help" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Help
              </Link>
            </nav>

            {/* Auth Links */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">Welcome, {user.first_name}</span>
                  <button 
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/admin/login"
                    className="text-gray-700 hover:text-blue-600 text-sm font-medium"
                  >
                    Admin Portal
                  </Link>
                  <Link 
                    to="/login"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Member Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Admin header
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Mobile menu button and page title */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={onMenuClick}
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Page Title */}
            <div className="ml-4 lg:ml-0">
              <h1 className="text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Center Section - Search (optional) */}
          <div className="flex-1 max-w-xs mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Right Section - User menu and notifications */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              type="button"
              className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="View notifications"
            >
              <BellIcon className="h-6 w-6" />
            </button>

            {/* User menu */}
            {user && (
              <div className="relative flex items-center">
                <div className="flex items-center space-x-3">
                  {/* User avatar */}
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  
                  {/* User info - hidden on small screens */}
                  <div className="hidden md:block">
                    <div className="flex items-center space-x-1">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.role || 'Administrator'}
                        </div>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Dropdown menu - you can implement this with a state */}
                {/* For now, just a logout button */}
                <button
                  onClick={handleLogout}
                  className="ml-3 text-sm text-gray-700 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;