import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { validateEmail, sanitizeInput } from '../../utils/validation';
import { RATE_LIMIT } from '../../utils/constants';
import styles from './AuthPages.module.css';

// Rate limiting constants
const RESET_REQUEST_COOLDOWN = 60 * 1000; // 1 minute between requests
const MAX_RESET_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const ForgotPasswordPage = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Rate limiting state
  const [resetAttempts, setResetAttempts] = useState(() => {
    const stored = localStorage.getItem('resetAttempts');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [lastResetTime, setLastResetTime] = useState(() => {
    const stored = localStorage.getItem('lastResetTime');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [lockoutTime, setLockoutTime] = useState(() => {
    const stored = localStorage.getItem('resetLockoutTime');
    return stored ? parseInt(stored, 10) : null;
  });
  
  // Refs
  const emailInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Hooks
  const { requestPasswordReset, clearError } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-focus email input
  useEffect(() => {
    if (emailInputRef.current && !isSubmitted) {
      emailInputRef.current.focus();
    }
  }, [isSubmitted]);

  // Clear lockout when time expires
  useEffect(() => {
    if (lockoutTime && Date.now() >= lockoutTime) {
      setLockoutTime(null);
      setResetAttempts(0);
      localStorage.removeItem('resetLockoutTime');
      localStorage.removeItem('resetAttempts');
      showToast('Reset requests unlocked. You can try again.', 'info');
    }
  }, [lockoutTime, showToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle input changes with sanitization
  const handleInputChange = useCallback((e) => {
    const value = sanitizeInput(e.target.value);
    setEmail(value);
    
    // Clear errors as user types
    if (errors.email || errors.general) {
      setErrors({});
    }
    
    clearError();
  }, [errors, clearError]);

  // Enhanced email validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (trimmedEmail.length > 254) {
      newErrors.email = 'Email address is too long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  // Rate limiting checks
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    
    // Check if locked out
    if (lockoutTime && now < lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - now) / 1000 / 60);
      setErrors({ 
        general: `Too many reset requests. Please wait ${remainingTime} minutes before trying again.` 
      });
      return false;
    }

    // Check cooldown period
    if (now - lastResetTime < RESET_REQUEST_COOLDOWN) {
      const remainingCooldown = Math.ceil((RESET_REQUEST_COOLDOWN - (now - lastResetTime)) / 1000);
      setErrors({ 
        general: `Please wait ${remainingCooldown} seconds before requesting another reset.` 
      });
      return false;
    }

    return true;
  }, [lockoutTime, lastResetTime]);

  // Handle rate limiting
  const handleRateLimit = useCallback(() => {
    const newAttempts = resetAttempts + 1;
    const now = Date.now();
    
    setResetAttempts(newAttempts);
    setLastResetTime(now);
    localStorage.setItem('resetAttempts', newAttempts.toString());
    localStorage.setItem('lastResetTime', now.toString());
    
    if (newAttempts >= MAX_RESET_ATTEMPTS) {
      const lockTime = now + LOCKOUT_DURATION;
      setLockoutTime(lockTime);
      localStorage.setItem('resetLockoutTime', lockTime.toString());
    }
  }, [resetAttempts]);

  // Enhanced form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Validate form
    if (!validateForm()) {
      emailInputRef.current?.focus();
      return;
    }

    // Check rate limiting
    if (!checkRateLimit()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const trimmedEmail = email.trim().toLowerCase();
      
      await requestPasswordReset(trimmedEmail, {
        signal: abortControllerRef.current.signal
      });
      
      // Success - update rate limiting and show success
      handleRateLimit();
      setIsSubmitted(true);
      showToast('Password reset instructions sent successfully', 'success');
      
    } catch (error) {
      if (error.name === 'AbortError') return;
      
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = 'No account found with this email address. Please check and try again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many reset requests. Please wait before trying again.';
        handleRateLimit();
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid email format. Please enter a valid email address.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
      
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading, validateForm, checkRateLimit, email, requestPasswordReset, 
    handleRateLimit, showToast
  ]);

  // Handle resend with enhanced rate limiting
  const handleResend = useCallback(async () => {
    if (isLoading) return;
    
    if (!checkRateLimit()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const trimmedEmail = email.trim().toLowerCase();
      await requestPasswordReset(trimmedEmail);
      
      handleRateLimit();
      showToast('Reset instructions sent again', 'success');
      
    } catch (error) {
      console.error('Resend error:', error);
      showToast('Failed to resend email. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, checkRateLimit, email, requestPasswordReset, handleRateLimit, showToast]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !isLoading && !isSubmitted) {
      handleSubmit(e);
    }
  }, [handleSubmit, isLoading, isSubmitted]);

  // Get remaining cooldown time
  const getRemainingCooldown = useCallback(() => {
    const now = Date.now();
    const remaining = RESET_REQUEST_COOLDOWN - (now - lastResetTime);
    
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / 1000);
  }, [lastResetTime]);

  // Get remaining lockout time
  const getRemainingLockoutTime = useCallback(() => {
    if (!lockoutTime) return null;
    const remaining = lockoutTime - Date.now();
    if (remaining <= 0) return null;
    
    const minutes = Math.ceil(remaining / 1000 / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }, [lockoutTime]);

  // Check if form should be disabled
  const isFormDisabled = useCallback(() => {
    return isLoading || (lockoutTime && Date.now() < lockoutTime);
  }, [isLoading, lockoutTime]);

  // Success view
  if (isSubmitted) {
    return (
      <>
        <Helmet>
          <title>Check Your Email - ChurchConnect DBMS</title>
          <meta name="description" content="Password reset instructions sent" />
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
              <div className={styles.successIcon}>
                <svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1>Check Your Email</h1>
              <p>We've sent password reset instructions to <strong>{email}</strong></p>
            </div>

            <div className={styles.authForm}>
              <div className={styles.infoBox}>
                <h3>What's next?</h3>
                <ul>
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the reset link in the email</li>
                  <li>Create a new secure password</li>
                  <li>Sign in with your new password</li>
                </ul>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Security Notice</h4>
                      <p className="mt-1 text-sm text-blue-700">
                        The reset link will expire in 1 hour for security reasons.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.actionButtons}>
                {getRemainingCooldown() > 0 ? (
                  <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      Wait {getRemainingCooldown()} seconds before requesting another email
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleResend}
                    variant="secondary"
                    disabled={isFormDisabled()}
                    className={styles.resendButton}
                    aria-label="Resend password reset email"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Resending...</span>
                      </>
                    ) : (
                      'Resend Email'
                    )}
                  </Button>
                )}
                
                <Link to="/admin/login" className={styles.backLink}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
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
        <title>Forgot Password - ChurchConnect DBMS</title>
        <meta name="description" content="Reset your ChurchConnect DBMS password" />
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
            <h1>Forgot Password</h1>
            <p>Enter your email address and we'll send you instructions to reset your password</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
            {/* General Error Alert */}
            {errors.general && (
              <div className={styles.errorAlert} role="alert">
                <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-medium">Request Failed:</span>
                  <span className="ml-2">{errors.general}</span>
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
                      Too Many Requests
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      You've made too many reset requests. Please wait {getRemainingLockoutTime()} before trying again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rate Limiting Info */}
            {resetAttempts > 0 && resetAttempts < MAX_RESET_ATTEMPTS && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Rate Limit Notice</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      {resetAttempts} of {MAX_RESET_ATTEMPTS} reset requests used. 
                      Account will be temporarily locked after {MAX_RESET_ATTEMPTS} attempts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                <svg className={styles.inputIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Email Address
              </label>
              <input
                ref={emailInputRef}
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="Enter your email address"
                required
                autoComplete="email"
                aria-describedby={errors.email ? 'email-error' : 'email-help'}
                aria-invalid={!!errors.email}
                disabled={isFormDisabled()}
                maxLength={254}
              />
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
                  We'll send reset instructions to this email address
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={isFormDisabled() || !email.trim()}
              className={styles.submitButton}
              aria-label={isLoading ? 'Sending reset instructions...' : 'Send reset instructions'}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Sending...</span>
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </Button>

            <div className={styles.authFooter}>
              <p>
                Remember your password? <Link to="/admin/login" className={styles.backLink}>Sign In</Link>
              </p>
            </div>
          </form>

          {/* Development Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Development Mode</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div>Reset Attempts: {resetAttempts}/{MAX_RESET_ATTEMPTS}</div>
                <div>Cooldown: {getRemainingCooldown()}s remaining</div>
                {lockoutTime && (
                  <div className="text-red-600">
                    Locked until: {new Date(lockoutTime).toLocaleTimeString()}
                  </div>
                )}
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

export default React.memo(ForgotPasswordPage);