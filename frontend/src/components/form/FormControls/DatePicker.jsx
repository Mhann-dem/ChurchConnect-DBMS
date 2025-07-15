import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from '../Form.module.css';

const DatePicker = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = "Select date",
  minDate,
  maxDate,
  className = '',
  helpText,
  showAge = false, // Show calculated age for birth dates
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(value || '');
  const inputRef = useRef(null);
  
  // Calculate age if showAge is true and value exists
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Call onChange with the raw value
    if (onChange) {
      onChange({
        target: {
          name,
          value: inputValue
        }
      });
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // Convert display value to ISO format for the date input
    if (displayValue && inputRef.current) {
      try {
        const date = new Date(displayValue);
        if (!isNaN(date.getTime())) {
          inputRef.current.value = date.toISOString().split('T')[0];
        }
      } catch (error) {
        // Handle invalid date format
      }
    }
  };

  const handleInputBlur = () => {
    setIsOpen(false);
    // Format the display value
    if (displayValue) {
      setDisplayValue(formatDate(displayValue));
    }
  };

  const age = showAge ? calculateAge(value) : null;

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
      
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="date"
          id={name}
          name={name}
          value={value || ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          required={required}
          min={minDate}
          max={maxDate}
          className={`${styles.formInput} ${styles.dateInput} ${error ? styles.error : ''}`}
          placeholder={placeholder}
          aria-describedby={`${name}-help ${error ? `${name}-error` : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        
        {/* Calendar icon */}
        <svg 
          className={styles.dateIcon} 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>

      {/* Show calculated age */}
      {showAge && age !== null && (
        <div className={styles.ageDisplay}>
          Age: {age} years old
        </div>
      )}

      {/* Help text */}
      {helpText && (
        <div id={`${name}-help`} className={styles.helpText}>
          {helpText}
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

DatePicker.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
  className: PropTypes.string,
  helpText: PropTypes.string,
  showAge: PropTypes.bool
};

export default DatePicker;