// frontend/src/components/form/Steps/PledgeInfo.jsx
import React from 'react';
import { DollarSign, Info } from 'lucide-react';
import { Input, Select } from '../FormControls';
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

  const formatCurrency = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getFrequencyLabel = (frequency) => {
    const option = frequencyOptions.find(f => f.value === frequency);
    return option ? option.label : frequency;
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <DollarSign className={styles.stepIcon} size={24} />
        <div>
          <h2 className={styles.stepTitle}>Pledge Information</h2>
          <p className={styles.stepDescription}>
            Your financial support helps us serve our community and grow together in faith. 
            This information is completely optional and confidential.
          </p>
        </div>
      </div>

      <div className={styles.pledgeNotice}>
        <div className={styles.noticeHeader}>
          <Info className={styles.noticeIcon} size={20} />
          <h3>Why we ask about pledges:</h3>
        </div>
        <ul className={styles.noticeList}>
          <li>Helps us plan ministry activities and budget</li>
          <li>Completely voluntary - no pressure or obligation</li>
          <li>Information kept strictly confidential</li>
          <li>You can change or cancel anytime</li>
        </ul>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.inputWithPrefix}>
          <span className={styles.inputPrefix}>$</span>
          <Input
            name="pledgeAmount"
            label="Pledge Amount (Optional)"
            value={formData.pledgeAmount}
            onChange={handleAmountChange}
            onBlur={handleBlur}
            error={errors.pledgeAmount}
            touched={touched.pledgeAmount}
            placeholder="0.00"
            helpText="Enter amount without currency symbol"
          />
        </div>

        <Select
          name="pledgeFrequency"
          label="Pledge Frequency"
          value={formData.pledgeFrequency}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.pledgeFrequency}
          touched={touched.pledgeFrequency}
          options={frequencyOptions}
          disabled={!formData.pledgeAmount}
          helpText="Select how often you'd like to contribute"
        />
      </div>

      {formData.pledgeAmount && (
        <div className={styles.pledgeSummary}>
          <h4>Pledge Summary:</h4>
          <div className={styles.summaryContent}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Amount:</span>
              <span className={styles.summaryValue}>{formatCurrency(formData.pledgeAmount)}</span>
            </div>
            {formData.pledgeFrequency && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Frequency:</span>
                <span className={styles.summaryValue}>{getFrequencyLabel(formData.pledgeFrequency)}</span>
              </div>
            )}
          </div>
          <div className={styles.pledgeNote}>
            <Info className={styles.pledgeNoteIcon} size={16} />
            <p>
              Thank you for your generous heart! Your contribution makes a real difference 
              in our church's ability to serve and grow.
            </p>
          </div>
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