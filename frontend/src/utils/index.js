// utils/index.js
// Central export file for all utility functions

export * from './validation';
export * from './formatters';
export * from './helpers';
export * from './constants';
export * from './dateUtils';
export * from './exportUtils';
export * from './accessibility';

// Re-export commonly used functions with aliases
export { 
  validateEmail as isValidEmail,
  validatePhone as isValidPhone,
  formatCurrency as currency,
  formatPhoneNumber as phone,
  capitalizeWords as capitalize
} from './formatters';

export {
  debounce,
  throttle,
  generateId,
  deepClone
} from './helpers';

export {
  exportToCSV,
  exportToPDF,
  downloadFile
} from './exportUtils';

export {
  addAriaAttributes,
  announceToScreenReader,
  focusElement
} from './accessibility'; 
