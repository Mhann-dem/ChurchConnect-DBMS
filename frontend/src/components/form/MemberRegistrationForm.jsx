import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Form.module.css';


// Import the real services and hooks
import membersService from '../../services/members';
import { useToast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';

// Add these helper functions at the top of your MemberRegistrationForm.jsx file
const formatPhoneForAPI = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it's a US number (10 digits), add +1 prefix
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it already has country code (11 digits starting with 1), add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return cleaned.length > 0 ? `+${cleaned}` : '';
};

// Simple UI Components
const Button = ({ children, variant = 'default', onClick, disabled = false, ...props }) => {
  const variantClasses = {
    default: styles.buttonDefault,
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    outline: styles.buttonOutline
  };
  
  return (
    <button 
      className={`${styles.button} ${variantClasses[variant]}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const LoadingSpinner = ({ size = 'sm' }) => (
  <span className={`${styles.spinner} ${styles[`spinner-${size}`]}`} />
);

// Step Components
const StepIndicator = ({ steps, currentStep, completedSteps }) => (
  <div className={styles.stepIndicator}>
    {steps.map((step, index) => (
      <div 
        key={step.id} 
        className={`${styles.step} ${
          index === currentStep ? styles.active : 
          completedSteps.includes(step.id) ? styles.completed : ''
        }`}
      >
        <div className={styles.stepNumber}>{index + 1}</div>
        <div className={styles.stepTitle}>{step.title}</div>
      </div>
    ))}
  </div>
);

const PersonalInfo = ({ formData = {}, errors = {}, touched = {}, onChange, onBlur, setFieldValue, isAdminMode = false }) => (
  <div className={styles.stepContent}>
    <h2 className={styles.stepTitle}>Personal Information</h2>
    <p className={styles.stepDescription}>
      Please provide your basic personal information. Required fields are marked with *.
    </p>

    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label>First Name *</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName || ''}
          onChange={onChange}
          onBlur={onBlur}
          className={errors.firstName && touched.firstName ? styles.inputError : styles.input}
          required
        />
        {errors.firstName && touched.firstName && (
          <span className={styles.errorText}>{errors.firstName}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Last Name *</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName || ''}
          onChange={onChange}
          onBlur={onBlur}
          className={errors.lastName && touched.lastName ? styles.inputError : styles.input}
          required
        />
        {errors.lastName && touched.lastName && (
          <span className={styles.errorText}>{errors.lastName}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Email Address *</label>
        <input
          type="email"
          name="email"
          value={formData.email || ''}
          onChange={onChange}
          onBlur={onBlur}
          className={errors.email && touched.email ? styles.inputError : styles.input}
          required
        />
        {errors.email && touched.email && (
          <span className={styles.errorText}>{errors.email}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Date of Birth {!isAdminMode ? '*' : ''}</label>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth || ''}
          onChange={onChange}
          onBlur={onBlur}
          className={errors.dateOfBirth && touched.dateOfBirth ? styles.inputError : styles.input}
          required={!isAdminMode}
        />
        {errors.dateOfBirth && touched.dateOfBirth && (
          <span className={styles.errorText}>{errors.dateOfBirth}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Gender {!isAdminMode ? '*' : ''}</label>
        <select
          name="gender"
          value={formData.gender || ''}
          onChange={onChange}
          onBlur={onBlur}
          className={errors.gender && touched.gender ? styles.inputError : styles.select}
          required={!isAdminMode}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
        {errors.gender && touched.gender && (
          <span className={styles.errorText}>{errors.gender}</span>
        )}
      </div>
    </div>
  </div>
);

const ContactInfo = ({ formData = {}, errors = {}, touched = {}, onChange, onBlur, isAdminMode = false }) => (
  <div className={styles.stepContent}>
    <h2 className={styles.stepTitle}>Contact Information</h2>
    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label>Phone Number {!isAdminMode ? '*' : ''}</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone || ''}
          onChange={onChange}
          onBlur={onBlur}
          className={errors.phone && touched.phone ? styles.inputError : styles.input}
          required={!isAdminMode}
        />
        {errors.phone && touched.phone && (
          <span className={styles.errorText}>{errors.phone}</span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Address {!isAdminMode ? '*' : ''}</label>
        <textarea
          name="address"
          value={formData.address || ''}
          onChange={onChange}
          onBlur={onBlur}
          className={errors.address && touched.address ? styles.inputError : styles.textarea}
          rows={3}
          required={!isAdminMode}
        />
        {errors.address && touched.address && (
          <span className={styles.errorText}>{errors.address}</span>
        )}
      </div>
    </div>
  </div>
);

const MinistryInterests = ({ formData = {}, onChange, setFieldValue }) => {
  const ministryOptions = [
    'Worship Team', 'Youth Ministry', 'Children\'s Ministry', 'Community Outreach', 
    'Hospitality', 'Technical Support', 'Prayer Team', 'Bible Study'
  ];

  const handleMinistryChange = (ministry, checked) => {
    const current = formData.ministryInterests || [];
    const updated = checked 
      ? [...current, ministry]
      : current.filter(m => m !== ministry);
    setFieldValue('ministryInterests', updated);
  };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Ministry Interests</h2>
      <div className={styles.checkboxGrid}>
        {ministryOptions.map(ministry => (
          <label key={ministry} className={styles.checkboxItem}>
            <input
              type="checkbox"
              checked={(formData.ministryInterests || []).includes(ministry)}
              onChange={(e) => handleMinistryChange(ministry, e.target.checked)}
            />
            {ministry}
          </label>
        ))}
      </div>
    </div>
  );
};

const PledgeInfo = ({ formData = {}, onChange }) => (
  <div className={styles.stepContent}>
    <h2 className={styles.stepTitle}>Pledge Information (Optional)</h2>
    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label>Pledge Amount</label>
        <input
          type="number"
          name="pledgeAmount"
          value={formData.pledgeAmount || ''}
          onChange={onChange}
          className={styles.input}
          min="0"
          step="0.01"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Pledge Frequency</label>
        <select
          name="pledgeFrequency"
          value={formData.pledgeFrequency || ''}
          onChange={onChange}
          className={styles.select}
        >
          <option value="">Select Frequency</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annually">Annually</option>
        </select>
      </div>
    </div>
  </div>
);

const FamilyInfo = ({ formData = {}, onChange, isAdminMode = false }) => (
  <div className={styles.stepContent}>
    <h2 className={styles.stepTitle}>Family Information</h2>
    <div className={styles.formGrid}>
      <div className={styles.formGroup}>
        <label>Emergency Contact Name {!isAdminMode ? '*' : ''}</label>
        <input
          type="text"
          name="emergencyContactName"
          value={formData.emergencyContactName || ''}
          onChange={onChange}
          className={styles.input}
          required={!isAdminMode}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Emergency Contact Phone {!isAdminMode ? '*' : ''}</label>
        <input
          type="tel"
          name="emergencyContactPhone"
          value={formData.emergencyContactPhone || ''}
          onChange={onChange}
          className={styles.input}
          required={!isAdminMode}
        />
      </div>
    </div>
  </div>
);

const Confirmation = ({ formData = {}, setFieldValue, isAdminMode = false }) => (
  <div className={styles.stepContent}>
    <h2 className={styles.stepTitle}>Please Review Your Information</h2>
    <div className={styles.confirmationSummary}>
      <div className={styles.summarySection}>
        <h3>Personal Information</h3>
        <p>Name: {formData.firstName} {formData.lastName}</p>
        <p>Email: {formData.email}</p>
        <p>Phone: {formData.phone}</p>
      </div>
    </div>

    {!isAdminMode && (
      <div className={styles.agreementSection}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.privacyPolicyAgreed || false}
            onChange={(e) => setFieldValue('privacyPolicyAgreed', e.target.checked)}
            required
          />
          I agree to the Privacy Policy and Terms of Service *
        </label>
      </div>
    )}
  </div>
);

// Form hook
const useForm = (initialData) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const setFieldValue = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setFieldError = (name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const resetForm = () => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    resetForm
  };
};

// Constants
const STEPS = [
  { id: 'personal', title: 'Personal Information', component: PersonalInfo },
  { id: 'contact', title: 'Contact Information', component: ContactInfo },
  { id: 'ministry', title: 'Ministry Interests', component: MinistryInterests },
  { id: 'pledge', title: 'Pledge Information', component: PledgeInfo },
  { id: 'family', title: 'Family Information', component: FamilyInfo },
  { id: 'confirmation', title: 'Confirmation', component: Confirmation }
];

const INITIAL_FORM_DATA = {
  firstName: '',
  lastName: '',
  preferredName: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  alternatePhone: '',
  address: '',
  preferredContactMethod: 'email',
  preferredLanguage: 'English',
  accessibilityNeeds: '',
  ministryInterests: [],
  prayerRequest: '',
  pledgeAmount: '',
  pledgeFrequency: '',
  familyMembers: [],
  emergencyContactName: '',
  emergencyContactPhone: '',
  privacyPolicyAgreed: false,
  communicationOptIn: true,
  internalNotes: '',
  tags: [],
  skipValidation: false,
  registeredBy: null,
  registrationContext: 'public'
};

// Validation function
const validateStep = (stepId, formData, isAdminMode = false) => {
  const stepValidations = {
    personal: () => {
      const errors = {};
      if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName?.trim()) errors.lastName = 'Last name is required';
      if (!formData.email?.trim()) errors.email = 'Email is required';
      if (!isAdminMode || !formData.skipValidation) {
        if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
        if (!formData.gender) errors.gender = 'Gender is required';
      }
      return errors;
    },
    contact: () => {
      const errors = {};
      if (!isAdminMode || !formData.skipValidation) {
        if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
        if (!formData.address?.trim()) errors.address = 'Address is required';
      }
      return errors;
    },
    ministry: () => ({}),
    pledge: () => ({}),
    family: () => {
      const errors = {};
      if (!isAdminMode || !formData.skipValidation) {
        if (!formData.emergencyContactName?.trim()) {
          errors.emergencyContactName = 'Emergency contact name is required';
        }
        if (!formData.emergencyContactPhone?.trim()) {
          errors.emergencyContactPhone = 'Emergency contact phone is required';
        }
      }
      return errors;
    },
    confirmation: () => {
      const errors = {};
      if (!formData.privacyPolicyAgreed && (!isAdminMode || !formData.skipValidation)) {
        errors.privacyPolicyAgreed = 'You must agree to the privacy policy';
      }
      return errors;
    }
  };

  return stepValidations[stepId] ? stepValidations[stepId]() : {};
};

// Replace your existing transformFormDataForAPI function with this:
const transformFormDataForAPI = (formData) => {
  const transformedData = {
    first_name: formData.firstName?.trim() || '',
    last_name: formData.lastName?.trim() || '',
    preferred_name: formData.preferredName?.trim() || '',
    email: formData.email?.trim() || '',
    date_of_birth: formData.dateOfBirth || null,
    gender: formData.gender || '',
    phone: formatPhoneForAPI(formData.phone),
    alternate_phone: formatPhoneForAPI(formData.alternatePhone),
    address: formData.address?.trim() || '',
    preferred_contact_method: formData.preferredContactMethod || 'email',
    preferred_language: formData.preferredLanguage || 'English',
    accessibility_needs: formData.accessibilityNeeds?.trim() || '',
    emergency_contact_name: formData.emergencyContactName?.trim() || '',
    emergency_contact_phone: formatPhoneForAPI(formData.emergencyContactPhone),
    notes: formData.prayerRequest?.trim() || formData.notes?.trim() || '',
    communication_opt_in: formData.communicationOptIn !== false,
    privacy_policy_agreed: formData.privacyPolicyAgreed === true, // Ensure it's explicitly true
    is_active: true,
    internal_notes: formData.internalNotes?.trim() || '',
  };

  console.log('[Transform] Original form data:', formData);
  console.log('[Transform] Transformed API data:', transformedData);
  
  return transformedData;
};


// Main Component
const MemberRegistrationForm = ({ 
  isAdminMode = false, 
  onSuccess = null,
  initialData = null,
  onCancel = null 
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Determine if user is admin
  const isAdmin = isAuthenticated && ['admin', 'super_admin'].includes(user?.role);
  const effectiveAdminMode = isAdminMode && isAdmin;

  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    resetForm
  } = useForm({
    ...INITIAL_FORM_DATA,
    ...initialData,
    registeredBy: effectiveAdminMode ? user?.id : null,
    registrationContext: effectiveAdminMode ? 'admin_portal' : 'public'
  });

  // Auto-save functionality (using in-memory storage)
  useEffect(() => {
    const saveData = () => {
      const savedData = {
        ...formData,
        currentStep,
        timestamp: new Date().toISOString(),
        isAdminMode: effectiveAdminMode
      };
      
      window.formDataCache = savedData;
    };

    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, effectiveAdminMode]);

  const handleNext = async () => {
    const stepId = STEPS[currentStep].id;
    const stepErrors = validateStep(stepId, formData, effectiveAdminMode);
    
    if (Object.keys(stepErrors).length === 0) {
      setCompletedSteps(prev => [...prev, stepId]);
      setCurrentStep(prev => prev + 1);
    } else {
      Object.keys(stepErrors).forEach(field => {
        setFieldError(field, stepErrors[field]);
      });
      showToast('Please fix the errors before continuing.', 'error');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      console.log('[RegistrationForm] Submitting form data:', formData);
      
      // Transform the form data to match API expectations
      const apiData = transformFormDataForAPI(formData);
      console.log('[RegistrationForm] Transformed API data:', apiData);

      // Use real members service
      const result = await membersService.createMember(apiData);
      console.log('[RegistrationForm] Create member result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create member');
      }

      // Clear saved data
      delete window.formDataCache;

      if (effectiveAdminMode && onSuccess) {
        console.log('[RegistrationForm] Calling onSuccess callback');
        onSuccess(result.data);
        showToast(`${result.data?.first_name || 'Member'} registered successfully!`, 'success');
      } else {
        showToast('Registration submitted successfully!', 'success');
        navigate('/thank-you', { 
          state: { 
            memberData: { 
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email 
            } 
          } 
        });
      }
    } catch (error) {
      console.error('[RegistrationForm] Submit error:', error);
      
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.detail ||
                          error?.validationErrors?.message ||
                          error?.message || 
                          'An error occurred. Please try again.';
                          
      showToast(errorMessage, 'error');
      
      if (error?.validationErrors) {
        console.error('[RegistrationForm] Validation errors:', error.validationErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const AdminEnhancements = () => {
    if (!effectiveAdminMode) return null;

    return (
      <div className={styles.adminEnhancements}>
        <div className={styles.adminHeader}>
          <h3>Admin Options</h3>
          <span className={styles.adminBadge}>
            Registering as: {user?.firstName || user?.first_name} {user?.lastName || user?.last_name}
          </span>
        </div>
        
        <div className={styles.adminControls}>
          <div className={styles.formGroup}>
            <label htmlFor="internalNotes">Internal Notes</label>
            <textarea
              id="internalNotes"
              name="internalNotes"
              value={formData.internalNotes}
              onChange={handleChange}
              placeholder="Internal notes (not visible to member)"
              rows={3}
              className={styles.internalNotes}
            />
          </div>

          <div className={styles.adminCheckbox}>
            <label>
              <input
                type="checkbox"
                checked={formData.skipValidation || false}
                onChange={(e) => setFieldValue('skipValidation', e.target.checked)}
              />
              Skip strict validation (admin override)
            </label>
          </div>
        </div>
      </div>
    );
  };

  const CurrentStepComponent = STEPS[currentStep].component;
  const isLastStep = currentStep === STEPS.length - 1;

  const stepProps = {
    formData,
    errors,
    touched,
    onChange: handleChange,
    onBlur: handleBlur,
    setFieldValue,
    isAdminMode: effectiveAdminMode
  };

  return (
    <div className={`${styles.formContainer} ${effectiveAdminMode ? styles.adminMode : ''}`}>
      <div className={styles.formHeader}>
        <h1 className={styles.title}>
          {effectiveAdminMode ? 'Register New Member' : 'Member Registration'}
        </h1>
        <p className={styles.subtitle}>
          {effectiveAdminMode ? 
            'Adding a new member to the church database' :
            'Join our church family - we\'re excited to get to know you!'
          }
        </p>
      </div>

      <AdminEnhancements />

      <StepIndicator 
        steps={STEPS} 
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      <div className={styles.formContent}>
        <CurrentStepComponent {...stepProps} />
      </div>

      <div className={styles.formActions}>
        {currentStep > 0 && (
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={isSubmitting}
          >
            Previous
          </Button>
        )}

        <div className={styles.actionButtons}>
          {effectiveAdminMode && onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          
          {!isLastStep ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || (!effectiveAdminMode && !formData.privacyPolicyAgreed)}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  {effectiveAdminMode ? 'Registering...' : 'Submitting...'}
                </>
              ) : (
                effectiveAdminMode ? 'Register Member' : 'Submit Registration'
              )}
            </Button>
          )}
        </div>
      </div>

      {!effectiveAdminMode && (
        <div className={styles.autoSaveIndicator}>
          <span>✓ Progress automatically saved</span>
        </div>
      )}

      {effectiveAdminMode && (
        <div className={styles.adminFooter}>
          <small>
            Admin Registration Mode • Changes are tracked • 
            Member will receive welcome email if communication is opted in
          </small>
        </div>
      )}
    </div>
  );
};

export default MemberRegistrationForm;