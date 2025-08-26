import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Mail, 
  MessageSquare, 
  Download, 
  Trash2, 
  Tag, 
  UserPlus, 
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { parseCSV, validateImportData } from '../../../utils/importUtils';
import styles from './Members.module.css';

const BulkActions = ({ 
  selectedMembers, 
  onClearSelection, 
  onBulkAction,
  onImportMembers,
  totalMembers,
  allMembers 
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionType, setActionType] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importPreview, setImportPreview] = useState([]);
  const [importStep, setImportStep] = useState('upload'); // upload, preview, process
  const [fieldMapping, setFieldMapping] = useState({});
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip'); // skip, update, create_new
  
  const fileInputRef = useRef(null);

  // Tag management state
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([
    { id: 1, name: 'New Member', color: '#10B981' },
    { id: 2, name: 'Leadership', color: '#8B5CF6' },
    { id: 3, name: 'Volunteer', color: '#F59E0B' },
    { id: 4, name: 'Young Adult', color: '#3B82F6' },
    { id: 5, name: 'Senior', color: '#EF4444' },
    { id: 6, name: 'Follow Up', color: '#F97316' },
    { id: 7, name: 'Imported', color: '#6B7280' }
  ]);

  // Email composition state
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
    template: 'custom'
  });

  const emailTemplates = {
    welcome: {
      subject: 'Welcome to Our Church Family',
      message: `Dear [Name],

We're thrilled to welcome you to our church family! Thank you for taking the time to register with us.

We look forward to getting to know you better and helping you find your place in our community.

Blessings,
Church Administration Team`
    },
    event: {
      subject: 'Upcoming Church Event',
      message: `Dear [Name],

We have an exciting upcoming event that we'd love for you to join us for!

Event details will be shared soon. Stay tuned!

Blessings,
Church Administration Team`
    },
    followup: {
      subject: 'Following Up With You',
      message: `Dear [Name],

We wanted to reach out and see how you're doing. If you have any questions or need prayer, please don't hesitate to reach out.

We're here for you!

Blessings,
Church Administration Team`
    }
  };

  // Expected CSV fields for mapping
  const expectedFields = [
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'dateOfBirth', label: 'Date of Birth', required: false },
    { key: 'gender', label: 'Gender', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'preferredContactMethod', label: 'Contact Method', required: false },
    { key: 'ministryInterests', label: 'Ministry Interests', required: false },
    { key: 'pledgeAmount', label: 'Pledge Amount', required: false }
  ];

  useEffect(() => {
    if (selectedMembers.length === 0) {
      setShowActionMenu(false);
      setActionType('');
    }
  }, [selectedMembers]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFile(file);
    setImportErrors([]);
    setIsProcessing(true);

    try {
      let data;
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        data = await parseCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // For Excel files, you'd need a library like xlsx
        throw new Error('Excel import coming soon. Please use CSV format.');
      } else {
        throw new Error('Unsupported file format. Please use CSV files.');
      }

      if (data.length === 0) {
        throw new Error('The file appears to be empty or invalid.');
      }

      // Auto-detect field mapping
      const headers = Object.keys(data[0]);
      const autoMapping = {};
      headers.forEach(header => {
        const normalized = header.toLowerCase().replace(/[^a-z]/g, '');
        const match = expectedFields.find(field => 
          field.label.toLowerCase().replace(/[^a-z]/g, '').includes(normalized) ||
          field.key.toLowerCase().includes(normalized)
        );
        if (match) {
          autoMapping[header] = match.key;
        }
      });

      setFieldMapping(autoMapping);
      setImportData(data);
      setImportPreview(data.slice(0, 5)); // Show first 5 rows
      setImportStep('preview');

    } catch (error) {
      setImportErrors([error.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportConfirm = async () => {
    setIsProcessing(true);
    
    try {
      // Validate and transform data
      const transformedData = importData.map((row, index) => {
        const transformed = {};
        Object.keys(fieldMapping).forEach(csvField => {
          const targetField = fieldMapping[csvField];
          if (targetField && row[csvField]) {
            transformed[targetField] = row[csvField];
          }
        });

        // Add metadata
        transformed.importedAt = new Date().toISOString();
        transformed.importSource = 'bulk_csv';
        transformed.registrationContext = 'admin_import';
        
        return { ...transformed, _originalRowIndex: index };
      });

      // Validate the transformed data
      const validationResult = validateImportData(transformedData);
      
      if (validationResult.errors.length > 0) {
        setImportErrors(validationResult.errors);
        return;
      }

      // Process the import
      const result = await onImportMembers(validationResult.validData, {
        duplicateStrategy,
        addTags: ['Imported']
      });

      setProcessingResult({
        type: 'success',
        message: `Successfully imported ${result.successful} members. ${result.skipped || 0} duplicates skipped.`
      });

      // Reset import state
      setTimeout(() => {
        setShowImportDialog(false);
        setImportStep('upload');
        setImportFile(null);
        setImportData([]);
        setImportPreview([]);
        setFieldMapping({});
        setProcessingResult(null);
      }, 3000);

    } catch (error) {
      setImportErrors([error.message || 'Import failed']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAction = async (action) => {
    setIsProcessing(true);
    setProcessingResult(null);
    
    try {
      let result;
      
      switch (action) {
        case 'delete':
          result = await onBulkAction('delete', selectedMembers);
          break;
        case 'tag':
          result = await onBulkAction('tag', selectedMembers, { tags: selectedTags });
          break;
        case 'email':
          result = await onBulkAction('email', selectedMembers, emailData);
          break;
        case 'export':
          result = await onBulkAction('export', selectedMembers);
          break;
        case 'activate':
          result = await onBulkAction('activate', selectedMembers);
          break;
        case 'deactivate':
          result = await onBulkAction('deactivate', selectedMembers);
          break;
        default:
          throw new Error('Unknown action');
      }

      setProcessingResult({
        type: 'success',
        message: result.message || `Successfully processed ${selectedMembers.length} members`
      });
      
      setTimeout(() => {
        onClearSelection();
        setShowActionMenu(false);
        setActionType('');
        setProcessingResult(null);
      }, 2000);

    } catch (error) {
      setProcessingResult({
        type: 'error',
        message: error.message || 'An error occurred while processing the action'
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
      setShowTagDialog(false);
      setShowEmailDialog(false);
    }
  };

  const handleActionSelect = (action) => {
    setActionType(action);
    setShowActionMenu(false);
    
    switch (action) {
      case 'delete':
        setShowConfirmDialog(true);
        break;
      case 'tag':
        setShowTagDialog(true);
        break;
      case 'email':
        setShowEmailDialog(true);
        break;
      case 'import':
        setShowImportDialog(true);
        break;
      case 'export':
      case 'activate':
      case 'deactivate':
        handleBulkAction(action);
        break;
      default:
        break;
    }
  };

  const handleTemplateChange = (template) => {
    if (template === 'custom') {
      setEmailData({
        subject: '',
        message: '',
        template: 'custom'
      });
    } else {
      setEmailData({
        ...emailTemplates[template],
        template
      });
    }
  };

  const getSelectedMemberNames = () => {
    return selectedMembers.map(id => {
      const member = allMembers.find(m => m.id === id);
      return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
    }).slice(0, 10).join(', ') + (selectedMembers.length > 10 ? '...' : '');
  };

  // Render import preview table
  const ImportPreviewTable = () => (
    <div className={styles.importPreview}>
      <h4>Import Preview (First 5 rows)</h4>
      <div className={styles.fieldMapping}>
        <h5>Field Mapping</h5>
        {Object.keys(importData[0] || {}).map(csvField => (
          <div key={csvField} className={styles.mappingRow}>
            <span className={styles.csvField}>{csvField}</span>
            <span>→</span>
            <select
              value={fieldMapping[csvField] || ''}
              onChange={(e) => setFieldMapping(prev => ({
                ...prev,
                [csvField]: e.target.value
              }))}
              className={styles.mappingSelect}
            >
              <option value="">Skip this field</option>
              {expectedFields.map(field => (
                <option key={field.key} value={field.key}>
                  {field.label} {field.required ? '*' : ''}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      
      <div className={styles.duplicateStrategy}>
        <h5>Duplicate Handling</h5>
        <label>
          <input
            type="radio"
            value="skip"
            checked={duplicateStrategy === 'skip'}
            onChange={(e) => setDuplicateStrategy(e.target.value)}
          />
          Skip duplicates (by email)
        </label>
        <label>
          <input
            type="radio"
            value="update"
            checked={duplicateStrategy === 'update'}
            onChange={(e) => setDuplicateStrategy(e.target.value)}
          />
          Update existing records
        </label>
      </div>

      <table className={styles.previewTable}>
        <thead>
          <tr>
            {Object.keys(fieldMapping).map(csvField => (
              fieldMapping[csvField] && (
                <th key={csvField}>
                  {expectedFields.find(f => f.key === fieldMapping[csvField])?.label}
                </th>
              )
            ))}
          </tr>
        </thead>
        <tbody>
          {importPreview.map((row, index) => (
            <tr key={index}>
              {Object.keys(fieldMapping).map(csvField => (
                fieldMapping[csvField] && (
                  <td key={csvField}>{row[csvField]}</td>
                )
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (selectedMembers.length === 0) {
    return (
      <div className={styles.emptyBulkActions}>
        <button
          className={styles.importButton}
          onClick={() => setShowImportDialog(true)}
          disabled={isProcessing}
        >
          <Upload size={16} />
          Import Members
        </button>
      </div>
    );
  }

  return (
    <div className={styles.bulkActionsContainer}>
      <div className={styles.bulkActionsBar}>
        <div className={styles.selectionInfo}>
          <CheckCircle className={styles.selectionIcon} />
          <span className={styles.selectionText}>
            {selectedMembers.length} of {totalMembers} members selected
          </span>
        </div>
        
        <div className={styles.bulkActions}>
          <button
            className={styles.actionButton}
            onClick={() => setShowActionMenu(!showActionMenu)}
            disabled={isProcessing}
          >
            Actions
          </button>
          
          <button
            className={styles.importButton}
            onClick={() => setShowImportDialog(true)}
            disabled={isProcessing}
          >
            <Upload size={16} />
            Import
          </button>
          
          <button
            className={styles.clearButton}
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            <X size={16} />
            Clear Selection
          </button>
        </div>
      </div>

      {processingResult && (
        <div className={`${styles.processingResult} ${styles[processingResult.type]}`}>
          {processingResult.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{processingResult.message}</span>
        </div>
      )}

      {showActionMenu && (
        <div className={styles.actionMenu}>
          <button
            className={styles.actionItem}
            onClick={() => handleActionSelect('email')}
            disabled={isProcessing}
          >
            <Mail size={16} />
            Send Email
          </button>
          
          <button
            className={styles.actionItem}
            onClick={() => handleActionSelect('tag')}
            disabled={isProcessing}
          >
            <Tag size={16} />
            Add Tags
          </button>
          
          <button
            className={styles.actionItem}
            onClick={() => handleActionSelect('export')}
            disabled={isProcessing}
          >
            <Download size={16} />
            Export Selected
          </button>
          
          <button
            className={styles.actionItem}
            onClick={() => handleActionSelect('activate')}
            disabled={isProcessing}
          >
            <UserPlus size={16} />
            Activate Members
          </button>
          
          <button
            className={styles.actionItem}
            onClick={() => handleActionSelect('deactivate')}
            disabled={isProcessing}
          >
            <Users size={16} />
            Deactivate Members
          </button>
          
          <hr className={styles.menuDivider} />
          
          <button
            className={`${styles.actionItem} ${styles.dangerAction}`}
            onClick={() => handleActionSelect('delete')}
            disabled={isProcessing}
          >
            <Trash2 size={16} />
            Delete Selected
          </button>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Import Members</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowImportDialog(false)}
                disabled={isProcessing}
              >
                <X size={20} />
              </button>
            </div>
            
            {importStep === 'upload' && (
              <div className={styles.importUpload}>
                <div className={styles.uploadArea}>
                  <FileSpreadsheet size={48} className={styles.uploadIcon} />
                  <h4>Upload Member Data</h4>
                  <p>Support for CSV files with member information</p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className={styles.fileInput}
                    disabled={isProcessing}
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={styles.uploadButton}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={16} className={styles.spinning} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Choose File
                      </>
                    )}
                  </button>
                </div>
                
                <div className={styles.importInstructions}>
                  <h5>CSV Format Guidelines:</h5>
                  <ul>
                    <li>Include headers in the first row</li>
                    <li>Required fields: First Name, Last Name, Email, Phone</li>
                    <li>Optional: Date of Birth, Gender, Address, etc.</li>
                    <li>Use standard date format (YYYY-MM-DD)</li>
                    <li>Separate multiple ministry interests with semicolons</li>
                  </ul>
                  
                  <button
                    className={styles.downloadTemplate}
                    onClick={() => {
                      // Create and download CSV template
                      const template = expectedFields.map(f => f.label).join(',') + '\n' +
                        'John,Doe,john@example.com,555-0123,1990-01-15,Male,123 Main St,email,Choir;Youth,50';
                      const blob = new Blob([template], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'member_import_template.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download size={16} />
                    Download Template
                  </button>
                </div>
              </div>
            )}
            
            {importStep === 'preview' && (
              <div className={styles.importPreviewStep}>
                <ImportPreviewTable />
                
                {importErrors.length > 0 && (
                  <div className={styles.importErrors}>
                    <AlertTriangle size={16} />
                    <div>
                      <strong>Issues found:</strong>
                      <ul>
                        {importErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className={styles.importStats}>
                  <div className={styles.statItem}>
                    <strong>{importData.length}</strong> rows to import
                  </div>
                  <div className={styles.statItem}>
                    <strong>{Object.values(fieldMapping).filter(v => v).length}</strong> fields mapped
                  </div>
                </div>
              </div>
            )}
            
            <div className={styles.modalActions}>
              {importStep === 'preview' && (
                <button
                  className={styles.secondaryButton}
                  onClick={() => {
                    setImportStep('upload');
                    setImportFile(null);
                    setImportData([]);
                    setImportErrors([]);
                  }}
                  disabled={isProcessing}
                >
                  Back to Upload
                </button>
              )}
              
              <button
                className={styles.cancelButton}
                onClick={() => setShowImportDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              
              {importStep === 'preview' && (
                <button
                  className={styles.primaryButton}
                  onClick={handleImportConfirm}
                  disabled={isProcessing || importErrors.length > 0 || 
                    !Object.values(fieldMapping).some(v => v === 'firstName') ||
                    !Object.values(fieldMapping).some(v => v === 'lastName') ||
                    !Object.values(fieldMapping).some(v => v === 'email')
                  }
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className={styles.spinning} />
                      Importing...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Import {importData.length} Members
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showConfirmDialog && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete {selectedMembers.length} member(s)?
              This action cannot be undone.
            </p>
            <div className={styles.membersList}>
              <strong>Members to be deleted:</strong>
              <p>{getSelectedMemberNames()}</p>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowConfirmDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                onClick={() => handleBulkAction('delete')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Deleting...' : 'Delete Members'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Dialog */}
      {showTagDialog && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Add Tags to Selected Members</h3>
            <p>Select tags to add to {selectedMembers.length} member(s):</p>
            
            <div className={styles.tagGrid}>
              {availableTags.map(tag => (
                <label key={tag.id} className={styles.tagOption}>
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.id]);
                      } else {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id));
                      }
                    }}
                  />
                  <span 
                    className={styles.tagLabel}
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                </label>
              ))}
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowTagDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => handleBulkAction('tag')}
                disabled={isProcessing || selectedTags.length === 0}
              >
                {isProcessing ? 'Adding Tags...' : 'Add Tags'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Dialog */}
      {showEmailDialog && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Send Email to Selected Members</h3>
            <p>Compose email for {selectedMembers.length} member(s):</p>
            
            <div className={styles.emailForm}>
              <div className={styles.formGroup}>
                <label>Email Template:</label>
                <select
                  value={emailData.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className={styles.formControl}
                >
                  <option value="custom">Custom Message</option>
                  <option value="welcome">Welcome Message</option>
                  <option value="event">Event Invitation</option>
                  <option value="followup">Follow Up</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Subject:</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  className={styles.formControl}
                  placeholder="Enter email subject"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Message:</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                  className={styles.formTextarea}
                  rows="6"
                  placeholder="Enter your message here..."
                />
              </div>
              
              <div className={styles.emailPreview}>
                <small>
                  <strong>Note:</strong> [Name] will be replaced with each member's name
                </small>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowEmailDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => handleBulkAction('email')}
                disabled={isProcessing || !emailData.subject || !emailData.message}
              >
                {isProcessing ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActions;