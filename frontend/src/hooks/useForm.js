// hooks/useForm.js - Production Ready with advanced validation and state management
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  validatePhone, 
  validateRequired,
  validateAge,
  validateDate,
  validateNumber,
  validateFile,
  validateUrl,
  validatePledgeAmount
} from '../utils/validation';

/**
 * Production-ready form hook with advanced validation, auto-save, and error handling
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationSchema - Validation rules schema
 * @param {Object} options - Configuration options
 * @returns {Object} Form utilities and state
 */
const useForm = (initialValues = {}, validationSchema = {}, options = {}) => {
  const {
    onSubmit,
    onValidationError,
    enableReinitialize = false,
    validateOnChange = true,
    validateOnBlur = true,
    validateOnMount = false,
    autoSave = false,
    autoSaveDelay = 1000,
    autoSaveKey = null,
    transformValues = null,
    preserveState = false
  } = options;

  // Core form state
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Refs for managing state and preventing memory leaks
  const mountedRef = useRef(true);
  const autoSaveTimeoutRef = useRef(null);
  const initialValuesRef = useRef(initialValues);
  const lastAutoSaveRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Update initial values ref when they change
  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  // Available validators map
  const validators = useMemo(() => ({
    required: validateRequired,
    email: validateEmail,
    password: validatePassword,
    name: validateName,
    phone: validatePhone,
    age: validateAge,
    date: validateDate,
    number: validateNumber,
    file: validateFile,
    url: validateUrl,
    pledgeAmount: validatePledgeAmount,
    
    // Custom validators
    min: (value, min) => {
      const num = Number(value);
      return isNaN(num) || num < min ? `Must be at least ${min}` : null;
    },
    max: (value, max) => {
      const num = Number(value);
      return isNaN(num) || num > max ? `Must be no more than ${max}` : null;
    },
    minLength: (value, length) => {
      return !value || value.length < length ? `Must be at least ${length} characters` : null;
    },
    maxLength: (value, length) => {
      return value && value.length > length ? `Must be no more than ${length} characters` : null;
    },
    pattern: (value, regex, message = 'Invalid format') => {
      return value && !regex.test(value) ? message : null;
    },
    confirm: (value, confirmValue, field = 'password') => {
      return value !== confirmValue ? `${field} confirmation does not match` : null;
    }
  }), []);

  // Validate a single field
  const validateField = useCallback((name, value, rules = null, allValues = values) => {
    if (!rules && !validationSchema[name]) return null;
    
    const fieldRules = rules || validationSchema[name];
    
    // Handle different rule formats
    if (typeof fieldRules === 'string') {
      return validators[fieldRules]?.(value) || null;
    }
    
    if (Array.isArray(fieldRules)) {
      for (const rule of fieldRules) {
        const error = validateField(name, value, rule, allValues);
        if (error) return error;
      }
      return null;
    }
    
    if (typeof fieldRules === 'object' && fieldRules !== null) {
      for (const [ruleType, ruleConfig] of Object.entries(fieldRules)) {
        if (ruleType === 'custom' && typeof ruleConfig === 'function') {
          const error = ruleConfig(value, allValues);
          if (error) return error;
        } else if (validators[ruleType]) {
          const error = typeof ruleConfig === 'object' 
            ? validators[ruleType](value, ruleConfig.value, ruleConfig.message)
            : validators[ruleType](value, ruleConfig);
          if (error) return error;
        }
      }
      return null;
    }
    
    if (typeof fieldRules === 'function') {
      return fieldRules(value, allValues, name);
    }
    
    return null;
  }, [validationSchema, values, validators]);

  // Validate entire form
  const validateForm = useCallback((formValues = values) => {
    const newErrors = {};
    let isValid = true;
    
    // Transform values before validation if transformer provided
    const valuesToValidate = transformValues ? transformValues(formValues) : formValues;
    
    for (const fieldName of Object.keys(validationSchema)) {
      const error = validateField(fieldName, valuesToValidate[fieldName], null, valuesToValidate);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    }
    
    return { isValid, errors: newErrors };
  }, [values, validationSchema, validateField, transformValues]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (!autoSave || !options.onAutoSave || !mountedRef.current) return;
    
    try {
      const currentValues = JSON.stringify(values);
      
      // Skip if values haven't changed
      if (lastAutoSaveRef.current === currentValues) return;
      
      // Validate before auto-save
      const { isValid } = validateForm();
      if (!isValid) return;
      
      await options.onAutoSave(values);
      lastAutoSaveRef.current = currentValues;
      
      // Store in localStorage if key provided
      if (autoSaveKey) {
        localStorage.setItem(autoSaveKey, currentValues);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [autoSave, options.onAutoSave, values, validateForm, autoSaveKey]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !isDirty || isSubmitting) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(handleAutoSave, autoSaveDelay);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSave, isDirty, isSubmitting, handleAutoSave, autoSaveDelay]);

  // Load saved values from localStorage on mount
  useEffect(() => {
    if (autoSaveKey && preserveState) {
      try {
        const saved = localStorage.getItem(autoSaveKey);
        if (saved) {
          const savedValues = JSON.parse(saved);
          setValues(prev => ({ ...prev, ...savedValues }));
          setIsDirty(true);
        }
      } catch (error) {
        console.error('Failed to load saved form state:', error);
      }
    }
  }, [autoSaveKey, preserveState]);

  // Reinitialize form when initial values change
  useEffect(() => {
    if (enableReinitialize && initialValues !== initialValuesRef.current) {
      setValues(initialValues);
      setErrors({});
      setTouched({});
      setIsDirty(false);
      setSubmitAttempted(false);
      setSubmitCount(0);
    }
  }, [initialValues, enableReinitialize]);

  // Validate on mount if required
  useEffect(() => {
    if (validateOnMount) {
      const { errors: validationErrors } = validateForm();
      setErrors(validationErrors);
    }
  }, [validateOnMount, validateForm]);

  // Set field value with validation
  const setFieldValue = useCallback((name, value) => {
    if (!mountedRef.current) return;
    
    setValues(prev => {
      const newValues = { ...prev, [name]: value };
      
      // Validate field if enabled
      if (validateOnChange) {
        const error = validateField(name, value, null, newValues);
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: error
        }));
      }
      
      return newValues;
    });
    
    setIsDirty(true);
  }, [validateOnChange, validateField]);

  // Set field error
  const setFieldError = useCallback((name, error) => {
    if (!mountedRef.current) return;
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // Set field touched
  const setFieldTouched = useCallback((name, isTouched = true) => {
    if (!mountedRef.current) return;
    
    setTouched(prev => ({
      ...prev,
      [name]: isTouched
    }));
  }, []);

  // Handle input change
  const handleChange = useCallback((e) => {
    const target = e.target || e.currentTarget;
    const { name, value, type, checked, files } = target;
    
    let fieldValue = value;
    
    // Handle different input types
    switch (type) {
      case 'checkbox':
        fieldValue = checked;
        break;
      case 'radio':
        fieldValue = checked ? value : values[name];
        break;
      case 'file':
        fieldValue = files;
        break;
      case 'number':
        fieldValue = value === '' ? '' : Number(value);
        break;
      default:
        fieldValue = value;
    }
    
    setFieldValue(name, fieldValue);
  }, [setFieldValue, values]);

  // Handle input blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target || e.currentTarget;
    
    setFieldTouched(name, true);
    
    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      setFieldError(name, error);
    }
  }, [validateOnBlur, validateField, values, setFieldTouched, setFieldError]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    // Handle both event objects and direct calls
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    if (!mountedRef.current || isSubmitting) return;
    
    setSubmitAttempted(true);
    setSubmitCount(prev => prev + 1);
    setIsSubmitting(true);
    
    try {
      // Validate all fields
      const { isValid, errors: validationErrors } = validateForm();
      
      if (!isValid) {
        setErrors(validationErrors);
        
        // Mark all fields as touched to show errors
        const allTouched = Object.keys(validationSchema).reduce((acc, field) => {
          acc[field] = true;
          return acc;
        }, {});
        setTouched(allTouched);
        
        if (onValidationError) {
          onValidationError(validationErrors);
        }
        
        return { success: false, errors: validationErrors };
      }
      
      // Clear errors on successful validation
      setErrors({});
      
      if (onSubmit) {
        const valuesToSubmit = transformValues ? transformValues(values) : values;
        const result = await onSubmit(valuesToSubmit);
        
        if (mountedRef.current) {
          setIsDirty(false);
          
          // Clear auto-saved data on successful submission
          if (autoSaveKey) {
            localStorage.removeItem(autoSaveKey);
          }
        }
        
        return result || { success: true };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Form submission error:', error);
      
      if (mountedRef.current) {
        const errorMessage = error?.response?.data?.message || 
                            error?.message || 
                            'Submission failed. Please try again.';
        
        setErrors({ submit: errorMessage });
      }
      
      throw error;
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [
    isSubmitting, validateForm, validationSchema, onValidationError, 
    onSubmit, transformValues, values, autoSaveKey
  ]);

  // Reset form
  const reset = useCallback((newValues = initialValuesRef.current) => {
    if (!mountedRef.current) return;
    
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setSubmitAttempted(false);
    setSubmitCount(0);
    setIsSubmitting(false);
    
    // Clear auto-saved data
    if (autoSaveKey) {
      localStorage.removeItem(autoSaveKey);
    }
  }, [autoSaveKey]);

  // Reset specific field
  const resetField = useCallback((name) => {
    if (!mountedRef.current) return;
    
    setValues(prev => ({
      ...prev,
      [name]: initialValuesRef.current[name]
    }));
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    
    setTouched(prev => ({
      ...prev,
      [name]: false
    }));
  }, []);

  // Get field props for easy binding
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] ?? '',
    onChange: handleChange,
    onBlur: handleBlur
  }), [values, handleChange, handleBlur]);

  // Get field meta information
  const getFieldMeta = useCallback((name) => ({
    value: values[name],
    error: errors[name],
    touched: touched[name],
    initialValue: initialValuesRef.current[name],
    isDirty: values[name] !== initialValuesRef.current[name]
  }), [values, errors, touched]);

  // Computed form state
  const formState = useMemo(() => {
    const hasErrors = Object.keys(errors).length > 0;
    const hasValues = Object.keys(values).some(key => 
      values[key] !== undefined && values[key] !== '' && values[key] !== null
    );
    
    return {
      isValid: !hasErrors,
      hasErrors,
      hasValues,
      canSubmit: !hasErrors && !isSubmitting && hasValues,
      fieldCount: Object.keys(validationSchema).length,
      touchedFieldCount: Object.keys(touched).length,
      errorFieldCount: Object.keys(errors).length
    };
  }, [errors, values, isSubmitting, validationSchema, touched]);

  return {
    // Form values and state
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    submitAttempted,
    submitCount,
    
    // Computed state
    ...formState,
    
    // Field manipulation
    setFieldValue,
    setFieldError,
    setFieldTouched,
    
    // Event handlers
    handleChange,
    handleBlur,
    handleSubmit,
    
    // Validation
    validateField,
    validateForm,
    
    // Utilities
    reset,
    resetField,
    getFieldProps,
    getFieldMeta,
    
    // Auto-save
    triggerAutoSave: handleAutoSave
  };
};

export default useForm;