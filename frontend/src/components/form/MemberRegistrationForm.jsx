// frontend/src/components/form/MemberRegistrationForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import useForm from '../../hooks/useForm';
import { useToast } from '../../hooks/useToast';
import { validateMemberForm } from '../../utils/validation';
import membersService from '../../services/members';
import { AuthContext } from '../../context/AuthContext';
import StepIndicator from './StepIndicator';
import PersonalInfo from './Steps/PersonalInfo';
import ContactInfo from './Steps/ContactInfo';
import MinistryInterests from './Steps/MinistryInterests';
import PledgeInfo from './Steps/PledgeInfo';
import FamilyInfo from './Steps/FamilyInfo';
import Confirmation from './Steps/Confirmation';
import { LoadingSpinner } from '../shared';
import { Button } from '../ui';
import styles from './Form.module.css';

const STEPS = [
  { id: 'personal', title: 'Personal Information', component: PersonalInfo },
  { id: 'contact', title: 'Contact Information', component: ContactInfo },
  { id: 'ministry', title: 'Ministry Interests', component: MinistryInterests },
  { id: 'pledge', title: 'Pledge Information', component: PledgeInfo },
  { id: 'family', title: 'Family Information', component: FamilyInfo },
  { id: 'confirmation', title: 'Confirmation', component: Confirmation }
];

const INITIAL_FORM_DATA = {
  // Personal Information
  firstName: '',
  lastName: '',
  preferredName: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  
  // Contact Information
  phone: '',
  alternatePhone: '',
  address: '',
  preferredContactMethod: 'email',
  preferredLanguage: 'English',
  accessibilityNeeds: '',
  
  // Ministry Interests
  ministryInterests: [],
  prayerRequest: '',
  
  // Pledge Information
  pledgeAmount: '',
  pledgeFrequency: '',
  
  // Family Information
  familyMembers: [],
  emergencyContactName: '',
  emergencyContactPhone: '',
  
  // Agreement
  privacyPolicyAgreed: false,
  communicationOptIn: true,
  
  // Admin-only fields
  internalNotes: '',
  tags: [],
  skipValidation: false,
  registeredBy: null,
  registrationContext: 'public'
};

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
    pledge: () => {
      const errors = {};
      if (formData.pledgeAmount && !formData.pledgeFrequency) {
        errors.pledgeFrequency = 'Pledge frequency is required when amount is specified';
      }
      return errors;
    },
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

const MemberRegistrationForm = ({ 
  isAdminMode = false, 
  onSuccess = null,
  initialData = null,
  onCancel = null 
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [estimatedTime, setEstimatedTime] = useState('3-5 minutes');
  const [showBulkImport, setShowBulkImport] = useState(false);

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
    validateField,
    resetForm
  } = useForm({
    ...INITIAL_FORM_DATA,
    ...initialData,
    registeredBy: effectiveAdminMode ? user?.id : null,
    registrationContext: effectiveAdminMode ? 'admin_portal' : 'public'
  });

  // Enhanced auto-save with admin context
  useEffect(() => {
    const saveData = () => {
      const savedData = {
        ...formData,
        currentStep,
        timestamp: new Date().toISOString(),
        isAdminMode: effectiveAdminMode
      };
      try {
        const storageKey = effectiveAdminMode ? 
          'churchconnect_admin_form_data' : 
          'churchconnect_form_data';
        // Note: Using in-memory storage instead of localStorage for Claude.ai compatibility
        window.formDataCache = savedData;
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };

    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, effectiveAdminMode]);

  // Load saved data on mount
  useEffect(() => {
    try {
      // Note: Using in-memory storage instead of localStorage for Claude.ai compatibility
      const savedData = window.formDataCache;
      if (savedData && savedData.isAdminMode === effectiveAdminMode) {
        const timeDiff = new Date() - new Date(savedData.timestamp);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          Object.keys(savedData).forEach(key => {
            if (key !== 'timestamp' && key !== 'currentStep' && key !== 'isAdminMode' && 
                INITIAL_FORM_DATA.hasOwnProperty(key)) {
              setFieldValue(key, savedData[key]);
            }
          });
          setCurrentStep(savedData.currentStep || 0);
          showToast('Your previous progress has been restored.', 'info');
        }
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
  }, [setFieldValue, showToast, effectiveAdminMode]);

  const updateFormData = (updates) => {
    Object.keys(updates).forEach(key => {
      setFieldValue(key, updates[key]);
    });
  };

  // Admin-specific quick fill functions
  const applyDefaultPreferences = () => {
    updateFormData({
      preferredContactMethod: 'email',
      communicationOptIn: true,
      preferredLanguage: 'English'
    });
    showToast('Default preferences applied', 'success');
  };

  const clearFormForNext = () => {
    resetForm();
    setCurrentStep(0);
    setCompletedSteps([]);
    showToast('Form cleared for next member', 'info');
  };

  const handleNext = async () => {
    const stepId = STEPS[currentStep].id;
    const stepErrors = validateStep(stepId, formData, effectiveAdminMode);
    
    if (Object.keys(stepErrors).length === 0) {
      setCompletedSteps(prev => [...prev, stepId]);
      setCurrentStep(prev => prev + 1);
      
      const remaining = STEPS.length - currentStep - 1;
      const timePerStep = remaining * 0.8;
      setEstimatedTime(`${Math.ceil(timePerStep)} minutes remaining`);
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
    const formErrors = effectiveAdminMode && formData.skipValidation ? 
      {} : validateMemberForm(formData);
    
    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        const submitData = {
          ...formData,
          ...(effectiveAdminMode && {
            registeredBy: user.id,
            registrationContext: 'admin_portal',
            internalNotes: formData.internalNotes
          })
        };

        const result = await membersService.createMember(submitData);
        
        // Clear saved data
        try {
          delete window.formDataCache;
        } catch (error) {
          console.error('Error clearing saved data:', error);
        }

        if (effectiveAdminMode && onSuccess) {
          onSuccess(result);
          showToast('Member registered successfully!', 'success');
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
        console.error('Form submission error:', error);
        showToast(error.response?.data?.message || 'An error occurred. Please try again.', 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      Object.keys(formErrors).forEach(field => {
        setFieldError(field, formErrors[field]);
      });
      showToast('Please fix all errors before submitting.', 'error');
    }
  };

  const AdminEnhancements = () => {
    if (!effectiveAdminMode) return null;

    return (
      <div className={styles.adminEnhancements}>
        <div className={styles.adminHeader}>
          <h3>Admin Options</h3>
          <span className={styles.adminBadge}>
            Registering as: {user?.firstName} {user?.lastName}
          </span>
        </div>
        
        <div className={styles.adminControls}>
          <div className={styles.formGroup}>
            <label htmlFor="internalNotes">Internal Notes</label>
            <textarea
              id="internalNotes"
              value={formData.internalNotes}
              onChange={handleChange}
              placeholder="Internal notes (not visible to member)"
              rows={3}
              className={styles.internalNotes}
            />
          </div>

          <div className={styles.adminActions}>
            <button
              type="button"
              onClick={applyDefaultPreferences}
              className={styles.quickAction}
              disabled={isSubmitting}
            >
              Apply Defaults
            </button>
            
            <button
              type="button"
              onClick={clearFormForNext}
              className={styles.quickAction}
              disabled={isSubmitting}
            >
              Clear for Next
            </button>
            
            <button
              type="button"
              onClick={() => setShowBulkImport(true)}
              className={styles.quickAction}
              disabled={isSubmitting}
            >
              Bulk Import
            </button>
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
    validateField,
    updateFormData,
    onValidate: validateField,
    onBack: handlePrevious,
    onSubmit: handleSubmit,
    isSubmitting,
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
        {!effectiveAdminMode && (
          <p className={styles.estimatedTime}>
            Estimated time: {estimatedTime}
          </p>
        )}
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