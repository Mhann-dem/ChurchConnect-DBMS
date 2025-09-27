// frontend/src/components/admin/Families/BulkActions.jsx - ENHANCED VERSION
import React, { useState } from 'react';
import Button from '../../ui/Button';
import ConfirmDialog from '../../shared/ConfirmDialog';
import { TrashIcon, DownloadIcon, XIcon, CheckCircleIcon } from 'lucide-react';

const BulkActions = ({ selectedCount, onAction, onClear }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    onAction('delete');
    setShowDeleteDialog(false);
  };

  const handleBulkExport = () => {
    onAction('export');
  };

  const bulkActionsStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    animation: 'slideDown 0.3s ease-out'
  };

  const bulkInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const selectedCountStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#92400e'
  };

  const bulkButtonsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '6px',
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer'
  };

  const exportButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none'
  };

  const deleteButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none'
  };

  const clearButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db'
  };

  return (
    <>
      <div style={bulkActionsStyle}>
        <div style={bulkInfoStyle}>
          <CheckCircleIcon size={20} color="#f59e0b" />
          <span style={selectedCountStyle}>
            {selectedCount} familie{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div style={bulkButtonsStyle}>
          <button
            style={exportButtonStyle}
            onClick={handleBulkExport}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#059669';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#10b981';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <DownloadIcon size={16} />
            Export Selected
          </button>
          
          <button
            style={deleteButtonStyle}
            onClick={handleBulkDelete}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#b91c1c';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#dc2626';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <TrashIcon size={16} />
            Delete Selected
          </button>
          
          <button
            style={clearButtonStyle}
            onClick={onClear}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = '#d1d5db';
            }}
          >
            <XIcon size={16} />
            Clear Selection
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Families"
        message={`Are you sure you want to delete ${selectedCount} familie${selectedCount !== 1 ? 's' : ''}? This will remove all family relationships and cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
      />

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default BulkActions;