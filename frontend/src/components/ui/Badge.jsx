// src/components/ui/Badge.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styles from './UI.module.css';

const Badge = ({
  children,
  variant = 'default',
  size = 'medium',
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  const baseClasses = [
    styles.badge,
    styles[`badge--${variant}`],
    styles[`badge--${size}`],
    removable && styles['badge--removable'],
    className
  ].filter(Boolean).join(' ');

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove?.(e);
  };

  return (
    <span className={baseClasses} {...props}>
      <span className={styles.badgeContent}>{children}</span>
      {removable && (
        <button
          type="button"
          className={styles.badgeRemove}
          onClick={handleRemove}
          aria-label="Remove badge"
        >
          <svg 
            viewBox="0 0 24 24" 
            className={styles.badgeRemoveIcon}
            aria-hidden="true"
          >
            <path 
              d="M18 6L6 18M6 6l12 12" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'default', 
    'primary', 
    'secondary', 
    'success', 
    'warning', 
    'danger', 
    'info'
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  removable: PropTypes.bool,
  onRemove: PropTypes.func,
  className: PropTypes.string
};

export default Badge;
