// src/components/ui/Avatar.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './UI.module.css';

const Avatar = ({
  src,
  alt,
  name,
  size = 'medium',
  shape = 'circle',
  fallback,
  className = '',
  onClick,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const baseClasses = [
    styles.avatar,
    styles[`avatar--${size}`],
    styles[`avatar--${shape}`],
    onClick && styles['avatar--clickable'],
    className
  ].filter(Boolean).join(' ');

  const handleImageError = () => {
    setImageError(true);
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderContent = () => {
    if (src && !imageError) {
      return (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={styles.avatarImage}
          onError={handleImageError}
        />
      );
    }

    if (fallback) {
      return <span className={styles.avatarFallback}>{fallback}</span>;
    }

    if (name) {
      return (
        <span className={styles.avatarInitials}>
          {getInitials(name)}
        </span>
      );
    }

    return (
      <svg
        className={styles.avatarIcon}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    );
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={baseClasses}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      {...props}
    >
      {renderContent()}
    </Component>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
  shape: PropTypes.oneOf(['circle', 'square']),
  fallback: PropTypes.node,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default Avatar;
