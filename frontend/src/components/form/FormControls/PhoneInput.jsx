// frontend/src/components/form/FormControls/PhoneInput.jsx - UPDATED
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
  helpText = "Enter your phone number (US numbers will be formatted automatically)",
  required = false,
  disabled = false,
  ...props 
}) => {
  const hasError = error && touched;
  
  const formatPhoneNumber = (phoneNumber) => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Apply formatting for display (but remember we'll convert to +1XXXXXXXXXX for API)
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
      // For React forms, we need to create a synthetic event
      const syntheticEvent = {
        target: {
          name: name,
          value: formattedValue
        }
      };
      onChange(syntheticEvent);
    }
  };
  
  const handleBlur = (e) => {
    if (onBlur) {
      const syntheticEvent = {
        target: {
          name: name,
          value: e.target.value
        }
      };
      onBlur(syntheticEvent);
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
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`${styles.input} ${hasError ? styles.inputError : ''}`}
        aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
        maxLength="14" // (555) 123-4567 format
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