import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, X, AlertTriangle, Info } from 'lucide-react';

const BulkImport = ({ isOpen, onClose, onImportComplete }) => {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file
      if (!selectedFile.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum size is 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/v1/members/template/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'member_import_template.csv';
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download template');
      }
    } catch (error) {
      console.error('Template download error:', error);
      alert('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setStep('processing'); // Show processing step
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('skip_duplicates', 'true');

      const response = await fetch('/api/v1/members/bulk_import/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          imported: data.data.imported,
          failed: data.data.failed,
          skipped: data.data.skipped || 0,
          total: data.data.total || (data.data.imported + data.data.failed),
          errors: data.data.errors || []
        });
        
        // Auto-refresh parent after showing result
        setTimeout(() => {
          if (onImportComplete) {
            onImportComplete(data);
          }
        }, 1000);
      } else {
        setResult({
          success: false,
          error: data.error || 'Import failed',
          details: data.details || [],
          errors: data.data?.errors || []
        });
      }
      
      setStep('result');
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error: ' + error.message
      });
      setStep('result');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setResult(null);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={handleClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 28px',
          borderBottom: '2px solid #f3f4f6',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              Import Members
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
              Upload a CSV file to add multiple members at once
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '8px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '28px' }}>
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                <Upload size={48} style={{ color: 'white' }} />
              </div>
              
              <h4 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '700' }}>
                Processing Import...
              </h4>
              <p style={{ color: '#6b7280', margin: '0 0 32px', fontSize: '15px' }}>
                Validating and importing members from your CSV file
              </p>
              
              <div style={{
                background: '#f3f4f6',
                borderRadius: '12px',
                padding: '20px',
                display: 'inline-block'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid #e5e7eb',
                    borderTop: '3px solid #667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span style={{ color: '#374151', fontWeight: '500' }}>
                    Reading CSV file: {file?.name}
                  </span>
                </div>
              </div>
              
              <div style={{ marginTop: '20px', fontSize: '13px', color: '#9ca3af' }}>
                This may take a few moments for large files...
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div>
              {/* Info Box */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                gap: '12px'
              }}>
                <Info size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '14px', color: '#1e40af', lineHeight: '1.6' }}>
                  <strong>CSV Format Requirements:</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                    <li>Required: First Name, Last Name, Email</li>
                    <li>Optional: Phone, Date of Birth, Gender, Address, Emergency Contact</li>
                    <li>Phone accepts any format (0241234567 or +233241234567)</li>
                    <li>Date format: YYYY-MM-DD (e.g., 1990-01-15)</li>
                  </ul>
                </div>
              </div>

              {/* Download Template Button */}
              <button
                onClick={downloadTemplate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 20px',
                  background: 'white',
                  border: '2px solid #d1d5db',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '24px',
                  fontWeight: '600',
                  fontSize: '15px',
                  width: '100%',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  color: '#374151'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.color = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.color = '#374151';
                }}
              >
                <Download size={20} />
                Download CSV Template with Examples
              </button>

              {/* File Upload Area */}
              <div style={{
                border: '3px dashed #d1d5db',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                marginBottom: '24px',
                background: file ? '#f0fdf4' : '#f9fafb',
                borderColor: file ? '#10b981' : '#d1d5db',
                transition: 'all 0.3s'
              }}>
                <FileSpreadsheet size={56} style={{ 
                  color: file ? '#10b981' : '#9ca3af',
                  margin: '0 auto 16px'
                }} />
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '14px 32px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    fontWeight: '600',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto 12px',
                    boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <Upload size={20} />
                  {file ? 'Change File' : 'Choose CSV File'}
                </button>

                {file && (
                  <div style={{
                    background: 'white',
                    border: '1px solid #d1fae5',
                    borderRadius: '8px',
                    padding: '16px',
                    marginTop: '16px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle size={24} style={{ color: '#10b981' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#065f46' }}>
                          {file.name}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                          {(file.size / 1024).toFixed(1)} KB • Ready to import
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: '#6b7280'
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {!file && (
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                    or drag and drop your CSV file here
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '12px 24px',
                    background: 'white',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#374151'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleImport}
                  disabled={!file || importing}
                  style={{
                    padding: '12px 32px',
                    background: !file || importing 
                      ? '#d1d5db' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: !file || importing ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: !file || importing ? 'none' : '0 4px 6px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {importing && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff40',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {importing ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                {result.success ? (
                  <>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: result.failed > 0 
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      boxShadow: result.failed > 0
                        ? '0 10px 25px rgba(245, 158, 11, 0.3)'
                        : '0 10px 25px rgba(16, 185, 129, 0.3)'
                    }}>
                      {result.failed > 0 ? (
                        <AlertTriangle size={48} style={{ color: 'white' }} />
                      ) : (
                        <CheckCircle size={48} style={{ color: 'white' }} />
                      )}
                    </div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '700', color: result.failed > 0 ? '#92400e' : '#065f46' }}>
                      {result.failed > 0 ? 'Import Partially Complete' : 'Import Successful!'}
                    </h4>
                    <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: '15px' }}>
                      {result.failed > 0 
                        ? `${result.imported} members imported successfully, but ${result.failed} failed. Review errors below.`
                        : 'All members have been successfully imported to the database'}
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
                    }}>
                      <AlertCircle size={48} style={{ color: 'white' }} />
                    </div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
                      Import Failed
                    </h4>
                    <p style={{ color: '#dc2626', margin: '0 0 24px', fontSize: '15px', fontWeight: '500' }}>
                      {result.error}
                    </p>
                  </>
                )}
              </div>

              {/* Statistics */}
              {result.success && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    background: '#f0fdf4',
                    border: '2px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#15803d', marginBottom: '4px' }}>
                      {result.imported}
                    </div>
                    <div style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>Imported</div>
                  </div>

                  {result.failed > 0 && (
                    <div style={{
                      background: '#fef2f2',
                      border: '2px solid #fecaca',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>
                        {result.failed}
                      </div>
                      <div style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600' }}>Failed</div>
                    </div>
                  )}

                  {result.skipped > 0 && (
                    <div style={{
                      background: '#fffbeb',
                      border: '2px solid #fde68a',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#d97706', marginBottom: '4px' }}>
                        {result.skipped}
                      </div>
                      <div style={{ fontSize: '13px', color: '#92400e', fontWeight: '600' }}>Skipped</div>
                    </div>
                  )}

                  <div style={{
                    background: '#f3f4f6',
                    border: '2px solid #d1d5db',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                      {result.total}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Total Rows</div>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {result.errors && result.errors.length > 0 && (
                <div style={{
                  background: '#fef2f2',
                  border: '2px solid #fecaca',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <AlertTriangle size={20} style={{ color: '#dc2626' }} />
                    <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#991b1b' }}>
                      Why Imports Failed ({result.errors.length} {result.errors.length === 1 ? 'error' : 'errors'})
                    </h5>
                  </div>
                  
                  <div style={{ marginBottom: '16px', padding: '12px', background: '#fff7ed', borderRadius: '8px', fontSize: '13px', color: '#9a3412' }}>
                    <strong>💡 Common Issues:</strong> Missing required fields (First Name, Last Name, Email), invalid email format, or duplicate emails
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {result.errors.slice(0, 15).map((error, idx) => (
                      <div key={idx} style={{
                        background: 'white',
                        borderLeft: '4px solid #dc2626',
                        padding: '14px 16px',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <div style={{ 
                            fontWeight: '700', 
                            color: '#991b1b',
                            fontSize: '13px',
                            background: '#fef2f2',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca'
                          }}>
                            Row {error.row_number || idx + 2}
                          </div>
                          {error.row_data?.email && (
                            <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                              {error.row_data.email}
                            </div>
                          )}
                        </div>
                        <div style={{ 
                          color: '#dc2626', 
                          fontSize: '14px', 
                          lineHeight: '1.5',
                          fontWeight: '500'
                        }}>
                          {error.error_message || error}
                        </div>
                        {error.row_data && Object.keys(error.row_data).length > 0 && (
                          <details style={{ marginTop: '8px' }}>
                            <summary style={{ 
                              cursor: 'pointer', 
                              color: '#6b7280', 
                              fontSize: '12px',
                              fontWeight: '600',
                              padding: '4px 0'
                            }}>
                              View row data
                            </summary>
                            <div style={{ 
                              marginTop: '8px', 
                              padding: '10px',
                              background: '#f9fafb',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#374151',
                              fontFamily: 'monospace',
                              maxHeight: '150px',
                              overflow: 'auto'
                            }}>
                              {Object.entries(error.row_data).map(([key, value]) => (
                                <div key={key} style={{ marginBottom: '4px' }}>
                                  <span style={{ fontWeight: '600', color: '#6b7280' }}>{key}:</span>{' '}
                                  <span>{value || '(empty)'}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                    {result.errors.length > 15 && (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#6b7280', 
                        fontSize: '14px', 
                        fontStyle: 'italic',
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px dashed #d1d5db'
                      }}>
                        ...and {result.errors.length - 15} more errors. Download the error log for full details.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Errors but Failed */}
              {(!result.errors || result.errors.length === 0) && !result.success && result.error && (
                <div style={{
                  background: '#fef2f2',
                  border: '2px solid #fecaca',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <AlertCircle size={24} style={{ color: '#dc2626', flexShrink: 0 }} />
                    <div>
                      <h5 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#991b1b' }}>
                        Import Error
                      </h5>
                      <p style={{ margin: 0, color: '#dc2626', fontSize: '14px', lineHeight: '1.6' }}>
                        {result.error}
                      </p>
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        background: 'white', 
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#6b7280'
                      }}>
                        <strong>Possible solutions:</strong>
                        <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                          <li>Check that your file is a valid CSV format</li>
                          <li>Ensure headers match the template (First Name, Last Name, Email)</li>
                          <li>Verify there are no special characters in the file</li>
                          <li>Try with a smaller file to identify the issue</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={handleClose}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: result.success 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
                }}
              >
                {result.success ? 'Done' : 'Close'}
              </button>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default BulkImport;