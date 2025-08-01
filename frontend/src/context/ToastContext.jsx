// context/ToastContext.jsx
import React, { createContext, useContext, useReducer, useCallback } from 'react';

const ToastContext = createContext();

const initialState = {
  toasts: []
};

const toastReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.payload]
      };
    
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload)
      };
    
    case 'CLEAR_TOASTS':
      return {
        ...state,
        toasts: []
      };
    
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map(toast =>
          toast.id === action.payload.id
            ? { ...toast, ...action.payload.updates }
            : toast
        )
      };
    
    default:
      return state;
  }
};

export const ToastProvider = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, initialState);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      dismissible: true,
      ...toast
    };

    dispatch({ type: 'ADD_TOAST', payload: newToast });

    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const clearToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_TOASTS' });
  }, []);

  const updateToast = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_TOAST', payload: { id, updates } });
  }, []);

  // Generic showToast method
  const showToast = useCallback((message, type = 'info', options = {}) => {
    return addToast({
      type,
      message,
      ...options
    });
  }, [addToast]);

  // Convenience methods for different toast types
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options
    });
  }, [addToast]);

  const showError = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      duration: 0, // Don't auto-dismiss error toasts
      ...options
    });
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      duration: 7000,
      ...options
    });
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options
    });
  }, [addToast]);

  const showLoading = useCallback((message, options = {}) => {
    return addToast({
      type: 'loading',
      message,
      duration: 0,
      dismissible: false,
      ...options
    });
  }, [addToast]);

  const value = {
    toasts: state.toasts,
    addToast,
    removeToast,
    clearToasts,
    updateToast,
    showToast, // Add the generic method
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};