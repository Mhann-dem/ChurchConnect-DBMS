// src/components/shared/ErrorBoundary.jsx - ENHANCED VERSION (keeps your CSS modules)
import React from 'react';
import styles from './Shared.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Enhanced error logging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to monitoring service (replace with your monitoring solution)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }

    // Report to error tracking service if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.withScope((scope) => {
        scope.setTag('errorBoundary', true);
        scope.setLevel('error');
        scope.setContext('errorInfo', errorInfo);
        window.Sentry.captureException(error);
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  }

  handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      const { fallbackMessage } = this.props;
      const { retryCount } = this.state;
      
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContent}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h2>Something went wrong</h2>
              <p>
                {fallbackMessage || 
                 "We're sorry, but something unexpected happened. Please try refreshing the page."}
              </p>
              
              {retryCount > 0 && (
                <p style={{ color: '#F59E0B', fontSize: '14px', marginTop: '8px' }}>
                  Retry attempt: {retryCount}
                </p>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Error Details (Development Only)
                </summary>
                <div style={{ 
                  backgroundColor: '#FEE2E2', 
                  padding: '12px', 
                  borderRadius: '4px',
                  marginBottom: '8px' 
                }}>
                  <strong>Error:</strong>
                  <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '4px' }}>
                    {this.state.error.toString()}
                  </pre>
                </div>
                <div style={{ 
                  backgroundColor: '#FEE2E2', 
                  padding: '12px', 
                  borderRadius: '4px' 
                }}>
                  <strong>Component Stack:</strong>
                  <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '4px' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                className={styles.retryButton}
                onClick={this.handleRetry}
                style={{
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Try Again
              </button>
              
              <button 
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Refresh Page
              </button>
            </div>

            {retryCount > 2 && (
              <div style={{
                marginTop: '20px',
                padding: '12px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#92400E'
              }}>
                <strong>Persistent Error:</strong> If this error keeps occurring, please contact support 
                or try clearing your browser cache.
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = (Component, fallbackMessage) => {
  return function ErrorBoundaryWrapper(props) {
    return (
      <ErrorBoundary fallbackMessage={fallbackMessage}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary;