// frontend/src/components/form/FormControls/Input.jsx
import React from 'react';
import styles from '../Form.module.css';

const Input = ({ 
  name, 
  label, 
  value, 
  onChange, 
  onBlur, 
  error, 
  touched, 
  type = 'text',
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
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`${styles.input} ${hasError ? styles.inputError : ''}`}
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

export default Input;