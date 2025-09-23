// src/hooks/useFormSubmission.js
import { useState, useCallback } from 'react';

export const useFormSubmission = ({ 
  onSubmit, 
  onSuccess, 
  onError, 
  onClose,
  successMessage,
  autoCloseDelay = 2500 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const handleSubmit = useCallback(async (formData, event) => {
    if (event) {
      event.preventDefault();
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      console.log('Form submission started:', formData);
      
      const result = await onSubmit(formData);
      
      console.log('Form submission result:', result);

      // Handle different response formats
      let isSuccess = true;
      let responseMessage = successMessage;

      if (result && typeof result === 'object') {
        isSuccess = result.success !== false;
        responseMessage = result.message || successMessage;
        
        if (!isSuccess) {
          throw new Error(result.error || 'Submission failed');
        }
      }

      // Show success state
      setShowSuccess(true);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result, formData);
      }

      // Auto-close form after showing success
      setTimeout(() => {
        setShowSuccess(false);
        if (onClose) {
          onClose({ success: true, data: result });
        }
      }, autoCloseDelay);

      return { success: true, data: result };

    } catch (error) {
      console.error('Form submission error:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error ||
                          error?.message || 
                          'An error occurred while saving';

      setSubmissionError(errorMessage);
      
      if (onError) {
        onError(error, formData);
      }

      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onSuccess, onError, onClose, successMessage, autoCloseDelay]);

  return {
    isSubmitting,
    showSuccess,
    submissionError,
    handleSubmit,
    clearError: () => setSubmissionError(null)
  };
};