// frontend/src/utils/importUtils.js

/**
 * Parse CSV file and return array of objects
 * @param {File} file - CSV file to parse
 * @returns {Promise<Array>} - Array of objects representing CSV rows
 */
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('File is empty'));
          return;
        }

        // Parse headers
        const headers = lines[0].split(',').map(header => 
          header.trim().replace(/"/g, '')
        );

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const row = {};
          const values = parseCSVLine(lines[i]);
          
          if (values.length === headers.length) {
            headers.forEach((header, index) => {
              row[header] = values[index];
            });
            data.push(row);
          }
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse CSV: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Parse a single CSV line, handling quoted values and commas
 * @param {string} line - CSV line to parse
 * @returns {Array<string>} - Array of field values
 */
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
};

/**
 * Validate imported member data
 * @param {Array} data - Array of member objects to validate
 * @returns {Object} - Validation result with valid data and errors
 */
export const validateImportData = (data) => {
  const validData = [];
  const errors = [];
  const duplicateEmails = new Set();
  const seenEmails = new Set();

  data.forEach((member, index) => {
    const rowErrors = [];
    const rowNumber = index + 1;

    // Required field validation
    if (!member.firstName || !member.firstName.trim()) {
      rowErrors.push(`Row ${rowNumber}: First name is required`);
    }

    if (!member.lastName || !member.lastName.trim()) {
      rowErrors.push(`Row ${rowNumber}: Last name is required`);
    }

    if (!member.email || !member.email.trim()) {
      rowErrors.push(`Row ${rowNumber}: Email is required`);
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.email.trim())) {
        rowErrors.push(`Row ${rowNumber}: Invalid email format`);
      }
      
      // Check for duplicate emails within the import
      const normalizedEmail = member.email.trim().toLowerCase();
      if (seenEmails.has(normalizedEmail)) {
        duplicateEmails.add(normalizedEmail);
        rowErrors.push(`Row ${rowNumber}: Duplicate email found in import data`);
      } else {
        seenEmails.add(normalizedEmail);
      }
    }

    if (!member.phone || !member.phone.trim()) {
      rowErrors.push(`Row ${rowNumber}: Phone number is required`);
    } else {
      // Basic phone validation (remove non-digits and check length)
      const phoneDigits = member.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        rowErrors.push(`Row ${rowNumber}: Phone number must be at least 10 digits`);
      }
    }

    // Optional field validation
    if (member.dateOfBirth && !isValidDate(member.dateOfBirth)) {
      rowErrors.push(`Row ${rowNumber}: Invalid date format for date of birth (use YYYY-MM-DD)`);
    }

    if (member.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(member.gender.toLowerCase())) {
      rowErrors.push(`Row ${rowNumber}: Invalid gender value (use: male, female, other, prefer_not_to_say)`);
    }

    if (member.preferredContactMethod && 
        !['email', 'phone', 'sms', 'mail'].includes(member.preferredContactMethod.toLowerCase())) {
      rowErrors.push(`Row ${rowNumber}: Invalid contact method (use: email, phone, sms, mail)`);
    }

    // Add row errors to main errors array
    errors.push(...rowErrors);

    // If no errors, add to valid data with cleaned values
    if (rowErrors.length === 0) {
      const cleanedMember = {
        firstName: member.firstName.trim(),
        lastName: member.lastName.trim(),
        email: member.email.trim().toLowerCase(),
        phone: cleanPhoneNumber(member.phone),
        dateOfBirth: member.dateOfBirth || null,
        gender: member.gender ? member.gender.toLowerCase() : null,
        address: member.address ? member.address.trim() : '',
        preferredContactMethod: member.preferredContactMethod ? 
          member.preferredContactMethod.toLowerCase() : 'email',
        preferredLanguage: member.preferredLanguage || 'English',
        ministryInterests: parseMinistryInterests(member.ministryInterests),
        pledgeAmount: parsePledgeAmount(member.pledgeAmount),
        pledgeFrequency: member.pledgeFrequency || null,
        // Add import metadata
        ...member
      };
      
      validData.push(cleanedMember);
    }
  });

  return {
    validData,
    errors,
    summary: {
      total: data.length,
      valid: validData.length,
      invalid: data.length - validData.length,
      duplicateEmails: duplicateEmails.size
    }
  };
};

/**
 * Check if a date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid date
 */
const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  // Support common date formats
  const dateFormats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
  ];

  if (!dateFormats.some(format => format.test(dateString))) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
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
 * Generate sample CSV data for download template
 * @returns {string} - CSV template string
 */
export const generateCSVTemplate = () => {
  const headers = [
    'First Name',
    'Last Name', 
    'Email',
    'Phone',
    'Date of Birth',
    'Gender',
    'Address',
    'Contact Method',
    'Language',
    'Ministry Interests',
    'Pledge Amount'
  ];

  const sampleData = [
    [
      'John',
      'Doe',
      'john.doe@example.com',
      '(555) 123-4567',
      '1985-06-15',
      'male',
      '123 Main St, City, ST 12345',
      'email',
      'English',
      'Choir; Youth Ministry',
      '50'
    ],
    [
      'Jane',
      'Smith',
      'jane.smith@example.com',
      '555-987-6543',
      '1990-03-22',
      'female',
      '456 Oak Ave, Town, ST 67890',
      'phone',
      'English',
      'Women\'s Ministry; Bible Study',
      '25'
    ],
    [
      'Carlos',
      'Rodriguez',
      'carlos.rodriguez@example.com',
      '+1 (555) 246-8135',
      '1978-12-03',
      'male',
      '789 Pine St, Village, ST 54321',
      'sms',
      'Spanish',
      'Men\'s Ministry; Outreach',
      '100'
    ]
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => 
      row.map(field => 
        field.includes(',') || field.includes('"') ? 
        `"${field.replace(/"/g, '""')}"` : field
      ).join(',')
    )
  ].join('\n');

  return csvContent;
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