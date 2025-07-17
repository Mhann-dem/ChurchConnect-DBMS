// hooks/useForm.js - Form management hook with validation and state management

import { useState, useCallback, useEffect } from 'react';
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
  validatePledgeAmount,
  validateMemberForm,
  validateAdminLogin,
  validateSearchQuery
} from '../utils/validation';

const useForm = (initialValues = {}, validationSchema = {}, options = {}) => {
  const {
    onSubmit,
    enableReinitialize = false,
    validateOnChange = true,
    validateOnBlur = true,
    autoSave = false,
    autoSaveDelay = 1000
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && isDirty && !isSubmitting) {
      const timeoutId = setTimeout(() => {
        handleAutoSave();
      }, autoSaveDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [values, isDirty, isSubmitting, autoSave, autoSaveDelay]);

  // Reinitialize form when initialValues change
  useEffect(() => {
    if (enableReinitialize) {
      setValues(initialValues);
      setErrors({});
      setTouched({});
      setIsDirty(false);
      setSubmitAttempted(false);
    }
  }, [initialValues, enableReinitialize]);

  const handleAutoSave = useCallback(async () => {
    if (options.onAutoSave && typeof options.onAutoSave === 'function') {
      try {
        await options.onAutoSave(values);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [values, options.onAutoSave]);

  // Create validateField function using available validators
  const validateField = useCallback((name, value, rules, allValues = {}) => {
    if (!rules) return null;

    // Handle different validation rule formats
    if (typeof rules === 'string') {
      // Simple string rule like 'required', 'email', etc.
      return getValidationError(rules, value, allValues);
    } else if (Array.isArray(rules)) {
      // Array of validation rules
      for (const rule of rules) {
        const error = getValidationError(rule, value, allValues);
        if (error) return error;
      }
      return null;
    } else if (typeof rules === 'object') {
      // Object with validation rules and options
      for (const [ruleType, ruleConfig] of Object.entries(rules)) {
        const error = getValidationError(ruleType, value, allValues, ruleConfig);
        if (error) return error;
      }
      return null;
    } else if (typeof rules === 'function') {
      // Custom validation function
      return rules(value, allValues);
    }

    return null;
  }, []);

  // Helper function to get validation error based on rule type
  const getValidationError = (ruleType, value, allValues, config = {}) => {
    switch (ruleType) {
      case 'required':
        return validateRequired(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'name':
        return validateName(value);
      case 'phone':
        return validatePhone(value);
      case 'age':
        return validateAge(value);
      case 'date':
        return validateDate(value);
      case 'number':
        return validateNumber(value);
      case 'file':
        return validateFile(value);
      case 'url':
        return validateUrl(value);
      case 'pledgeAmount':
        return validatePledgeAmount(value);
      default:
        return null;
    }
  };

  // Create validateForm function
  const validateForm = useCallback((formValues, schema) => {
    const errors = {};
    
    for (const [fieldName, rules] of Object.entries(schema)) {
      const error = validateField(fieldName, formValues[fieldName], rules, formValues);
      if (error) {
        errors[fieldName] = error;
      }
    }
    
    return errors;
  }, [validateField]);

  const validateSingleField = useCallback((name, value) => {
    if (!validationSchema[name]) return null;

    const error = validateField(name, value, validationSchema[name], values);
    return error;
  }, [validationSchema, values, validateField]);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);

    if (validateOnChange) {
      const error = validateSingleField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [validateOnChange, validateSingleField]);

  const setFieldValue = setValue;

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  const setFieldTouched = useCallback((name, touched = true) => {
    setTouched(prev => ({
      ...prev,
      [name]: touched
    }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValue(name, fieldValue);
  }, [setValue]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setFieldTouched(name, true);

    if (validateOnBlur) {
      const error = validateSingleField(name, values[name]);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [validateOnBlur, validateSingleField, values]);

  const validate = useCallback(() => {
    const formErrors = validateForm(values, validationSchema);
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [values, validationSchema, validateForm]);

  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }

    setSubmitAttempted(true);
    setIsSubmitting(true);

    try {
      // Validate all fields
      const isValid = validate();
      
      if (!isValid) {
        // Mark all fields as touched to show validation errors
        const allFieldsTouched = Object.keys(validationSchema).reduce((acc, field) => {
          acc[field] = true;
          return acc;
        }, {});
        setTouched(allFieldsTouched);
        return;
      }

      if (onSubmit) {
        await onSubmit(values);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, validationSchema]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setSubmitAttempted(false);
    setIsSubmitting(false);
  }, [initialValues]);

  const resetField = useCallback((name) => {
    setValues(prev => ({
      ...prev,
      [name]: initialValues[name]
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
  }, [initialValues]);

  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    onBlur: handleBlur
  }), [values, handleChange, handleBlur]);

  const getFieldMeta = useCallback((name) => ({
    value: values[name],
    error: errors[name],
    touched: touched[name],
    initialValue: initialValues[name]
  }), [values, errors, touched, initialValues]);

  const isValid = Object.keys(errors).length === 0;
  const hasErrors = Object.keys(errors).some(key => errors[key]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    isValid,
    hasErrors,
    submitAttempted,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validate,
    reset,
    resetField,
    getFieldProps,
    getFieldMeta
  };
};

export default useForm;