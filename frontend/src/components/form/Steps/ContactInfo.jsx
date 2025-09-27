// frontend/src/components/form/Steps/ContactInfo.jsx
import React from 'react';
import { Phone } from 'lucide-react';
import { TextArea, PhoneInput, Select } from '../FormControls';
import styles from '../Form.module.css';

const ContactInfo = ({ 
  formData = {}, 
  errors = {}, 
  touched = {}, 
  onChange, 
  onBlur, 
  setFieldValue,
  isAdminMode = false 
}) => {
  const contactMethodOptions = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'sms', label: 'Text Message' },
    { value: 'mail', label: 'Postal Mail' },
    { value: 'no_contact', label: 'No Contact Please' }
  ];

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'Other', label: 'Other' }
  ];

  // Ensure handlers exist and provide fallbacks
  const handleSetFieldValue = setFieldValue || ((field, value) => {
    console.warn('setFieldValue not provided, falling back to onChange');
    if (onChange) {
      const mockEvent = { target: { name: field, value } };
      onChange(mockEvent);
    }
  });

  // Handle phone input changes
  const handlePhoneChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, phone: value }));
    
    if (touched.phone) {
      const error = validatePhoneNumber(value);
      setErrors(prev => ({ ...prev, phone: error }));
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <Phone className={styles.stepIcon} size={24} />
        <div>
          <h2 className={styles.stepTitle}>Contact Information</h2>
          <p className={styles.stepDescription}>
            How can we reach you? This helps us stay connected and provide better service.
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <PhoneInput
          name="phone"
          label="Phone Number"
          value={formData.phone}
          onChange={(value) => handlePhoneChange('phone', value)}
          onBlur={handleBlur}
          error={errors.phone}
          touched={touched.phone}
          required={!isAdminMode}
          placeholder="(555) 123-4567"
        />

        <PhoneInput
          name="alternatePhone"
          label="Alternate Phone"
          value={formData.alternatePhone}
          onChange={(value) => handlePhoneChange('alternatePhone', value)}
          onBlur={handleBlur}
          error={errors.alternatePhone}
          touched={touched.alternatePhone}
          placeholder="(555) 987-6543"
        />

        <div className={styles.fullWidth}>
          <TextArea
            name="address"
            label="Address"
            value={formData.address}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.address}
            touched={touched.address}
            placeholder="Street address, city, state, zip code"
            rows={3}
            required={!isAdminMode}
            helpText="Optional - helps us understand our community better"
          />
        </div>

        <Select
          name="preferredContactMethod"
          label="Preferred Contact Method"
          value={formData.preferredContactMethod || 'email'}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.preferredContactMethod}
          touched={touched.preferredContactMethod}
          options={contactMethodOptions}
        />

        <Select
          name="preferredLanguage"
          label="Preferred Language"
          value={formData.preferredLanguage || 'English'}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.preferredLanguage}
          touched={touched.preferredLanguage}
          options={languageOptions}
        />

        <div className={styles.fullWidth}>
          <TextArea
            name="accessibilityNeeds"
            label="Accessibility Needs"
            value={formData.accessibilityNeeds}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.accessibilityNeeds}
            touched={touched.accessibilityNeeds}
            placeholder="Please let us know if you have any accessibility requirements"
            rows={2}
            helpText="This helps us better accommodate your needs during services and events"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;