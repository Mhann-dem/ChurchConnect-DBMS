// utils/navigation.js - Navigation constants and route definitions

// Permission levels
export const PERMISSION_LEVELS = {
  PUBLIC: 'public',
  AUTHENTICATED: 'authenticated', 
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// User roles
export const USER_ROLES = {
  GUEST: 'guest',
  MEMBER: 'member',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Route definitions with permissions and metadata
export const ADMIN_ROUTES = {
  // Dashboard
  DASHBOARD: {
    path: '/admin/dashboard',
    title: 'Dashboard',
    description: 'Overview of church activities and key metrics',
    icon: 'BarChart3',
    permission: PERMISSION_LEVELS.ADMIN,
    group: 'main',
    order: 1,
    breadcrumbs: [
      { title: 'Admin', path: '/admin' },
      { title: 'Dashboard', path: '/admin/dashboard' }
    ]
  },

  // Members Management
  MEMBERS: {
    path: '/admin/members',
    title: 'Members',
    description: 'Manage church members and their information',
    icon: 'Users',
    permission: PERMISSION_LEVELS.ADMIN,
    group: 'management',
    order: 2,
    breadcrumbs: [
      { title: 'Admin', path: '/admin' },
      { title: 'Members', path: '/admin/members' }
    ],
    subRoutes: {
      LIST: {
        path: '/admin/members',
        title: 'All Members',
        description: 'View and manage all church members'
      },
      NEW: {
        path: '/admin/members/new',
        title: 'Add Member',
        description: 'Register a new church member',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Members', path: '/admin/members' },
          { title: 'Add Member', path: '/admin/members/new' }
        ]
      },
      CALENDAR: {
        path: '/admin/events/calendar',
        title: 'Event Calendar',
        description: 'View events in calendar format',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Events', path: '/admin/events' },
          { title: 'Calendar', path: '/admin/events/calendar' }
        ]
      },
      DETAIL: {
        path: '/admin/events/:id',
        title: 'Event Details',
        description: 'View event information and attendees',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Events', path: '/admin/events' },
          { title: 'Event Details', path: null }
        ]
      }
    }
  },

  // Reports & Analytics
  REPORTS: {
    path: '/admin/reports',
    title: 'Reports & Analytics',
    description: 'Generate comprehensive reports and view analytics',
    icon: 'FileText',
    permission: PERMISSION_LEVELS.ADMIN,
    group: 'analytics',
    order: 6,
    breadcrumbs: [
      { title: 'Admin', path: '/admin' },
      { title: 'Reports', path: '/admin/reports' }
    ],
    subRoutes: {
      OVERVIEW: {
        path: '/admin/reports',
        title: 'Reports Overview',
        description: 'View all available reports'
      },
      MEMBERS: {
        path: '/admin/reports/members',
        title: 'Member Reports',
        description: 'Member statistics and analytics',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Reports', path: '/admin/reports' },
          { title: 'Member Reports', path: '/admin/reports/members' }
        ]
      },
      FINANCIAL: {
        path: '/admin/reports/financial',
        title: 'Financial Reports',
        description: 'Pledge and donation analytics',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Reports', path: '/admin/reports' },
          { title: 'Financial Reports', path: '/admin/reports/financial' }
        ]
      },
      ATTENDANCE: {
        path: '/admin/reports/attendance',
        title: 'Attendance Reports',
        description: 'Event and service attendance tracking',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Reports', path: '/admin/reports' },
          { title: 'Attendance Reports', path: '/admin/reports/attendance' }
        ]
      },
      CUSTOM: {
        path: '/admin/reports/custom',
        title: 'Custom Reports',
        description: 'Build custom reports with report builder',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Reports', path: '/admin/reports' },
          { title: 'Custom Reports', path: '/admin/reports/custom' }
        ]
      }
    }
  },

  // Communications
  COMMUNICATIONS: {
    path: '/admin/communications',
    title: 'Communications',
    description: 'Manage church communications and notifications',
    icon: 'MessageSquare',
    permission: PERMISSION_LEVELS.ADMIN,
    group: 'management',
    order: 7,
    breadcrumbs: [
      { title: 'Admin', path: '/admin' },
      { title: 'Communications', path: '/admin/communications' }
    ],
    subRoutes: {
      ANNOUNCEMENTS: {
        path: '/admin/communications/announcements',
        title: 'Announcements',
        description: 'Create and manage church announcements',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Communications', path: '/admin/communications' },
          { title: 'Announcements', path: '/admin/communications/announcements' }
        ]
      },
      EMAIL: {
        path: '/admin/communications/email',
        title: 'Email Campaigns',
        description: 'Send emails to members and groups',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Communications', path: '/admin/communications' },
          { title: 'Email Campaigns', path: '/admin/communications/email' }
        ]
      },
      SMS: {
        path: '/admin/communications/sms',
        title: 'SMS Messages',
        description: 'Send SMS notifications to members',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Communications', path: '/admin/communications' },
          { title: 'SMS Messages', path: '/admin/communications/sms' }
        ]
      }
    }
  },

  // Settings & Administration
  SETTINGS: {
    path: '/admin/settings',
    title: 'Settings',
    description: 'Configure system preferences and administrative options',
    icon: 'Settings',
    permission: PERMISSION_LEVELS.ADMIN,
    group: 'system',
    order: 8,
    breadcrumbs: [
      { title: 'Admin', path: '/admin' },
      { title: 'Settings', path: '/admin/settings' }
    ],
    subRoutes: {
      GENERAL: {
        path: '/admin/settings/general',
        title: 'General Settings',
        description: 'Basic church and system configuration',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Settings', path: '/admin/settings' },
          { title: 'General', path: '/admin/settings/general' }
        ]
      },
      USERS: {
        path: '/admin/settings/users',
        title: 'User Management',
        description: 'Manage admin users and permissions',
        permission: PERMISSION_LEVELS.SUPER_ADMIN,
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Settings', path: '/admin/settings' },
          { title: 'Users', path: '/admin/settings/users' }
        ]
      },
      SECURITY: {
        path: '/admin/settings/security',
        title: 'Security Settings',
        description: 'Configure security and authentication settings',
        permission: PERMISSION_LEVELS.SUPER_ADMIN,
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Settings', path: '/admin/settings' },
          { title: 'Security', path: '/admin/settings/security' }
        ]
      },
      BACKUP: {
        path: '/admin/settings/backup',
        title: 'Backup & Restore',
        description: 'Manage data backups and system restoration',
        permission: PERMISSION_LEVELS.SUPER_ADMIN,
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Settings', path: '/admin/settings' },
          { title: 'Backup', path: '/admin/settings/backup' }
        ]
      },
      INTEGRATIONS: {
        path: '/admin/settings/integrations',
        title: 'Integrations',
        description: 'Configure third-party service integrations',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Settings', path: '/admin/settings' },
          { title: 'Integrations', path: '/admin/settings/integrations' }
        ]
      }
    }
  },

  // Profile Management
  PROFILE: {
    path: '/admin/profile',
    title: 'Profile',
    description: 'Manage your account settings and preferences',
    icon: 'User',
    permission: PERMISSION_LEVELS.AUTHENTICATED,
    group: 'account',
    order: 9,
    breadcrumbs: [
      { title: 'Admin', path: '/admin' },
      { title: 'Profile', path: '/admin/profile' }
    ],
    subRoutes: {
      OVERVIEW: {
        path: '/admin/profile',
        title: 'Profile Overview',
        description: 'View and edit your profile information'
      },
      SECURITY: {
        path: '/admin/profile/security',
        title: 'Security Settings',
        description: 'Change password and security preferences',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Profile', path: '/admin/profile' },
          { title: 'Security', path: '/admin/profile/security' }
        ]
      },
      PREFERENCES: {
        path: '/admin/profile/preferences',
        title: 'Preferences',
        description: 'Configure your system preferences',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Profile', path: '/admin/profile' },
          { title: 'Preferences', path: '/admin/profile/preferences' }
        ]
      }
    }
  },

  // Help & Support
  HELP: {
    path: '/admin/help',
    title: 'Help & Support',
    description: 'Get help and access documentation',
    icon: 'HelpCircle',
    permission: PERMISSION_LEVELS.AUTHENTICATED,
    group: 'support',
    order: 10,
    breadcrumbs: [
      { title: 'Admin', path: '/admin' },
      { title: 'Help', path: '/admin/help' }
    ],
    subRoutes: {
      OVERVIEW: {
        path: '/admin/help',
        title: 'Help Center',
        description: 'Browse help topics and documentation'
      },
      FAQ: {
        path: '/admin/help/faq',
        title: 'FAQ',
        description: 'Frequently asked questions',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Help', path: '/admin/help' },
          { title: 'FAQ', path: '/admin/help/faq' }
        ]
      },
      TUTORIALS: {
        path: '/admin/help/tutorials',
        title: 'Tutorials',
        description: 'Step-by-step guides and tutorials',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Help', path: '/admin/help' },
          { title: 'Tutorials', path: '/admin/help/tutorials' }
        ]
      },
      CONTACT: {
        path: '/admin/help/contact',
        title: 'Contact Support',
        description: 'Get in touch with our support team',
        breadcrumbs: [
          { title: 'Admin', path: '/admin' },
          { title: 'Help', path: '/admin/help' },
          { title: 'Contact', path: '/admin/help/contact' }
        ]
      }
    }
  }
};

// Public routes (non-admin)
export const PUBLIC_ROUTES = {
  HOME: {
    path: '/',
    title: 'Home',
    description: 'Church homepage',
    permission: PERMISSION_LEVELS.PUBLIC
  },
  ABOUT: {
    path: '/about',
    title: 'About Us',
    description: 'Learn about our church',
    permission: PERMISSION_LEVELS.PUBLIC
  },
  CONTACT: {
    path: '/contact',
    title: 'Contact',
    description: 'Get in touch with us',
    permission: PERMISSION_LEVELS.PUBLIC
  },
  REGISTER: {
    path: '/register',
    title: 'Member Registration',
    description: 'Register as a new church member',
    permission: PERMISSION_LEVELS.PUBLIC
  }
};

// Authentication routes
export const AUTH_ROUTES = {
  LOGIN: {
    path: '/admin/login',
    title: 'Admin Login',
    description: 'Sign in to admin dashboard',
    permission: PERMISSION_LEVELS.PUBLIC
  },
  FORGOT_PASSWORD: {
    path: '/admin/forgot-password',
    title: 'Forgot Password',
    description: 'Reset your password',
    permission: PERMISSION_LEVELS.PUBLIC
  },
  RESET_PASSWORD: {
    path: '/admin/reset-password',
    title: 'Reset Password',
    description: 'Create new password',
    permission: PERMISSION_LEVELS.PUBLIC
  }
};

// Navigation groups with metadata
export const NAVIGATION_GROUPS = {
  main: {
    title: 'Overview',
    order: 1,
    icon: 'BarChart3'
  },
  management: {
    title: 'Management',
    order: 2,
    icon: 'Users'
  },
  financial: {
    title: 'Financial',
    order: 3,
    icon: 'DollarSign'
  },
  analytics: {
    title: 'Analytics',
    order: 4,
    icon: 'TrendingUp'
  },
  system: {
    title: 'System',
    order: 5,
    icon: 'Settings'
  },
  account: {
    title: 'Account',
    order: 6,
    icon: 'User'
  },
  support: {
    title: 'Support',
    order: 7,
    icon: 'HelpCircle'
  }
};

// Helper functions for navigation
export const getRoutesByGroup = (group, userRole = USER_ROLES.ADMIN) => {
  return Object.values(ADMIN_ROUTES)
    .filter(route => 
      route.group === group && 
      hasPermission(userRole, route.permission)
    )
    .sort((a, b) => a.order - b.order);
};

export const getAllRoutesForUser = (userRole = USER_ROLES.ADMIN) => {
  return Object.values(ADMIN_ROUTES)
    .filter(route => hasPermission(userRole, route.permission))
    .sort((a, b) => a.order - b.order);
};

export const getNavigationGroups = (userRole = USER_ROLES.ADMIN) => {
  const userRoutes = getAllRoutesForUser(userRole);
  const groupsWithRoutes = new Set(userRoutes.map(route => route.group));
  
  return Object.entries(NAVIGATION_GROUPS)
    .filter(([key]) => groupsWithRoutes.has(key))
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, group]) => ({
      key,
      ...group,
      routes: getRoutesByGroup(key, userRole)
    }));
};

export const hasPermission = (userRole, requiredPermission) => {
  const roleHierarchy = {
    [USER_ROLES.GUEST]: 0,
    [USER_ROLES.MEMBER]: 1,
    [USER_ROLES.ADMIN]: 2,
    [USER_ROLES.SUPER_ADMIN]: 3
  };

  const permissionLevels = {
    [PERMISSION_LEVELS.PUBLIC]: 0,
    [PERMISSION_LEVELS.AUTHENTICATED]: 1,
    [PERMISSION_LEVELS.ADMIN]: 2,
    [PERMISSION_LEVELS.SUPER_ADMIN]: 3
  };

  return roleHierarchy[userRole] >= permissionLevels[requiredPermission];
};

export const findRouteByPath = (path) => {
  // Check admin routes
  for (const route of Object.values(ADMIN_ROUTES)) {
    if (route.path === path) return route;
    
    // Check sub-routes
    if (route.subRoutes) {
      for (const subRoute of Object.values(route.subRoutes)) {
        if (subRoute.path === path) return { ...subRoute, parent: route };
      }
    }
  }

  // Check public routes
  for (const route of Object.values(PUBLIC_ROUTES)) {
    if (route.path === path) return route;
  }

  // Check auth routes
  for (const route of Object.values(AUTH_ROUTES)) {
    if (route.path === path) return route;
  }

  return null;
};

export const buildBreadcrumbs = (currentPath, dynamicData = {}) => {
  const route = findRouteByPath(currentPath);
  
  if (!route) {
    return [{ title: 'Admin', path: '/admin' }];
  }

  let breadcrumbs = route.breadcrumbs || [];
  
  // Handle dynamic breadcrumbs (e.g., member names, group titles)
  breadcrumbs = breadcrumbs.map(crumb => {
    if (crumb.path === null && dynamicData.title) {
      return { ...crumb, title: dynamicData.title };
    }
    return crumb;
  });

  return breadcrumbs;
};

export const getPageMetadata = (path) => {
  const route = findRouteByPath(path);
  
  return {
    title: route?.title || 'ChurchConnect Admin',
    description: route?.description || 'Church management system',
    breadcrumbs: route?.breadcrumbs || []
  };
};

// Keyboard shortcuts mapping
export const KEYBOARD_SHORTCUTS = {
  'ctrl+b': {
    description: 'Toggle sidebar',
    action: 'toggleSidebar'
  },
  'ctrl+k': {
    description: 'Open command palette',
    action: 'openCommandPalette'
  },
  'ctrl+/': {
    description: 'Show keyboard shortcuts',
    action: 'showShortcuts'
  },
  'alt+d': {
    description: 'Go to dashboard',
    action: 'navigate',
    path: '/admin/dashboard'
  },
  'alt+m': {
    description: 'Go to members',
    action: 'navigate',
    path: '/admin/members'
  },
  'alt+g': {
    description: 'Go to groups',
    action: 'navigate',
    path: '/admin/groups'
  },
  'alt+p': {
    description: 'Go to pledges',
    action: 'navigate',
    path: '/admin/pledges'
  },
  'alt+r': {
    description: 'Go to reports',
    action: 'navigate',
    path: '/admin/reports'
  },
  'alt+e': {
    description: 'Go to events',
    action: 'navigate',
    path: '/admin/events'
  },
  'alt+s': {
    description: 'Go to settings',
    action: 'navigate',
    path: '/admin/settings'
  },
  'escape': {
    description: 'Close modal/sidebar',
    action: 'closeOverlay'
  }
};

// Quick actions for command palette
export const QUICK_ACTIONS = [
  {
    id: 'add-member',
    title: 'Add New Member',
    description: 'Register a new church member',
    icon: 'UserPlus',
    path: '/admin/members/new',
    keywords: ['member', 'add', 'register', 'new', 'person']
  },
  {
    id: 'create-group',
    title: 'Create New Group',
    description: 'Create a new ministry group',
    icon: 'Users2',
    path: '/admin/groups/new',
    keywords: ['group', 'ministry', 'create', 'new', 'team']
  },
  {
    id: 'record-pledge',
    title: 'Record Pledge',
    description: 'Record a new pledge or donation',
    icon: 'DollarSign',
    path: '/admin/pledges/new',
    keywords: ['pledge', 'donation', 'money', 'financial', 'give']
  },
  {
    id: 'create-event',
    title: 'Create Event',
    description: 'Plan a new church event',
    icon: 'Calendar',
    path: '/admin/events/new',
    keywords: ['event', 'activity', 'service', 'meeting', 'schedule']
  },
  {
    id: 'view-reports',
    title: 'View Reports',
    description: 'Access reports and analytics',
    icon: 'FileText',
    path: '/admin/reports',
    keywords: ['report', 'analytics', 'statistics', 'data', 'insights']
  },
  {
    id: 'member-search',
    title: 'Search Members',
    description: 'Find and view member information',
    icon: 'Search',
    path: '/admin/members',
    keywords: ['search', 'find', 'member', 'person', 'contact']
  },
  {
    id: 'settings',
    title: 'System Settings',
    description: 'Configure system preferences',
    icon: 'Settings',
    path: '/admin/settings',
    keywords: ['settings', 'config', 'preferences', 'system', 'admin']
  }
];

export default {
  ADMIN_ROUTES,
  PUBLIC_ROUTES,
  AUTH_ROUTES,
  NAVIGATION_GROUPS,
  PERMISSION_LEVELS,
  USER_ROLES,
  KEYBOARD_SHORTCUTS,
  QUICK_ACTIONS,
  getRoutesByGroup,
  getAllRoutesForUser,
  getNavigationGroups,
  hasPermission,
  findRouteByPath,
  buildBreadcrumbs,
  getPageMetadata
};