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
  placeholder = "(555) 123-4567",
  helpText,
  required = false,
  disabled = false,
  ...props 
}) => {
  const hasError = error && touched;
  
  const formatPhoneNumber = (phoneNumber) => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Apply formatting
    if (cleaned.length >= 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length >= 6) {
      return cleaned.replace(/(\d{3})(\d{3})/, '($1) $2-');
    } else if (cleaned.length >= 3) {
      return cleaned.replace(/(\d{3})/, '($1) ');
    }
    
    return cleaned;
  };
  
  const handleChange = (e) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    if (onChange) {
      onChange(formattedValue);
    }
  };
  
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
        type="tel"
        value={value || ''}
        onChange={handleChange}
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

export default PhoneInput;