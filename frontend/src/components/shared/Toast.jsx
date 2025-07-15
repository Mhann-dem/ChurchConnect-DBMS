// src/components/shared/Toast.jsx
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Shared.module.css';

const Toast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const positionClass = {
    'top-right': styles.toastTopRight,
    'top-left': styles.toastTopLeft,
    'bottom-right': styles.toastBottomRight,
    'bottom-left': styles.toastBottomLeft,
    'top-center': styles.toastTopCenter,
    'bottom-center': styles.toastBottomCenter
  };

  return createPortal(
    <div 
      className={`${styles.toast} ${styles[`toast${type.charAt(0).toUpperCase() + type.slice(1)}`]} ${positionClass[position]} ${isVisible ? styles.toastVisible : styles.toastHidden}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.toastContent}>
        <span className={styles.toastIcon}>{typeIcons[type]}</span>
        <span className={styles.toastMessage}>{message}</span>
        <button 
          className={styles.toastCloseButton}
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
};

// Toast Container for managing multiple toasts
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          position={toast.position}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};

export default Toast;