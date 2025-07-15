// src/components/shared/EmptyState.jsx
import React from 'react';
import styles from './Shared.module.css';

const EmptyState = ({ 
  icon, 
  title, 
  message, 
  actionText,
  onAction,
  illustration 
}) => {
  return (
    <div className={styles.emptyState}>
      {illustration && (
        <div className={styles.emptyStateIllustration}>
          {illustration}
        </div>
      )}
      {icon && (
        <div className={styles.emptyStateIcon}>
          {icon}
        </div>
      )}
      {title && (
        <h3 className={styles.emptyStateTitle}>{title}</h3>
      )}
      {message && (
        <p className={styles.emptyStateMessage}>{message}</p>
      )}
      {actionText && onAction && (
        <button 
          className={styles.emptyStateAction}
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;