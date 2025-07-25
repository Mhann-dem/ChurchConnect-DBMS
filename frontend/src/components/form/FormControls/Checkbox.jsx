// frontend/src/components/form/FormControls/Checkbox.jsx
import React from 'react';
import styles from '../Form.module.css';

const Checkbox = ({
  name,
  label,
  checked = false,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  className = '',
  ...props
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  const checkboxId = `checkbox-${name}`;
  const hasError = touched && error;

  return (
    <div className={`${styles.checkboxGroup} ${className} ${hasError ? styles.hasError : ''}`}>
      <div className={styles.checkboxWrapper}>
        <input
          id={checkboxId}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={styles.checkboxInput}
          {...props}
        />
        
        <label htmlFor={checkboxId} className={styles.checkboxLabel}>
          <span className={styles.checkboxCustom}>
            {checked && <span className={styles.checkmark}>✓</span>}
          </span>
          <span className={styles.checkboxText}>{label}</span>
        </label>
      </div>
      
      {hasError && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Checkbox;