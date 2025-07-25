// frontend/src/components/form/FormControls/PhoneInput.jsx
import React from 'react';
import styles from '../Form.module.css';

const PhoneInput = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder = '(555) 123-4567',
  helpText = '',
  disabled = false,
  className = '',
  ...props
}) => {
  const formatPhoneNumber = (input) => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');
    
    // Don't format if empty
    if (!digits) return '';
    
    // Format based on length
    if (digits.length <= 3) {
      return `(${digits}`;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handleChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (onChange) {
      onChange(formatted);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  const phoneId = `phone-${name}`;
  const hasError = touched && error;

  return (
    <div className={`${styles.inputGroup} ${className}`}>
      {label && (
        <label htmlFor={phoneId} className={styles.inputLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={`${styles.inputWrapper} ${hasError ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
        <input
          id={phoneId}
          name={name}
          type="tel"
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.input}
          maxLength="14"
          {...props}
        />
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

export default PhoneInput;