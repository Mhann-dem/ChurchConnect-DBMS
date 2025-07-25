import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  UserPlusIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const navigationItems = [
  { 
    name: 'Home', 
    href: '/',
    icon: HomeIcon,
    description: 'Return to homepage',
    exact: true
  },
  { 
    name: 'Join Us', 
    href: '/register',
    icon: UserPlusIcon,
    description: 'Become a church member',
    aliases: ['/form', '/member-registration']
  },
  { 
    name: 'Events', 
    href: '/events',
    icon: CalendarDaysIcon,
    description: 'Upcoming church events'
  },
  { 
    name: 'Ministries', 
    href: '/ministries',
    icon: UserGroupIcon,
    description: 'Explore our ministries'
  },
  { 
    name: 'Help', 
    href: '/help',
    icon: QuestionMarkCircleIcon,
    description: 'Get assistance and support'
  },
  { 
    name: 'FAQ', 
    href: '/faq',
    icon: ChatBubbleLeftRightIcon,
    description: 'Frequently asked questions'
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

  // Check if current path matches nav item or its aliases
  const isActiveItem = (item) => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    
    if (location.pathname === item.href) {
      return true;
    }
    
    if (item.aliases) {
      return item.aliases.includes(location.pathname);
    }
    
    return false;
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
      <div className="space-y-1" role="navigation" aria-label="Main navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveItem(item);
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive: linkActive }) =>
                `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive || linkActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
              onClick={closeDropdowns}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 mr-3" aria-hidden="true" />
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
    <div className="flex space-x-1" role="navigation" aria-label="Main navigation">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActiveItem(item);
        
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
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
              <span>{item.name}</span>
              
              {/* Tooltip/Dropdown indicator */}
              <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
              </div>
            </NavLink>

            {/* Tooltip/Description */}
            {activeDropdown === item.name && (
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50"
                role="tooltip"
              >
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