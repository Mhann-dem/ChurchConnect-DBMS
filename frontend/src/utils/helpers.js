/**
 * ChurchConnect DBMS - Utility Helpers
 * General-purpose helper functions for the application
 */

/**
 * Capitalizes the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} The capitalized string
 */
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - The string to title case
 * @returns {string} The title cased string
 */
export const titleCase = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Generates initials from a full name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} The initials (max 2 characters)
 */
export const getInitials = (firstName, lastName) => {
  if (!firstName && !lastName) return '';
  
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return `${first}${last}`;
};

/**
 * Generates a full name from first and last name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {string} preferredName - Preferred name (optional)
 * @returns {string} The full name
 */
export const getFullName = (firstName, lastName, preferredName = null) => {
  const displayFirstName = preferredName || firstName;
  if (!displayFirstName && !lastName) return '';
  if (!displayFirstName) return lastName;
  if (!lastName) return displayFirstName;
  return `${displayFirstName} ${lastName}`;
};

/**
 * Safely gets nested object properties
 * @param {Object} obj - The object to traverse
 * @param {string} path - The path to the property (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if property doesn't exist
 * @returns {any} The property value or default value
 */
export const getNestedProperty = (obj, path, defaultValue = undefined) => {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current !== undefined ? current : defaultValue;
};

/**
 * Debounces a function call
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} The debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Throttles a function call
 * @param {Function} func - The function to throttle
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} The throttled function
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
};

/**
 * Generates a random ID
 * @param {number} length - The length of the ID
 * @returns {string} A random ID string
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Copies text to clipboard
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

/**
 * Scrolls to an element smoothly
 * @param {string|HTMLElement} element - Element selector or DOM element
 * @param {Object} options - Scroll options
 */
export const scrollToElement = (element, options = {}) => {
  const targetElement = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
  
  if (!targetElement) return;
  
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    ...options
  };
  
  targetElement.scrollIntoView(defaultOptions);
};

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {any} value - The value to check
 * @returns {boolean} True if empty, false otherwise
 */
export const isEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Removes empty properties from an object
 * @param {Object} obj - The object to clean
 * @returns {Object} The cleaned object
 */
export const removeEmptyProperties = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!isEmpty(value)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/**
 * Formats a number with commas
 * @param {number} num - The number to format
 * @returns {string} The formatted number
 */
export const formatNumber = (num) => {
  if (num == null || isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Formats a currency amount
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: 'USD')
 * @param {string} locale - The locale (default: 'en-US')
 * @returns {string} The formatted currency
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount == null || isNaN(amount)) return '$0.00';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported locales
    return `$${formatNumber(amount.toFixed(2))}`;
  }
};

/**
 * Truncates text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} length - The maximum length
 * @param {string} suffix - The suffix to add (default: '...')
 * @returns {string} The truncated text
 */
export const truncateText = (text, length, suffix = '...') => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
};

/**
 * Converts a string to a URL-friendly slug
 * @param {string} str - The string to convert
 * @returns {string} The slug
 */
export const slugify = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Calculates age from birth date
 * @param {string|Date} birthDate - The birth date
 * @returns {number} The age in years
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
};

/**
 * Groups an array of objects by a property
 * @param {Array} array - The array to group
 * @param {string} key - The property key to group by
 * @returns {Object} The grouped object
 */
export const groupBy = (array, key) => {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((groups, item) => {
    const group = getNestedProperty(item, key, 'undefined');
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

/**
 * Sorts an array of objects by a property
 * @param {Array} array - The array to sort
 * @param {string} key - The property key to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} The sorted array
 */
export const sortBy = (array, key, direction = 'asc') => {
  if (!Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const aValue = getNestedProperty(a, key);
    const bValue = getNestedProperty(b, key);
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filters an array of objects by multiple criteria
 * @param {Array} array - The array to filter
 * @param {Object} filters - The filter criteria
 * @returns {Array} The filtered array
 */
export const filterBy = (array, filters) => {
  if (!Array.isArray(array) || !filters) return array;
  
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') return true;
      
      const itemValue = getNestedProperty(item, key);
      
      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }
      
      if (typeof value === 'string') {
        return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
      }
      
      return itemValue === value;
    });
  });
};

/**
 * Downloads a file with given content and filename
 * @param {string} content - The file content
 * @param {string} filename - The filename
 * @param {string} contentType - The content type
 */
export const downloadFile = (content, filename, contentType = 'text/plain') => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
};

/**
 * Validates if a string is a valid email
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email, false otherwise
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if a string is a valid phone number
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if valid phone, false otherwise
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid US phone number (10 digits)
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
};

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} The result of the function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Creates a deep clone of an object
 * @param {any} obj - The object to clone
 * @returns {any} The cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
};

/**
 * Merges multiple objects deeply
 * @param {Object} target - The target object
 * @param {...Object} sources - The source objects
 * @returns {Object} The merged object
 */
export const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
};

/**
 * Helper function to check if value is an object
 * @param {any} item - The item to check
 * @returns {boolean} True if object, false otherwise
 */
const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

export default {
  capitalize,
  titleCase,
  getInitials,
  getFullName,
  getNestedProperty,
  debounce,
  throttle,
  generateId,
  copyToClipboard,
  scrollToElement,
  isEmpty,
  removeEmptyProperties,
  formatNumber,
  formatCurrency,
  truncateText,
  slugify,
  calculateAge,
  groupBy,
  sortBy,
  filterBy,
  downloadFile,
  isValidEmail,
  isValidPhone,
  retryWithBackoff,
  deepClone,
  deepMerge
};