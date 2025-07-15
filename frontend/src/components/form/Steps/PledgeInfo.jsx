// frontend/src/components/form/Steps/PledgeInfo.jsx
import React from 'react';
import { Input, Select } from '../FormControls';
import styles from '../Form.module.css';

const PledgeInfo = ({ formData, errors, touched, onChange, onBlur, setFieldValue }) => {
  const frequencyOptions = [
    { value: '', label: 'Select Frequency' },
    { value: 'one-time', label: 'One-time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' }
  ];

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onChange(e);
    }
  };

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>Pledge Information</h2>
      <p className={styles.stepDescription}>
        Your financial support helps us serve our community and grow together in faith. 
        This information is completely optional and confidential.
      </p>

      <div className={styles.pledgeNotice}>
        <div className={styles.noticeIcon}>💡</div>
        <div>
          <h3>Why we ask about pledges:</h3>
          <ul>
            <li>Helps us plan ministry activities and budget</li>
            <li>Completely voluntary - no pressure or obligation</li>
            <li>Information kept strictly confidential</li>
            <li>You can change or cancel anytime</li>
          </ul>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <Input
            name="pledgeAmount"
            type="text"
            label="Pledge Amount (Optional)"
            value={formData.pledgeAmount}
            onChange={handleAmountChange}
            onBlur={onBlur}
            error={errors.pledgeAmount}
            touched={touched.pledgeAmount}
            placeholder="0.00"
            prefix="$"
            helpText="Enter amount without currency symbol"
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            name="pledgeFrequency"
            label="Pledge Frequency"
            value={formData.pledgeFrequency}
            onChange={onChange}
            onBlur={onBlur}
            error={errors.pledgeFrequency}
            touched={touched.pledgeFrequency}
            options={frequencyOptions}
            disabled={!formData.pledgeAmount}
            helpText="Select how often you'd like to contribute"
          />
        </div>
      </div>

      {formData.pledgeAmount && (
        <div className={styles.pledgeSummary}>
          <h4>Pledge Summary:</h4>
          <p>
            Amount: <strong>${formData.pledgeAmount}</strong>
            {formData.pledgeFrequency && (
              <span> ({formData.pledgeFrequency})</span>
            )}
          </p>
          <p className={styles.pledgeNote}>
            Thank you for your generous heart! Your contribution makes a real difference 
            in our church's ability to serve and grow.
          </p>
        </div>
      )}

      <div className={styles.skipOption}>
        <button 
          type="button" 
          className={styles.skipButton}
          onClick={() => {
            setFieldValue('pledgeAmount', '');
            setFieldValue('pledgeFrequency', '');
          }}
        >
          Skip this step
        </button>
      </div>
    </div>
  );
};

export default PledgeInfo;