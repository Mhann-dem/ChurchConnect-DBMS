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
    
    // The login function now returns { success: true, user, token } on success
    // or throws an error on failure
    if (result?.success) {
      console.log('5. Login successful, showing toast');
      showToast('Login successful! Welcome back.', 'success');
      
      console.log('6. Navigating to:', from);
      navigate(from, { replace: true });
    } else {
      // This shouldn't happen with the new implementation
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
            <img src="/logo.png" alt="ChurchConnect" />
          </div>
          <h1>Admin Login</h1>
          <p>Sign in to manage your church data</p>
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
              value={formData.email}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="Enter your email"
              required
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : undefined}
              disabled={isLoading}
            />
            {errors.email && (
              <div id="email-error" className={styles.errorMessage} role="alert">
                {errors.email}
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
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
                {errors.password}
              </div>
            )}
          </div>

          <div className={styles.formOptions}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className={styles.checkbox}
                disabled={isLoading}
              />
              <span className={styles.checkboxText}>Remember me</span>
            </label>
            
            <Link 
              to="/admin/forgot-password" 
              className={styles.forgotLink}
              tabIndex={isLoading ? -1 : 0}
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isLoading}
            className={styles.submitButton}
            aria-label={isLoading ? 'Signing in...' : 'Sign in'}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className={styles.authFooter}>
          <p>
            Need help? <Link to="/help" className={styles.helpLink}>Contact Support</Link>
          </p>
        </div>
      </div>

      <div className={styles.authBackground}>
        <div className={styles.backgroundPattern}></div>
      </div>
    </div>
  );
};

export default LoginPage;