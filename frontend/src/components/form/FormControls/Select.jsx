// frontend/src/components/form/FormControls/Select.jsx
import React from 'react';
import styles from '../Form.module.css';

const Select = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  options = [],
  placeholder = 'Select an option',
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

  const selectId = `select-${name}`;
  const hasError = touched && error;

  return (
    <div className={`${styles.inputGroup} ${className}`}>
      {label && (
        <label htmlFor={selectId} className={styles.inputLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={`${styles.inputWrapper} ${hasError ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
        <select
          id={selectId}
          name={name}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={styles.select}
          {...props}
        >
          {!value && placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

export default Select;