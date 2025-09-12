// utils/validation.js
// Validation utilities for form inputs and data

/**
 * Email validation using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Phone number validation (supports multiple formats)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid phone format
 */
export const validatePhone = (phone) => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits)
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

/**
 * Password strength validation
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with strength score and feedback
 */
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    strength: 0,
    feedback: []
  };

  if (!password) {
    result.feedback.push('Password is required');
    return result;
  }

  if (password.length < 8) {
    result.feedback.push('Password must be at least 8 characters long');
  } else {
    result.strength += 1;
  }

  if (!/[a-z]/.test(password)) {
    result.feedback.push('Password must contain at least one lowercase letter');
  } else {
    result.strength += 1;
  }

  if (!/[A-Z]/.test(password)) {
    result.feedback.push('Password must contain at least one uppercase letter');
  } else {
    result.strength += 1;
  }

  if (!/\d/.test(password)) {
    result.feedback.push('Password must contain at least one number');
  } else {
    result.strength += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.feedback.push('Password must contain at least one special character');
  } else {
    result.strength += 1;
  }

  result.isValid = result.strength >= 4;
  return result;
};

/**
 * Name validation
 * @param {string} name - Name to validate
 * @returns {boolean} - True if valid name
 */
export const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return false;
  }

  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2;
};

/**
 * Date validation
 * @param {string} date - Date string to validate
 * @returns {boolean} - True if valid date
 */
export const validateDate = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

/**
 * Age validation based on date of birth
 * @param {string} dateOfBirth - Date of birth to validate
 * @returns {object} - Validation result with age and validity
 */
export const validateAge = (dateOfBirth) => {
  const result = {
    isValid: false,
    age: null,
    message: ''
  };

  if (!validateDate(dateOfBirth)) {
    result.message = 'Invalid date format';
    return result;
  }

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (birthDate > today) {
    result.message = 'Date of birth cannot be in the future';
    return result;
  }

  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    result.age = age - 1;
  } else {
    result.age = age;
  }

  if (result.age < 0 || result.age > 150) {
    result.message = 'Please enter a valid age';
    return result;
  }

  result.isValid = true;
  return result;
};

/**
 * Pledge amount validation
 * @param {string|number} amount - Amount to validate
 * @returns {boolean} - True if valid amount
 */
export const validatePledgeAmount = (amount) => {
  if (!amount) return false;
  
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0 && numAmount <= 1000000;
};

/**
 * Required field validation
 * @param {any} value - Value to validate
 * @returns {boolean} - True if field has value
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Form validation for member registration
 * @param {object} formData - Form data to validate
 * @returns {object} - Validation result with errors
 */
export const validateMemberForm = (formData) => {
  const errors = {};

  // Required fields
  if (!validateRequired(formData.firstName)) {
    errors.firstName = 'First name is required';
  } else if (!validateName(formData.firstName)) {
    errors.firstName = 'Please enter a valid first name';
  }

  if (!validateRequired(formData.lastName)) {
    errors.lastName = 'Last name is required';
  } else if (!validateName(formData.lastName)) {
    errors.lastName = 'Please enter a valid last name';
  }

  if (!validateRequired(formData.email)) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!validateRequired(formData.phone)) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!validateRequired(formData.dateOfBirth)) {
    errors.dateOfBirth = 'Date of birth is required';
  } else {
    const ageValidation = validateAge(formData.dateOfBirth);
    if (!ageValidation.isValid) {
      errors.dateOfBirth = ageValidation.message;
    }
  }

  if (!validateRequired(formData.gender)) {
    errors.gender = 'Gender is required';
  }

  // Optional pledge validation
  if (formData.pledgeAmount) {
    if (!validatePledgeAmount(formData.pledgeAmount)) {
      errors.pledgeAmount = 'Please enter a valid pledge amount';
    }
    
    if (!validateRequired(formData.pledgeFrequency)) {
      errors.pledgeFrequency = 'Pledge frequency is required when amount is specified';
    }
  }

  // Privacy policy agreement
  if (!formData.privacyPolicyAgreed) {
    errors.privacyPolicyAgreed = 'You must agree to the privacy policy';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Admin login validation
 * @param {object} loginData - Login data to validate
 * @returns {object} - Validation result with errors
 */
export const validateAdminLogin = (loginData) => {
  const errors = {};

  if (!validateRequired(loginData.email)) {
    errors.email = 'Email is required';
  } else if (!validateEmail(loginData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!validateRequired(loginData.password)) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Search query validation
 * @param {string} query - Search query to validate
 * @returns {boolean} - True if valid search query
 */
export const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return false;
  
  const trimmedQuery = query.trim();
  return trimmedQuery.length >= 2 && trimmedQuery.length <= 100;
};

/**
 * URL validation
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * File validation for uploads
 * @param {File} file - File to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  } = options;

  const result = {
    isValid: false,
    error: null
  };

  if (!file) {
    result.error = 'No file selected';
    return result;
  }

  if (file.size > maxSize) {
    result.error = `File size must be less than ${maxSize / (1024 * 1024)}MB`;
    return result;
  }

  if (!allowedTypes.includes(file.type)) {
    result.error = `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    return result;
  }

  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    result.error = `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`;
    return result;
  }

  result.isValid = true;
  return result;
};

// Add this function to your existing validation.js file
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Basic HTML sanitization - remove script tags and potential XSS
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Add these to your validation.js file
export const validateMember = (memberData) => {
  const errors = {};
  
  // Required fields validation
  if (!validateRequired(memberData.firstName)) {
    errors.firstName = 'First name is required';
  } else if (!validateName(memberData.firstName)) {
    errors.firstName = 'Please enter a valid first name';
  }

  if (!validateRequired(memberData.lastName)) {
    errors.lastName = 'Last name is required';
  } else if (!validateName(memberData.lastName)) {
    errors.lastName = 'Please enter a valid last name';
  }

  if (!validateRequired(memberData.email)) {
    errors.email = 'Email is required';
  } else if (!validateEmail(memberData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!validateRequired(memberData.phone)) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(memberData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!validateRequired(memberData.dateOfBirth)) {
    errors.dateOfBirth = 'Date of birth is required';
  } else {
    const ageValidation = validateAge(memberData.dateOfBirth);
    if (!ageValidation.isValid) {
      errors.dateOfBirth = ageValidation.message;
    }
  }

  if (!validateRequired(memberData.gender)) {
    errors.gender = 'Gender is required';
  }

  // Optional fields validation
  if (memberData.address && !validateRequired(memberData.address)) {
    errors.address = 'Please enter a valid address';
  }

  if (memberData.city && !validateRequired(memberData.city)) {
    errors.city = 'Please enter a valid city';
  }

  if (memberData.postalCode && !validateRequired(memberData.postalCode)) {
    errors.postalCode = 'Please enter a valid postal code';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateFilters = (filters) => {
  const errors = {};
  
  // Validate date filters
  if (filters.startDate && !validateDate(filters.startDate)) {
    errors.startDate = 'Invalid start date format';
  }
  
  if (filters.endDate && !validateDate(filters.endDate)) {
    errors.endDate = 'Invalid end date format';
  }
  
  // Validate date range (end date should be after start date)
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    
    if (start > end) {
      errors.dateRange = 'End date must be after start date';
    }
  }
  
  // Validate status filter if provided
  if (filters.status && !['active', 'inactive', 'pending'].includes(filters.status)) {
    errors.status = 'Invalid status value';
  }
  
  // Validate search query if provided
  if (filters.search && !validateSearchQuery(filters.search)) {
    errors.search = 'Search query must be between 2 and 100 characters';
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validatePledgeFilters = (filters) => {
  const errors = {};
  
  // Validate date filters
  if (filters.startDate && !validateDate(filters.startDate)) {
    errors.startDate = 'Invalid start date format';
  }
  
  if (filters.endDate && !validateDate(filters.endDate)) {
    errors.endDate = 'Invalid end date format';
  }
  
  // Validate date range
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    
    if (start > end) {
      errors.dateRange = 'End date must be after start date';
    }
  }
  
  // Validate pledge status
  if (filters.status && !['active', 'fulfilled', 'cancelled', 'overdue'].includes(filters.status)) {
    errors.status = 'Invalid pledge status';
  }
  
  // Validate frequency filter
  if (filters.frequency && !['weekly', 'monthly', 'quarterly', 'yearly', 'one-time'].includes(filters.frequency)) {
    errors.frequency = 'Invalid pledge frequency';
  }
  
  // Validate amount range
  if (filters.minAmount && !validateNumber(filters.minAmount, { min: 0 })) {
    errors.minAmount = 'Invalid minimum amount';
  }
  
  if (filters.maxAmount && !validateNumber(filters.maxAmount, { min: 0 })) {
    errors.maxAmount = 'Invalid maximum amount';
  }
  
  if (filters.minAmount && filters.maxAmount) {
    const min = parseFloat(filters.minAmount);
    const max = parseFloat(filters.maxAmount);
    
    if (min > max) {
      errors.amountRange = 'Maximum amount must be greater than minimum amount';
    }
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateReportFilters = (filters) => {
  const errors = {};
  
  // Validate required date range for reports
  if (!validateRequired(filters.startDate)) {
    errors.startDate = 'Start date is required for reports';
  } else if (!validateDate(filters.startDate)) {
    errors.startDate = 'Invalid start date format';
  }
  
  if (!validateRequired(filters.endDate)) {
    errors.endDate = 'End date is required for reports';
  } else if (!validateDate(filters.endDate)) {
    errors.endDate = 'Invalid end date format';
  }
  
  // Validate date range
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    
    if (start > end) {
      errors.dateRange = 'End date must be after start date';
    }
    
    // Validate that date range is not too large (e.g., more than 5 years)
    const maxRange = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years in milliseconds
    if (end - start > maxRange) {
      errors.dateRange = 'Date range cannot exceed 5 years';
    }
  }
  
  // Validate report type
  const validReportTypes = ['members', 'pledges', 'donations', 'financial', 'activity'];
  if (!validateRequired(filters.reportType)) {
    errors.reportType = 'Report type is required';
  } else if (!validReportTypes.includes(filters.reportType)) {
    errors.reportType = 'Invalid report type';
  }
  
  // Validate format if provided
  if (filters.format && !['pdf', 'csv', 'excel'].includes(filters.format)) {
    errors.format = 'Invalid report format';
  }
  
  // Validate grouping if provided
  if (filters.groupBy && !['month', 'quarter', 'year', 'category', 'status'].includes(filters.groupBy)) {
    errors.groupBy = 'Invalid grouping option';
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};



/**
 * Generic number validation
 * @param {string|number} value - Value to validate
 * @param {object} [options] - Validation options
 * @param {number} [options.min] - Minimum value
 * @param {number} [options.max] - Maximum value
 * @returns {boolean} - True if valid number
 */
export const validateNumber = (value, { min, max } = {}) => {
  if (value === null || value === undefined || value === '') return false;
  const num = Number(value);
  if (isNaN(num)) return false;
  
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
};

