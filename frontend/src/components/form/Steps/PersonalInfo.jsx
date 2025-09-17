// frontend/src/components/form/Steps/PersonalInfo.jsx
import React from 'react';
import { User } from 'lucide-react';
import { Input, Select, DatePicker } from '../FormControls';
import styles from '../Form.module.css';

const PersonalInfo = ({ 
  formData = {}, 
  errors = {}, 
  touched = {}, 
  onChange, 
  onBlur, 
  setFieldValue,
  isAdminMode = false
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

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <User className={styles.stepIcon} size={24} />
        <div>
          <h2 className={styles.stepTitle}>Personal Information</h2>
          <p className={styles.stepDescription}>
            Please provide your basic personal information. Required fields are marked with *.
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <Input
          name="firstName"
          label="First Name"
          value={formData.firstName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.firstName}
          touched={touched.firstName}
          required={true}
          placeholder="Enter your first name"
        />

        <Input
          name="lastName"
          label="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.lastName}
          touched={touched.lastName}
          required={true}
          placeholder="Enter your last name"
        />

        <Input
          name="preferredName"
          label="Preferred Name"
          value={formData.preferredName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.preferredName}
          touched={touched.preferredName}
          placeholder="What would you like to be called?"
          helpText="Leave blank if you prefer your first name"
        />

        <Input
          name="email"
          type="email"
          label="Email Address"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          touched={touched.email}
          required={true}
          placeholder="your.email@example.com"
        />

        <DatePicker
          name="dateOfBirth"
          label="Date of Birth"
          value={formData.dateOfBirth}
          onChange={handleDateChange}
          onBlur={handleBlur}
          error={errors.dateOfBirth}
          touched={touched.dateOfBirth}
          required={!isAdminMode}
          maxDate={new Date()}
        />

        <Select
          name="gender"
          label="Gender"
          value={formData.gender}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.gender}
          touched={touched.gender}
          required={!isAdminMode}
          options={genderOptions}
        />
      </div>
    </div>
  );
};

export default PersonalInfo;