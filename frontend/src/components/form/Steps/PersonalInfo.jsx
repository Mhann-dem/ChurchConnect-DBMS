// frontend/src/components/form/Steps/PersonalInfo.jsx
import React from 'react';
import Input from '../FormControls/Input';
import Select from '../FormControls/Select';
import DatePicker from '../FormControls/DatePicker';
import styles from '../Form.module.css';

const PersonalInfo = ({ 
  formData = {}, 
  errors = {}, 
  touched = {}, 
  onChange, 
  onBlur, 
  setFieldValue 
}) => {
  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  // Ensure handlers exist and provide fallbacks
  const handleChange = onChange || ((e) => {
    console.warn('onChange not provided', e.target.name, e.target.value);
  });
  
  const handleBlur = onBlur || ((e) => {
    console.warn('onBlur not provided', e.target.name);
  });
  
  const handleSetFieldValue = setFieldValue || ((field, value) => {
    console.warn('setFieldValue not provided', field, value);
  });

  // Handle date changes specifically
  const handleDateChange = (date) => {
    handleSetFieldValue('dateOfBirth', date);
  };

  // Handle select changes
  const handleSelectChange = (e) => {
    handleChange(e);
  };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Personal Information</h2>
      <p className={styles.stepDescription}>
        Please provide your basic personal information. Required fields are marked with *.
      </p>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <Input
            name="firstName"
            label="First Name *"
            value={formData.firstName || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.firstName}
            touched={touched.firstName}
            required
            placeholder="Enter your first name"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            name="lastName"
            label="Last Name *"
            value={formData.lastName || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.lastName}
            touched={touched.lastName}
            required
            placeholder="Enter your last name"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            name="preferredName"
            label="Preferred Name"
            value={formData.preferredName || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.preferredName}
            touched={touched.preferredName}
            placeholder="What would you like to be called?"
            helpText="Leave blank if you prefer your first name"
          />
        </div>

        <div className={styles.formGroup}>
          <Input
            name="email"
            type="email"
            label="Email Address *"
            value={formData.email || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            touched={touched.email}
            required
            placeholder="your.email@example.com"
          />
        </div>

        <div className={styles.formGroup}>
          <DatePicker
            name="dateOfBirth"
            label="Date of Birth *"
            value={formData.dateOfBirth || ''}
            onChange={handleDateChange}
            onBlur={handleBlur}
            error={errors.dateOfBirth}
            touched={touched.dateOfBirth}
            required
            maxDate={new Date()}
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            name="gender"
            label="Gender *"
            value={formData.gender || ''}
            onChange={handleSelectChange}
            onBlur={handleBlur}
            error={errors.gender}
            touched={touched.gender}
            required
            options={genderOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;