import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const navigationItems = [
  { name: 'Home', href: '/' },
  { name: 'Register', href: '/form' },
  { name: 'Help', href: '/help' },
  { name: 'FAQ', href: '/faq' }
];

export const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="ChurchConnect" 
              className="h-8 w-8 mr-2"
            />
            <span className="text-xl font-bold text-gray-900">ChurchConnect</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Admin Login Link */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink
              to="/auth/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Admin Login
            </NavLink>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </NavLink>
              ))}
              <NavLink
                to="/auth/login"
                className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Login
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;