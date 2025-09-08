// pages/auth/LoginPage.jsx - Enhanced version with proper backend integration
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { testConnection } from '../../services/api';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import styles from './AuthPages.module.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking'); // checking, connected, error
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  
  const { login, isAuthenticated, error: authError } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state or default to admin dashboard
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Check API connection on mount
  useEffect(() => {
    checkApiConnection();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      setErrors({ general: authError });
      
      // Handle rate limiting
      if (authError.includes('Too many attempts')) {
        setLockoutTime(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }
    }
  }, [authError]);

  // Check API connection
  const checkApiConnection = async () => {
    try {
      setConnectionStatus('checking');
      const result = await testConnection();
      
      if (result.success) {
        setConnectionStatus('connected');
        console.log('[LoginPage] API connection verified:', result.data);
      } else {
        setConnectionStatus('error');
        console.error('[LoginPage] API connection failed:', result.error);
        showToast('Unable to connect to server. Please try again later.', 'error');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('[LoginPage] Connection check failed:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear general error when user modifies form
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: ''
      }));
    }
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkLockout = () => {
    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
      setErrors({ 
        general: `Account temporarily locked. Please try again in ${remainingTime} minutes.` 
      });
      return true;
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if form is valid
    if (!validateForm()) {
      return;
    }

    // Check connection status
    if (connectionStatus !== 'connected') {
      setErrors({ general: 'Unable to connect to server. Please check your internet connection.' });
      return;
    }

    // Check lockout
    if (checkLockout()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const credentials = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };
      
      console.log('[LoginPage] Attempting login for:', credentials.email);
      
      const result = await login(credentials);
      
      if (result?.success) {
        console.log('[LoginPage] Login successful');
        
        // Reset attempt count on success
        setAttemptCount(0);
        setLockoutTime(null);
        
        showToast(
          `Welcome back, ${result.user?.first_name || 'Admin'}!`, 
          'success'
        );
        
        // Navigate to dashboard or requested page
        navigate(from, { replace: true });
      } else {
        // Handle login failure
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        
        let errorMessage = result?.error || 'Login failed. Please check your credentials.';
        
        // Add attempt counter for multiple failures
        if (newAttemptCount >= 3) {
          errorMessage += ` (Attempt ${newAttemptCount}/5)`;
          
          if (newAttemptCount >= 5) {
            setLockoutTime(Date.now() + 15 * 60 * 1000);
            errorMessage = 'Too many failed attempts. Account locked for 15 minutes.';
          }
        }
        
        setErrors({ general: errorMessage });
        showToast(errorMessage, 'error');
      }
      
    } catch (error) {
      console.error('[LoginPage] Login error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
        setConnectionStatus('error');
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e);
    }
  };

  const isFormDisabled = () => {
    return isLoading || 
           connectionStatus === 'error' || 
           (lockoutTime && Date.now() < lockoutTime);
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'checking':
        return (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <LoadingSpinner size="xs" />
            <span>Connecting to server...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Connected</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Connection failed</span>
            <button
              type="button"
              onClick={checkApiConnection}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Retry
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logo}>
            <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
              <path d="M12 7L8 12l2 2 2-2 4-4-2-2-2 2z" fill="white"/>
            </svg>
          </div>
          <h1 className={styles.title}>ChurchConnect Admin</h1>
          <p className={styles.subtitle}>Sign in to manage your church community</p>
          {getConnectionStatusDisplay()}
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          {errors.general && (
            <div className={styles.errorAlert} role="alert">
              <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="font-medium">Authentication Error:</span>
                <span className="ml-2">{errors.general}</span>
              </div>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Connection Issue
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Unable to connect to the authentication server. Please check your internet connection and try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label 
              htmlFor="email" 
              className={`${styles.label} ${focusedField === 'email' ? styles.labelFocused : ''}`}
            >
              <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={() => handleFocus('email')}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`${styles.input} ${errors.email ? styles.inputError : ''} ${focusedField === 'email' ? styles.inputFocused : ''}`}
                placeholder="admin@church.org"
                required
                autoComplete="email"
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isFormDisabled()}
              />
            </div>
            {errors.email && (
              <div id="email-error" className={styles.errorMessage} role="alert">
                <svg className={styles.errorMessageIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label 
              htmlFor="password" 
              className={`${styles.label} ${focusedField === 'password' ? styles.labelFocused : ''}`}
            >
              <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => handleFocus('password')}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`${styles.input} ${errors.password ? styles.inputError : ''} ${focusedField === 'password' ? styles.inputFocused : ''}`}
                placeholder="Enter your secure password"
                required
                autoComplete="current-password"
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isFormDisabled()}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isFormDisabled()}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <div id="password-error" className={styles.errorMessage} role="alert">
                <svg className={styles.errorMessageIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password}
              </div>
            )}
          </div>

          <div className={styles.formOptions}>
            <label className={styles.checkboxWrapper}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className={styles.checkboxInput}
                disabled={isFormDisabled()}
              />
              <span className={styles.checkboxCustom}>
                <svg className={styles.checkboxIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className={styles.checkboxLabel}>Keep me signed in</span>
            </label>

            {attemptCount > 0 && attemptCount < 5 && (
              <div className="text-sm text-amber-600">
                {attemptCount === 1 ? '1 failed attempt' : `${attemptCount} failed attempts`}
                {attemptCount >= 3 && ' - Account will be locked after 5 attempts'}
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isFormDisabled()}
            className={`${styles.submitButton} ${isLoading ? styles.submitButtonLoading : ''}`}
            aria-label={isLoading ? 'Signing in...' : 'Sign in to ChurchConnect'}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg className={styles.submitButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </>
            )}
          </Button>

          <div className={styles.forgotPasswordWrapper}>
            <Link 
              to="/admin/forgot-password" 
              className={styles.forgotPasswordLink}
              tabIndex={isFormDisabled() ? -1 : 0}
            >
              <svg className={styles.forgotPasswordIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Forgot your password?
            </Link>
          </div>
        </form>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Development Mode</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div>API Endpoint: {process.env.REACT_APP_API_URL || 'http://localhost:8000'}</div>
              <div>Connection Status: {connectionStatus}</div>
              <div>Attempt Count: {attemptCount}/5</div>
              {lockoutTime && (
                <div className="text-red-600">
                  Locked until: {new Date(lockoutTime).toLocaleTimeString()}
                </div>
              )}
            </div>
            <div className="mt-3 space-y-1">
              <div className="text-xs text-blue-600">Demo Credentials:</div>
              <div className="text-xs font-mono bg-white p-2 rounded border">
                <div>Email: admin@church.org</div>
                <div>Password: admin123</div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.authFooter}>
          <div className={styles.divider}>
            <span>Need assistance?</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link to="/help" className={styles.helpLink}>
              <svg className={styles.helpIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help Center
            </Link>
            
            <Link to="/admin/contact" className={styles.helpLink}>
              <svg className={styles.helpIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </Link>
          </div>

          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              ChurchConnect DBMS v1.2.0
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Secure church management system
            </p>
          </div>
        </div>
      </div>

      <div className={styles.authBackground}>
        <div className={styles.backgroundPattern}></div>
        <div className={styles.backgroundGlow}></div>
      </div>
    </div>
  );
};

export default LoginPage;