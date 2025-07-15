// src/components/shared/Modal.jsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Shared.module.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  closeOnOverlayClick = true,
  showCloseButton = true
}) => {
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus management
      if (firstFocusableRef.current) {
        firstFocusableRef.current.focus();
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = {
    small: styles.modalSmall,
    medium: styles.modalMedium,
    large: styles.modalLarge,
    fullscreen: styles.modalFullscreen
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div 
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div 
        className={`${styles.modal} ${sizeClass[size]}`}
        ref={modalRef}
      >
        {(title || showCloseButton) && (
          <div className={styles.modalHeader}>
            {title && <h2 id="modal-title" className={styles.modalTitle}>{title}</h2>}
            {showCloseButton && (
              <button
                className={styles.modalCloseButton}
                onClick={onClose}
                aria-label="Close modal"
                ref={firstFocusableRef}
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className={styles.modalContent}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
