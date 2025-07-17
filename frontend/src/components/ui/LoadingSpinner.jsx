import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', color = '#007bff' }) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return (
    <div className="spinner-container">
      <div 
        className={`spinner ${sizeClasses[size]}`}
        style={{ borderTopColor: color }}
      ></div>
    </div>
  );
};

export default LoadingSpinner;