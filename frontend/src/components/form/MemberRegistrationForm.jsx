// frontend/src/components/form/MemberRegistrationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../hooks/useToast';
import { validateStep, validateForm } from '../../utils/validation';
import { submitMemberRegistration } from '../../services/members';
import StepIndicator from './StepIndicator';
import PersonalInfo from './Steps/PersonalInfo';
import ContactInfo from './Steps/ContactInfo';
import MinistryInterests from './Steps/MinistryInterests';
import PledgeInfo from './Steps/PledgeInfo';
import FamilyInfo from './Steps/FamilyInfo';
import Confirmation from './Steps/Confirmation';
import LoadingSpinner from '../shared';
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
  communicationOptIn: true
};

const MemberRegistrationForm = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [estimatedTime, setEstimatedTime] = useState('3-5 minutes');

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
  } = useForm(INITIAL_FORM_DATA);

  // Auto-save functionality
  useEffect(() => {
    const saveData = () => {
      const savedData = {
        ...formData,
        currentStep,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('churchconnect_form_data', JSON.stringify(savedData));
    };

    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData, currentStep]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('churchconnect_form_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const timeDiff = new Date() - new Date(parsed.timestamp);
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff < 24) { // Only restore if less than 24 hours old
          Object.keys(parsed).forEach(key => {
            if (key !== 'timestamp' && key !== 'currentStep') {
              setFieldValue(key, parsed[key]);
            }
          });
          setCurrentStep(parsed.currentStep || 0);
          showToast('Your previous progress has been restored.', 'info');
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  const handleNext = async () => {
    const stepId = STEPS[currentStep].id;
    const stepErrors = validateStep(stepId, formData);
    
    if (Object.keys(stepErrors).length === 0) {
      setCompletedSteps(prev => [...prev, stepId]);
      setCurrentStep(prev => prev + 1);
      
      // Update estimated time based on progress
      const remaining = STEPS.length - currentStep - 1;
      const timePerStep = remaining * 0.8; // ~45 seconds per step
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
    const formErrors = validateForm(formData);
    
    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        const result = await submitMemberRegistration(formData);
        
        if (result.success) {
          localStorage.removeItem('churchconnect_form_data');
          showToast('Registration submitted successfully!', 'success');
          navigate('/thank-you', { 
            state: { 
              memberData: { 
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email 
              } 
            } 
          });
        } else {
          throw new Error(result.message || 'Submission failed');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        showToast(error.message || 'An error occurred. Please try again.', 'error');
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

  const CurrentStepComponent = STEPS[currentStep].component;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h1 className={styles.title}>Member Registration</h1>
        <p className={styles.subtitle}>
          Join our church family - we're excited to get to know you!
        </p>
        <p className={styles.estimatedTime}>
          Estimated time: {estimatedTime}
        </p>
      </div>

      <StepIndicator 
        steps={STEPS} 
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      <div className={styles.formContent}>
        <CurrentStepComponent
          formData={formData}
          errors={errors}
          touched={touched}
          onChange={handleChange}
          onBlur={handleBlur}
          setFieldValue={setFieldValue}
          validateField={validateField}
        />
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
              disabled={isSubmitting || !formData.privacyPolicyAgreed}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Submitting...
                </>
              ) : (
                'Submit Registration'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Auto-save indicator */}
      <div className={styles.autoSaveIndicator}>
        <span>✓ Progress automatically saved</span>
      </div>
    </div>
  );
};

export default MemberRegistrationForm;