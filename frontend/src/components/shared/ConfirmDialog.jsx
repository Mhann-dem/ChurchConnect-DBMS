// src/components/shared/ConfirmDialog.jsx
import React from 'react';
import Modal from './Modal';
import styles from './Shared.module.css';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default' // 'default', 'danger', 'warning'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      closeOnOverlayClick={false}
      showCloseButton={false}
    >
      <div className={styles.confirmDialog}>
        <div className={`${styles.confirmIcon} ${styles[`confirm${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>
          {type === 'danger' && '⚠️'}
          {type === 'warning' && '⚠️'}
          {type === 'default' && '❓'}
        </div>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmActions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            className={`${styles.confirmButton} ${styles[`confirm${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;