// src/components/ui/Dropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './UI.module.css';

const Dropdown = ({
  trigger,
  children,
  placement = 'bottom-start',
  disabled = false,
  closeOnItemClick = true,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const calculatePosition = () => {
    if (!triggerRef.current || !dropdownRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'bottom-start':
        top = triggerRect.bottom + 4;
        left = triggerRect.left;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + 4;
        left = triggerRect.right - dropdownRect.width;
        break;
      case 'top-start':
        top = triggerRect.top - dropdownRect.height - 4;
        left = triggerRect.left;
        break;
      case 'top-end':
        top = triggerRect.top - dropdownRect.height - 4;
        left = triggerRect.right - dropdownRect.width;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - dropdownRect.height) / 2;
        left = triggerRect.left - dropdownRect.width - 4;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - dropdownRect.height) / 2;
        left = triggerRect.right + 4;
        break;
      default:
        break;
    }

    // Boundary checking
    if (left < 8) left = 8;
    if (left + dropdownRect.width > viewportWidth - 8) {
      left = viewportWidth - dropdownRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + dropdownRect.height > viewportHeight - 8) {
      top = viewportHeight - dropdownRect.height - 8;
    }

    setPosition({ top, left });
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    toggleDropdown();
  };

  const handleItemClick = (e) => {
    if (closeOnItemClick) {
      closeDropdown();
    }
  };

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, placement]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        closeDropdown();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    const handleResize = () => {
      if (isOpen) calculatePosition();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  return (
    <div className={styles.dropdown} {...props}>
      <div
        ref={triggerRef}
        className={`${styles.dropdownTrigger} ${disabled ? styles.disabled : ''}`}
        onClick={handleTriggerClick}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`${styles.dropdownContent} ${className}`}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 1000
          }}
          onClick={handleItemClick}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = '',
  ...props 
}) => {
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  return (
    <div
      className={`${styles.dropdownItem} ${disabled ? styles.disabled : ''} ${className}`}
      onClick={handleClick}
      role="menuitem"
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownDivider = ({ className = '' }) => (
  <div className={`${styles.dropdownDivider} ${className}`} role="separator" />
);

const DropdownHeader = ({ children, className = '' }) => (
  <div className={`${styles.dropdownHeader} ${className}`} role="presentation">
    {children}
  </div>
);

Dropdown.Item = DropdownItem;
Dropdown.Divider = DropdownDivider;
Dropdown.Header = DropdownHeader;

Dropdown.propTypes = {
  trigger: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  placement: PropTypes.oneOf([
    'bottom-start',
    'bottom-end',
    'top-start',
    'top-end',
    'left',
    'right'
  ]),
  disabled: PropTypes.bool,
  closeOnItemClick: PropTypes.bool,
  className: PropTypes.string
};

DropdownItem.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

DropdownDivider.propTypes = {
  className: PropTypes.string
};

DropdownHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Dropdown;