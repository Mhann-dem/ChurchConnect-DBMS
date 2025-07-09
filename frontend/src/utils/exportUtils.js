/**
 * Export utilities for ChurchConnect DBMS
 * Provides functions to export data in various formats
 */

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Optional array of headers
 * @param {Object} options - Export options
 * @returns {string} CSV string
 */
export const convertToCSV = (data, headers = null, options = {}) => {
  const {
    delimiter = ',',
    quote = '"',
    escape = '"',
    includeHeaders = true,
    dateFormat = 'YYYY-MM-DD',
    excludeFields = []
  } = options;

  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  if (!headers) {
    headers = Object.keys(data[0]).filter(key => !excludeFields.includes(key));
  }

  // Escape and quote CSV values
  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    let stringValue = String(value);
    
    // Format dates
    if (value instanceof Date) {
      stringValue = formatDate(value, dateFormat);
    }
    
    // Escape quotes
    if (stringValue.includes(quote)) {
      stringValue = stringValue.replace(new RegExp(quote, 'g'), escape + quote);
    }
    
    // Quote if contains delimiter, quote, or newline
    if (stringValue.includes(delimiter) || stringValue.includes(quote) || stringValue.includes('\n')) {
      stringValue = quote + stringValue + quote;
    }
    
    return stringValue;
  };

  let csvContent = '';
  
  // Add headers
  if (includeHeaders) {
    csvContent += headers.map(header => escapeCSVValue(header)).join(delimiter) + '\n';
  }
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => escapeCSVValue(row[header]));
    csvContent += values.join(delimiter) + '\n';
  });
  
  return csvContent;
};

/**
 * Download data as CSV file
 * @param {Array} data - Data to export
 * @param {string} filename - Filename without extension
 * @param {Object} options - Export options
 */
export const downloadCSV = (data, filename, options = {}) => {
  const csvContent = convertToCSV(data, null, options);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${filename}.csv`);
};

/**
 * Convert data to JSON format
 * @param {Array} data - Data to convert
 * @param {Object} options - Export options
 * @returns {string} JSON string
 */
export const convertToJSON = (data, options = {}) => {
  const {
    pretty = true,
    excludeFields = [],
    dateFormat = 'ISO'
  } = options;

  // Process data to exclude fields and format dates
  const processedData = data.map(item => {
    const processed = {};
    
    Object.keys(item).forEach(key => {
      if (!excludeFields.includes(key)) {
        let value = item[key];
        
        // Format dates
        if (value instanceof Date) {
          value = dateFormat === 'ISO' ? value.toISOString() : formatDate(value, dateFormat);
        }
        
        processed[key] = value;
      }
    });
    
    return processed;
  });

  return JSON.stringify(processedData, null, pretty ? 2 : 0);
};

/**
 * Download data as JSON file
 * @param {Array} data - Data to export
 * @param {string} filename - Filename without extension
 * @param {Object} options - Export options
 */
export const downloadJSON = (data, filename, options = {}) => {
  const jsonContent = convertToJSON(data, options);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadFile(blob, `${filename}.json`);
};

/**
 * Create Excel-compatible CSV
 * @param {Array} data - Data to export
 * @param {string} filename - Filename without extension
 * @param {Object} options - Export options
 */
export const downloadExcelCSV = (data, filename, options = {}) => {
  const csvContent = convertToCSV(data, null, {
    ...options,
    delimiter: ',',
    quote: '"'
  });
  
  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${filename}.csv`);
};

/**
 * Create and download PDF report
 * @param {Object} reportData - Report data
 * @param {string} filename - Filename without extension
 * @param {Object} options - PDF options
 */
export const downloadPDF = async (reportData, filename, options = {}) => {
  const {
    title = 'ChurchConnect Report',
    orientation = 'portrait',
    format = 'a4',
    margins = { top: 20, right: 20, bottom: 20, left: 20 },
    includeHeader = true,
    includeFooter = true,
    churchInfo = {}
  } = options;

  // This would typically use a library like jsPDF
  // For now, we'll create a simple HTML structure that can be printed
  const printWindow = window.open('', '_blank');
  const htmlContent = generatePDFHTML(reportData, { title, churchInfo, includeHeader, includeFooter });
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Trigger print dialog
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

/**
 * Generate HTML for PDF printing
 * @param {Object} data - Report data
 * @param {Object} options - HTML options
 * @returns {string} HTML string
 */
const generatePDFHTML = (data, options) => {
  const { title, churchInfo, includeHeader, includeFooter } = options;
  
  const currentDate = new Date().toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .church-info { margin-bottom: 20px; }
        .report-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .report-date { font-size: 14px; color: #666; }
        .content { margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f2f2f2; font-weight: bold; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-item { text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #333; }
        .stat-label { font-size: 14px; color: #666; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      ${includeHeader ? `
        <div class="header">
          <div class="church-info">
            <h1>${churchInfo.name || 'Church Name'}</h1>
            <p>${churchInfo.address || ''}</p>
            <p>${churchInfo.phone || ''} | ${churchInfo.email || ''}</p>
          </div>
          <div class="report-title">${title}</div>
          <div class="report-date">Generated on ${currentDate}</div>
        </div>
      ` : ''}
      
      <div class="content">
        ${generateReportContent(data)}
      </div>
      
      ${includeFooter ? `
        <div class="footer">
          <p>Generated by ChurchConnect DBMS - ${currentDate}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `;
};

/**
 * Generate report content based on data type
 * @param {Object} data - Report data
 * @returns {string} HTML content
 */
const generateReportContent = (data) => {
  if (data.stats) {
    return generateStatsReport(data);
  } else if (data.members) {
    return generateMembersReport(data);
  } else if (data.pledges) {
    return generatePledgesReport(data);
  } else if (data.groups) {
    return generateGroupsReport(data);
  }
  
  return '<p>No data to display</p>';
};

/**
 * Generate statistics report HTML
 * @param {Object} data - Statistics data
 * @returns {string} HTML content
 */
const generateStatsReport = (data) => {
  const { stats } = data;
  
  return `
    <div class="stats">
      ${Object.entries(stats).map(([key, value]) => `
        <div class="stat-item">
          <div class="stat-value">${value}</div>
          <div class="stat-label">${formatStatLabel(key)}</div>
        </div>
      `).join('')}
    </div>
  `;
};

/**
 * Generate members report HTML
 * @param {Object} data - Members data
 * @returns {string} HTML content
 */
const generateMembersReport = (data) => {
  const { members } = data;
  
  return `
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Registration Date</th>
          <th>Groups</th>
        </tr>
      </thead>
      <tbody>
        ${members.map(member => `
          <tr>
            <td>${member.first_name} ${member.last_name}</td>
            <td>${member.email}</td>
            <td>${member.phone}</td>
            <td>${formatDate(member.registration_date)}</td>
            <td>${member.groups ? member.groups.join(', ') : 'None'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

/**
 * Generate pledges report HTML
 * @param {Object} data - Pledges data
 * @returns {string} HTML content
 */
const generatePledgesReport = (data) => {
  const { pledges } = data;
  
  return `
    <table class="table">
      <thead>
        <tr>
          <th>Member</th>
          <th>Amount</th>
          <th>Frequency</th>
          <th>Start Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${pledges.map(pledge => `
          <tr>
            <td>${pledge.member_name}</td>
            <td>$${pledge.amount}</td>
            <td>${pledge.frequency}</td>
            <td>${formatDate(pledge.start_date)}</td>
            <td>${pledge.status}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

/**
 * Generate groups report HTML
 * @param {Object} data - Groups data
 * @returns {string} HTML content
 */
const generateGroupsReport = (data) => {
  const { groups } = data;
  
  return `
    <table class="table">
      <thead>
        <tr>
          <th>Group Name</th>
          <th>Leader</th>
          <th>Members</th>
          <th>Meeting Schedule</th>
        </tr>
      </thead>
      <tbody>
        ${groups.map(group => `
          <tr>
            <td>${group.name}</td>
            <td>${group.leader_name || 'TBD'}</td>
            <td>${group.member_count || 0}</td>
            <td>${group.meeting_schedule || 'TBD'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

/**
 * Format statistic label for display
 * @param {string} key - Statistic key
 * @returns {string} Formatted label
 */
const formatStatLabel = (key) => {
  const labels = {
    total_members: 'Total Members',
    new_members: 'New Members',
    active_groups: 'Active Groups',
    total_pledges: 'Total Pledges',
    active_pledges: 'Active Pledges',
    pledge_amount: 'Pledge Amount'
  };
  
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Date format
 * @returns {string} Formatted date
 */
const formatDate = (date, format = 'MM/DD/YYYY') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj)) return '';
  
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Generic file download function
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename
 */
const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Validate export data
 * @param {Array} data - Data to validate
 * @returns {Object} Validation result
 */
export const validateExportData = (data) => {
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
  
  // Check for consistent structure
  const firstItemKeys = Object.keys(data[0]);
  const inconsistentItems = data.filter(item => {
    const itemKeys = Object.keys(item);
    return itemKeys.length !== firstItemKeys.length || 
           !itemKeys.every(key => firstItemKeys.includes(key));
  });
  
  if (inconsistentItems.length > 0) {
    result.warnings.push(`${inconsistentItems.length} items have inconsistent structure`);
  }
  
  return result;
};

/**
 * Get export format options
 * @returns {Array} Available export formats
 */
export const getExportFormats = () => [
  { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
  { value: 'excel', label: 'Excel CSV', description: 'Excel-compatible CSV' },
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
  { value: 'pdf', label: 'PDF', description: 'Portable Document Format' }
];

/**
 * Get field options for export customization
 * @param {Array} data - Sample data
 * @returns {Array} Available fields
 */
export const getFieldOptions = (data) => {
  if (!data || data.length === 0) return [];
  
  const fields = Object.keys(data[0]);
  
    return fields.map(field => ({
      value: field,
      label: formatStatLabel(field)
    }));
  };
