// frontend/src/components/form/Steps/MinistryInterests.jsx
import React from 'react';
import Checkbox from '../FormControls/Checkbox';
import TextArea from '../FormControls/TextArea';
import styles from '../Form.module.css';

const MinistryInterests = ({ formData, errors, touched, onChange, onBlur, setFieldValue }) => {
  const ministryOptions = [
    { value: 'worship', label: 'Worship Team (Music/Vocals)' },
    { value: 'youth', label: 'Youth Ministry' },
    { value: 'children', label: 'Children\'s Ministry' },
    { value: 'seniors', label: 'Senior Ministry' },
    { value: 'outreach', label: 'Community Outreach' },
    { value: 'hospitality', label: 'Hospitality & Welcoming' },
    { value: 'technical', label: 'Technical/Audio-Visual' },
    { value: 'administration', label: 'Administration' },
    { value: 'counseling', label: 'Counseling/Support' },
    { value: 'missions', label: 'Missions' },
    { value: 'prayer', label: 'Prayer Team' },
    { value: 'education', label: 'Bible Study/Education' },
    { value: 'finance', label: 'Finance Committee' },
    { value: 'maintenance', label: 'Building/Maintenance' },
    { value: 'other', label: 'Other (please specify in notes)' }
  ];

  const handleMinistryChange = (value, checked) => {
    const currentInterests = formData.ministryInterests || [];
    if (checked) {
      setFieldValue('ministryInterests', [...currentInterests, value]);
    } else {
      setFieldValue('ministryInterests', currentInterests.filter(interest => interest !== value));
    }
  };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Ministry Interests</h2>
      <p className={styles.stepDescription}>
        Help us understand how you'd like to get involved in our church community. 
        Select all that interest you - there's no commitment required.
      </p>

      <div className={styles.ministryGrid}>
        <div className={styles.formGroup}>
          <label className={styles.sectionLabel}>
            Areas of Interest
          </label>
          <div className={styles.checkboxGrid}>
            {ministryOptions.map((option) => (
              <Checkbox
                key={option.value}
                name={`ministry-${option.value}`}
                label={option.label}
                checked={formData.ministryInterests?.includes(option.value) || false}
                onChange={(checked) => handleMinistryChange(option.value, checked)}
                className={styles.ministryCheckbox}
              />
            ))}
          </div>
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <TextArea
            name="prayerRequest"
            label="Prayer Request (Optional)"
            value={formData.prayerRequest}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.prayerRequest}
            touched={touched.prayerRequest}
            placeholder="Share any prayer requests or ways our church family can support you"
            rows={4}
            helpText="This information will be kept confidential and shared only with our prayer team"
          />
        </div>
      </div>
    </div>
  );
};

export default MinistryInterests;