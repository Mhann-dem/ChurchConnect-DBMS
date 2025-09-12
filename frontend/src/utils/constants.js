// ChurchConnect DBMS - Constants
// Application-wide constants and configuration values

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
export const API_TIMEOUT = 10000; // 10 seconds

// Authentication
export const TOKEN_KEY = 'churchconnect_token';
export const REFRESH_TOKEN_KEY = 'churchconnect_refresh_token';
export const TOKEN_EXPIRY_KEY = 'churchconnect_token_expiry';
export const JWT_EXPIRY = parseInt(process.env.REACT_APP_JWT_EXPIRY) || 3600;
export const SESSION_TIMEOUT = parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 1800;

// Application Info
export const APP_NAME = process.env.REACT_APP_APP_NAME || 'ChurchConnect';
export const APP_VERSION = process.env.REACT_APP_APP_VERSION || '1.0.0';

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const PAGINATION_OPTIONS = [10, 25, 50, 100];

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_VISIBLE_PAGES: 7,
};

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

// Form Steps
export const FORM_STEPS = {
  PERSONAL_INFO: 'personal_info',
  CONTACT_INFO: 'contact_info',
  MINISTRY_INTERESTS: 'ministry_interests',
  PLEDGE_INFO: 'pledge_info',
  FAMILY_INFO: 'family_info',
  CONFIRMATION: 'confirmation'
};

// Form Validation
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

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 254
  },
  PHONE: {
    PATTERN: /^[\+]?[1-9][\d]{0,15}$/,
    MIN_LENGTH: 10,
    MAX_LENGTH: 15
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s\-'\.]+$/
  },
  PLEDGE_AMOUNT: {
    MIN: 0.01,
    MAX: 1000000
  }
};

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];

// Contact Method Options
export const CONTACT_METHOD_OPTIONS = [
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'phone', label: 'Phone', icon: 'Phone' },
  { value: 'sms', label: 'SMS', icon: 'MessageSquare' },
  { value: 'mail', label: 'Postal Mail', icon: 'MapPin' },
  { value: 'no_contact', label: 'No Contact', icon: 'X' }
];

// Pledge Options
export const PLEDGE_FREQUENCY_OPTIONS = [
  { value: 'one-time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' }
];

export const PLEDGE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'completed', label: 'Completed', color: 'info' },
  { value: 'cancelled', label: 'Cancelled', color: 'danger' },
  { value: 'suspended', label: 'Suspended', color: 'warning' },
  { value: 'pending', label: 'Pending', color: 'secondary' }
];

// Member Options
export const MEMBER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'secondary' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'suspended', label: 'Suspended', color: 'danger' }
];

// Relationship Options
export const RELATIONSHIP_TYPE_OPTIONS = [
  { value: 'head', label: 'Head of Household' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'dependent', label: 'Dependent' },
  { value: 'other', label: 'Other' },
];

export const FAMILY_RELATIONSHIP_OPTIONS = [
  { value: 'head', label: 'Head of Family' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'dependent', label: 'Dependent' },
  { value: 'other', label: 'Other' }
];

// Age Options
export const AGE_BRACKET_OPTIONS = [
  { value: '0-17', label: 'Under 18' },
  { value: '18-25', label: '18-25' },
  { value: '26-40', label: '26-40' },
  { value: '41-60', label: '41-60' },
  { value: '60+', label: '60+' },
];

export const AGE_BRACKETS = [
  { value: '0-17', label: 'Under 18' },
  { value: '18-25', label: '18-25' },
  { value: '26-40', label: '26-40' },
  { value: '41-60', label: '41-60' },
  { value: '60+', label: '60+' }
];

export const AGE_RANGE_OPTIONS = [
  { value: '', label: 'All Ages' },
  { value: '0-17', label: 'Under 18' },
  { value: '18-25', label: '18-25' },
  { value: '26-40', label: '26-40' },
  { value: '41-60', label: '41-60' },
  { value: '61+', label: '61 and older' }
];

// User Roles
export const ADMIN_ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'readonly', label: 'Read Only' },
];

export const USER_ROLES = [
  { value: 'super_admin', label: 'Super Administrator' },
  { value: 'admin', label: 'Administrator' },
  { value: 'staff', label: 'Staff Member' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'read_only', label: 'Read Only' }
];

// Language Options
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
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

// Ministry Options
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

export const MINISTRY_CATEGORIES = [
  { value: 'worship', label: 'Worship & Music' },
  { value: 'youth', label: 'Youth Ministry' },
  { value: 'children', label: 'Children\'s Ministry' },
  { value: 'seniors', label: 'Senior Ministry' },
  { value: 'outreach', label: 'Outreach & Missions' },
  { value: 'education', label: 'Christian Education' },
  { value: 'fellowship', label: 'Fellowship & Social' },
  { value: 'service', label: 'Service & Volunteer' },
  { value: 'prayer', label: 'Prayer Ministry' },
  { value: 'other', label: 'Other' }
];

// Date and Time
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'MMMM dd, yyyy',
  SHORT: 'MM/dd/yyyy'
};

export const DATE_RANGE_PRESETS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
  { value: 'all', label: 'All time' }
];

export const TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' }
];

// Export Options
export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', extension: '.csv' },
  { value: 'xlsx', label: 'Excel', extension: '.xlsx' },
  { value: 'pdf', label: 'PDF', extension: '.pdf' }
];

export const EXPORT_FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV', extension: 'csv', mimeType: 'text/csv' },
  { value: 'excel', label: 'Excel', extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { value: 'pdf', label: 'PDF', extension: 'pdf', mimeType: 'application/pdf' },
  { value: 'json', label: 'JSON', extension: 'json', mimeType: 'application/json' }
];

// Filter Defaults
export const MEMBER_FILTERS_DEFAULTS = {
  gender: '',
  ageRange: '',
  pledgeStatus: '',
  registrationDateRange: '',
  isActive: true,
  ministryId: '',
  joinDateRange: ''
};

export const PLEDGE_FILTERS_DEFAULTS = {
  status: 'all',
  frequency: 'all',
  amountRange: '',
  dateRange: '',
  memberId: ''
};

// Search
export const SEARCH_CONSTRAINTS = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 100,
  DEBOUNCE_DELAY: 500
};

// UI Constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 5000,
  LOADING_SPINNER_DELAY: 200,
  MODAL_ANIMATION_DURATION: 300,
  PAGE_TRANSITION_DURATION: 200
};

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

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
};

export const Z_INDEX = {
  DROPDOWN: 1000,
  MODAL: 1050,
  TOAST: 1100,
  TOOLTIP: 1200
};

// Colors and Themes
export const CHART_COLORS = {
  PRIMARY: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
  SUCCESS: ['#10B981', '#059669', '#047857', '#065F46'],
  WARNING: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
  DANGER: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
  NEUTRAL: ['#6B7280', '#4B5563', '#374151', '#1F2937']
};

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

export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
};

// Storage Keys
export const STORAGE_KEYS = {
  THEME: 'churchconnect_theme',
  LANGUAGE: 'churchconnect_language',
  FORM_DRAFT: 'churchconnect_form_draft',
  DASHBOARD_LAYOUT: 'churchconnect_dashboard_layout',
  SEARCH_HISTORY: 'churchconnect_search_history',
  USER_PREFERENCES: 'churchconnect_user_preferences',
  AUTH_TOKEN: 'churchconnect_auth_token',
  REFRESH_TOKEN: 'churchconnect_refresh_token',
  FILTER_PRESETS: 'churchconnect_filter_presets'
};

// API Endpoints
export const API_ENDPOINTS = {
  MEMBERS: '/api/admin/members',
  PLEDGES: '/api/admin/pledges',
  GROUPS: '/api/admin/groups',
  REPORTS: '/api/admin/reports',
  EXPORT: '/api/admin/export',
  STATISTICS: '/api/admin/statistics'
};

// Messages
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

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please correct the errors below.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  GENERIC: 'An unexpected error occurred. Please try again.'
};

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
  EXPORT_COMPLETED: 'Export completed successfully!',
  DATA_REFRESHED: 'Data refreshed successfully!'
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

// Feature Flags
export const FEATURES = {
  DARK_MODE: process.env.REACT_APP_ENABLE_DARK_MODE === 'true',
  MULTI_LANGUAGE: process.env.REACT_APP_ENABLE_MULTI_LANGUAGE === 'true',
  ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  SERVICE_WORKER: process.env.REACT_APP_ENABLE_SERVICE_WORKER === 'true',
  ACCESSIBILITY: process.env.REACT_APP_ENABLE_ACCESSIBILITY_FEATURES === 'true',
  PUSH_NOTIFICATIONS: process.env.REACT_APP_ENABLE_PUSH_NOTIFICATIONS === 'true',
};

export const ACCESSIBILITY = {
  KEYBOARD_DELAY: 300,
  FOCUS_VISIBLE_DELAY: 100,
  SCREEN_READER_DELAY: 500,
};

// Additional Options
export const EVENT_TYPES = [
  { value: 'worship', label: 'Worship Service' },
  { value: 'bible_study', label: 'Bible Study' },
  { value: 'fellowship', label: 'Fellowship Event' },
  { value: 'outreach', label: 'Outreach Event' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'social', label: 'Social Event' },
  { value: 'educational', label: 'Educational' },
  { value: 'other', label: 'Other' }
];

export const PERMISSIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  ADMIN: 'admin'
};

export const BULK_ACTIONS = [
  { value: 'export', label: 'Export Selected', icon: 'Download' },
  { value: 'update_status', label: 'Update Status', icon: 'Edit' },
  { value: 'add_to_group', label: 'Add to Group', icon: 'UserPlus' },
  { value: 'send_email', label: 'Send Email', icon: 'Mail' },
  { value: 'delete', label: 'Delete Selected', icon: 'Trash2', variant: 'danger' }
];

export const REPORT_TYPES = [
  { value: 'member_list', label: 'Member Directory' },
  { value: 'pledge_summary', label: 'Pledge Summary' },
  { value: 'attendance_report', label: 'Attendance Report' },
  { value: 'financial_report', label: 'Financial Report' },
  { value: 'ministry_report', label: 'Ministry Participation' },
  { value: 'birthday_list', label: 'Birthday List' },
  { value: 'anniversary_list', label: 'Anniversary List' }
];

// Default export with all constants
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