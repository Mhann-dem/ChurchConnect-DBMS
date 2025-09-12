import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { testConnection } from '../../services/api';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { validateEmail, sanitizeInput } from '../../utils/validation';
import { RATE_LIMIT, AUTH_ERRORS } from '../../utils/constants';
import styles from './AuthPages.module.css';

// Security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const LoginPage = () => {
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  
  // Security state
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [attemptCount, setAttemptCount] = useState(() => {
    // Restore attempt count from localStorage for security
    const stored = localStorage.getItem('loginAttempts');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [lockoutTime, setLockoutTime] = useState(() => {
    const stored = localStorage.getItem('lockoutTime');
    return stored ? parseInt(stored, 10) : null;
  });
  
  // Refs
  const emailInputRef = useRef(null);
  const formRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Hooks
  const { login, isAuthenticated, error: authError, clearError } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Check API connection on mount
  useEffect(() => {
    checkApiConnection();
  }, []);

  // Auto-focus email input
  useEffect(() => {
    if (emailInputRef.current && connectionStatus === 'connected') {
      emailInputRef.current.focus();
    }
  }, [connectionStatus]);

  // Handle authentication redirect
  useEffect(() => {
    if (isAuthenticated) {
      // Clear any existing errors and attempts
      clearError();
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lockoutTime');
      
      navigate(from, { replace: true });
      
      // Show welcome message with user info if available
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      showToast(
        `Welcome back${user.first_name ? `, ${user.first_name}` : ''}!`, 
        'success'
      );
    }
  }, [isAuthenticated, navigate, from, clearError, showToast]);

  // Handle auth errors with enhanced security
  useEffect(() => {
    if (authError) {
      const errorType = getErrorType(authError);
      setErrors({ general: authError });
      
      // Handle specific error types
      switch (errorType) {
        case 'RATE_LIMITED':
          handleRateLimit();
          break;
        case 'INVALID_CREDENTIALS':
          handleFailedAttempt();
          break;
        case 'ACCOUNT_LOCKED':
          handleAccountLocked();
          break;
        case 'NETWORK_ERROR':
          setConnectionStatus('error');
          break;
        default:
          break;
      }
      
      showToast(authError, 'error');
    }
  }, [authError, showToast]);

  // Clear lockout when time expires
  useEffect(() => {
    if (lockoutTime && Date.now() >= lockoutTime) {
      setLockoutTime(null);
      setAttemptCount(0);
      localStorage.removeItem('lockoutTime');
      localStorage.removeItem('loginAttempts');
      showToast('Account unlocked. You can try logging in again.', 'info');
    }
  }, [lockoutTime, showToast]);

  // Security helper functions
  const getErrorType = useCallback((error) => {
    if (error.includes('rate limit') || error.includes('too many')) return 'RATE_LIMITED';
    if (error.includes('invalid') || error.includes('credentials')) return 'INVALID_CREDENTIALS';
    if (error.includes('locked') || error.includes('suspended')) return 'ACCOUNT_LOCKED';
    if (error.includes('network') || error.includes('connection')) return 'NETWORK_ERROR';
    return 'UNKNOWN';
  }, []);

  const handleRateLimit = useCallback(() => {
    const lockTime = Date.now() + LOCKOUT_DURATION;
    setLockoutTime(lockTime);
    localStorage.setItem('lockoutTime', lockTime.toString());
  }, []);

  const handleFailedAttempt = useCallback(() => {
    const newCount = attemptCount + 1;
    setAttemptCount(newCount);
    localStorage.setItem('loginAttempts', newCount.toString());
    
    if (newCount >= MAX_LOGIN_ATTEMPTS) {
      handleRateLimit();
    }
  }, [attemptCount, handleRateLimit]);

  const handleAccountLocked = useCallback(() => {
    setErrors({ general: 'Account is locked. Contact administrator for assistance.' });
  }, []);

  // API connection check with retry logic
  const checkApiConnection = useCallback(async (retryCount = 0) => {
    try {
      setConnectionStatus('checking');
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const result = await testConnection({
        signal: abortControllerRef.current.signal,
        timeout: 5000
      });
      
      if (result.success) {
        setConnectionStatus('connected');
        console.log('[LoginPage] API connection verified');
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      
      console.error('[LoginPage] Connection check failed:', error);
      setConnectionStatus('error');
      
      // Retry logic
      if (retryCount < 3) {
        setTimeout(() => {
          checkApiConnection(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        showToast('Unable to connect to server. Please check your connection.', 'error');
      }
    }
  }, [showToast]);

  // Form handlers
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    // Sanitize input
    const sanitizedValue = type === 'checkbox' ? checked : sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Clear errors as user types
    if (errors[name] || errors.general) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }

    // Clear auth error
    if (authError) {
      clearError();
    }
  }, [errors, authError, clearError]);

  const handleFocus = useCallback((fieldName) => {
    setFocusedField(fieldName);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedField('');
  }, []);

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Email validation
    const email = formData.email.trim();
    if (!email) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (email.length > 254) {
      newErrors.email = 'Email address is too long';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password is too long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Security checks
  const performSecurityChecks = useCallback(() => {
    // Check connection
    if (connectionStatus !== 'connected') {
      setErrors({ 
        general: 'Unable to connect to server. Please check your internet connection.' 
      });
      return false;
    }

    // Check lockout
    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
      setErrors({ 
        general: `Account temporarily locked. Please try again in ${remainingTime} minutes.` 
      });
      return false;
    }

    return true;
  }, [connectionStatus, lockoutTime]);

  // Enhanced form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    // Validate form
    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField && formRef.current) {
        const errorInput = formRef.current.querySelector(`[name="${firstErrorField}"]`);
        errorInput?.focus();
      }
      return;
    }

    // Perform security checks
    if (!performSecurityChecks()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      const credentials = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rememberMe: formData.rememberMe
      };
      
      console.log('[LoginPage] Attempting login for:', credentials.email);
      
      // Add timeout for login request
      const timeoutId = setTimeout(() => {
        throw new Error('Login request timed out');
      }, 30000);
      
      const result = await login(credentials);
      clearTimeout(timeoutId);
      
      if (result?.success) {
        console.log('[LoginPage] Login successful');
        
        // Reset security counters
        setAttemptCount(0);
        setLockoutTime(null);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockoutTime');
        
        // Don't navigate here - useEffect will handle it
      } else {
        // Handle login failure
        throw new Error(result?.error || 'Login failed. Please check your credentials.');
      }
      
    } catch (error) {
      console.error('[LoginPage] Login error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
        setConnectionStatus('error');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading, validateForm, errors, performSecurityChecks, formData, 
    login, attemptCount, lockoutTime
  ]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading && connectionStatus === 'connected') {
      handleSubmit(e);
    }
  }, [handleSubmit, isLoading, connectionStatus]);

  // Form state helpers
  const isFormDisabled = useCallback(() => {
    return isLoading || 
           connectionStatus === 'error' || 
           (lockoutTime && Date.now() < lockoutTime);
  }, [isLoading, connectionStatus, lockoutTime]);

  // Connection status display
  const getConnectionStatusDisplay = useCallback(() => {
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
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
              onClick={() => checkApiConnection()}
              className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              disabled={isLoading}
            >
              Retry
            </button>
          </div>
        );
      default:
        return null;
    }
  }, [connectionStatus, checkApiConnection, isLoading]);

  // Get remaining lockout time
  const getRemainingLockoutTime = useCallback(() => {
    if (!lockoutTime) return null;
    const remaining = lockoutTime - Date.now();
    if (remaining <= 0) return null;
    
    const minutes = Math.ceil(remaining / 1000 / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }, [lockoutTime]);

  return (
    <>
      <Helmet>
        <title>Admin Login - ChurchConnect DBMS</title>
        <meta name="description" content="Sign in to ChurchConnect DBMS administrative dashboard" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.logo}>
              <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                <path d="M12 7L8 12l2 2 2-2 4-4-2-2-2 2z" fill="white"/>
              </svg>
            </div>
            <h1 className={styles.title}>ChurchConnect Admin</h1>
            <p className={styles.subtitle}>Sign in to manage your church community</p>
            {getConnectionStatusDisplay()}
          </div>

          <form 
            ref={formRef}
            onSubmit={handleSubmit} 
            className={styles.authForm} 
            noValidate
            autoComplete="on"
          >
            {/* General Error Alert */}
            {errors.general && (
              <div className={styles.errorAlert} role="alert">
                <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-medium">Authentication Error:</span>
                  <span className="ml-2">{errors.general}</span>
                </div>
              </div>
            )}

            {/* Connection Error Alert */}
            {connectionStatus === 'error' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4" role="alert">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
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

            {/* Lockout Warning */}
            {lockoutTime && Date.now() < lockoutTime && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4" role="alert">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Account Temporarily Locked
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      Too many failed login attempts. Please wait {getRemainingLockoutTime()} before trying again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className={styles.inputGroup}>
              <label 
                htmlFor="email" 
                className={`${styles.label} ${focusedField === 'email' ? styles.labelFocused : ''}`}
              >
                <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <input
                  ref={emailInputRef}
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
                  aria-describedby={errors.email ? 'email-error' : 'email-help'}
                  aria-invalid={!!errors.email}
                  disabled={isFormDisabled()}
                  maxLength={254}
                />
              </div>
              {errors.email && (
                <div id="email-error" className={styles.errorMessage} role="alert">
                  <svg className={styles.errorMessageIcon} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </div>
              )}
              {!errors.email && (
                <div id="email-help" className={styles.helpText}>
                  Enter your administrator email address
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className={styles.inputGroup}>
              <label 
                htmlFor="password" 
                className={`${styles.label} ${focusedField === 'password' ? styles.labelFocused : ''}`}
              >
                <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                  aria-describedby={errors.password ? 'password-error' : 'password-help'}
                  aria-invalid={!!errors.password}
                  disabled={isFormDisabled()}
                  maxLength={128}
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
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <div id="password-error" className={styles.errorMessage} role="alert">
                  <svg className={styles.errorMessageIcon} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </div>
              )}
              {!errors.password && (
                <div id="password-help" className={styles.helpText}>
                  Minimum 6 characters required
                </div>
              )}
            </div>

            {/* Form Options */}
            <div className={styles.formOptions}>
              <label className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className={styles.checkboxInput}
                  disabled={isFormDisabled()}
                  aria-describedby="remember-help"
                />
                <span className={styles.checkboxCustom}>
                  <svg className={styles.checkboxIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className={styles.checkboxLabel}>Keep me signed in</span>
              </label>
              <div id="remember-help" className={styles.helpText}>
                Stay logged in for {SESSION_TIMEOUT / 60000} minutes
              </div>

              {/* Attempt Counter */}
              {attemptCount > 0 && attemptCount < MAX_LOGIN_ATTEMPTS && (
                <div className="text-sm text-amber-600 mt-2">
                  {attemptCount === 1 ? '1 failed attempt' : `${attemptCount} failed attempts`}
                  {attemptCount >= 3 && ` - Account will be locked after ${MAX_LOGIN_ATTEMPTS} attempts`}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={isFormDisabled() || !formData.email.trim() || !formData.password}
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
                  <svg className={styles.submitButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </>
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className={styles.forgotPasswordWrapper}>
              <Link 
                to="/admin/forgot-password" 
                className={styles.forgotPasswordLink}
                tabIndex={isFormDisabled() ? -1 : 0}
              >
                <svg className={styles.forgotPasswordIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* Development Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Development Mode</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div>API Endpoint: {process.env.REACT_APP_API_URL || 'http://localhost:8000'}</div>
                <div>Connection: {connectionStatus}</div>
                <div>Attempts: {attemptCount}/{MAX_LOGIN_ATTEMPTS}</div>
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

          {/* Footer */}
          <div className={styles.authFooter}>
            <div className={styles.divider}>
              <span>Need assistance?</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link to="/help" className={styles.helpLink}>
                <svg className={styles.helpIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help Center
              </Link>
              
              <Link to="/admin/contact" className={styles.helpLink}>
                <svg className={styles.helpIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </Link>
            </div>

            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                ChurchConnect DBMS v2.0.0
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Secure church management system
              </p>
            </div>
          </div>
        </div>

        {/* Background */}
        <div className={styles.authBackground}>
          <div className={styles.backgroundPattern}></div>
          <div className={styles.backgroundGlow}></div>
        </div>
      </div>
    </>
  );
};

export default React.memo(LoginPage);