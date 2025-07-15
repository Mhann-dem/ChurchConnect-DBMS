 
import React from 'react';
import PropTypes from 'prop-types';
import styles from '../Form.module.css';

const RadioGroup = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  className = '',
  helpText,
  inline = false,
  ...props
}) => {
  const handleChange = (optionValue) => {
    if (onChange) {
      onChange({
        target: {
          name,
          value: optionValue
        }
      });
    }
  };

  const handleKeyDown = (event, optionValue) => {
    // Handle keyboard navigation
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleChange(optionValue);
    }
  };

  return (
    <fieldset 
      className={`${styles.formGroup} ${styles.radioGroup} ${className}`}
      disabled={disabled}
      {...props}
    >
      {label && (
        <legend className={`${styles.formLabel} ${styles.radioGroupLabel} ${required ? styles.required : ''}`}>
          {label}
          {required && <span className={styles.requiredIndicator} aria-label="required">*</span>}
        </legend>
      )}

      <div 
        className={`${styles.radioOptions} ${inline ? styles.inline : styles.stacked}`}
        role="radiogroup"
        aria-describedby={`${name}-help ${error ? `${name}-error` : ''}`}
        aria-invalid={error ? 'true' : 'false'}
      >
        {options.map((option, index) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const optionDisabled = typeof option === 'object' ? option.disabled : false;
          const optionId = `${name}-${index}`;
          const isChecked = value === optionValue;

          return (
            <div key={optionValue} className={styles.radioOption}>
              <input
                type="radio"
                id={optionId}
                name={name}
                value={optionValue}
                checked={isChecked}
                onChange={() => handleChange(optionValue)}
                disabled={disabled || optionDisabled}
                className={styles.radioInput}
                aria-describedby={error ? `${name}-error` : undefined}
              />
              
              <label
                htmlFor={optionId}
                className={`${styles.radioLabel} ${isChecked ? styles.checked : ''} ${disabled || optionDisabled ? styles.disabled : ''}`}
                onKeyDown={(e) => handleKeyDown(e, optionValue)}
                tabIndex={disabled || optionDisabled ? -1 : 0}
              >
                <span className={styles.radioIndicator}>
                  {isChecked && (
                    <svg 
                      className={styles.radioCheckmark} 
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12" 
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="6" cy="6" r="3" fill="currentColor"/>
                    </svg>
                  )}
                </span>
                <span className={styles.radioText}>{optionLabel}</span>
              </label>
            </div>
          );
        })}
      </div>

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
    </fieldset>
  );
};

RadioGroup.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool
      })
    ])
  ),
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  helpText: PropTypes.string,
  inline: PropTypes.bool
};

export default RadioGroup;