import React, { forwardRef, useState } from 'react';
import styles from '../Form.module.css';

const Input = forwardRef(({
  type = 'text',
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  icon,
  prefix,
  suffix,
  className = '',
  autoComplete,
  maxLength,
  pattern,
  min,
  max,
  step,
  readOnly = false,
  'aria-describedby': ariaDescribedby,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputId = name || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  const handleFocus = (e) => {
    setFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const inputClasses = [
    styles.input,
    focused && styles.inputFocused,
    error && styles.inputError,
    disabled && styles.inputDisabled,
    prefix && styles.inputWithPrefix,
    suffix && styles.inputWithSuffix,
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    styles.inputContainer,
    focused && styles.inputContainerFocused,
    error && styles.inputContainerError
  ].filter(Boolean).join(' ');

  const describedBy = [
    error && errorId,
    helpText && helpId,
    ariaDescribedby
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-label="required">*</span>}
        </label>
      )}
      
      <div className={containerClasses}>
        {icon && (
          <div className={styles.inputIcon}>
            {icon}
          </div>
        )}
        
        {prefix && (
          <div className={styles.inputPrefix}>
            {prefix}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          maxLength={maxLength}
          pattern={pattern}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy || undefined}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
        
        {suffix && (
          <div className={styles.inputSuffix}>
            {suffix}
          </div>
        )}
      </div>
      
      {error && (
        <div id={errorId} className={styles.errorMessage} role="alert">
          <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div id={helpId} className={styles.helpText}>
          {helpText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;