import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing toast notifications
 * Provides methods to show success, error, warning, and info toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  // Generate unique ID for each toast
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  // Add a new toast
  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = generateId();
    const toast = {
      id,
      message,
      type,
      timestamp: new Date(),
      duration: options.duration || 5000,
      persistent: options.persistent || false,
      action: options.action || null,
      dismissible: options.dismissible !== false
    };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss after duration unless persistent
    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, [generateId]);

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Show success toast
  const showSuccess = useCallback((message, options = {}) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  // Show error toast
  const showError = useCallback((message, options = {}) => {
    return addToast(message, 'error', {
      duration: 7000, // Longer duration for errors
      ...options
    });
  }, [addToast]);

  // Show warning toast
  const showWarning = useCallback((message, options = {}) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  // Show info toast
  const showInfo = useCallback((message, options = {}) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  // Generic show toast method
  const showToast = useCallback((message, type = 'info', options = {}) => {
    return addToast(message, type, options);
  }, [addToast]);

  // Show loading toast
  const showLoading = useCallback((message = 'Loading...', options = {}) => {
    return addToast(message, 'loading', {
      persistent: true,
      dismissible: false,
      ...options
    });
  }, [addToast]);

  // Update an existing toast
  const updateToast = useCallback((id, updates) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id 
          ? { ...toast, ...updates }
          : toast
      )
    );
  }, []);

  // Show toast with action button
  const showActionToast = useCallback((message, type = 'info', actionLabel, actionHandler, options = {}) => {
    return addToast(message, type, {
      action: {
        label: actionLabel,
        handler: actionHandler
      },
      duration: 0, // Don't auto-dismiss action toasts
      ...options
    });
  }, [addToast]);

  // Show confirmation toast
  const showConfirmation = useCallback((message, onConfirm, onCancel, options = {}) => {
    return addToast(message, 'confirmation', {
      action: {
        confirm: onConfirm,
        cancel: onCancel
      },
      duration: 0, // Don't auto-dismiss confirmation toasts
      dismissible: false,
      ...options
    });
  }, [addToast]);

  // Batch toast operations
  const batchToasts = useCallback((toastConfigs) => {
    const ids = [];
    toastConfigs.forEach(config => {
      const id = addToast(config.message, config.type, config.options);
      ids.push(id);
    });
    return ids;
  }, [addToast]);

  // Find toast by ID
  const findToast = useCallback((id) => {
    return toasts.find(toast => toast.id === id);
  }, [toasts]);

  // Check if toast exists
  const hasToast = useCallback((id) => {
    return toasts.some(toast => toast.id === id);
  }, [toasts]);

  // Get toasts by type
  const getToastsByType = useCallback((type) => {
    return toasts.filter(toast => toast.type === type);
  }, [toasts]);

  // Pause all auto-dismissing toasts
  const pauseAutosDismiss = useCallback(() => {
    setToasts(prev => 
      prev.map(toast => ({ ...toast, paused: true }))
    );
  }, []);

  // Resume all paused toasts
  const resumeAutoDismiss = useCallback(() => {
    setToasts(prev => 
      prev.map(toast => ({ ...toast, paused: false }))
    );
  }, []);

  // Clean up expired toasts
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setToasts(prev => 
        prev.filter(toast => {
          if (toast.persistent || toast.duration === 0) return true;
          if (toast.paused) return true;
          
          const elapsed = now - toast.timestamp;
          return elapsed < toast.duration;
        })
      );
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  return {
    // State
    toasts,
    
    // Core methods
    showToast,
    removeToast,
    clearAllToasts,
    updateToast,
    
    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showActionToast,
    showConfirmation,
    
    // Batch operations
    batchToasts,
    
    // Query methods
    findToast,
    hasToast,
    getToastsByType,
    
    // Control methods
    pauseAutosDismiss,
    resumeAutoDismiss,
    
    // Computed values
    hasToasts: toasts.length > 0,
    toastCount: toasts.length,
    errorCount: toasts.filter(t => t.type === 'error').length,
    warningCount: toasts.filter(t => t.type === 'warning').length,
    
    // Quick access methods for common patterns
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    loading: showLoading
  };
};