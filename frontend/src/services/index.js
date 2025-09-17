// services/index.js

// Core services
export { default as api } from './api';
export { default as auth } from './auth';

// Business logic services
export { default as members } from './members';
export { default as groups } from './groups';
export { default as pledges } from './pledges';
export { default as reports } from './reports';
export { default as familiesService } from './families';

// Utility services
export { default as exportService } from './export';
export { default as notifications } from './notifications';

// Dashboard service - note the named export
export { dashboardService } from './dashboardService';

// Optional: Create a services object for easier access
const services = {
  api: () => import('./api').then(m => m.default),
  auth: () => import('./auth').then(m => m.default),
  members: () => import('./members').then(m => m.default),
  groups: () => import('./groups').then(m => m.default),
  pledges: () => import('./pledges').then(m => m.default),
  reports: () => import('./reports').then(m => m.default),
  exportService: () => import('./export').then(m => m.default),
  notifications: () => import('./notifications').then(m => m.default),
  dashboardService: () => import('./dashboardService').then(m => m.dashboardService),
};

export { services };