import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  UserPlusIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

const navigationItems = [
  { 
    name: 'Home', 
    href: '/',
    icon: HomeIcon,
    description: 'Back to homepage'
  },
  { 
    name: 'Register', 
    href: '/form',
    icon: UserPlusIcon,
    description: 'Join our church'
  },
  { 
    name: 'Help', 
    href: '/help',
    icon: QuestionMarkCircleIcon,
    description: 'Get assistance'
  },
  { 
    name: 'FAQ', 
    href: '/faq',
    icon: ChatBubbleLeftRightIcon,
    description: 'Common questions'
  }
];

export const Navigation = ({ isMobile = false }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

  const toggleDropdown = (itemName) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName);
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.nav-dropdown')) {
        closeDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  if (isMobile) {
    return (
      <div className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
              onClick={closeDropdowns}
            >
              <Icon className="h-5 w-5 mr-3" />
              <div>
                <div>{item.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </div>
              </div>
            </NavLink>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex space-x-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <div key={item.name} className="relative nav-dropdown">
            <NavLink
              to={item.href}
              className={({ isActive: linkActive }) =>
                `group flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive || linkActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
              onMouseEnter={() => setActiveDropdown(item.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Icon className="h-4 w-4 mr-2" />
              <span>{item.name}</span>
              
              {/* Tooltip/Dropdown indicator */}
              <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronDownIcon className="h-3 w-3" />
              </div>
            </NavLink>

            {/* Tooltip/Description */}
            {activeDropdown === item.name && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50">
                {item.description}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Navigation;