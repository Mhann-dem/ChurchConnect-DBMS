// frontend/src/components/form/FormControls/Select.jsx
import React from 'react';
import styles from '../Form.module.css';

const Select = ({ 
  name, 
  label, 
  value, 
  onChange, 
  onBlur, 
  error, 
  touched, 
  options = [],
  placeholder,
  helpText,
  required = false,
  disabled = false,
  ...props 
}) => {
  const hasError = error && touched;
  
  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={`${styles.select} ${hasError ? styles.inputError : ''}`}
        aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

export default Select;