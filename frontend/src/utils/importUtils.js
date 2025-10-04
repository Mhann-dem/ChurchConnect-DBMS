// frontend/src/utils/importUtils.js

// frontend/src/utils/importUtils.js - SIMPLIFIED VERSION
// Let the backend handle all transformations

/**
 * Parse CSV text into array of objects
 * SIMPLIFIED: Just parse, don't transform
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
    
    if (values.length === 0) continue;
    
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
 * Parse a single CSV line handling quoted fields
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
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  
  return result.map(field => {
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1);
    }
    return field;
  });
};

/**
 * Validate import data - BASIC validation only
 * Backend will do the real validation
 */
export const validateImportData = (data, fieldMapping) => {
  const errors = [];
  
  if (!Array.isArray(data) || data.length === 0) {
    errors.push('No data to validate');
    return errors;
  }

  // Check required field mappings only
  const requiredFields = ['firstName', 'lastName', 'email'];
  const mappedFields = Object.values(fieldMapping);
  
  requiredFields.forEach(field => {
    if (!mappedFields.includes(field)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailField = Object.keys(fieldMapping).find(key => fieldMapping[key] === 'email');
  
  if (emailField) {
    let invalidEmails = 0;
    data.forEach((row, index) => {
      const email = row[emailField]?.trim();
      if (email && !emailRegex.test(email)) {
        invalidEmails++;
        if (invalidEmails <= 3) {
          errors.push(`Row ${index + 2}: Invalid email format: ${email}`);
        }
      }
    });
    if (invalidEmails > 3) {
      errors.push(`...and ${invalidEmails - 3} more invalid emails`);
    }
  }

  return errors;
};

/**
 * Auto-detect field mappings - UPDATED for your column names
 */
export const autoDetectFieldMapping = (headers, expectedFields) => {
  const mapping = {};
  
  // Your expected field definitions
  const fieldVariations = {
    'firstName': ['first name', 'firstname', 'first_name', 'first', 'given name'],
    'lastName': ['last name', 'lastname', 'last_name', 'last', 'surname'],
    'email': ['email', 'email address', 'e-mail', 'mail'],
    'phone': ['phone', 'phone number', 'mobile', 'cell', 'telephone'],
    'dateOfBirth': ['date of birth', 'dob', 'birth date', 'birthdate', 'birthday'],
    'gender': ['gender', 'sex'],
    'address': ['address', 'home address', 'location', 'street address'],
    'emergencyContactName': ['emergency contact name', 'emergency contact', 'emergency name'],
    'emergencyContactPhone': ['emergency contact phone', 'emergency phone', 'emergency number'],
    'preferredName': ['preferred name', 'nickname', 'goes by'],
    'alternatePhone': ['alternate phone', 'alt phone', 'secondary phone', 'other phone'],
    'notes': ['notes', 'comments', 'remarks']
  };
  
  headers.forEach(header => {
    const normalized = header.toLowerCase().trim();
    
    // Try to match against field variations
    for (const [fieldKey, variations] of Object.entries(fieldVariations)) {
      if (variations.some(v => normalized === v || normalized.replace(/[^a-z]/g, '') === v.replace(/[^a-z]/g, ''))) {
        mapping[header] = fieldKey;
        break;
      }
    }
  });
  
  console.log('[ImportUtils] Auto-detected mapping:', mapping);
  return mapping;
};

/**
 * Validate CSV file
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
  
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'File size must be less than 10MB' };
  }
  
  return { success: true };
};

/**
 * Generate import preview
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
 * Export members to CSV
 */
export const exportMembersToCSV = (members, fields = null) => {
  if (!members || members.length === 0) {
    return '';
  }

  const defaultFields = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'address', label: 'Address' },
    { key: 'emergency_contact_name', label: 'Emergency Contact Name' },
    { key: 'emergency_contact_phone', label: 'Emergency Contact Phone' }
  ];

  const exportFields = fields || defaultFields;
  const headers = exportFields.map(field => field.label);
  
  const csvRows = [
    headers.join(','),
    ...members.map(member => 
      exportFields.map(field => {
        const value = member[field.key] || '';
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