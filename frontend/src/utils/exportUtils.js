/**
 * Export utilities for ChurchConnect DBMS
 * Handles data export functionality for CSV, PDF, and Excel formats
 */

import { formatDate, formatPhone, formatCurrency } from './formatters';

/**
 * Convert array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of column headers
 * @param {Object} options - Export options
 * @returns {string} CSV string
 */
export const convertToCSV = (data, headers = null, options = {}) => {
  if (!data || data.length === 0) {
    return '';
  }

  const {
    delimiter = ',',
    includeHeaders = true,
    customHeaders = {},
    dateFormat = 'MM/DD/YYYY'
  } = options;

  // Get headers from first object if not provided
  const columns = headers || Object.keys(data[0]);
  
  // Create header row
  let csv = '';
  if (includeHeaders) {
    const headerRow = columns.map(col => {
      const header = customHeaders[col] || col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `"${header}"`;
    }).join(delimiter);
    csv += headerRow + '\n';
  }

  // Create data rows
  data.forEach(row => {
    const dataRow = columns.map(col => {
      let value = row[col] || '';
      
      // Handle different data types
      if (value instanceof Date) {
        value = formatDate(value, dateFormat);
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains delimiter
        value = value.replace(/"/g, '""');
        if (value.includes(delimiter) || value.includes('\n') || value.includes('"')) {
          value = `"${value}"`;
        }
      } else if (typeof value === 'number') {
        value = value.toString();
      } else if (typeof value === 'boolean') {
        value = value ? 'Yes' : 'No';
      } else if (value === null || value === undefined) {
        value = '';
      }
      
      return value;
    }).join(delimiter);
    
    csv += dataRow + '\n';
  });

  return csv;
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV content string
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

/**
 * Export members data to CSV
 * @param {Array} members - Array of member objects
 * @param {Object} options - Export options
 */
export const exportMembersToCSV = (members, options = {}) => {
  const {
    includeFields = ['all'],
    filename = `members_export_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`,
    ...csvOptions
  } = options;

  // Define available fields for member export
  const availableFields = {
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    date_of_birth: 'Date of Birth',
    gender: 'Gender',
    address: 'Address',
    preferred_contact_method: 'Preferred Contact',
    registration_date: 'Registration Date',
    groups: 'Groups/Ministries',
    pledge_amount: 'Pledge Amount',
    pledge_frequency: 'Pledge Frequency'
  };

  // Determine which fields to include
  const fieldsToInclude = includeFields.includes('all') 
    ? Object.keys(availableFields)
    : includeFields.filter(field => availableFields[field]);

  // Transform member data for export
  const exportData = members.map(member => {
    const exportMember = {};
    
    fieldsToInclude.forEach(field => {
      switch (field) {
        case 'phone':
          exportMember[field] = formatPhone(member[field]);
          break;
        case 'date_of_birth':
        case 'registration_date':
          exportMember[field] = member[field] ? formatDate(member[field]) : '';
          break;
        case 'groups':
          exportMember[field] = member.groups?.map(g => g.name).join(', ') || '';
          break;
        case 'pledge_amount':
          exportMember[field] = member.pledge_amount ? formatCurrency(member.pledge_amount) : '';
          break;
        case 'gender':
          exportMember[field] = member[field]?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
          break;
        default:
          exportMember[field] = member[field] || '';
      }
    });
    
    return exportMember;
  });

  const csvContent = convertToCSV(exportData, fieldsToInclude, {
    ...csvOptions,
    customHeaders: availableFields
  });

  downloadCSV(csvContent, filename);
};

/**
 * Export pledges data to CSV
 * @param {Array} pledges - Array of pledge objects
 * @param {Object} options - Export options
 */
export const exportPledgesToCSV = (pledges, options = {}) => {
  const {
    filename = `pledges_export_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`,
    ...csvOptions
  } = options;

  const headers = ['member_name', 'email', 'amount', 'frequency', 'start_date', 'end_date', 'status'];
  const customHeaders = {
    member_name: 'Member Name',
    email: 'Email',
    amount: 'Amount',
    frequency: 'Frequency',
    start_date: 'Start Date',
    end_date: 'End Date',
    status: 'Status'
  };

  const exportData = pledges.map(pledge => ({
    member_name: pledge.member ? `${pledge.member.first_name} ${pledge.member.last_name}` : '',
    email: pledge.member?.email || '',
    amount: formatCurrency(pledge.amount),
    frequency: pledge.frequency?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '',
    start_date: formatDate(pledge.start_date),
    end_date: pledge.end_date ? formatDate(pledge.end_date) : '',
    status: pledge.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''
  }));

  const csvContent = convertToCSV(exportData, headers, {
    ...csvOptions,
    customHeaders
  });

  downloadCSV(csvContent, filename);
};

/**
 * Export groups data to CSV
 * @param {Array} groups - Array of group objects
 * @param {Object} options - Export options
 */
export const exportGroupsToCSV = (groups, options = {}) => {
  const {
    filename = `groups_export_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`,
    ...csvOptions
  } = options;

  const headers = ['name', 'description', 'leader_name', 'member_count', 'meeting_schedule', 'active'];
  const customHeaders = {
    name: 'Group Name',
    description: 'Description',
    leader_name: 'Leader',
    member_count: 'Member Count',
    meeting_schedule: 'Meeting Schedule',
    active: 'Active'
  };

  const exportData = groups.map(group => ({
    name: group.name || '',
    description: group.description || '',
    leader_name: group.leader_name || '',
    member_count: group.member_count || 0,
    meeting_schedule: group.meeting_schedule || '',
    active: group.active ? 'Yes' : 'No'
  }));

  const csvContent = convertToCSV(exportData, headers, {
    ...csvOptions,
    customHeaders
  });

  downloadCSV(csvContent, filename);
};

/**
 * Generate and download a comprehensive report
 * @param {Object} data - Object containing all data types
 * @param {Object} options - Export options
 */
export const exportComprehensiveReport = (data, options = {}) => {
  const {
    filename = `church_report_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`,
    includeStats = true,
    ...csvOptions
  } = options;

  const { members = [], pledges = [], groups = [] } = data;

  let csvContent = '';

  // Add statistics section if requested
  if (includeStats) {
    csvContent += 'CHURCH STATISTICS\n';
    csvContent += `Report Generated: ${formatDate(new Date(), 'MM/DD/YYYY hh:mm A')}\n`;
    csvContent += `Total Members: ${members.length}\n`;
    csvContent += `Total Pledges: ${pledges.length}\n`;
    csvContent += `Total Groups: ${groups.length}\n`;
    csvContent += `Active Members: ${members.filter(m => m.is_active).length}\n`;
    csvContent += `Active Pledges: ${pledges.filter(p => p.status === 'active').length}\n`;
    csvContent += '\n\n';
  }

  // Add members section
  if (members.length > 0) {
    csvContent += 'MEMBERS\n';
    const membersCSV = convertToCSV(members, null, {
      ...csvOptions,
      includeHeaders: true
    });
    csvContent += membersCSV + '\n\n';
  }

  // Add pledges section
  if (pledges.length > 0) {
    csvContent += 'PLEDGES\n';
    const pledgesData = pledges.map(pledge => ({
      member_name: pledge.member ? `${pledge.member.first_name} ${pledge.member.last_name}` : '',
      amount: formatCurrency(pledge.amount),
      frequency: pledge.frequency,
      status: pledge.status,
      start_date: formatDate(pledge.start_date)
    }));
    const pledgesCSV = convertToCSV(pledgesData, null, {
      ...csvOptions,
      includeHeaders: true
    });
    csvContent += pledgesCSV + '\n\n';
  }

  // Add groups section
  if (groups.length > 0) {
    csvContent += 'GROUPS\n';
    const groupsCSV = convertToCSV(groups, null, {
      ...csvOptions,
      includeHeaders: true
    });
    csvContent += groupsCSV + '\n\n';
  }

  downloadCSV(csvContent, filename);
};

/**
 * Validate data before export
 * @param {Array} data - Data to validate
 * @param {string} type - Type of data (members, pledges, groups)
 * @returns {Object} Validation result
 */
export const validateExportData = (data, type) => {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  if (!Array.isArray(data)) {
    result.valid = false;
    result.errors.push('Data must be an array');
    return result;
  }

  if (data.length === 0) {
    result.warnings.push('No data to export');
    return result;
  }

  // Type-specific validation
  switch (type) {
    case 'members':
      data.forEach((member, index) => {
        if (!member.first_name || !member.last_name) {
          result.warnings.push(`Member at index ${index} missing required name fields`);
        }
        if (!member.email) {
          result.warnings.push(`Member at index ${index} missing email`);
        }
      });
      break;
    
    case 'pledges':
      data.forEach((pledge, index) => {
        if (!pledge.amount || pledge.amount <= 0) {
          result.warnings.push(`Pledge at index ${index} has invalid amount`);
        }
        if (!pledge.member) {
          result.warnings.push(`Pledge at index ${index} missing member information`);
        }
      });
      break;
    
    case 'groups':
      data.forEach((group, index) => {
        if (!group.name) {
          result.warnings.push(`Group at index ${index} missing name`);
        }
      });
      break;
  }

  return result;
};

/**
 * Get export template for specific data type
 * @param {string} type - Data type (members, pledges, groups)
 * @returns {string} CSV template
 */
export const getExportTemplate = (type) => {
  const templates = {
    members: 'first_name,last_name,email,phone,date_of_birth,gender,address\n"John","Doe","john.doe@example.com","(555) 123-4567","01/15/1985","male","123 Main St"',
    pledges: 'member_email,amount,frequency,start_date\n"john.doe@example.com","100.00","monthly","01/01/2024"',
    groups: 'name,description,leader_name,meeting_schedule\n"Youth Group","Weekly youth meetings","Jane Smith","Sundays 6:00 PM"'
  };

  return templates[type] || '';
};

export default {
  convertToCSV,
  downloadCSV,
  exportMembersToCSV,
  exportPledgesToCSV,
  exportGroupsToCSV,
  exportComprehensiveReport,
  validateExportData,
  getExportTemplate
};