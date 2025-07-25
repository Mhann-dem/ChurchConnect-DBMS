// frontend/src/components/form/FormControls/DatePicker.jsx
import React from 'react';
import styles from '../Form.module.css';

const DatePicker = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  minDate,
  maxDate,
  helpText = '',
  disabled = false,
  className = '',
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  const dateId = `date-${name}`;
  const hasError = touched && error;

  // Format dates for input constraints
  const formatDateForInput = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  };

  return (
    <div className={`${styles.inputGroup} ${className}`}>
      {label && (
        <label htmlFor={dateId} className={styles.inputLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={`${styles.inputWrapper} ${hasError ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
        <input
          id={dateId}
          name={name}
          type="date"
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          min={formatDateForInput(minDate)}
          max={formatDateForInput(maxDate)}
          disabled={disabled}
          className={styles.dateInput}
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

export default DatePicker;