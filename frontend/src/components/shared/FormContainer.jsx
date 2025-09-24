// src/components/shared/FormContainer.jsx
import React from 'react';
import { CheckCircle, X, Loader } from 'lucide-react';

const FormContainer = ({ 
  children, 
  title, 
  onClose, 
  showSuccess, 
  successMessage, 
  submissionError,
  isSubmitting,
  maxWidth = '900px',
  className = ''
}) => {
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
    content: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '0',
      maxWidth,
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      position: 'relative'
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
      color: '#6b7280',
      transition: 'all 0.2s'
    },
    contentArea: {
      padding: '24px'
    },
    successOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      borderRadius: '12px',
      zIndex: 10
    },
    successIcon: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      backgroundColor: '#10b981',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    },
    successText: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1f2937',
      textAlign: 'center',
      margin: 0
    },
    successSubtext: {
      fontSize: '14px',
      color: '#6b7280',
      textAlign: 'center',
      margin: 0
    },
    errorBanner: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '6px',
      padding: '12px 16px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#dc2626'
    },
    loadingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#6b7280',
      fontSize: '12px'
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={{ ...modalStyles.content }} className={className}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>{title}</h2>
          <button
            onClick={onClose}
            style={modalStyles.closeButton}
            disabled={isSubmitting}
            onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#f3f4f6')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        <div style={modalStyles.contentArea}>
          {submissionError && (
            <div style={modalStyles.errorBanner}>
              <X size={16} />
              <span>{submissionError}</span>
            </div>
          )}
          
          {children}
        </div>

        {/* Success Overlay */}
        {showSuccess && (
          <div style={modalStyles.successOverlay}>
            <div style={modalStyles.successIcon}>
              <CheckCircle size={32} />
            </div>
            <h3 style={modalStyles.successText}>
              {successMessage || 'Success!'}
            </h3>
            <p style={modalStyles.successSubtext}>
              This form will close automatically...
            </p>
            <div style={modalStyles.loadingIndicator}>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Closing</span>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FormContainer;