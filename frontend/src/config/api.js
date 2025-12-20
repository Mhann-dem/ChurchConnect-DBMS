/**
 * API Configuration for ChurchConnect Frontend
 * Dynamically configures API base URL based on environment
 * Handles development, staging, and production environments
 */

// Detect environment and set API URL accordingly
const getApiBaseUrl = () => {
  // Check for explicit environment variable
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // Fallback: Determine based on hostname
  const hostname = window.location.hostname;
  
  // Production Railway deployment
  if (
    hostname.includes('.up.railway.app') ||
    hostname.includes('railway.app') ||
    hostname.includes(process.env.REACT_APP_PRODUCTION_DOMAIN)
  ) {
    return 'https://your-app-backend.up.railway.app';
  }

  // Custom domain
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const protocol = window.location.protocol;
    const apiDomain = hostname.replace(/^[^.]*\./, ''); // Remove subdomain if present
    return `${protocol}//api.${apiDomain}`;
  }

  // Local development
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

// API Configuration object
const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Enable credentials for cross-domain requests (includes cookies/auth headers)
  withCredentials: true,
};

// Endpoints mapping
const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login/',
    LOGOUT: '/api/auth/logout/',
    REFRESH: '/api/auth/token/refresh/',
    PROFILE: '/api/auth/profile/',
    CHANGE_PASSWORD: '/api/auth/change-password/',
    PASSWORD_RESET_REQUEST: '/api/auth/password-reset-request/',
    PASSWORD_RESET_CONFIRM: '/api/auth/password-reset-confirm/',
    REGISTER: '/api/auth/register/',
    VERIFY_EMAIL: '/api/auth/verify-email/',
  },

  // Members
  MEMBERS: {
    LIST: '/api/members/',
    CREATE: '/api/members/',
    DETAIL: (id) => `/api/members/${id}/`,
    UPDATE: (id) => `/api/members/${id}/`,
    DELETE: (id) => `/api/members/${id}/`,
    BULK_CREATE: '/api/members/bulk-create/',
    BULK_UPDATE: '/api/members/bulk-update/',
    SEARCH: '/api/members/search/',
    EXPORT: '/api/members/export/',
    IMPORT: '/api/members/import/',
  },

  // Families
  FAMILIES: {
    LIST: '/api/families/',
    CREATE: '/api/families/',
    DETAIL: (id) => `/api/families/${id}/`,
    UPDATE: (id) => `/api/families/${id}/`,
    DELETE: (id) => `/api/families/${id}/`,
    MEMBERS: (id) => `/api/families/${id}/members/`,
  },

  // Groups
  GROUPS: {
    LIST: '/api/groups/',
    CREATE: '/api/groups/',
    DETAIL: (id) => `/api/groups/${id}/`,
    UPDATE: (id) => `/api/groups/${id}/`,
    DELETE: (id) => `/api/groups/${id}/`,
    MEMBERS: (id) => `/api/groups/${id}/members/`,
    ADD_MEMBER: (id) => `/api/groups/${id}/add-member/`,
    REMOVE_MEMBER: (id) => `/api/groups/${id}/remove-member/`,
  },

  // Pledges
  PLEDGES: {
    LIST: '/api/pledges/',
    CREATE: '/api/pledges/',
    DETAIL: (id) => `/api/pledges/${id}/`,
    UPDATE: (id) => `/api/pledges/${id}/`,
    DELETE: (id) => `/api/pledges/${id}/`,
    REPORT: '/api/pledges/report/',
  },

  // Events
  EVENTS: {
    LIST: '/api/events/',
    CREATE: '/api/events/',
    DETAIL: (id) => `/api/events/${id}/`,
    UPDATE: (id) => `/api/events/${id}/`,
    DELETE: (id) => `/api/events/${id}/`,
    REGISTER: (id) => `/api/events/${id}/register/`,
    UNREGISTER: (id) => `/api/events/${id}/unregister/`,
  },

  // Reports
  REPORTS: {
    ATTENDANCE: '/api/reports/attendance/',
    FINANCIAL: '/api/reports/financial/',
    MEMBERSHIP: '/api/reports/membership/',
    CUSTOM: '/api/reports/custom/',
  },

  // Admin Management
  ADMIN: {
    USERS: '/api/admin/users/',
    CREATE_USER: '/api/admin/users/',
    USER_DETAIL: (id) => `/api/admin/users/${id}/`,
    UPDATE_USER: (id) => `/api/admin/users/${id}/`,
    DELETE_USER: (id) => `/api/admin/users/${id}/`,
    SYSTEM_STATS: '/api/admin/system-stats/',
    AUDIT_LOG: '/api/admin/audit-log/',
  },

  // Health Check
  HEALTH: '/api/health/',
  API_DOCS: '/api/docs/',
  SCHEMA: '/api/schema/',
};

// Export for use in the application
export { API_CONFIG, API_ENDPOINTS, API_BASE_URL };
