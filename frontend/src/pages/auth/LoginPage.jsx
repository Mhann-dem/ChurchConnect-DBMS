// pages/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
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
  
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state or default to admin dashboard
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const credentials = {
        email: formData.email,
        password: formData.password
      };
      
      console.log('=== LOGIN DEBUG START ===');
      console.log('1. Attempting login with:', { email: credentials.email, password: '***' });
      
      const result = await login(credentials);
      
      console.log('2. Login result:', result);
      console.log('3. Result success:', result?.success);
      console.log('4. IsAuthenticated state:', isAuthenticated);
      
      if (result?.success) {
        console.log('5. Login successful, showing toast');
        showToast('Login successful! Welcome back.', 'success');
        
        console.log('6. Navigating to:', from);
        navigate(from, { replace: true });
      } else {
        console.log('5. Unexpected login result:', result);
        const errorMessage = 'Login failed. Please try again.';
        setErrors({ general: errorMessage });
        showToast(errorMessage, 'error');
      }
      
      console.log('=== LOGIN DEBUG END ===');
      
    } catch (error) {
      console.error('6. Login error caught:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      setErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
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
          <h1 className={styles.title}>Admin Login</h1>
          <p className={styles.subtitle}>Sign in to manage your church data</p>
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
                placeholder="Enter your email address"
                required
                autoComplete="email"
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isLoading}
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
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
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
                disabled={isLoading}
              />
              <span className={styles.checkboxCustom}>
                <svg className={styles.checkboxIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className={styles.checkboxLabel}>Remember me</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isLoading}
            className={`${styles.submitButton} ${isLoading ? styles.submitButtonLoading : ''}`}
            aria-label={isLoading ? 'Signing in...' : 'Sign in'}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Signing in...</span>
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
              tabIndex={isLoading ? -1 : 0}
            >
              <svg className={styles.forgotPasswordIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Forgot your password?
            </Link>
          </div>
        </form>

        <div className={styles.authFooter}>
          <div className={styles.divider}>
            <span>Need help?</span>
          </div>
          <Link to="/help" className={styles.helpLink}>
            <svg className={styles.helpIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.18l.09-.09a2.121 2.121 0 013 0l.09.09a2.121 2.121 0 010 3L12 8.36l-3.18-3.18a2.121 2.121 0 010-3z" />
            </svg>
            Contact Support
          </Link>
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