// src/components/shared/LoadingSpinner.jsx
import React from 'react';
import styles from './Shared.module.css';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...', fullscreen = false }) => {
  const sizeClass = {
    small: styles.spinnerSmall,
    medium: styles.spinnerMedium,
    large: styles.spinnerLarge
  };

  const content = (
    <div className={`${styles.spinnerContainer} ${fullscreen ? styles.fullscreen : ''}`}>
      <div className={`${styles.spinner} ${sizeClass[size]}`}>
        <div className={styles.spinnerInner}></div>
      </div>
      {message && <p className={styles.spinnerMessage}>{message}</p>}
    </div>
  );

  return fullscreen ? (
    <div className={styles.fullscreenOverlay}>
      {content}
    </div>
  ) : content;
};

export default LoadingSpinner;
