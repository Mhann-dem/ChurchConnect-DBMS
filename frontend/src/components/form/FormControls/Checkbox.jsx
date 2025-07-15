import React, { forwardRef, useState } from 'react';
import styles from '../Form.module.css';

const Checkbox = forwardRef(({
  label,
  name,
  value,
  checked,
  onChange,
  onBlur,
  required = false,
  disabled = false,
  error,
  helpText,
  indeterminate = false,
  className = '',
  size = 'medium',
  variant = 'default',
  'aria-describedby': ariaDescribedby,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  const checkboxId = name || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${checkboxId}-error`;
  const helpId = `${checkboxId}-help`;

  const handleFocus = (e) => {
    setFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  const checkboxClasses = [
    styles.checkbox,
    styles[`checkbox${size.charAt(0).toUpperCase()}${size.slice(1)}`],
    styles[`checkbox${variant.charAt(0).toUpperCase()}${variant.slice(1)}`],
    focused && styles.checkboxFocused,
    error && styles.checkboxError,
    disabled && styles.checkboxDisabled,
    indeterminate && styles.checkboxIndeterminate,
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    styles.checkboxContainer,
    focused && styles.checkboxContainerFocused,
    error && styles.checkboxContainerError
  ].filter(Boolean).join(' ');

  const describedBy = [
    error && errorId,
    helpText && helpId,
    ariaDescribedby
  ].filter(Boolean).join(' ');

  const renderCheckmark = () => {
    if (indeterminate) {
      return (
        <svg className={styles.checkboxIcon} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (checked) {
      return (
        <svg className={styles.checkboxIcon} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return null;
  };

  return (
    <div className={styles.formGroup}>
      <div className={containerClasses}>
        <div className={styles.checkboxWrapper}>
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            required={required}
            disabled={disabled}
            className={styles.checkboxInput}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy || undefined}
            {...props}
          />
          
          <div className={checkboxClasses}>
            {renderCheckmark()}
          </div>
        </div>
        
        {label && (
          <label htmlFor={checkboxId} className={styles.checkboxLabel}>
            {label}
            {required && <span className={styles.required} aria-label="required">*</span>}
          </label>
        )}
      </div>
      
      {error && (
        <div id={errorId} className={styles.errorMessage} role="alert">
          <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div id={helpId} className={styles.helpText}>
          {helpText}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;