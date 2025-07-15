// hooks/useForm.js - Form management hook with validation and state management

import { useState, useCallback, useEffect } from 'react';
import { validateField, validateForm } from '../utils/validation';

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

  const validateSingleField = useCallback((name, value) => {
    if (!validationSchema[name]) return null;

    const error = validateField(name, value, validationSchema[name], values);
    return error;
  }, [validationSchema, values]);

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
  }, [values, validationSchema]);

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