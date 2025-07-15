// frontend/src/components/form/StepIndicator.jsx
import React from 'react';
import styles from './Form.module.css';

const StepIndicator = ({ steps, currentStep, completedSteps }) => {
  return (
    <div className={styles.stepIndicator}>
      <div className={styles.stepsList}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`${styles.stepItem} ${
              index === currentStep ? styles.current : ''
            } ${completedSteps.includes(step.id) ? styles.completed : ''}`}
          >
            <div className={styles.stepNumber}>
              {completedSteps.includes(step.id) ? (
                <span className={styles.checkmark}>✓</span>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className={styles.stepTitle}>{step.title}</div>
            {index < steps.length - 1 && (
              <div className={styles.stepConnector}></div>
            )}
          </div>
        ))}
      </div>
      
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default StepIndicator;