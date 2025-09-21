// frontend/src/utils/importUtils.js


/**
 * Clean and format phone number
 * @param {string} phone - Raw phone number
 * @returns {string} - Cleaned phone number
 */
const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return original if not standard format
  return phone.trim();
};

/**
 * Parse ministry interests from string
 * @param {string} interestsString - Comma or semicolon separated interests
 * @returns {Array<string>} - Array of ministry interests
 */
const parseMinistryInterests = (interestsString) => {
  if (!interestsString) return [];
  
  return interestsString
    .split(/[,;]/)
    .map(interest => interest.trim())
    .filter(interest => interest.length > 0);
};

/**
 * Parse and validate pledge amount
 * @param {string} amountString - Pledge amount string
 * @returns {number|null} - Parsed pledge amount or null
 */
const parsePledgeAmount = (amountString) => {
  if (!amountString) return null;
  
  // Remove currency symbols and whitespace
  const cleaned = amountString.toString().replace(/[$,\s]/g, '');
  const amount = parseFloat(cleaned);
  
  return isNaN(amount) ? null : amount;
};

/**
 * Export members data to CSV
 * @param {Array} members - Array of member objects to export
 * @param {Array} fields - Fields to include in export
 * @returns {string} - CSV string
 */
export const exportMembersToCSV = (members, fields = null) => {
  if (!members || members.length === 0) {
    return '';
  }

  // Default fields to export
  const defaultFields = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'address', label: 'Address' },
    { key: 'preferredContactMethod', label: 'Contact Method' },
    { key: 'registrationDate', label: 'Registration Date' },
    { key: 'isActive', label: 'Active Status' }
  ];

  const exportFields = fields || defaultFields;
  const headers = exportFields.map(field => field.label);
  
  const csvRows = [
    headers.join(','),
    ...members.map(member => 
      exportFields.map(field => {
        const value = member[field.key] || '';
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV content to download
 * @param {string} filename - Filename for download
 */
export const downloadCSV = (csvContent, filename = 'export.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// utils/importUtils.js - CSV parsing and import validation utilities

/**
 * Parse CSV text into array of objects
 * @param {string} csvText - Raw CSV text
 * @returns {Array<Object>} Array of objects with headers as keys
 */
export const parseCSV = (csvText) => {
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('Invalid CSV data provided');
  }

  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  if (!headers || headers.length === 0) {
    throw new Error('No headers found in CSV file');
  }

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length === 0) continue; // Skip empty rows
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }

  console.log('[ImportUtils] Parsed CSV:', {
    headers,
    rowCount: data.length,
    sampleRow: data[0]
  });

  return data;
};

/**
 * Parse a single CSV line handling quoted fields and commas
 * @param {string} line - Single CSV line
 * @returns {Array<string>} Array of field values
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result.map(field => {
    // Remove surrounding quotes if present
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1);
    }
    return field;
  });
};

/**
 * Validate import data against field mapping
 * @param {Array<Object>} data - Parsed CSV data
 * @param {Object} fieldMapping - Mapping of CSV headers to expected fields
 * @returns {Array<string>} Array of validation error messages
 */
export const validateImportData = (data, fieldMapping) => {
  const errors = [];
  
  if (!Array.isArray(data) || data.length === 0) {
    errors.push('No data to validate');
    return errors;
  }

  // Check required field mappings
  const requiredFields = ['firstName', 'lastName', 'email'];
  const mappedFields = Object.values(fieldMapping);
  
  requiredFields.forEach(field => {
    if (!mappedFields.includes(field)) {
      errors.push(`Missing required field mapping: ${field}`);
    }
  });

  // Validate data quality
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{9,}$/;
  
  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because index is 0-based and we skip header
    
    // Find the actual CSV field names for our required fields
    const firstNameField = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'firstName');
    const lastNameField = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'lastName');
    const emailField = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'email');
    const phoneField = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'phone');
    const dobField = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'dateOfBirth');
    
    // Validate required fields
    if (firstNameField && !row[firstNameField]?.trim()) {
      errors.push(`Row ${rowNumber}: First name is required`);
    }
    
    if (lastNameField && !row[lastNameField]?.trim()) {
      errors.push(`Row ${rowNumber}: Last name is required`);
    }
    
    if (emailField) {
      const email = row[emailField]?.trim();
      if (!email) {
        errors.push(`Row ${rowNumber}: Email is required`);
      } else if (!emailRegex.test(email)) {
        errors.push(`Row ${rowNumber}: Invalid email format`);
      }
    }
    
    // Validate optional fields
    if (phoneField && row[phoneField]) {
      const phone = row[phoneField]?.trim();
      if (phone && !phoneRegex.test(phone)) {
        errors.push(`Row ${rowNumber}: Invalid phone number format`);
      }
    }
    
    if (dobField && row[dobField]) {
      const dob = row[dobField]?.trim();
      if (dob && !isValidDate(dob)) {
        errors.push(`Row ${rowNumber}: Invalid date of birth format (use YYYY-MM-DD)`);
      }
    }
  });

  // Check for duplicate emails
  if (emailField) {
    const emails = data.map(row => row[emailField]?.trim().toLowerCase()).filter(Boolean);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    
    if (duplicateEmails.length > 0) {
      errors.push(`Duplicate emails found in import data: ${[...new Set(duplicateEmails)].join(', ')}`);
    }
  }

  return errors;
};

/**
 * Validate date string format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Whether the date is valid
 */
const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  // Try to parse the date
  const date = new Date(dateString);
  
  // Check if it's a valid date
  if (isNaN(date.getTime())) return false;
  
  // Check if it's a reasonable date (not too far in past or future)
  const now = new Date();
  const minDate = new Date('1900-01-01');
  const maxDate = new Date(now.getFullYear() + 1, 11, 31); // Next year
  
  return date >= minDate && date <= maxDate;
};

/**
 * Transform import data to match API expectations
 * @param {Array<Object>} data - Raw import data
 * @param {Object} fieldMapping - Field mapping configuration
 * @returns {Array<Object>} Transformed data ready for API
 */
export const transformImportData = (data, fieldMapping) => {
  return data.map(row => {
    const transformed = {};
    
    Object.keys(fieldMapping).forEach(csvField => {
      const targetField = fieldMapping[csvField];
      if (targetField && row[csvField]) {
        const value = row[csvField].trim();
        
        // Convert field names to API format
        const apiField = convertToApiFieldName(targetField);
        
        // Apply field-specific transformations
        transformed[apiField] = transformFieldValue(targetField, value);
      }
    });
    
    // Add metadata
    transformed.imported_at = new Date().toISOString();
    transformed.import_source = 'csv_upload';
    transformed.registration_context = 'admin_import';
    
    return transformed;
  });
};

/**
 * Convert frontend field names to API field names
 * @param {string} fieldName - Frontend field name
 * @returns {string} API field name
 */
const convertToApiFieldName = (fieldName) => {
  const fieldMap = {
    'firstName': 'first_name',
    'lastName': 'last_name',
    'dateOfBirth': 'date_of_birth',
    'preferredContactMethod': 'preferred_contact_method',
    'ministryInterests': 'ministry_interests',
    'pledgeAmount': 'pledge_amount'
  };
  return fieldMap[fieldName] || fieldName;
};

/**
 * Transform field values based on field type
 * @param {string} fieldType - Type of field being transformed
 * @param {string} value - Raw field value
 * @returns {any} Transformed value
 */
const transformFieldValue = (fieldType, value) => {
  if (!value) return null;
  
  switch (fieldType) {
    case 'email':
      return value.toLowerCase();
    
    case 'phone':
      // Format phone number
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length === 10) return `+1${cleaned}`;
      if (cleaned.length === 11 && cleaned.startsWith('1')) return `+${cleaned}`;
      return value; // Return as-is if format is unclear
    
    case 'pledgeAmount':
      const amount = parseFloat(value);
      return isNaN(amount) ? null : amount;
    
    case 'ministryInterests':
      // Split by semicolon or comma
      return value.split(/[;,]/).map(interest => interest.trim()).filter(Boolean);
    
    case 'dateOfBirth':
      // Ensure date is in YYYY-MM-DD format
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    
    default:
      return value;
  }
};

/**
 * Generate sample CSV template
 * @param {Array<Object>} fields - Field definitions
 * @returns {string} CSV template content
 */
export const generateCSVTemplate = (fields) => {
  const headers = fields.map(field => field.label);
  const sampleData = {
    'First Name': 'John',
    'Last Name': 'Doe',
    'Email': 'john.doe@example.com',
    'Phone': '+1 (555) 123-4567',
    'Date of Birth': '1990-01-15',
    'Gender': 'Male',
    'Address': '123 Main St, Anytown, ST 12345',
    'Contact Method': 'email',
    'Ministry Interests': 'Choir;Youth Ministry',
    'Pledge Amount': '50.00'
  };
  
  const sampleRow = headers.map(header => sampleData[header] || '');
  
  return headers.join(',') + '\n' + sampleRow.join(',');
};

/**
 * Validate CSV file before parsing
 * @param {File} file - File object to validate
 * @returns {Object} Validation result with success flag and error message
 */
export const validateCSVFile = (file) => {
  if (!file) {
    return { success: false, error: 'No file provided' };
  }
  
  if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
    return { success: false, error: 'File must be in CSV format' };
  }
  
  if (file.size === 0) {
    return { success: false, error: 'File is empty' };
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return { success: false, error: 'File size must be less than 10MB' };
  }
  
  return { success: true };
};

/**
 * Auto-detect field mappings based on CSV headers
 * @param {Array<string>} headers - CSV headers
 * @param {Array<Object>} expectedFields - Expected field definitions
 * @returns {Object} Auto-detected field mappings
 */
export const autoDetectFieldMapping = (headers, expectedFields) => {
  const mapping = {};
  
  headers.forEach(header => {
    const normalized = header.toLowerCase().replace(/[^a-z]/g, '');
    
    // Try exact matches first
    const exactMatch = expectedFields.find(field => 
      field.label.toLowerCase().replace(/[^a-z]/g, '') === normalized
    );
    
    if (exactMatch) {
      mapping[header] = exactMatch.key;
      return;
    }
    
    // Try partial matches
    const partialMatch = expectedFields.find(field => {
      const fieldNormalized = field.label.toLowerCase().replace(/[^a-z]/g, '');
      return fieldNormalized.includes(normalized) || normalized.includes(fieldNormalized);
    });
    
    if (partialMatch) {
      mapping[header] = partialMatch.key;
      return;
    }
    
    // Try key matches
    const keyMatch = expectedFields.find(field => 
      field.key.toLowerCase() === normalized
    );
    
    if (keyMatch) {
      mapping[header] = keyMatch.key;
    }
  });
  
  return mapping;
};

/**
 * Format import statistics for display
 * @param {Object} stats - Import statistics from API
 * @returns {Object} Formatted statistics
 */
export const formatImportStats = (stats) => {
  return {
    total: stats.total || 0,
    imported: stats.imported || 0,
    updated: stats.updated || 0,
    skipped: stats.skipped || 0,
    failed: stats.failed || 0,
    duplicates: stats.duplicates || 0,
    errors: stats.errors || []
  };
};

/**
 * Generate import preview data
 * @param {Array<Object>} data - Raw import data
 * @param {Object} fieldMapping - Field mappings
 * @param {number} previewRows - Number of rows to preview (default: 5)
 * @returns {Array<Object>} Preview data
 */
export const generateImportPreview = (data, fieldMapping, previewRows = 5) => {
  const preview = data.slice(0, previewRows);
  
  return preview.map((row, index) => {
    const previewRow = { _index: index };
    
    Object.keys(fieldMapping).forEach(csvField => {
      const targetField = fieldMapping[csvField];
      if (targetField) {
        previewRow[targetField] = row[csvField] || '';
      }
    });
    
    return previewRow;
  });
};

/**
 * Check for potential duplicate records
 * @param {Array<Object>} data - Import data
 * @param {string} emailField - Email field name in CSV
 * @returns {Array<Object>} Potential duplicates with details
 */
export const findPotentialDuplicates = (data, emailField) => {
  const duplicates = [];
  const emailMap = new Map();
  
  data.forEach((row, index) => {
    const email = row[emailField]?.trim().toLowerCase();
    if (email) {
      if (emailMap.has(email)) {
        duplicates.push({
          email,
          rows: [emailMap.get(email), index + 2], // +2 for Excel row numbers
          records: [data[emailMap.get(email) - 2], row]
        });
      } else {
        emailMap.set(email, index + 2);
      }
    }
  });
  
  return duplicates;
};

/**
 * Sanitize import data to prevent XSS and other security issues
 * @param {Array<Object>} data - Raw import data
 * @returns {Array<Object>} Sanitized data
 */
export const sanitizeImportData = (data) => {
  return data.map(row => {
    const sanitized = {};
    
    Object.keys(row).forEach(key => {
      let value = row[key];
      
      if (typeof value === 'string') {
        // Remove potentially dangerous characters/patterns
        value = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocols
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();
          
        // Limit length to prevent extremely long strings
        if (value.length > 1000) {
          value = value.substring(0, 1000);
        }
      }
      
      sanitized[key] = value;
    });
    
    return sanitized;
  });
};

// // Export utility functions as named exports for tree-shaking
// export {
//   parseCSVLine,
//   isValidDate,
//   convertToApiFieldName,
//   transformFieldValue,
//   cleanPhoneNumber,
//   parseMinistryInterests,
//   parsePledgeAmount,
//   generateCSVTemplate,
//   validateCSVFile,
//   autoDetectFieldMapping,
//   formatImportStats,
//   generateImportPreview,
//   findPotentialDuplicates,
//   sanitizeImportData,
//   validateImportData,
//   parseCSV,
//   exportMembersToCSV,
//   downloadCSV
// };