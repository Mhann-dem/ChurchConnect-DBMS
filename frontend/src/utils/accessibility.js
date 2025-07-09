/**
 * Accessibility utilities for ChurchConnect DBMS
 * Provides functions to enhance accessibility and usability
 */

/**
 * Announce content to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level ('polite' or 'assertive')
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus management for modals and navigation
 * @param {HTMLElement} element - Element to focus
 * @param {boolean} scrollToElement - Whether to scroll to element
 */
export const focusElement = (element, scrollToElement = true) => {
  if (!element) return;
  
  // Make element focusable if it's not already
  if (element.tabIndex === -1) {
    element.tabIndex = 0;
  }
  
  element.focus();
  
  if (scrollToElement) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }
};

/**
 * Trap focus within a container (useful for modals)
 * @param {HTMLElement} container - Container to trap focus within
 * @returns {function} Function to remove focus trap
 */
export const trapFocus = (container) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
    
    // Close modal on Escape key
    if (e.key === 'Escape') {
      const closeButton = container.querySelector('[data-close]');
      if (closeButton) {
        closeButton.click();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  if (firstElement) {
    firstElement.focus();
  }
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get user's preferred color scheme
 * @returns {string} 'dark' or 'light'
 */
export const getPreferredColorScheme = () => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

/**
 * Check if user prefers high contrast
 * @returns {boolean} True if user prefers high contrast
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Apply high contrast mode
 */
export const applyHighContrastMode = () => {
  document.documentElement.classList.add('high-contrast');
};

/**
 * Remove high contrast mode
 */
export const removeHighContrastMode = () => {
  document.documentElement.classList.remove('high-contrast');
};

/**
 * Increase font size for better readability
 * @param {number} factor - Multiplication factor (e.g., 1.2 for 20% increase)
 */
export const increaseFontSize = (factor = 1.2) => {
  const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  document.documentElement.style.fontSize = `${currentSize * factor}px`;
};

/**
 * Reset font size to default
 */
export const resetFontSize = () => {
  document.documentElement.style.fontSize = '';
};

/**
 * Skip to main content functionality
 * @param {string} mainContentId - ID of main content area
 */
export const skipToMainContent = (mainContentId = 'main-content') => {
  const mainContent = document.getElementById(mainContentId);
  if (mainContent) {
    focusElement(mainContent, true);
    announceToScreenReader('Skipped to main content');
  }
};

/**
 * Validate form accessibility
 * @param {HTMLFormElement} form - Form element to validate
 * @returns {Array} Array of accessibility issues
 */
export const validateFormAccessibility = (form) => {
  const issues = [];
  
  // Check for labels
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const label = form.querySelector(`label[for="${input.id}"]`);
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledby = input.getAttribute('aria-labelledby');
    
    if (!label && !ariaLabel && !ariaLabelledby) {
      issues.push({
        element: input,
        issue: 'Input missing label',
        severity: 'error'
      });
    }
  });
  
  // Check for required field indicators
  const requiredInputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  requiredInputs.forEach(input => {
    const hasAriaRequired = input.getAttribute('aria-required') === 'true';
    const hasRequiredAttribute = input.hasAttribute('required');
    
    if (!hasAriaRequired && !hasRequiredAttribute) {
      issues.push({
        element: input,
        issue: 'Required field not properly marked',
        severity: 'warning'
      });
    }
  });
  
  // Check for error messages
  const errorMessages = form.querySelectorAll('[aria-live="polite"], [aria-live="assertive"]');
  if (errorMessages.length === 0) {
    issues.push({
      element: form,
      issue: 'No live regions for error announcements',
      severity: 'warning'
    });
  }
  
  return issues;
};

/**
 * Add keyboard navigation to custom components
 * @param {HTMLElement} element - Element to add keyboard navigation to
 * @param {Object} options - Configuration options
 */
export const addKeyboardNavigation = (element, options = {}) => {
  const {
    role = 'button',
    activationKeys = ['Enter', ' '],
    navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
    onActivate = () => {},
    onNavigate = () => {}
  } = options;
  
  // Set appropriate ARIA attributes
  element.setAttribute('role', role);
  element.setAttribute('tabindex', '0');
  
  element.addEventListener('keydown', (e) => {
    if (activationKeys.includes(e.key)) {
      e.preventDefault();
      onActivate(e);
    } else if (navigationKeys.includes(e.key)) {
      e.preventDefault();
      onNavigate(e);
    }
  });
};

/**
 * Create accessible notification
 * @param {string} message - Notification message
 * @param {string} type - Type of notification ('success', 'error', 'warning', 'info')
 * @param {number} duration - Duration in ms (0 for persistent)
 */
export const createAccessibleNotification = (message, type = 'info', duration = 5000) => {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  notification.textContent = message;
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'notification__close';
  closeButton.setAttribute('aria-label', 'Close notification');
  closeButton.innerHTML = '×';
  closeButton.addEventListener('click', () => {
    notification.remove();
  });
  
  notification.appendChild(closeButton);
  
  // Add to page
  let notificationContainer = document.querySelector('.notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    notificationContainer.setAttribute('aria-live', 'polite');
    notificationContainer.setAttribute('aria-atomic', 'false');
    document.body.appendChild(notificationContainer);
  }
  
  notificationContainer.appendChild(notification);
  
  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, duration);
  }
  
  return notification;
};

/**
 * Check if element is visible to screen readers
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if visible to screen readers
 */
export const isVisibleToScreenReaders = (element) => {
  const style = getComputedStyle(element);
  const ariaHidden = element.getAttribute('aria-hidden') === 'true';
  const hasDisplay = style.display !== 'none';
  const hasVisibility = style.visibility !== 'hidden';
  const hasOpacity = style.opacity !== '0';
  const hasClip = !style.clip || style.clip === 'auto';
  
  return !ariaHidden && hasDisplay && hasVisibility && hasOpacity && hasClip;
};

/**
 * Get accessibility preferences from localStorage
 * @returns {Object} User's accessibility preferences
 */
export const getAccessibilityPreferences = () => {
  const defaults = {
    fontSize: 'normal',
    highContrast: false,
    reducedMotion: prefersReducedMotion(),
    colorScheme: getPreferredColorScheme(),
    screenReader: false
  };
  
  try {
    const stored = localStorage.getItem('accessibility-preferences');
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch (error) {
    console.warn('Error reading accessibility preferences:', error);
    return defaults;
  }
};

/**
 * Save accessibility preferences to localStorage
 * @param {Object} preferences - Preferences to save
 */
export const saveAccessibilityPreferences = (preferences) => {
  try {
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences));
  } catch (error) {
    console.warn('Error saving accessibility preferences:', error);
  }
};

/**
 * Apply accessibility preferences
 * @param {Object} preferences - Preferences to apply
 */
export const applyAccessibilityPreferences = (preferences) => {
  const { fontSize, highContrast, colorScheme } = preferences;
  
  // Apply font size
  if (fontSize === 'large') {
    increaseFontSize(1.2);
  } else if (fontSize === 'extra-large') {
    increaseFontSize(1.5);
  } else {
    resetFontSize();
  }
  
  // Apply high contrast
  if (highContrast) {
    applyHighContrastMode();
  } else {
    removeHighContrastMode();
  }
  
  // Apply color scheme
  document.documentElement.setAttribute('data-theme', colorScheme);
};

/**
 * Initialize accessibility features
 */
export const initializeAccessibility = () => {
  // Apply saved preferences
  const preferences = getAccessibilityPreferences();
  applyAccessibilityPreferences(preferences);
  
  // Add skip link if it doesn't exist
  if (!document.querySelector('.skip-link')) {
    const skipLink = document.createElement('a');
    skipLink.className = 'skip-link';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      skipToMainContent();
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
  
  // Listen for preference changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    const newPrefs = { ...preferences, reducedMotion: e.matches };
    saveAccessibilityPreferences(newPrefs);
  });
  
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const newPrefs = { ...preferences, colorScheme: e.matches ? 'dark' : 'light' };
    saveAccessibilityPreferences(newPrefs);
    applyAccessibilityPreferences(newPrefs);
  });
};

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeAccessibility);
} 
