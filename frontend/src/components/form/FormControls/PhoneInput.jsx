import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from '../Form.module.css';

const PhoneInput = ({
  label,
  name,
  value = '',
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = '(123) 456-7890',
  className = '',
  helpText,
  countryCode = 'US',
  allowInternational = false,
  ...props
}) => {
  const [formattedValue, setFormattedValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  // Phone number formatting patterns
  const patterns = {
    US: {
      mask: '(XXX) XXX-XXXX',
      regex: /^(\d{3})(\d{3})(\d{4})$/,
      format: '($1) $2-$3',
      placeholder: '(123) 456-7890'
    },
    INTERNATIONAL: {
      mask: '+X XXX XXX XXXX',
      regex: /^(\+\d{1,3})\s(\d{3})\s(\d{3})\s(\d{4})$/,
      format: '$1 $2 $3 $4',
      placeholder: '+1 123 456 7890'
    }
  };

  useEffect(() => {
    if (value) {
      setFormattedValue(formatPhoneNumber(value));
    }
  }, [value]);

  const formatPhoneNumber = (input) => {
    if (!input) return '';
    
    // Remove all non-digit characters except + for international
    const cleaned = input.replace(/[^\d+]/g, '');
    
    // Handle international format
    if (allowInternational && cleaned.startsWith('+')) {
      // Basic international formatting
      const match = cleaned.match(/^(\+\d{1,3})(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
      }
      return cleaned;
    }
    
    // Handle US format
    const digits = cleaned.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return true; // Empty is valid if not required
    
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // International format validation
    if (allowInternational && cleaned.startsWith('+')) {
      return cleaned.length >= 10 && cleaned.length <= 15;
    }
    
    // US format validation
    const digits = cleaned.replace(/\D/g, '');
    return digits.length === 10;
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    const valid = validatePhoneNumber(formatted);
    
    setFormattedValue(formatted);
    setIsValid(valid);
    
    if (onChange) {
      onChange({
        target: {
          name,
          value: formatted
        }
      });
    }
  };

  const handleBlur = () => {
    // Final validation on blur
    const valid = validatePhoneNumber(formattedValue);
    setIsValid(valid);
  };

  const handleKeyDown = (e) => {
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].includes(e.keyCode) ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey) ||
        (e.keyCode === 67 && e.ctrlKey) ||
        (e.keyCode === 86 && e.ctrlKey) ||
        (e.keyCode === 88 && e.ctrlKey) ||
        // Allow home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    
    // Ensure that it's a number or + for international
    if (allowInternational && e.key === '+' && e.target.selectionStart === 0) {
      return;
    }
    
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const getPhoneType = () => {
    if (!formattedValue) return '';
    
    // Simple phone type detection based on pattern
    if (formattedValue.includes('(')) {
      return 'Mobile/Landline';
    } else if (formattedValue.startsWith('+')) {
      return 'International';
    }
    return '';
  };

  return (
    <div className={`${styles.formGroup} ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className={`${styles.formLabel} ${required ? styles.required : ''}`}
        >
          {label}
          {required && <span className={styles.requiredIndicator} aria-label="required">*</span>}
        </label>
      )}
      
      <div className={styles.phoneInputWrapper}>
        <input
          type="tel"
          id={name}
          name={name}
          value={formattedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`${styles.formInput} ${styles.phoneInput} ${error || (!isValid && formattedValue) ? styles.error : ''}`}
          aria-describedby={`${name}-help ${error ? `${name}-error` : ''}`}
          aria-invalid={error || (!isValid && formattedValue) ? 'true' : 'false'}
          autoComplete="tel"
          {...props}
        />
        
        {/* Phone icon */}
        <svg 
          className={styles.phoneIcon} 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      </div>

      {/* Phone type indicator */}
      {formattedValue && getPhoneType() && (
        <div className={styles.phoneTypeIndicator}>
          {getPhoneType()}
        </div>
      )}

      {/* Format guide */}
      {allowInternational && (
        <div className={styles.formatGuide}>
          Format: US: (123) 456-7890 | International: +1 123 456 7890
        </div>
      )}

      {/* Help text */}
      {helpText && (
        <div id={`${name}-help`} className={styles.helpText}>
          {helpText}
        </div>
      )}

      {/* Validation error */}
      {!isValid && formattedValue && !error && (
        <div className={styles.errorMessage} role="alert">
          Please enter a valid phone number
        </div>
      )}

      {/* Error message */}
      {error && (
        <div id={`${name}-error`} className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

PhoneInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  helpText: PropTypes.string,
  countryCode: PropTypes.string,
  allowInternational: PropTypes.bool
};

export default PhoneInput;