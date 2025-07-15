// frontend/src/components/form/Steps/PersonalInfo.jsx
import React from 'react';
import { Input, Select, DatePicker } from '../FormControls';
import styles from '../Form.module.css';

const PersonalInfo = ({ formData, errors, touched, onChange, onBlur, setFieldValue }) => {
  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

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
            value={formData.firstName}
            onChange={onChange}
            onBlur={onBlur}
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
            value={formData.lastName}
            onChange={onChange}
            onBlur={onBlur}
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
            value={formData.preferredName}
            onChange={onChange}
            onBlur={onBlur}
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
            value={formData.email}
            onChange={onChange}
            onBlur={onBlur}
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
            value={formData.dateOfBirth}
            onChange={(date) => setFieldValue('dateOfBirth', date)}
            onBlur={onBlur}
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
            value={formData.gender}
            onChange={onChange}
            onBlur={onBlur}
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