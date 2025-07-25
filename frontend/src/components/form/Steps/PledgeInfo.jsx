// frontend/src/components/form/Steps/PledgeInfo.jsx
import React from 'react';
import styles from '../Form.module.css';

const PledgeInfo = ({ 
  formData = {}, 
  errors = {}, 
  touched = {}, 
  onChange, 
  onBlur, 
  setFieldValue 
}) => {
  const frequencyOptions = [
    { value: '', label: 'Select Frequency' },
    { value: 'one-time', label: 'One-time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' }
  ];

  // Safe handlers with fallbacks
  const handleChange = onChange || (() => console.warn('onChange not provided'));
  const handleBlur = onBlur || (() => console.warn('onBlur not provided'));
  const handleSetFieldValue = setFieldValue || ((field, value) => {
    console.warn('setFieldValue not provided, falling back to onChange');
    if (onChange) {
      const mockEvent = { target: { name: field, value } };
      onChange(mockEvent);
    }
  });

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleChange(e);
    }
  };

  const handleSkip = () => {
    handleSetFieldValue('pledgeAmount', '');
    handleSetFieldValue('pledgeFrequency', '');
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
          <label htmlFor="pledgeAmount">Pledge Amount (Optional)</label>
          <div className={styles.inputWithPrefix}>
            <span className={styles.inputPrefix}>$</span>
            <input
              id="pledgeAmount"
              name="pledgeAmount"
              type="text"
              value={formData.pledgeAmount || ''}
              onChange={handleAmountChange}
              onBlur={handleBlur}
              className={styles.input}
              placeholder="0.00"
            />
          </div>
          {errors.pledgeAmount && touched.pledgeAmount && (
            <span className={styles.errorMessage}>{errors.pledgeAmount}</span>
          )}
          <div className={styles.helpText}>Enter amount without currency symbol</div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="pledgeFrequency">Pledge Frequency</label>
          <select
            id="pledgeFrequency"
            name="pledgeFrequency"
            value={formData.pledgeFrequency || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.select}
            disabled={!formData.pledgeAmount}
          >
            {frequencyOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.pledgeFrequency && touched.pledgeFrequency && (
            <span className={styles.errorMessage}>{errors.pledgeFrequency}</span>
          )}
          <div className={styles.helpText}>Select how often you'd like to contribute</div>
        </div>
      </div>

      {formData.pledgeAmount && (
        <div className={styles.pledgeSummary}>
          <h4>Pledge Summary:</h4>
          <p>
            Amount: <strong>${formData.pledgeAmount}</strong>
            {formData.pledgeFrequency && (
              <span> ({frequencyOptions.find(f => f.value === formData.pledgeFrequency)?.label})</span>
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
          onClick={handleSkip}
        >
          Skip this step
        </button>
      </div>
    </div>
  );
};

export default PledgeInfo;