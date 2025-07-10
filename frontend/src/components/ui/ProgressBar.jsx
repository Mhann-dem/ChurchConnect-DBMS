import React from 'react';
import styles from './UI.module.css';

const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  label = '', 
  showValue = true,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'default', // 'default', 'success', 'warning', 'error'
  animated = false,
  striped = false,
  className = '',
  ariaLabel = ''
}) => {
  // Ensure value is within bounds
  const clampedValue = Math.max(0, Math.min(value, max));
  const percentage = (clampedValue / max) * 100;

  // Generate aria-label if not provided
  const accessibleLabel = ariaLabel || label || `Progress: ${Math.round(percentage)}%`;

  return (
    <div className={`${styles.progressContainer} ${className}`}>
      {label && (
        <div className={styles.progressLabel}>
          <span>{label}</span>
          {showValue && (
            <span className={styles.progressValue}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div 
        className={`
          ${styles.progressBar} 
          ${styles[`progressBar--${size}`]} 
          ${styles[`progressBar--${variant}`]}
          ${animated ? styles.progressBarAnimated : ''}
          ${striped ? styles.progressBarStriped : ''}
        `}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={accessibleLabel}
      >
        <div 
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
        >
          {!label && showValue && (
            <span className={styles.progressText}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Multi-step progress indicator for forms
export const StepProgress = ({ 
  steps = [], 
  currentStep = 0, 
  className = '',
  variant = 'default' // 'default', 'dots', 'minimal'
}) => {
  return (
    <div className={`${styles.stepProgress} ${styles[`stepProgress--${variant}`]} ${className}`}>
      <div className={styles.stepProgressTrack}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div
              key={index}
              className={`
                ${styles.stepProgressItem}
                ${isActive ? styles.stepProgressItemActive : ''}
                ${isCompleted ? styles.stepProgressItemCompleted : ''}
                ${isUpcoming ? styles.stepProgressItemUpcoming : ''}
              `}
            >
              <div className={styles.stepProgressMarker}>
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path 
                      d="M3 8L6 11L13 4" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              {step.title && (
                <div className={styles.stepProgressLabel}>
                  <span className={styles.stepProgressTitle}>{step.title}</span>
                  {step.description && (
                    <span className={styles.stepProgressDescription}>
                      {step.description}
                    </span>
                  )}
                </div>
              )}
              
              {index < steps.length - 1 && (
                <div className={styles.stepProgressConnector} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;