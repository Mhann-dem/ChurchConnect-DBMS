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
    exact: true,
    emoji: '🏠'
  },
  { 
    name: 'Join Us', 
    href: '/register',
    icon: UserPlusIcon,
    description: 'Become a church member',
    aliases: ['/form', '/member-registration'],
    emoji: '👥'
  },
  { 
    name: 'Events', 
    href: '/events',
    icon: CalendarDaysIcon,
    description: 'Upcoming church events',
    emoji: '📅'
  },
  { 
    name: 'Ministries', 
    href: '/ministries',
    icon: UserGroupIcon,
    description: 'Explore our ministries',
    emoji: '⛪'
  },
  { 
    name: 'Help', 
    href: '/help',
    icon: QuestionMarkCircleIcon,
    description: 'Get assistance and support',
    emoji: '❓'
  },
  { 
    name: 'FAQ', 
    href: '/faq',
    icon: ChatBubbleLeftRightIcon,
    description: 'Frequently asked questions',
    emoji: '💬'
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
      <div className="space-y-2" role="navigation" aria-label="Main navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveItem(item);
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive: linkActive }) =>
                `flex items-center px-4 py-4 rounded-xl text-base font-bold transition-all duration-300 border-2 ${
                  isActive || linkActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-400/50 shadow-xl'
                    : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-xl border-transparent hover:border-white/20'
                }`
              }
              onClick={closeDropdowns}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="text-xl mr-4">{item.emoji}</div>
              <div>
                <div className="font-bold">{item.name}</div>
                <div className="text-xs text-gray-400 mt-1">
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
                `group flex flex-col items-center px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 relative overflow-hidden ${
                  isActive || linkActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-400/50 shadow-xl backdrop-blur-sm'
                    : 'text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-xl border-transparent hover:border-white/20 backdrop-blur-sm hover:scale-105'
                }`
              }
              onMouseEnter={() => setActiveDropdown(item.name)}
              onMouseLeave={() => setActiveDropdown(null)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="text-lg mb-1 transform group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
              <span className="text-xs uppercase tracking-wider">{item.name}</span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
              )}
              
              {/* Tooltip/Dropdown indicator */}
              <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronDownIcon className="h-3 w-3 absolute -bottom-1 left-1/2 transform -translate-x-1/2" aria-hidden="true" />
              </div>
            </NavLink>

            {/* Tooltip/Description */}
            {activeDropdown === item.name && (
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs rounded-xl shadow-2xl whitespace-nowrap z-50 border border-white/20 backdrop-blur-sm"
                role="tooltip"
              >
                <div className="font-bold text-blue-300">{item.name}</div>
                <div className="text-gray-400 mt-1">{item.description}</div>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-l border-t border-white/20"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Navigation;