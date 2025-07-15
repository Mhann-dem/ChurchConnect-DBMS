// frontend/src/components/form/Steps/ContactInfo.jsx
import React from 'react';
import { Input, Select, TextArea, PhoneInput } from '../FormControls';
import styles from '../Form.module.css';

const ContactInfo = ({ formData, errors, touched, onChange, onBlur, setFieldValue }) => {
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

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Contact Information</h2>
      <p className={styles.stepDescription}>
        How can we reach you? This helps us stay connected and provide better service.
      </p>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <PhoneInput
            name="phone"
            label="Phone Number *"
            value={formData.phone}
            onChange={(value) => setFieldValue('phone', value)}
            onBlur={onBlur}
            error={errors.phone}
            touched={touched.phone}
            required
            placeholder="(555) 123-4567"
          />
        </div>

        <div className={styles.formGroup}>
          <PhoneInput
            name="alternatePhone"
            label="Alternate Phone"
            value={formData.alternatePhone}
            onChange={(value) => setFieldValue('alternatePhone', value)}
            onBlur={onBlur}
            error={errors.alternatePhone}
            touched={touched.alternatePhone}
            placeholder="(555) 987-6543"
          />
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <TextArea
            name="address"
            label="Address"
            value={formData.address}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.address}
            touched={touched.address}
            placeholder="Street address, city, state, zip code"
            rows={3}
            helpText="Optional - helps us understand our community better"
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            name="preferredContactMethod"
            label="Preferred Contact Method"
            value={formData.preferredContactMethod}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.preferredContactMethod}
            touched={touched.preferredContactMethod}
            options={contactMethodOptions}
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            name="preferredLanguage"
            label="Preferred Language"
            value={formData.preferredLanguage}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.preferredLanguage}
            touched={touched.preferredLanguage}
            options={languageOptions}
          />
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <TextArea
            name="accessibilityNeeds"
            label="Accessibility Needs"
            value={formData.accessibilityNeeds}
            onChange={onChange}
            onBlur={onBlur}
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