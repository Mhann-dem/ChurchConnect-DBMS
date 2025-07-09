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
