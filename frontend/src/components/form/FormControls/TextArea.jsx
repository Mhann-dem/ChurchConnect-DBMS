import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from '../Form.module.css';

const TextArea = ({
  label,
  name,
  value = '',
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = '',
  className = '',
  helpText,
  rows = 4,
  maxLength,
  showCharacterCount = false,
  autoResize = false,
  ...props
}) => {
  const [charCount, setCharCount] = useState(value.length);
  const textareaRef = useRef(null);

  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, autoResize]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Update character count
    setCharCount(inputValue.length);
    
    // Auto-resize if enabled
    if (autoResize) {
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    
    // Call onChange prop
    if (onChange) {
      onChange(e);
    }
  };

  const handleKeyDown = (e) => {
    // Allow tab to indent (optional enhancement)
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '\t' + value.substring(end);
      
      if (onChange) {
        onChange({
          target: {
            name,
            value: newValue
          }
        });
      }
      
      // Set cursor position after tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  const isOverLimit = maxLength && charCount > maxLength;

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
      
      <div className={styles.textareaWrapper}>
        <textarea
          ref={textareaRef}
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className={`${styles.formInput} ${styles.textarea} ${error ? styles.error : ''} ${autoResize ? styles.autoResize : ''}`}
          aria-describedby={`${name}-help ${error ? `${name}-error` : ''} ${showCharacterCount ? `${name}-count` : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        
        {/* Resize handle for non-auto-resize textareas */}
        {!autoResize && (
          <div className={styles.resizeHandle} aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M12 12H9L12 9V12Z" fill="currentColor"/>
              <path d="M12 7H6L12 1V7Z" fill="currentColor"/>
            </svg>
          </div>
        )}
      </div>

      {/* Character count */}
      {showCharacterCount && (
        <div 
          id={`${name}-count`} 
          className={`${styles.characterCount} ${isOverLimit ? styles.overLimit : ''}`}
        >
          {charCount}{maxLength && ` / ${maxLength}`}
          {isOverLimit && (
            <span className={styles.overLimitText}> (over limit)</span>
          )}
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

TextArea.propTypes = {
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
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  showCharacterCount: PropTypes.bool,
  autoResize: PropTypes.bool
};

export default TextArea;