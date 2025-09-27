// frontend/src/hooks/useToast.js - PRODUCTION COMPATIBILITY FIX
import { useState, useCallback, useEffect } from 'react';

/**
 * PRODUCTION FIX: Simplified useToast for compatibility with existing components
 * Maintains the complex functionality but exports a simple interface
 */

// Simple toast implementation that works with existing components
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

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

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // PRODUCTION FIX: Simple showToast function that components expect
  const showToast = useCallback((message, type = 'info', options = {}) => {
    // Console fallback for production debugging
    const styles = {
      info: 'color: #3b82f6; background: #eff6ff',
      success: 'color: #059669; background: #ecfdf5', 
      error: 'color: #dc2626; background: #fef2f2',
      warning: 'color: #d97706; background: #fffbeb'
    };
    
    const style = styles[type] || styles.info;
    console.log(`%c[TOAST ${type.toUpperCase()}] ${message}`, `${style}; padding: 4px 8px; border-radius: 4px`);
    
    // Also add to toast system
    return addToast(message, type, options);
  }, [addToast]);

  // Convenience methods that components might use
  const showSuccess = useCallback((message, options = {}) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const showError = useCallback((message, options = {}) => {
    return showToast(message, 'error', { duration: 7000, ...options });
  }, [showToast]);

  const showWarning = useCallback((message, options = {}) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const showInfo = useCallback((message, options = {}) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
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

  // PRODUCTION FIX: Return simple interface for compatibility
  return {
    showToast,        // Primary method components expect
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts,
    toasts,
    hasToasts: toasts.length > 0,
    
    // Aliases for compatibility
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo
  };
};

export default useToast;