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
  helpText,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  ...props 
}) => {
  const hasError = error && touched;
  
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
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
        type="date"
        value={value || ''}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        min={minDate ? (typeof minDate === 'string' ? minDate : minDate.toISOString().split('T')[0]) : undefined}
        max={maxDate ? (typeof maxDate === 'string' ? maxDate : maxDate.toISOString().split('T')[0]) : undefined}
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

export default DatePicker;