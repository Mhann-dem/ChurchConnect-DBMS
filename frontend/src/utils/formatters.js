 // utils/formatters.js
// Formatting utilities for display and data transformation

/**
 * Format phone number with standard format
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleanPhone.length === 10) {
    // US format: (123) 456-7890
    return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
    // US format with country code: +1 (123) 456-7890
    return `+1 (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7)}`;
  } else if (cleanPhone.length > 10) {
    // International format: +XX XXX XXX XXXX
    return `+${cleanPhone.slice(0, -10)} ${cleanPhone.slice(-10, -7)} ${cleanPhone.slice(-7, -4)} ${cleanPhone.slice(-4)}`;
  }
  
  return phone; // Return original if can't format
};

/**
 * Format currency amount
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted currency
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount || isNaN(amount)) return '$0.00';
  
  const numAmount = parseFloat(amount);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

/**
 * Format name with proper capitalization
 * @param {string} name - Name to format
 * @returns {string} - Formatted name
 */
export const formatName = (name) => {
  if (!name) return '';
  
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format full name from first and last name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {string} preferredName - Preferred name (optional)
 * @returns {string} - Formatted full name
 */
export const formatFullName = (firstName, lastName, preferredName = '') => {
  const first = preferredName || firstName;
  const formattedFirst = formatName(first);
  const formattedLast = formatName(lastName);
  
  return `${formattedFirst} ${formattedLast}`.trim();
};

/**
 * Format address for display
 * @param {object} address - Address object with street, city, state, zip
 * @returns {string} - Formatted address
 */
export const formatAddress = (address) => {
  if (!address) return '';
  
  const { street, city, state, zip, country } = address;
  const parts = [];
  
  if (street) parts.push(street);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (zip) parts.push(zip);
  if (country && country !== 'USA') parts.push(country);
  
  return parts.join(', ');
};

/**
 * Format pledge frequency for display
 * @param {string} frequency - Pledge frequency
 * @returns {string} - Formatted frequency
 */
export const formatPledgeFrequency = (frequency) => {
  const frequencyMap = {
    'one-time': 'One-time',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'annually': 'Annually'
  };
  
  return frequencyMap[frequency] || frequency;
};

/**
 * Format member status for display
 * @param {boolean} isActive - Member active status
 * @returns {string} - Formatted status
 */
export const formatMemberStatus = (isActive) => {
  return isActive ? 'Active' : 'Inactive';
};

/**
 * Format gender for display
 * @param {string} gender - Gender code
 * @returns {string} - Formatted gender
 */
export const formatGender = (gender) => {
  const genderMap = {
    'male': 'Male',
    'female': 'Female',
    'other': 'Other',
    'prefer_not_to_say': 'Prefer not to say'
  };
  
  return genderMap[gender] || gender;
};

/**
 * Format contact method for display
 * @param {string} method - Contact method code
 * @returns {string} - Formatted contact method
 */
export const formatContactMethod = (method) => {
  const methodMap = {
    'email': 'Email',
    'phone': 'Phone',
    'sms': 'SMS',
    'mail': 'Mail',
    'no_contact': 'No Contact'
  };
  
  return methodMap[method] || method;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format percentage for display
 * @param {number} value - Percentage value (0-1)
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (isNaN(value)) return '0%';
  
  return (value * 100).toFixed(decimals) + '%';
};

/**
 * Format number with thousand separators
 * @param {number} number - Number to format
 * @returns {string} - Formatted number
 */
export const formatNumber = (number) => {
  if (isNaN(number)) return '0';
  
  return new Intl.NumberFormat('en-US').format(number);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Format initials from name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} - Formatted initials
 */
export const formatInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return `${first}${last}`;
};

/**
 * Format list items for display
 * @param {Array} items - Array of items
 * @param {number} maxItems - Maximum items to show
 * @returns {string} - Formatted list
 */
export const formatList = (items, maxItems = 3) => {
  if (!items || items.length === 0) return '';
  
  if (items.length <= maxItems) {
    return items.join(', ');
  }
  
  const visible = items.slice(0, maxItems);
  const remaining = items.length - maxItems;
  
  return `${visible.join(', ')} and ${remaining} more`;
};

/**
 * Format search query for display
 * @param {string} query - Search query
 * @returns {string} - Formatted query
 */
export const formatSearchQuery = (query) => {
  if (!query) return '';
  
  return query.trim().replace(/\s+/g, ' ');
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format error message for display
 * @param {string|object} error - Error to format
 * @returns {string} - Formatted error message
 */
export const formatError = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && error.message) {
    return error.message;
  }
  
  if (error && error.detail) {
    return error.detail;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Format validation errors for display
 * @param {object} errors - Validation errors object
 * @returns {string} - Formatted error message
 */
export const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return '';
  
  const errorMessages = Object.values(errors).flat();
  return errorMessages.join('. ');
};

/**
 * Format boolean value for display
 * @param {boolean} value - Boolean value
 * @returns {string} - Formatted boolean
 */
export const formatBoolean = (value) => {
  return value ? 'Yes' : 'No';
};

/**
 * Format empty value for display
 * @param {any} value - Value to check
 * @param {string} placeholder - Placeholder text
 * @returns {string} - Formatted value or placeholder
 */
export const formatEmptyValue = (value, placeholder = 'N/A') => {
  if (value === null || value === undefined || value === '') {
    return placeholder;
  }
  
  return value;
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};
