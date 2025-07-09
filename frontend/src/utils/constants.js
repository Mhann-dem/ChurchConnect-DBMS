// ChurchConnect DBMS - Constants
// Application-wide constants and configuration values

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
export const API_TIMEOUT = 10000; // 10 seconds

// Authentication
export const TOKEN_KEY = 'churchconnect_token';
export const REFRESH_TOKEN_KEY = 'churchconnect_refresh_token';
export const TOKEN_EXPIRY_KEY = 'churchconnect_token_expiry';

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const APP_NAME = process.env.REACT_APP_APP_NAME || 'ChurchConnect';
export const APP_VERSION = process.env.REACT_APP_APP_VERSION || '1.0.0';

// Authentication Constants
export const JWT_EXPIRY = parseInt(process.env.REACT_APP_JWT_EXPIRY) || 3600;
export const SESSION_TIMEOUT = parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 1800;

// Routes
export const ROUTES = {
  HOME: '/',
  REGISTRATION: '/register',
  THANK_YOU: '/thank-you',
  ADMIN: {
    LOGIN: '/admin/login',
    DASHBOARD: '/admin/dashboard',
    MEMBERS: '/admin/members',
    MEMBER_DETAIL: '/admin/members/:id',
    GROUPS: '/admin/groups',
    GROUP_DETAIL: '/admin/groups/:id',
    PLEDGES: '/admin/pledges',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
  },
  AUTH: {
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    LOGOUT: '/auth/logout',
  },
  HELP: {
    CENTER: '/help',
    FAQ: '/help/faq',
    TUTORIALS: '/help/tutorials',
  },
  NOT_FOUND: '/404',
};


export const FORM_VALIDATION = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  EMAIL: {
    MAX_LENGTH: 254,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
  ADDRESS: {
    MAX_LENGTH: 255,
  },
  NOTES: {
    MAX_LENGTH: 1000,
  },
};

// Relationship Type Options
export const RELATIONSHIP_TYPE_OPTIONS = [
  { value: 'head', label: 'Head of Household' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'dependent', label: 'Dependent' },
  { value: 'other', label: 'Other' },
];

// Age Bracket Options
export const AGE_BRACKET_OPTIONS = [
  { value: '0-17', label: 'Under 18' },
  { value: '18-25', label: '18-25' },
  { value: '26-40', label: '26-40' },
  { value: '41-60', label: '41-60' },
  { value: '60+', label: '60+' },
];

// Admin Role Options
export const ADMIN_ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'readonly', label: 'Read Only' },
];


// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_VISIBLE_PAGES: 7,
};

// Toast/Notification Constants
export const TOAST = {
  DURATION: parseInt(process.env.REACT_APP_TOAST_DURATION) || 5000,
  POSITION: 'top-right',
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  },
};


// Accessibility Constants
export const ACCESSIBILITY = {
  KEYBOARD_DELAY: 300,
  FOCUS_VISIBLE_DELAY: 100,
  SCREEN_READER_DELAY: 500,
};

// Feature Flags
export const FEATURES = {
  DARK_MODE: process.env.REACT_APP_ENABLE_DARK_MODE === 'true',
  MULTI_LANGUAGE: process.env.REACT_APP_ENABLE_MULTI_LANGUAGE === 'true',
  ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  SERVICE_WORKER: process.env.REACT_APP_ENABLE_SERVICE_WORKER === 'true',
  ACCESSIBILITY: process.env.REACT_APP_ENABLE_ACCESSIBILITY_FEATURES === 'true',
  PUSH_NOTIFICATIONS: process.env.REACT_APP_ENABLE_PUSH_NOTIFICATIONS === 'true',
};


// Form Constants
export const FORM_STEPS = {
  PERSONAL_INFO: 'personal_info',
  CONTACT_INFO: 'contact_info',
  MINISTRY_INTERESTS: 'ministry_interests',
  PLEDGE_INFO: 'pledge_info',
  FAMILY_INFO: 'family_info',
  CONFIRMATION: 'confirmation'
};

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];

// Contact Method Options
export const CONTACT_METHOD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'sms', label: 'SMS/Text' },
  { value: 'mail', label: 'Mail' },
  { value: 'no_contact', label: 'No Contact' }
];

// Pledge Frequency Options
export const PLEDGE_FREQUENCY_OPTIONS = [
  { value: 'one-time', label: 'One Time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' }
];

// Pledge Status Options
export const PLEDGE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

// Family Relationship Types
export const FAMILY_RELATIONSHIP_OPTIONS = [
  { value: 'head', label: 'Head of Family' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'dependent', label: 'Dependent' },
  { value: 'other', label: 'Other' }
];

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  READONLY: 'readonly'
};

// Age Brackets for Filtering
export const AGE_BRACKETS = [
  { value: '0-17', label: 'Under 18' },
  { value: '18-25', label: '18-25' },
  { value: '26-40', label: '26-40' },
  { value: '41-60', label: '41-60' },
  { value: '60+', label: '60+' }
];

// Languages
export const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'korean', label: 'Korean' },
  { value: 'other', label: 'Other' }
];

// Accessibility Options
export const ACCESSIBILITY_OPTIONS = [
  { value: 'wheelchair', label: 'Wheelchair Access' },
  { value: 'hearing_impaired', label: 'Hearing Impaired' },
  { value: 'vision_impaired', label: 'Vision Impaired' },
  { value: 'mobility_assistance', label: 'Mobility Assistance' },
  { value: 'sign_language', label: 'Sign Language Interpreter' },
  { value: 'large_print', label: 'Large Print Materials' },
  { value: 'other', label: 'Other' }
];

// Common Ministries/Groups
export const DEFAULT_MINISTRIES = [
  { value: 'worship', label: 'Worship Ministry' },
  { value: 'youth', label: 'Youth Ministry' },
  { value: 'children', label: 'Children\'s Ministry' },
  { value: 'seniors', label: 'Seniors Ministry' },
  { value: 'mens', label: 'Men\'s Ministry' },
  { value: 'womens', label: 'Women\'s Ministry' },
  { value: 'outreach', label: 'Outreach Ministry' },
  { value: 'prayer', label: 'Prayer Ministry' },
  { value: 'hospitality', label: 'Hospitality Ministry' },
  { value: 'media', label: 'Media Ministry' },
  { value: 'finance', label: 'Finance Ministry' },
  { value: 'facilities', label: 'Facilities Ministry' }
];

// Form Validation Messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  PHONE: 'Please enter a valid phone number',
  MIN_LENGTH: (min) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max) => `Must not exceed ${max} characters`,
  MIN_VALUE: (min) => `Must be at least ${min}`,
  MAX_VALUE: (max) => `Must not exceed ${max}`,
  INVALID_DATE: 'Please enter a valid date',
  FUTURE_DATE: 'Date cannot be in the future',
  PAST_DATE: 'Date must be in the past',
  PASSWORDS_MATCH: 'Passwords must match'
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'MMMM dd, yyyy',
  SHORT: 'MM/dd/yyyy'
};

// Export Formats
export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', extension: '.csv' },
  { value: 'xlsx', label: 'Excel', extension: '.xlsx' },
  { value: 'pdf', label: 'PDF', extension: '.pdf' }
];

// Chart Colors
export const CHART_COLORS = {
  DANGER: '#EF4444',
  INFO: '#6366F1',
  SUCCESS: '#22C55E',
  MUTED: '#6B7280',
  PRIMARY: '#0ea5e9',
  SECONDARY: '#78716c',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  LIGHT: '#f8fafc',
  DARK: '#1e293b',
};

// Theme Colors
export const THEME_COLORS = {
  LIGHT: {
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#10B981',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#22C55E',
    info: '#3B82F6'
  },
  DARK: {
    primary: '#60A5FA',
    secondary: '#94A3B8',
    accent: '#34D399',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
    error: '#F87171',
    warning: '#FBBF24',
    success: '#4ADE80',
    info: '#60A5FA'
  }
};

// Breakpoints for Responsive Design
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'churchconnect_theme',
  LANGUAGE: 'churchconnect_language',
  FORM_DRAFT: 'churchconnect_form_draft',
  DASHBOARD_LAYOUT: 'churchconnect_dashboard_layout',
  SEARCH_HISTORY: 'churchconnect_search_history',
  USER_PREFERENCES: 'churchconnect_user_preferences',
  AUTH_TOKEN: 'churchconnect_auth_token',
  REFRESH_TOKEN: 'churchconnect_refresh_token',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please correct the errors below.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  MEMBER_CREATED: 'Member record created successfully!',
  MEMBER_UPDATED: 'Member record updated successfully!',
  MEMBER_DELETED: 'Member record deleted successfully!',
  GROUP_CREATED: 'Group created successfully!',
  GROUP_UPDATED: 'Group updated successfully!',
  GROUP_DELETED: 'Group deleted successfully!',
  PLEDGE_CREATED: 'Pledge created successfully!',
  PLEDGE_UPDATED: 'Pledge updated successfully!',
  PLEDGE_DELETED: 'Pledge deleted successfully!',
  FORM_SUBMITTED: 'Form submitted successfully!',
  EXPORT_COMPLETE: 'Export completed successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  REGISTRATION_SUCCESS: 'Registration completed successfully!',
  UPDATE_SUCCESS: 'Information updated successfully!',
  DELETE_SUCCESS: 'Record deleted successfully!',
  SAVE_SUCCESS: 'Changes saved successfully!',
  EMAIL_SENT: 'Email sent successfully!',
  EXPORT_SUCCESS: 'Export completed successfully!',
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 5242880, // 5MB
  ALLOWED_TYPES: process.env.REACT_APP_ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
  ],
  MAX_FILES: 5,
};

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
};

// Z-Index Values
export const Z_INDEX = {
  DROPDOWN: 1000,
  MODAL: 1050,
  TOAST: 1100,
  TOOLTIP: 1200
};


export {
  API_BASE_URL,
  API_TIMEOUT,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXPIRY_KEY,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  FORM_STEPS,
  GENDER_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  PLEDGE_FREQUENCY_OPTIONS,
  PLEDGE_STATUS_OPTIONS,
  FAMILY_RELATIONSHIP_OPTIONS,
  USER_ROLES,
  AGE_BRACKETS,
  LANGUAGE_OPTIONS,
  ACCESSIBILITY_OPTIONS,
  DEFAULT_MINISTRIES,
  VALIDATION_MESSAGES,
  DATE_FORMATS,
  EXPORT_FORMATS,
  CHART_COLORS,
  THEME_COLORS,
  BREAKPOINTS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FILE_UPLOAD,
  ANIMATION_DURATION,
  Z_INDEX,
  APP_NAME,
  APP_VERSION,
  JWT_EXPIRY,
  SESSION_TIMEOUT,
  ROUTES,
  RELATIONSHIP_TYPE_OPTIONS,
  ADMIN_ROLE_OPTIONS,
  PAGINATION,
  TOAST,
  FORM_VALIDATION,
  AGE_BRACKET_OPTIONS,
  ACCESSIBILITY,
  FEATURES
};

export default {
  API_BASE_URL,
  API_TIMEOUT,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXPIRY_KEY,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  FORM_STEPS,
  GENDER_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  PLEDGE_FREQUENCY_OPTIONS,
  PLEDGE_STATUS_OPTIONS,
  FAMILY_RELATIONSHIP_OPTIONS,
  USER_ROLES,
  AGE_BRACKETS,
  LANGUAGE_OPTIONS,
  ACCESSIBILITY_OPTIONS,
  DEFAULT_MINISTRIES,
  VALIDATION_MESSAGES,
  DATE_FORMATS,
  EXPORT_FORMATS,
  CHART_COLORS,
  THEME_COLORS,
  BREAKPOINTS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FILE_UPLOAD,
  ANIMATION_DURATION,
  Z_INDEX,
  APP_NAME,
  APP_VERSION,
  JWT_EXPIRY,
  SESSION_TIMEOUT,
  ROUTES,
  RELATIONSHIP_TYPE_OPTIONS,
  ADMIN_ROLE_OPTIONS,
  PAGINATION,
  TOAST,
  FORM_VALIDATION,
  AGE_BRACKET_OPTIONS,
  ACCESSIBILITY,
  FEATURES
};