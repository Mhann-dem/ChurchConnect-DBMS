// frontend/src/pages/auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import styles from './AuthPages.module.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { requestPasswordReset } = useAuth();
  const { showToast } = useToast();

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
      showToast('Password reset instructions sent to your email', 'success');
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.response?.status === 404) {
        setErrors({
          email: 'No account found with this email address'
        });
      } else if (error.response?.status === 429) {
        setErrors({
          general: 'Too many reset requests. Please wait before trying again.'
        });
      } else {
        setErrors({
          general: 'Failed to send reset email. Please try again later.'
        });
      }
      
      showToast('Failed to send reset email. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    
    try {
      await requestPasswordReset(email);
      showToast('Password reset instructions sent again', 'success');
    } catch (error) {
      showToast('Failed to resend email. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <div className={styles.logo}>
              <img src="/logo.png" alt="ChurchConnect" />
            </div>
            <div className={styles.successIcon}>
              <svg fill="currentColor" viewBox="0 0 20 20">
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
                <li>Create a new password</li>
                <li>Sign in with your new password</li>
              </ul>
            </div>

            <div className={styles.actionButtons}>
              <Button
                onClick={handleResend}
                variant="secondary"
                disabled={isLoading}
                className={styles.resendButton}
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
              
              <Link to="/auth/login" className={styles.backLink}>
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.authBackground}>
          <div className={styles.backgroundPattern}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="ChurchConnect" />
          </div>
          <h1>Forgot Password</h1>
          <p>Enter your email address and we'll send you instructions to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          {errors.general && (
            <div className={styles.errorAlert} role="alert">
              <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.general}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="Enter your email address"
              required
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : 'email-help'}
              disabled={isLoading}
              autoFocus
            />
            {errors.email && (
              <div id="email-error" className={styles.errorMessage} role="alert">
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
            disabled={isLoading || !email.trim()}
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
              Remember your password? <Link to="/auth/login" className={styles.backLink}>Sign In</Link>
            </p>
          </div>
        </form>
      </div>

      <div className={styles.authBackground}>
        <div className={styles.backgroundPattern}></div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;