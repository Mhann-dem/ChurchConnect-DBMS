 // utils/helpers.js
// General helper utilities for common operations

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Generate unique ID
 * @param {string} prefix - Optional prefix for ID
 * @returns {string} - Unique ID
 */
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}${randomStr}`;
};

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} - Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Check if object is empty
 * @param {object} obj - Object to check
 * @returns {boolean} - True if empty
 */
export const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim() === '';
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Remove duplicates from array
 * @param {Array} arr - Array to process
 * @param {string} key - Key to use for comparison (for objects)
 * @returns {Array} - Array without duplicates
 */
export const removeDuplicates = (arr, key = null) => {
  if (!Array.isArray(arr)) return [];
  
  if (key) {
    const seen = new Set();
    return arr.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
  
  return [...new Set(arr)];
};

/**
 * Sort array of objects by key
 * @param {Array} arr - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} - Sorted array
 */
export const sortBy = (arr, key, direction = 'asc') => {
  if (!Array.isArray(arr)) return [];
  
  return arr.sort((a, b) => {
    let aVal = a[key];
    let bVal = b[key];
    
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';
    
    // Handle string comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (direction === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });
};

/**
 * Group array of objects by key
 * @param {Array} arr - Array to group
 * @param {string} key - Key to group by
 * @returns {object} - Grouped object
 */
export const groupBy = (arr, key) => {
  if (!Array.isArray(arr)) return {};
  
  return arr.reduce((groups, item) => {
    const value = item[key];
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(item);
    return groups;
  }, {});
};

/**
 * Filter array of objects by search query
 * @param {Array} arr - Array to filter
 * @param {string} query - Search query
 * @param {Array} fields - Fields to search in
 * @returns {Array} - Filtered array
 */
export const filterByQuery = (arr, query, fields = []) => {
  if (!Array.isArray(arr) || !query) return arr;
  
  const searchQuery = query.toLowerCase().trim();
  
  return arr.filter(item => {
    if (fields.length === 0) {
      // Search all string fields
      return Object.values(item).some(value => 
        typeof value === 'string' && 
        value.toLowerCase().includes(searchQuery)
      );
    }
    
    // Search specific fields
    return fields.some(field => {
      const value = item[field];
      return typeof value === 'string' && 
             value.toLowerCase().includes(searchQuery);
    });
  });
};

/**
 * Paginate array
 * @param {Array} arr - Array to paginate
 * @param {number} page - Current page (1-based)
 * @param {number} pageSize - Items per page
 * @returns {object} - Pagination result
 */
export const paginate = (arr, page, pageSize) => {
  if (!Array.isArray(arr)) return { items: [], totalPages: 0, totalItems: 0 };
  
  const totalItems = arr.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = arr.slice(startIndex, endIndex);
  
  return {
    items,
    totalPages,
    totalItems,
    currentPage: page,
    pageSize,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
};

/**
 * Format query parameters for URL
 * @param {object} params - Parameters object
 * @returns {string} - Query string
 */
export const formatQueryParams = (params) => {
  if (!params || typeof params !== 'object') return '';
  
  const queryParams = Object.entries(params)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
          }
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join('&'); 
    };
