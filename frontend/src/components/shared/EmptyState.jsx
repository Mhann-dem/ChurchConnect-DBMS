// src/components/shared/EmptyState.jsx
import React from 'react';
import styles from './Shared.module.css';

const EmptyState = ({ 
  icon, 
  title, 
  message, 
  actionText,
  onAction,
  action, // Support for legacy action prop
  illustration,
  className = '',
  ...rest // Capture any other props
}) => {
  // Fallback styles if CSS module fails to load
  const fallbackStyles = {
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '3rem 2rem',
      color: '#6b7280',
      minHeight: '200px'
    },
    emptyStateIcon: {
      width: '4rem',
      height: '4rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1.5rem',
      backgroundColor: '#f3f4f6',
      borderRadius: '50%',
      color: '#9ca3af'
    },
    emptyStateTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#374151',
      margin: '0 0 0.5rem 0'
    },
    emptyStateMessage: {
      fontSize: '0.875rem',
      color: '#6b7280',
      margin: '0 0 1.5rem 0',
      maxWidth: '28rem',
      lineHeight: '1.6'
    },
    emptyStateAction: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  };

  // Use CSS module styles if available, fallback to inline styles
  const getStyle = (key) => {
    if (styles && styles[key]) {
      return styles[key];
    }
    return '';
  };

  const getInlineStyle = (key) => {
    if (!styles || !styles[key]) {
      return fallbackStyles[key];
    }
    return {};
  };

  try {
    return (
      <div 
        className={`${getStyle('emptyState')} ${className}`}
        style={getInlineStyle('emptyState')}
        {...rest}
      >
        {illustration && (
          <div 
            className={getStyle('emptyStateIllustration')}
            style={getInlineStyle('emptyStateIllustration')}
          >
            {illustration}
          </div>
        )}
        {icon && (
          <div 
            className={getStyle('emptyStateIcon')}
            style={getInlineStyle('emptyStateIcon')}
          >
            {icon}
          </div>
        )}
        {title && (
          <h3 
            className={getStyle('emptyStateTitle')}
            style={getInlineStyle('emptyStateTitle')}
          >
            {String(title)}
          </h3>
        )}
        {message && (
          <p 
            className={getStyle('emptyStateMessage')}
            style={getInlineStyle('emptyStateMessage')}
          >
            {String(message)}
          </p>
        )}
        {/* Support both action patterns */}
        {action && React.isValidElement(action) && action}
        {actionText && onAction && !action && (
          <button 
            className={getStyle('emptyStateAction')}
            style={getInlineStyle('emptyStateAction')}
            onClick={onAction}
            type="button"
          >
            {String(actionText)}
          </button>
        )}
      </div>
    );
  } catch (error) {
    console.error('EmptyState component error:', error);
    // Ultimate fallback - render a simple div with just the essentials
    return (
      <div style={fallbackStyles.emptyState}>
        {title && <h3 style={fallbackStyles.emptyStateTitle}>{String(title)}</h3>}
        {message && <p style={fallbackStyles.emptyStateMessage}>{String(message)}</p>}
        {action && React.isValidElement(action) && action}
      </div>
    );
  }
};

export default EmptyState;