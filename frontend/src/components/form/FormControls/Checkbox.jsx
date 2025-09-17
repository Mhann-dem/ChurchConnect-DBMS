// frontend/src/components/form/FormControls/Checkbox.jsx
import React from 'react';
import styles from '../Form.module.css';

const Checkbox = ({ 
  name, 
  label, 
  checked, 
  onChange, 
  error, 
  touched, 
  helpText,
  disabled = false,
  className,
  ...props 
}) => {
  const hasError = error && touched;
  
  return (
    <div className={`${styles.formGroup} ${className || ''}`}>
      <label 
        className={`${styles.checkboxLabel} ${hasError ? styles.checkboxError : ''}`}
        htmlFor={name}
      >
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked || false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={styles.checkbox}
          aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
          {...props}
        />
        <span className={styles.checkboxText}>{label}</span>
      </label>
      {hasError && (
        <span id={`${name}-error`} className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
      {helpText && !hasError && (
        <span id={`${name}-help`} className={styles.helpText}>
          {helpText}
        </span>
      )}
    </div>
  );
};

export default Checkbox;