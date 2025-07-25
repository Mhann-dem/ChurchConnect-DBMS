// frontend/src/components/form/FormControls/Input.jsx
import React from 'react';
import styles from '../Form.module.css';

const Input = ({
  name,
  type = 'text',
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder = '',
  prefix = '',
  suffix = '',
  helpText = '',
  disabled = false,
  className = '',
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  const inputId = `input-${name}`;
  const hasError = touched && error;

  return (
    <div className={`${styles.inputGroup} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.inputLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={`${styles.inputWrapper} ${hasError ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
        {prefix && <span className={styles.inputPrefix}>{prefix}</span>}
        
        <input
          id={inputId}
          name={name}
          type={type}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.input}
          {...props}
        />
        
        {suffix && <span className={styles.inputSuffix}>{suffix}</span>}
      </div>
      
      {hasError && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {helpText && !hasError && (
        <div className={styles.helpText}>
          {helpText}
        </div>
      )}
    </div>
  );
};

export default Input;