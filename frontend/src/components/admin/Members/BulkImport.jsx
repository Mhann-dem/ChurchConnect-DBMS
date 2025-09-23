import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';

const BulkImport = ({ isOpen, onClose, onImportComplete }) => {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
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
          total: data.data.total || (data.data.imported + data.data.failed)
        });
        setStep('result');
        
        if (onImportComplete) {
          onImportComplete(data);
        }
      } else {
        setResult({
          success: false,
          error: data.error || 'Import failed'
        });
        setStep('result');
      }
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

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const contentStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '0',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  };

  return (
    <div style={modalStyle} onClick={handleClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Import Members from CSV
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {step === 'upload' && (
            <div style={{ textAlign: 'center' }}>
              <FileSpreadsheet size={48} style={{ color: '#3b82f6', marginBottom: '16px' }} />
              
              <h4 style={{ marginBottom: '8px' }}>Upload CSV File</h4>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Select a CSV file containing member information. Make sure it matches our template format.
              </p>

              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={downloadTemplate}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <Download size={16} />
                  Download Template
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  <Upload size={20} />
                  Choose CSV File
                </button>
              </div>

              {file && (
                <div style={{
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '24px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    <strong>Selected file:</strong> {file.name}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Size: {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleImport}
                  disabled={!file || importing}
                  style={{
                    padding: '8px 16px',
                    background: !file || importing ? '#9ca3af' : '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: !file || importing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
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
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div style={{ textAlign: 'center' }}>
              {result.success ? (
                <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
              ) : (
                <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
              )}

              <h4 style={{ marginBottom: '8px' }}>
                {result.success ? 'Import Complete!' : 'Import Failed'}
              </h4>

              {result.success ? (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ color: '#10b981', marginBottom: '16px' }}>
                    Successfully imported members to your database.
                  </p>
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#15803d' }}>
                      <p><strong>Imported:</strong> {result.imported} members</p>
                      {result.failed > 0 && <p><strong>Failed:</strong> {result.failed} members</p>}
                      <p><strong>Total processed:</strong> {result.total} records</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ color: '#dc2626', marginBottom: '16px' }}>
                    {result.error}
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                style={{
                  padding: '10px 24px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BulkImport;