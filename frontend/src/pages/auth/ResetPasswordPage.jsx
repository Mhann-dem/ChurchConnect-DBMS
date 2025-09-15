import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { validatePassword, sanitizeInput } from '../../utils/validation';
import { PASSWORD_REQUIREMENTS } from '../../utils/constants';
import styles from './AuthPages.module.css';

// Security constants
const TOKEN_VALIDATION_TIMEOUT = 10000; // 10 seconds
const PASSWORD_RESET_TIMEOUT = 30000; // 30 seconds
const PASSWORD_STRENGTH_LEVELS = {
  WEAK: 1,
  FAIR: 2,
  GOOD: 3,
  STRONG: 4
};

const ResetPasswordPage = () => {
  // Form state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const passwordInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const tokenCheckTimeoutRef = useRef(null);

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, validateResetToken, clearError } = useAuth();
  const { showToast } = useToast();

  // Extract URL parameters
  const urlParams = new URLSearchParams(location.search);
  const token = urlParams.get('token');
  const email = urlParams.get('email');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (tokenCheckTimeoutRef.current) {
        clearTimeout(tokenCheckTimeoutRef.current);
      }
    };
  }, []);

  // Token validation on mount
  useEffect(() => {
    const checkToken = async () => {
      if (!token || !email) {
        console.error('Missing token or email parameters');
        setTokenValid(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Set timeout for token validation
        tokenCheckTimeoutRef.current = setTimeout(() => {
          setTokenValid(false);
          showToast('Token validation timed out', 'error');
        }, TOKEN_VALIDATION_TIMEOUT);

        // Cancel any previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();

        const isValid = await validateResetToken(token, email, {
          signal: abortControllerRef.current.signal
        });
        
        clearTimeout(tokenCheckTimeoutRef.current);
        setTokenValid(isValid);
        
        if (!isValid) {
          showToast('Invalid or expired reset link', 'error');
        }
        
      } catch (error) {
        if (error.name === 'AbortError') return;
        
        console.error('Token validation error:', error);
        clearTimeout(tokenCheckTimeoutRef.current);
        setTokenValid(false);
        
        let errorMessage = 'Failed to validate reset link';
        if (error.message.includes('expired')) {
          errorMessage = 'Reset link has expired. Please request a new one.';
        } else if (error.message.includes('invalid')) {
          errorMessage = 'Invalid reset link. Please check your email for the correct link.';
        }
        
        showToast(errorMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [token, email, validateResetToken, showToast]);

  // Auto-focus password input when token is valid
  useEffect(() => {
    if (tokenValid && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [tokenValid]);

  // Password strength calculation
  const calculatePasswordStrength = useCallback((password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noCommon: !['password', '12345678', 'qwerty'].includes(password.toLowerCase())
    };

    // Calculate strength based on criteria met
    Object.values(checks).forEach(check => {
      if (check) strength++;
    });

    // Bonus points for longer passwords
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;

    return Math.min(strength, 4);
  }, []);

  // Handle input changes with real-time validation
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Real-time password strength calculation
    if (name === 'password') {
      const strength = calculatePasswordStrength(sanitizedValue);
      setPasswordStrength(strength);
    }

    // Clear errors as user types
    if (errors[name] || errors.general) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }

    clearError();
  }, [errors, clearError, calculatePasswordStrength]);

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (passwordValidation.error) {
      newErrors.password = passwordValidation.error;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Additional security checks
    if (formData.password && formData.password.length > 128) {
      newErrors.password = 'Password is too long (maximum 128 characters)';
    }

    // Check for common weak passwords
    const weakPasswords = ['password', 'admin', 'church', '123456', 'qwerty'];
    if (weakPasswords.some(weak => formData.password.toLowerCase().includes(weak))) {
      newErrors.password = 'Password contains common words that make it weak';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Enhanced form submission with comprehensive error handling
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting || !tokenValid) return;
    
    // Validate form
    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const errorInput = document.querySelector(`[name="${firstErrorField}"]`);
        errorInput?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setErrors({});
    
    try {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      // Set timeout for password reset
      const timeoutId = setTimeout(() => {
        abortControllerRef.current.abort();
      }, PASSWORD_RESET_TIMEOUT);

      await resetPassword(token, email, formData.password, {
        signal: abortControllerRef.current.signal
      });
      
      clearTimeout(timeoutId);
      
      showToast('Password reset successfully! Redirecting to login...', 'success');
      
      // Clear sensitive data
      setFormData({ password: '', confirmPassword: '' });
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/admin/login', { 
          state: { 
            message: 'Password reset successful. Please log in with your new password.',
            email: email
          }
        });
      }, 2000);
      
    } catch (error) {
      if (error.name === 'AbortError') return;
      
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = 'Invalid password format. Please check requirements.';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Reset link is invalid or expired. Please request a new one.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Password does not meet security requirements.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
      
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }, [
    isSubmitting, tokenValid, validateForm, errors, formData, token, email, 
    resetPassword, showToast, navigate
  ]);

  // Password visibility toggles
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword]);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(!showConfirmPassword);
  }, [showConfirmPassword]);

  // Get password strength info
  const getPasswordStrengthInfo = useCallback(() => {
    const strengthLabels = {
      0: { label: 'Very Weak', color: 'text-red-600', bgColor: 'bg-red-100' },
      1: { label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-50' },
      2: { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
      3: { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      4: { label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-100' }
    };
    
    return strengthLabels[passwordStrength] || strengthLabels[0];
  }, [passwordStrength]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading && tokenValid) {
      handleSubmit(e);
    }
  }, [handleSubmit, isLoading, tokenValid]);

  // Show loading spinner while validating token
  if (tokenValid === null) {
    return (
      <>
        <Helmet>
          <title>Validating Reset Link - ChurchConnect DBMS</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <div className={styles.authContainer}>
          <div className={styles.authCard}>
            <div className={styles.loadingContainer}>
              <LoadingSpinner size="large" />
              <h2>Validating Reset Link</h2>
              <p>Please wait while we verify your password reset request...</p>
            </div>
          </div>
          
          <div className={styles.authBackground}>
            <div className={styles.backgroundPattern}></div>
            <div className={styles.backgroundGlow}></div>
          </div>
        </div>
      </>
    );
  }

  // Show error message if token is invalid
  if (tokenValid === false) {
    return (
      <>
        <Helmet>
          <title>Invalid Reset Link - ChurchConnect DBMS</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <div className={styles.authContainer}>
          <div className={styles.authCard}>
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2>Invalid Reset Link</h2>
              <p>This password reset link is invalid, expired, or has already been used.</p>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Common reasons:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• The link has expired (valid for 1 hour)</li>
                  <li>• The link has already been used</li>
                  <li>• The link was corrupted when copied</li>
                  <li>• A newer reset request was made</li>
                </ul>
              </div>
              
              <div className={styles.errorActions}>
                <Link to="/admin/forgot-password" className={styles.linkButton}>
                  Request New Reset Link
                </Link>
                <Link to="/admin/login" className={styles.linkButtonSecondary}>
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
          
          <div className={styles.authBackground}>
            <div className={styles.backgroundPattern}></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reset Password - ChurchConnect DBMS</title>
        <meta name="description" content="Create a new secure password for your ChurchConnect account" />
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
            <h1>Reset Password</h1>
            <p>Create a new secure password for <strong>{email}</strong></p>
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
            {/* General Error Alert */}
            {errors.general && (
              <div className={styles.errorAlert} role="alert">
                <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-medium">Reset Failed:</span>
                  <span className="ml-2">{errors.general}</span>
                </div>
              </div>
            )}

            {/* New Password Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                New Password
              </label>
              <div className={styles.passwordInputWrapper}>
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  placeholder="Enter your new password"
                  required
                  autoComplete="new-password"
                  aria-describedby={errors.password ? 'password-error' : 'password-help'}
                  aria-invalid={!!errors.password}
                  disabled={isLoading}
                  maxLength={128}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${getPasswordStrengthInfo().color}`}>
                      {getPasswordStrengthInfo().label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength === 0 ? 'bg-red-500' :
                        passwordStrength === 1 ? 'bg-red-400' :
                        passwordStrength === 2 ? 'bg-yellow-400' :
                        passwordStrength === 3 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
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
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirm New Password
              </label>
              <div className={styles.passwordInputWrapper}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                  placeholder="Confirm your new password"
                  required
                  autoComplete="new-password"
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : 'confirm-password-help'}
                  aria-invalid={!!errors.confirmPassword}
                  disabled={isLoading}
                  maxLength={128}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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
              
              {errors.confirmPassword && (
                <div id="confirm-password-error" className={styles.errorMessage} role="alert">
                  <svg className={styles.errorMessageIcon} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.confirmPassword}
                </div>
              )}
              
              {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="flex items-center mt-1 text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs">Passwords match</span>
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Password Requirements:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span className={`mr-2 ${formData.password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}>
                    {formData.password.length >= 8 ? '✓' : '○'}
                  </span>
                  At least 8 characters long
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/[a-z]/.test(formData.password) ? '✓' : '○'}
                  </span>
                  Contains lowercase letter
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/[A-Z]/.test(formData.password) ? '✓' : '○'}
                  </span>
                  Contains uppercase letter
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${/\d/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/\d/.test(formData.password) ? '✓' : '○'}
                  </span>
                  Contains number
                </li>
                <li className="flex items-center">
                  <span className={`mr-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
                    {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '○'}
                  </span>
                  Contains special character
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              className={styles.submitButton}
              disabled={isLoading || !formData.password || !formData.confirmPassword || passwordStrength < 2}
              aria-label={isLoading ? 'Resetting password...' : 'Reset password'}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            <div className={styles.authFooter}>
              <p>
                Remember your password?{' '}
                <Link to="/admin/login" className={styles.backLink}>
                  Back to Login
                </Link>
              </p>
            </div>
          </form>

          {/* Development Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Development Mode</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div>Token Valid: {tokenValid ? 'Yes' : 'No'}</div>
                <div>Email: {email}</div>
                <div>Password Strength: {passwordStrength}/4</div>
                <div>Form Valid: {Object.keys(errors).length === 0 ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.authBackground}>
          <div className={styles.backgroundPattern}></div>
          <div className={styles.backgroundGlow}></div>
        </div>
      </div>
    </>
  );
};

export default React.memo(ResetPasswordPage);