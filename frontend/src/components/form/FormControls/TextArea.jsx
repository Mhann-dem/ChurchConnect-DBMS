// frontend/src/components/form/FormControls/TextArea.jsx
import React from 'react';
import styles from '../Form.module.css';

const TextArea = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder = '',
  rows = 3,
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

  const textareaId = `textarea-${name}`;
  const hasError = touched && error;

  return (
    <div className={`${styles.inputGroup} ${className}`}>
      {label && (
        <label htmlFor={textareaId} className={styles.inputLabel}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={`${styles.inputWrapper} ${hasError ? styles.hasError : ''} ${disabled ? styles.disabled : ''}`}>
        <textarea
          id={textareaId}
          name={name}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={styles.textarea}
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

export default TextArea;