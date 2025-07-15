import React, { forwardRef, useState } from 'react';
import styles from '../Form.module.css';

const Select = forwardRef(({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  error,
  helpText,
  multiple = false,
  className = '',
  'aria-describedby': ariaDescribedby,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  const selectId = name || `select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${selectId}-error`;
  const helpId = `${selectId}-help`;

  const handleFocus = (e) => {
    setFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  const selectClasses = [
    styles.select,
    focused && styles.selectFocused,
    error && styles.selectError,
    disabled && styles.selectDisabled,
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    styles.selectContainer,
    focused && styles.selectContainerFocused,
    error && styles.selectContainerError
  ].filter(Boolean).join(' ');

  const describedBy = [
    error && errorId,
    helpText && helpId,
    ariaDescribedby
  ].filter(Boolean).join(' ');

  // Handle different option formats
  const normalizeOptions = (options) => {
    return options.map(option => {
      if (typeof option === 'string') {
        return { value: option, label: option };
      }
      if (typeof option === 'object' && option !== null) {
        return {
          value: option.value || option.id || option.key,
          label: option.label || option.name || option.text || option.value,
          disabled: option.disabled || false,
          group: option.group
        };
      }
      return { value: '', label: 'Invalid option' };
    });
  };

  const normalizedOptions = normalizeOptions(options);

  // Group options if they have a group property
  const groupedOptions = normalizedOptions.reduce((acc, option) => {
    const group = option.group || 'ungrouped';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(option);
    return acc;
  }, {});

  const hasGroups = Object.keys(groupedOptions).length > 1 || !groupedOptions.ungrouped;

  const renderOption = (option, index) => (
    <option 
      key={`${option.value}-${index}`} 
      value={option.value}
      disabled={option.disabled}
    >
      {option.label}
    </option>
  );

  const renderGroupedOptions = () => {
    return Object.entries(groupedOptions).map(([groupName, groupOptions]) => {
      if (groupName === 'ungrouped') {
        return groupOptions.map(renderOption);
      }
      return (
        <optgroup key={groupName} label={groupName}>
          {groupOptions.map(renderOption)}
        </optgroup>
      );
    });
  };

  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-label="required">*</span>}
        </label>
      )}
      
      <div className={containerClasses}>
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          multiple={multiple}
          className={selectClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy || undefined}
          {...props}
        >
          {!multiple && placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {hasGroups ? renderGroupedOptions() : normalizedOptions.map(renderOption)}
        </select>
        
        {!multiple && (
          <div className={styles.selectIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9" />
            </svg>
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

Select.displayName = 'Select';

export default Select;