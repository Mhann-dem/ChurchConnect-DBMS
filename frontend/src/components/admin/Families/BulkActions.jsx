// frontend/src/components/admin/Families/BulkActions.jsx
import React, { useState } from 'react';
import Button from '../../ui/Button';
import ConfirmDialog from '../../shared/ConfirmDialog';
import './Families.module.css';

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

  return (
    <>
      <div className="bulk-actions">
        <div className="bulk-info">
          <span className="selected-count">
            {selectedCount} familie{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="bulk-buttons">
          <Button variant="outline" onClick={handleBulkExport}>
            Export Selected
          </Button>
          <Button variant="danger" onClick={handleBulkDelete}>
            Delete Selected
          </Button>
          <Button variant="ghost" onClick={onClear}>
            Clear Selection
          </Button>
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
    </>
  );
};

export default BulkActions;