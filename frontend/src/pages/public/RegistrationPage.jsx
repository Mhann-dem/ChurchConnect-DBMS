import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LoadingSpinner = ({ size = "medium" }) => (
  <div className={`spinner ${size}`}>
    <div className="spinner-circle"></div>
  </div>
);

const MemberRegistrationForm = ({ 
  initialData, 
  onSubmit, 
  onSaveAndContinue, 
  isSubmitting, 
  onError 
}) => {
  const [formData, setFormData] = useState(initialData || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    membershipType: 'regular',
    preferredContactMethod: 'email'
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return !value?.trim() ? `${name === 'firstName' ? 'First' : 'Last'} name is required` : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !value ? 'Email is required' : !emailRegex.test(value) ? 'Invalid email format' : '';
      case 'phone':
        // FIXED: General international phone validation
        if (!value) return ''; // Phone is optional
        // Remove all non-digit characters for validation
        const cleanPhone = value.replace(/[\s\-\(\)\+]/g, '');
        // Check if it's a valid phone number (7-15 digits)
        if (cleanPhone.length < 7 || cleanPhone.length > 15) {
          return 'Phone number must be between 7-15 digits';
        }
        // Check if contains only digits and allowed characters
        if (!/^[\+]?[\d\s\-\(\)]{7,20}$/.test(value)) {
          return 'Invalid phone number format';
        }
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }
    
    onSubmit(formData);
  };

  const handleSaveAndContinue = () => {
    if (!formData.email?.trim()) {
      setErrors(prev => ({ ...prev, email: 'Email is required to save progress' }));
      setTouched(prev => ({ ...prev, email: true }));
      return;
    }
    onSaveAndContinue(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      <div className="form-section">
        <h3>Personal Information</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.firstName ? 'error' : ''}
              disabled={isSubmitting}
              required
            />
            {errors.firstName && (
              <span className="error-message">{errors.firstName}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Last Name *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.lastName ? 'error' : ''}
              disabled={isSubmitting}
              required
            />
            {errors.lastName && (
              <span className="error-message">{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.email ? 'error' : ''}
            disabled={isSubmitting}
            required
          />
          {errors.email && (
            <span className="error-message">{errors.email}</span>
          )}
        </div>

        {/* FIXED: General international phone input */}
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.phone ? 'error' : ''}
            disabled={isSubmitting}
            placeholder="e.g. +1-555-123-4567 or 0241234567"
          />
          {errors.phone && (
            <span className="error-message">{errors.phone}</span>
          )}
          <small className="field-hint">
            Enter your phone number with country code (e.g. +233241234567) or local format
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            rows="3"
            placeholder="Street address, city, region, country"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="birthDate">Date of Birth</label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              max={new Date().toISOString().split('T')[0]} // Can't be future date
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="membershipType">Membership Type</label>
            <select
              id="membershipType"
              name="membershipType"
              value={formData.membershipType}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="regular">Regular Member</option>
              <option value="associate">Associate Member</option>
              <option value="youth">Youth Member (Under 18)</option>
              <option value="senior">Senior Member (65+)</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="preferredContactMethod">Preferred Contact Method</label>
            <select
              id="preferredContactMethod"
              name="preferredContactMethod"
              value={formData.preferredContactMethod}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="email">Email</option>
              <option value="phone">Phone Call</option>
              <option value="sms">SMS/Text Message</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={handleSaveAndContinue}
          className="save-button"
          disabled={isSubmitting || !formData.email?.trim()}
        >
          Save & Continue Later
        </button>
        
        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? <LoadingSpinner size="small" /> : 'Complete Registration'}
        </button>
      </div>
    </form>
  );
};

// Mock services for the registration page
const registrationService = {
  async submitRegistration(formData) {
    try {
      console.log('Submitting registration:', formData);
      
      // Format data for API (match your Django backend)
      const apiData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || '',
        address: formData.address || '',
        date_of_birth: formData.birthDate || null,
        gender: formData.gender || null,
        membership_type: formData.membershipType,
        preferred_contact_method: formData.preferredContactMethod,
        registration_source: 'public_form',
        privacy_policy_agreed: true
      };

      // FIXED: Use your correct API endpoint
      const response = await fetch('http://localhost:8000/api/v1/members/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Registration failed');
      }

      return {
        success: true,
        data: result,
        message: result.message || 'Registration successful!'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed. Please try again.',
        validationErrors: error.validationErrors || {}
      };
    }
  },

  async saveFormProgress(formData) {
    try {
      // Save to localStorage for now (in real app, save to backend)
      const progressData = {
        ...formData,
        savedAt: new Date().toISOString(),
        progressId: 'progress-' + Date.now()
      };
      
      localStorage.setItem('registrationProgress', JSON.stringify(progressData));
      
      return {
        success: true,
        progressId: progressData.progressId
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to save progress'
      };
    }
  },

  async loadFormProgress(progressId) {
    try {
      const saved = localStorage.getItem('registrationProgress');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.progressId === progressId) {
          return { success: true, data };
        }
      }
      return { success: false, error: 'Progress not found' };
    } catch (error) {
      return { success: false, error: 'Failed to load progress' };
    }
  }
};

const useToast = () => ({
  showToast: (message, type, duration = 4000) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-family: system-ui, sans-serif;
      font-weight: 500;
      max-width: 400px;
      word-break: break-word;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });
    
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
});

// Main Registration Page Component
const RegistrationPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(null);
  const [savedProgressId, setSavedProgressId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  // Load saved form data on mount
  useEffect(() => {
    const progressId = searchParams.get('continue');
    
    if (progressId) {
      setSavedProgressId(progressId);
      loadSavedForm(progressId);
    }
  }, [searchParams]);

  const loadSavedForm = async (progressId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await registrationService.loadFormProgress(progressId);
      if (result.success) {
        setFormData(result.data);
        showToast('Continuing with your saved form', 'success');
      } else {
        setError('Could not load saved form');
        showToast('Could not load saved form. Starting fresh.', 'error');
      }
    } catch (error) {
      console.error('Error loading saved form:', error);
      setError('Could not load saved form');
      showToast('Could not load saved form. Starting fresh.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await registrationService.submitRegistration(data);
      
      if (result.success) {
        showToast('Registration successful!', 'success');
        
        // Clear saved progress
        localStorage.removeItem('registrationProgress');
        
        // Redirect to success page or home
        setTimeout(() => {
          window.location.href = '/admin/members';
        }, 2000);
      } else {
        setError(result.error);
        showToast(result.error || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed');
      showToast('Registration failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndContinue = async (data) => {
    try {
      setError(null);
      
      if (!data.email?.trim()) {
        showToast('Please enter your email address to save your progress.', 'error');
        return;
      }

      const result = await registrationService.saveFormProgress(data);
      
      if (result.success) {
        showToast('Form saved! You can continue later.', 'success');
        setSavedProgressId(result.progressId);
      } else {
        showToast('Could not save form progress.', 'error');
      }
    } catch (error) {
      console.error('Save and continue error:', error);
      setError('Could not save form progress');
      showToast('Could not save form progress.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="registration-page">
        <div className="loading-container">
          <LoadingSpinner size="large" />
          <h2>Loading Your Saved Form</h2>
          <p>Please wait while we retrieve your information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="container">
        <header className="registration-header">
          <h1>Member Registration</h1>
          <p>
            Welcome to our church community! Please fill out the form below to register as a member. 
            All fields marked with an asterisk (*) are required.
          </p>
          
          <div className="help-info">
            <p>
              Estimated time: 3-5 minutes | Need help? <a href="/help">Visit our help center</a>
            </p>
          </div>
          
          {savedProgressId && formData && (
            <div className="continue-notice">
              <p>
                Continuing saved form: We've loaded your previously saved information.
              </p>
            </div>
          )}
        </header>

        <div className="form-container">
          <MemberRegistrationForm
            initialData={formData}
            onSubmit={handleFormSubmit}
            onSaveAndContinue={handleSaveAndContinue}
            isSubmitting={isSubmitting}
          />
        </div>

        <footer className="registration-footer">
          <div className="help-links">
            <h3>Need Assistance?</h3>
            <ul>
              <li><a href="/help/registration">Registration Help Guide</a></li>
              <li><a href="/help/privacy">Privacy & Data Protection</a></li>
              <li><a href="/help/contact">Contact Support</a></li>
            </ul>
          </div>
          
          <div className="privacy-note">
            <p>
              Privacy Notice: Your personal information is securely stored and 
              will only be used for church administration purposes.
            </p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .registration-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          color: #1f2937;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .registration-header {
          text-align: center;
          margin-bottom: 40px;
          background: rgba(255, 255, 255, 0.95);
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
        }

        .registration-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 16px;
        }

        .help-info {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 16px;
          margin: 20px 0;
        }

        .continue-notice {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-top: 20px;
        }

        .form-container {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          margin-bottom: 40px;
        }

        .form-section h3 {
          color: #1e40af;
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 24px;
          padding-bottom: 8px;
          border-bottom: 2px solid #bfdbfe;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          background: white;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #1e40af;
          box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
        }

        .form-group input.error {
          border-color: #dc2626;
        }

        .error-message {
          color: #dc2626;
          font-size: 0.85rem;
          margin-top: 4px;
          display: block;
        }

        .field-hint {
          color: #6b7280;
          font-size: 0.8rem;
          margin-top: 4px;
          display: block;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .save-button {
          background: transparent;
          color: #1e40af;
          border: 2px solid #bfdbfe;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .save-button:hover:not(:disabled) {
          background: #eff6ff;
          border-color: #1e40af;
        }

        .submit-button {
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .submit-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
        }

        .loading-container {
          text-align: center;
          padding: 80px 20px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          margin: 40px auto;
          max-width: 500px;
        }

        .registration-footer {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 40px;
        }

        .help-links ul {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .help-links a {
          display: block;
          padding: 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          text-decoration: none;
          color: #1e40af;
          transition: all 0.3s ease;
        }

        .privacy-note {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 20px;
          margin-top: 32px;
        }

        .spinner {
          display: inline-block;
        }

        .spinner-circle {
          width: 20px;
          height: 20px;
          border: 2px solid #bfdbfe;
          border-top: 2px solid #1e40af;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .container {
            padding: 20px 15px;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .form-actions {
            flex-direction: column-reverse;
          }
        }
      `}</style>
    </div>
  );
};

export default RegistrationPage;