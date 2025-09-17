// frontend/src/components/form/FormControls/TextArea.jsx
import React from 'react';
import styles from '../Form.module.css';

const TextArea = ({ 
  name, 
  label, 
  value, 
  onChange, 
  onBlur, 
  error, 
  touched, 
  placeholder,
  helpText,
  rows = 3,
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
      <textarea
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        className={`${styles.textarea} ${hasError ? styles.inputError : ''}`}
        aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
        {...props}
      />
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

export default TextArea;