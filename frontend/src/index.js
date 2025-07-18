import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import reportWebVitals from './reportWebVitals';

// Global styles
import './styles/globals.css';
import './styles/variables.css';
import './styles/components.css';
import './styles/utilities.css';
import './styles/responsive.css';

// Error boundary for production with comprehensive logging
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.logError(error, errorInfo);
    
    // Store error info in state for display if needed
    this.setState({ errorInfo });
  }

  logError = (error, errorInfo) => {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(), // Get user ID if available
      sessionId: this.getSessionId() // Get session ID if available
    };

    // Log to console for development
    console.error('🚨 Global Error Caught:', errorData);

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorReporting(errorData);
    }

    // Store error locally for debugging
    this.storeErrorLocally(errorData);
  };

  getUserId = () => {
    try {
      // Try to get user ID from localStorage or context
      const authData = JSON.parse(localStorage.getItem('auth') || '{}');
      return authData.user?.id || 'anonymous';
    } catch (e) {
      return 'anonymous';
    }
  };

  getSessionId = () => {
    try {
      // Generate or retrieve session ID
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    } catch (e) {
      return 'session_unknown';
    }
  };

  sendToErrorReporting = async (errorData) => {
    try {
      // Send to your error reporting service (e.g., Sentry, LogRocket, etc.)
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (e) {
      console.error('Failed to send error to reporting service:', e);
    }
  };

  storeErrorLocally = (errorData) => {
    try {
      // Store in localStorage for debugging (limit to last 10 errors)
      const errors = JSON.parse(localStorage.getItem('errorLog') || '[]');
      errors.unshift(errorData);
      const limitedErrors = errors.slice(0, 10); // Keep only last 10 errors
      localStorage.setItem('errorLog', JSON.stringify(limitedErrors));
    } catch (e) {
      console.error('Failed to store error locally:', e);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportError = () => {
    const errorData = {
      error: this.state.error,
      errorInfo: this.state.errorInfo,
      timestamp: new Date().toISOString()
    };
    
    // Copy error details to clipboard for easy reporting
    navigator.clipboard.writeText(JSON.stringify(errorData, null, 2)).then(() => {
      alert('Error details copied to clipboard. Please send this to support.');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(errorData, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error details copied to clipboard. Please send this to support.');
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <div className="error-container">
            <h2>🚨 Something went wrong</h2>
            <p>We're sorry, but something unexpected happened. The error has been logged and our team will investigate.</p>
            
            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre>
                  <code>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </code>
                </pre>
              </details>
            )}
            
            <div className="error-actions">
              <button 
                onClick={this.handleReload}
                className="btn btn-primary"
              >
                🔄 Refresh Page
              </button>
              
              <button 
                onClick={this.handleReportError}
                className="btn btn-secondary"
              >
                📋 Copy Error Details
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="btn btn-outline"
              >
                🏠 Go to Home
              </button>
            </div>
            
            <div className="error-info">
              <p><small>Error ID: {this.getSessionId()}</small></p>
              <p><small>Time: {new Date().toLocaleString()}</small></p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize the React app
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <SettingsProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </SettingsProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  </React.StrictMode>
);

// Performance monitoring with error tracking
reportWebVitals((metric) => {
  // Log performance metrics
  console.log('Performance metric:', metric);
  
  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics, Mixpanel, etc.
    try {
      if (window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
  
  // Log the error
  const errorData = {
    type: 'unhandledRejection',
    timestamp: new Date().toISOString(),
    reason: event.reason?.toString() || 'Unknown reason',
    stack: event.reason?.stack || 'No stack trace',
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  
  // Store locally
  try {
    const errors = JSON.parse(localStorage.getItem('errorLog') || '[]');
    errors.unshift(errorData);
    localStorage.setItem('errorLog', JSON.stringify(errors.slice(0, 10)));
  } catch (e) {
    console.error('Failed to store unhandled rejection:', e);
  }
  
  // Send to error reporting in production
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch((e) => console.error('Failed to send error to server:', e));
  }
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global JavaScript Error:', event.error);
  
  const errorData = {
    type: 'javascriptError',
    timestamp: new Date().toISOString(),
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack || 'No stack trace',
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  
  // Store locally
  try {
    const errors = JSON.parse(localStorage.getItem('errorLog') || '[]');
    errors.unshift(errorData);
    localStorage.setItem('errorLog', JSON.stringify(errors.slice(0, 10)));
  } catch (e) {
    console.error('Failed to store JavaScript error:', e);
  }
  
  // Send to error reporting in production
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch((e) => console.error('Failed to send error to server:', e));
  }
});

// Service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}