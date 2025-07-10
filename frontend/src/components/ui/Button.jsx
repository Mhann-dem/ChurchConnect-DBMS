// src/components/ui/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styles from './UI.module.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  startIcon,
  endIcon,
  className = '',
  ...props
}) => {
  const baseClasses = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    disabled && styles['button--disabled'],
    loading && styles['button--loading'],
    fullWidth && styles['button--fullWidth'],
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg viewBox="0 0 24 24" className={styles.spinnerIcon}>
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
              strokeDasharray="31.416"
              strokeDashoffset="31.416"
            />
          </svg>
        </span>
      )}
      {startIcon && !loading && (
        <span className={styles.buttonIcon} aria-hidden="true">
          {startIcon}
        </span>
      )}
      <span className={styles.buttonText}>{children}</span>
      {endIcon && !loading && (
        <span className={styles.buttonIcon} aria-hidden="true">
          {endIcon}
        </span>
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline', 'ghost', 'link']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.string
};

export default Button;