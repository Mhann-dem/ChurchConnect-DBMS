// frontend/src/components/admin/Events/BulkImportModal.jsx
import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  X, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Papa from 'papaparse';
import { useToast } from '../../../hooks/useToast';
import { eventsService } from '../../../services/events';
import LoadingSpinner from '../../shared/LoadingSpinner';

const BulkImportModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Import, 4: Results
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [importProgress, setImportProgress] = useState(0);

  const fileInputRef = useRef();
  const { success, error, loading: loadingToast, updateProgress } = useToast ();

  // CSV Template headers matching your backend Event model
  const eventFields = [
    { key: 'title', label: 'Title', required: true, example: 'Sunday Worship Service' },
    { key: 'description', label: 'Description', required: false, example: 'Join us for worship and fellowship' },
    { key: 'event_type', label: 'Event Type', required: true, example: 'service' },
    { key: 'location', label: 'Location', required: false, example: 'Main Sanctuary' },
    { key: 'start_datetime', label: 'Start Date & Time', required: true, example: '2024-12-25 09:00:00' },
    { key: 'end_datetime', label: 'End Date & Time', required: true, example: '2024-12-25 11:00:00' },
    { key: 'organizer', label: 'Organizer', required: false, example: 'Pastor John Smith' },
    { key: 'contact_email', label: 'Contact Email', required: false, example: 'events@church.com' },
    { key: 'contact_phone', label: 'Contact Phone', required: false, example: '(555) 123-4567' },
    { key: 'max_capacity', label: 'Max Capacity', required: false, example: '100' },
    { key: 'registration_fee', label: 'Registration Fee', required: false, example: '10.00' },
    { key: 'requires_registration', label: 'Requires Registration', required: false, example: 'true/false' },
    { key: 'is_public', label: 'Is Public', required: false, example: 'true/false' },
    { key: 'status', label: 'Status', required: false, example: 'published' }
  ];

  // Event type options for validation
  const eventTypes = [
    'service', 'meeting', 'social', 'youth', 'workshop', 'outreach', 
    'conference', 'retreat', 'fundraiser', 'kids', 'seniors', 'prayer', 
    'bible_study', 'baptism', 'wedding', 'funeral', 'other'
  ];

  const statusOptions = ['draft', 'published', 'cancelled', 'postponed'];

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = [
      // Header row
      eventFields.map(field => field.label),
      // Example row
      eventFields.map(field => field.example),
      // Empty rows for user data
      ...Array(5).fill(eventFields.map(() => ''))
    ];

    const csvString = Papa.unparse(csvContent);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `events_import_template_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    success('CSV template downloaded successfully');
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      error('Please select a CSV file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      error('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  // Parse CSV file
  const parseCSV = (file) => {
    const loadingId = loadingToast('Parsing CSV file...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        updateProgress(loadingId, 80, 'Processing data...');
        
        if (results.errors.length > 0) {
          console.warn('CSV parsing errors:', results.errors);
        }

        const { data, meta } = results;
        setHeaders(meta.fields || []);
        setCsvData(data);
        
        // Auto-map fields based on header names
        const autoMapping = {};
        meta.fields.forEach(header => {
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matchedField = eventFields.find(field => 
            field.key.replace(/_/g, '').toLowerCase() === normalizedHeader ||
            field.label.replace(/[^a-z0-9]/g, '').toLowerCase() === normalizedHeader
          );
          if (matchedField) {
            autoMapping[header] = matchedField.key;
          }
        });
        
        setFieldMapping(autoMapping);
        setStep(2);
        updateProgress(loadingId, 100, 'CSV parsed successfully');
        
        setTimeout(() => {
          const { removeToast } = useToast ();
          removeToast(loadingId);
        }, 1000);
      },
      error: (error) => {
        error('Failed to parse CSV file: ' + error.message);
        const { removeToast } = useToast ();
        removeToast(loadingId);
      }
    });
  };

  // Update field mapping
  const updateFieldMapping = (csvHeader, eventField) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvHeader]: eventField
    }));
  };

  // Validate data before import
  const validateData = () => {
    const errors = [];
    const mappedFields = Object.values(fieldMapping);

    // Check required fields are mapped
    const requiredFields = eventFields.filter(field => field.required);
    requiredFields.forEach(field => {
      if (!mappedFields.includes(field.key)) {
        errors.push({
          type: 'missing_required',
          message: `Required field "${field.label}" is not mapped`
        });
      }
    });

    // Validate data rows
    csvData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because CSV is 1-indexed and has header

      // Check required fields have values
      Object.entries(fieldMapping).forEach(([csvHeader, eventField]) => {
        const field = eventFields.find(f => f.key === eventField);
        if (field?.required && !row[csvHeader]?.trim()) {
          errors.push({
            type: 'missing_value',
            row: rowNumber,
            field: field.label,
            message: `Row ${rowNumber}: ${field.label} is required but empty`
          });
        }
      });

      // Validate specific field formats
      Object.entries(fieldMapping).forEach(([csvHeader, eventField]) => {
        const value = row[csvHeader];
        if (!value?.trim()) return;

        switch (eventField) {
          case 'start_datetime':
          case 'end_datetime':
          case 'registration_deadline':
            if (!isValidDateTime(value)) {
              errors.push({
                type: 'invalid_format',
                row: rowNumber,
                field: eventField,
                message: `Row ${rowNumber}: Invalid date format. Use YYYY-MM-DD HH:MM:SS`
              });
            }
            break;

          case 'event_type':
            if (!eventTypes.includes(value.toLowerCase())) {
              errors.push({
                type: 'invalid_value',
                row: rowNumber,
                field: eventField,
                message: `Row ${rowNumber}: Invalid event type "${value}". Must be one of: ${eventTypes.join(', ')}`
              });
            }
            break;

          case 'status':
            if (!statusOptions.includes(value.toLowerCase())) {
              errors.push({
                type: 'invalid_value',
                row: rowNumber,
                field: eventField,
                message: `Row ${rowNumber}: Invalid status "${value}". Must be one of: ${statusOptions.join(', ')}`
              });
            }
            break;

          case 'contact_email':
            if (!isValidEmail(value)) {
              errors.push({
                type: 'invalid_format',
                row: rowNumber,
                field: eventField,
                message: `Row ${rowNumber}: Invalid email format`
              });
            }
            break;

          case 'max_capacity':
            if (isNaN(value) || parseInt(value) < 1) {
              errors.push({
                type: 'invalid_format',
                row: rowNumber,
                field: eventField,
                message: `Row ${rowNumber}: Max capacity must be a positive number`
              });
            }
            break;

          case 'registration_fee':
            if (isNaN(value) || parseFloat(value) < 0) {
              errors.push({
                type: 'invalid_format',
                row: rowNumber,
                field: eventField,
                message: `Row ${rowNumber}: Registration fee must be a positive number`
              });
            }
            break;

          case 'requires_registration':
          case 'is_public':
          case 'is_featured':
            if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
              errors.push({
                type: 'invalid_format',
                row: rowNumber,
                field: eventField,
                message: `Row ${rowNumber}: Boolean field must be true/false, 1/0, or yes/no`
              });
            }
            break;
        }
      });

      // Validate date logic
      const startDate = getFieldValue(row, 'start_datetime');
      const endDate = getFieldValue(row, 'end_datetime');
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start >= end) {
          errors.push({
            type: 'logic_error',
            row: rowNumber,
            message: `Row ${rowNumber}: End date must be after start date`
          });
        }
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Helper function to get field value from row
  const getFieldValue = (row, fieldKey) => {
    const csvHeader = Object.keys(fieldMapping).find(header => fieldMapping[header] === fieldKey);
    return csvHeader ? row[csvHeader] : null;
  };

  // Validation helper functions
  const isValidDateTime = (value) => {
    const formats = [
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
      /^\d{4}-\d{2}-\d{2}$/
    ];
    return formats.some(format => format.test(value)) && !isNaN(Date.parse(value));
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Convert CSV boolean values
  const convertBoolean = (value) => {
    if (!value) return false;
    const lower = value.toLowerCase();
    return ['true', '1', 'yes'].includes(lower);
  };

  // Proceed to import step
  const proceedToImport = () => {
    if (!validateData()) {
      error('Please fix validation errors before importing');
      return;
    }
    setStep(3);
  };

  // Perform the actual import
  const performImport = async () => {
    setImporting(true);
    setImportProgress(0);
    
    const progressId = loadingToast('Importing events...');
    
    try {
      const eventsToImport = csvData.map((row, index) => {
        const eventData = {};
        
        // Map CSV data to event fields
        Object.entries(fieldMapping).forEach(([csvHeader, eventField]) => {
          const value = row[csvHeader];
          if (!value?.trim()) return;

          switch (eventField) {
            case 'max_capacity':
              eventData[eventField] = parseInt(value) || null;
              break;
              
            case 'registration_fee':
              eventData[eventField] = parseFloat(value) || 0;
              break;
              
            case 'requires_registration':
            case 'is_public':
            case 'is_featured':
              eventData[eventField] = convertBoolean(value);
              break;
              
            case 'event_type':
            case 'status':
              eventData[eventField] = value.toLowerCase();
              break;
              
            default:
              eventData[eventField] = value.trim();
          }
        });

        // Set default values
        eventData.status = eventData.status || 'draft';
        eventData.is_public = eventData.is_public !== undefined ? eventData.is_public : true;
        eventData.requires_registration = eventData.requires_registration || false;
        eventData.registration_fee = eventData.registration_fee || 0;

        return eventData;
      });

      updateProgress(progressId, 20, 'Processing events...');

      const results = {
        total: eventsToImport.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      // Import events in batches to avoid overwhelming the server
      const batchSize = 5;
      for (let i = 0; i < eventsToImport.length; i += batchSize) {
        const batch = eventsToImport.slice(i, i + batchSize);
        const batchPromises = batch.map(async (eventData, batchIndex) => {
          const globalIndex = i + batchIndex;
          try {
            await eventsService.createEvent(eventData);
            results.successful++;
            return { success: true, index: globalIndex };
          } catch (err) {
            results.failed++;
            results.errors.push({
              row: globalIndex + 2, // +2 for CSV header and 0-based index
              error: err.response?.data?.detail || err.message || 'Unknown error'
            });
            return { success: false, index: globalIndex, error: err };
          }
        });

        await Promise.allSettled(batchPromises);
        
        // Update progress
        const progress = Math.min(90, ((i + batchSize) / eventsToImport.length) * 80 + 20);
        setImportProgress(progress);
        updateProgress(progressId, progress, `Imported ${Math.min(i + batchSize, eventsToImport.length)} of ${eventsToImport.length} events...`);
      }

      updateProgress(progressId, 100, 'Import completed');
      setImportResults(results);
      setStep(4);

      setTimeout(() => {
        const { removeToast } = useToast ();
        removeToast(progressId);
      }, 1000);

      if (results.successful > 0) {
        success(`Successfully imported ${results.successful} events!`);
      }
      
      if (results.failed > 0) {
        error(`${results.failed} events failed to import. Check the results for details.`);
      }

    } catch (err) {
      console.error('Import error:', err);
      error('Import failed: ' + (err.message || 'Unknown error'));
      
      const { removeToast } = useToast ();
      removeToast(progressId);
    } finally {
      setImporting(false);
    }
  };

  // Reset the import process
  const resetImport = () => {
    setStep(1);
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setFieldMapping({});
    setValidationErrors([]);
    setImportResults(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 24px 16px',
      borderBottom: '1px solid #e5e7eb'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937',
      margin: 0
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      color: '#6b7280'
    },
    content: {
      padding: '24px'
    },
    stepIndicator: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '32px',
      position: 'relative'
    },
    stepItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: 1,
      position: 'relative'
    },
    stepNumber: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '8px',
      fontSize: '16px',
      fontWeight: 'bold'
    },
    stepLabel: {
      fontSize: '14px',
      textAlign: 'center'
    },
    uploadArea: {
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      padding: '48px 24px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    uploadAreaHover: {
      borderColor: '#3b82f6',
      backgroundColor: '#f8fafc'
    },
    button: {
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none'
    },
    secondaryButton: {
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #d1d5db'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '16px'
    },
    th: {
      padding: '12px',
      textAlign: 'left',
      borderBottom: '2px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      fontSize: '14px',
      fontWeight: '600'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '14px'
    },
    select: {
      width: '100%',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px'
    }
  };

  const getStepStyle = (stepNumber) => ({
    ...modalStyles.stepNumber,
    backgroundColor: step >= stepNumber ? '#3b82f6' : '#e5e7eb',
    color: step >= stepNumber ? 'white' : '#6b7280'
  });

  const renderStepIndicator = () => (
    <div style={modalStyles.stepIndicator}>
      {[
        { number: 1, label: 'Upload CSV' },
        { number: 2, label: 'Map Fields' },
        { number: 3, label: 'Import' },
        { number: 4, label: 'Results' }
      ].map((stepInfo, index) => (
        <div key={stepInfo.number} style={modalStyles.stepItem}>
          <div style={getStepStyle(stepInfo.number)}>
            {step > stepInfo.number ? <CheckCircle size={20} /> : stepInfo.number}
          </div>
          <div style={{
            ...modalStyles.stepLabel,
            color: step >= stepInfo.number ? '#1f2937' : '#6b7280'
          }}>
            {stepInfo.label}
          </div>
          {index < 3 && (
            <ArrowRight 
              size={16} 
              style={{
                position: 'absolute',
                right: '-12px',
                top: '12px',
                color: step > stepInfo.number ? '#3b82f6' : '#e5e7eb'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderUploadStep = () => (
    <div>
      <div style={{
        ...modalStyles.uploadArea,
        ...(file ? { borderColor: '#10b981', backgroundColor: '#f0fdf4' } : {})
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {file ? (
          <>
            <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#1f2937' }}>File Selected</h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280' }}>{file.name}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{...modalStyles.button, ...modalStyles.secondaryButton}}
            >
              <Upload size={16} />
              Choose Different File
            </button>
          </>
        ) : (
          <>
            <Upload size={48} style={{ color: '#6b7280', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#1f2937' }}>Upload CSV File</h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280' }}>
              Select a CSV file containing event data to import
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{...modalStyles.button, ...modalStyles.primaryButton}}
            >
              <Upload size={16} />
              Choose File
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ marginBottom: '16px', color: '#6b7280' }}>
          Don't have a CSV file? Download our template to get started.
        </p>
        <button
          onClick={downloadTemplate}
          style={{...modalStyles.button, ...modalStyles.secondaryButton}}
        >
          <Download size={16} />
          Download Template
        </button>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} />
          CSV Format Requirements
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
          <li>First row must contain column headers</li>
          <li>Date format: YYYY-MM-DD HH:MM:SS (time optional)</li>
          <li>Boolean fields: true/false, 1/0, or yes/no</li>
          <li>Event types: {eventTypes.join(', ')}</li>
          <li>Status options: {statusOptions.join(', ')}</li>
        </ul>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div>
      <h3>Map CSV Columns to Event Fields</h3>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Match your CSV columns to the corresponding event fields. Required fields are marked with *.
      </p>

      <table style={modalStyles.table}>
        <thead>
          <tr>
            <th style={modalStyles.th}>CSV Column</th>
            <th style={modalStyles.th}>Sample Data</th>
            <th style={modalStyles.th}>Map to Event Field</th>
          </tr>
        </thead>
        <tbody>
          {headers.map(header => (
            <tr key={header}>
              <td style={modalStyles.td}>
                <strong>{header}</strong>
              </td>
              <td style={modalStyles.td}>
                {csvData[0]?.[header] || <em style={{ color: '#6b7280' }}>No data</em>}
              </td>
              <td style={modalStyles.td}>
                <select
                  value={fieldMapping[header] || ''}
                  onChange={(e) => updateFieldMapping(header, e.target.value)}
                  style={modalStyles.select}
                >
                  <option value="">-- Don't Import --</option>
                  {eventFields.map(field => (
                    <option key={field.key} value={field.key}>
                      {field.label} {field.required && '*'}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
        <button
          onClick={() => setStep(1)}
          style={{...modalStyles.button, ...modalStyles.secondaryButton}}
        >
          Back
        </button>
        <button
          onClick={proceedToImport}
          style={{...modalStyles.button, ...modalStyles.primaryButton}}
          disabled={Object.keys(fieldMapping).length === 0}
        >
          Continue to Import
        </button>
      </div>
    </div>
  );

  const renderImportStep = () => (
    <div>
      <h3>Ready to Import</h3>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Review the import details below and click "Start Import" when ready.
      </p>

      <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px' }}>Import Summary</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <strong>Total Events:</strong> {csvData.length}
          </div>
          <div>
            <strong>Mapped Fields:</strong> {Object.keys(fieldMapping).length}
          </div>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px' 
        }}>
          <h4 style={{ margin: '0 0 12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={16} />
            Validation Errors ({validationErrors.length})
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {validationErrors.map((error, index) => (
              <div key={index} style={{ marginBottom: '8px', fontSize: '14px', color: '#dc2626' }}>
                • {error.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {validationErrors.length === 0 && (
        <div style={{ 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px' 
        }}>
          <div style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} />
            <strong>Validation Passed</strong>
          </div>
          <p style={{ margin: '8px 0 0', color: '#15803d' }}>
            All data is valid and ready for import.
          </p>
        </div>
      )}

      {importing && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Import Progress</span>
            <span>{Math.round(importProgress)}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${importProgress}%`,
              height: '100%',
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={() => setStep(2)}
          style={{...modalStyles.button, ...modalStyles.secondaryButton}}
          disabled={importing}
        >
          Back
        </button>
        <button
          onClick={performImport}
          style={{
            ...modalStyles.button, 
            ...modalStyles.primaryButton,
            opacity: importing || validationErrors.length > 0 ? 0.5 : 1
          }}
          disabled={importing || validationErrors.length > 0}
        >
          {importing ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload size={16} />
              Start Import
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderResultsStep = () => (
    <div>
      <h3>Import Results</h3>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Import completed. Review the results below.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <CheckCircle size={24} style={{ color: '#16a34a', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
            {importResults?.successful || 0}
          </div>
          <div style={{ color: '#15803d' }}>Successful</div>
        </div>

        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <XCircle size={24} style={{ color: '#dc2626', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
            {importResults?.failed || 0}
          </div>
          <div style={{ color: '#dc2626' }}>Failed</div>
        </div>

        <div style={{ 
          backgroundColor: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          padding: '16px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <FileText size={24} style={{ color: '#64748b', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#64748b' }}>
            {importResults?.total || 0}
          </div>
          <div style={{ color: '#64748b' }}>Total</div>
        </div>
      </div>

      {importResults?.errors && importResults.errors.length > 0 && (
        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '24px' 
        }}>
          <h4 style={{ margin: '0 0 12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            Import Errors
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {importResults.errors.map((error, index) => (
              <div key={index} style={{ marginBottom: '8px', fontSize: '14px', color: '#dc2626' }}>
                Row {error.row}: {error.error}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={resetImport}
          style={{...modalStyles.button, ...modalStyles.secondaryButton}}
        >
          <RefreshCw size={16} />
          Import More Events
        </button>
        <button
          onClick={() => {
            onSuccess?.(importResults);
            onClose();
          }}
          style={{...modalStyles.button, ...modalStyles.primaryButton}}
        >
          <CheckCircle size={16} />
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>Bulk Import Events</h2>
          <button 
            onClick={onClose}
            style={modalStyles.closeButton}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        <div style={modalStyles.content}>
          {renderStepIndicator()}
          
          {step === 1 && renderUploadStep()}
          {step === 2 && renderMappingStep()}
          {step === 3 && renderImportStep()}
          {step === 4 && renderResultsStep()}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;