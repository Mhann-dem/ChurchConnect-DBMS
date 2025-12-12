import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PublicPages.module.css';

const AccessibilityPage = () => {
  const [fontSize, setFontSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    document.documentElement.style.fontSize = size === 'large' ? '120%' : size === 'small' ? '90%' : '100%';
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
    document.body.classList.toggle('high-contrast', !highContrast);
  };

  const accessibilityFeatures = [
    {
      icon: "⌨️",
      title: "Keyboard Navigation",
      description: "Full keyboard navigation support with visible focus indicators and logical tab order.",
      details: [
        "Use Tab to navigate forward through interactive elements",
        "Use Shift+Tab to navigate backward",
        "Use Enter or Space to activate buttons and links",
        "Use arrow keys to navigate within components"
      ]
    },
    {
      icon: "🔍",
      title: "Screen Reader Compatibility",
      description: "Optimized for screen readers with semantic HTML and ARIA labels.",
      details: [
        "All images have descriptive alt text",
        "Form fields are properly labeled",
        "Headings follow logical hierarchy",
        "Status messages are announced to screen readers"
      ]
    },
    {
      icon: "🎨",
      title: "Visual Accessibility",
      description: "High contrast ratios and scalable text for better visibility.",
      details: [
        "Minimum 4.5:1 contrast ratio for normal text",
        "7:1 contrast ratio for small text",
        "Text can be resized up to 200% without loss of functionality",
        "Color is not the sole means of conveying information"
      ]
    },
    {
      icon: "⚡",
      title: "Reduced Motion",
      description: "Respects user preferences for reduced motion and animations.",
      details: [
        "Animations are disabled for users who prefer reduced motion",
        "Essential motion is still preserved for functionality",
        "Smooth scrolling can be turned off",
        "Parallax effects are minimized"
      ]
    }
  ];

  const keyboardShortcuts = [
    { key: "Tab", description: "Navigate to next interactive element" },
    { key: "Shift + Tab", description: "Navigate to previous interactive element" },
    { key: "Enter", description: "Activate buttons and links" },
    { key: "Space", description: "Activate buttons and checkboxes" },
    { key: "Escape", description: "Close modals and dropdowns" },
    { key: "Arrow Keys", description: "Navigate within menus and components" }
  ];

  return (
    <div className={styles.homePage}>
      <div className={styles.pageSection}>
        <div className={styles.pageBackground}>
          <div className={styles.pageOverlay}></div>
        </div>
        
        <div className={styles.pageContent}>
          <div className="container">
            <div className={styles.pageHeader}>
              <div className={styles.pageBreadcrumb}>
                <Link to="/" className={styles.breadcrumbLink}>Home</Link>
                <span className={styles.breadcrumbSeparator}>/</span>
                <span className={styles.breadcrumbCurrent}>Accessibility</span>
              </div>
              
              <h1 className={styles.pageTitle}>Accessibility Commitment</h1>
              <p className={styles.pageSubtitle}>
                We are committed to ensuring our website is accessible to everyone, 
                regardless of ability or technology used.
              </p>
            </div>

            <div className={styles.accessibilityTools}>
              <div className={styles.toolsCard}>
                <h2>Accessibility Tools</h2>
                <p>Use these tools to customize your browsing experience:</p>
                
                <div className={styles.toolsGrid}>
                  <div className={styles.tool}>
                    <h3>Text Size</h3>
                    <div className={styles.buttonGroup}>
                      <button 
                        className={`${styles.toolButton} ${fontSize === 'small' ? styles.active : ''}`}
                        onClick={() => handleFontSizeChange('small')}
                        aria-label="Small text size"
                      >
                        A-
                      </button>
                      <button 
                        className={`${styles.toolButton} ${fontSize === 'normal' ? styles.active : ''}`}
                        onClick={() => handleFontSizeChange('normal')}
                        aria-label="Normal text size"
                      >
                        A
                      </button>
                      <button 
                        className={`${styles.toolButton} ${fontSize === 'large' ? styles.active : ''}`}
                        onClick={() => handleFontSizeChange('large')}
                        aria-label="Large text size"
                      >
                        A+
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.tool}>
                    <h3>Contrast</h3>
                    <button 
                      className={`${styles.contrastButton} ${highContrast ? styles.active : ''}`}
                      onClick={toggleHighContrast}
                      aria-pressed={highContrast}
                    >
                      {highContrast ? 'Normal Contrast' : 'High Contrast'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.accessibilityGrid}>
              {accessibilityFeatures.map((feature, index) => (
                <div key={index} className={styles.featureCard}>
                  <div className={styles.featureIcon} role="img" aria-label={feature.title}>
                    {feature.icon}
                  </div>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>{feature.description}</p>
                  <ul className={styles.featureDetails}>
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex}>{detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className={styles.keyboardSection}>
              <h2>Keyboard Navigation</h2>
              <p>
                Our website can be fully navigated using only a keyboard. 
                Here are the main keyboard shortcuts:
              </p>
              
              <div className={styles.shortcutsGrid}>
                {keyboardShortcuts.map((shortcut, index) => (
                  <div key={index} className={styles.shortcutItem}>
                    <kbd className={styles.shortcutKey}>{shortcut.key}</kbd>
                    <span className={styles.shortcutDescription}>{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.standardsSection}>
              <h2>Accessibility Standards</h2>
              <p>
                Our website aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 
                at the AA level. These guidelines explain how to make web content more accessible 
                for people with disabilities.
              </p>
              
              <div className={styles.standardsGrid}>
                <div className={styles.standardItem}>
                  <h3>Perceivable</h3>
                  <p>Information and UI components must be presentable to users in ways they can perceive.</p>
                </div>
                <div className={styles.standardItem}>
                  <h3>Operable</h3>
                  <p>UI components and navigation must be operable by all users.</p>
                </div>
                <div className={styles.standardItem}>
                  <h3>Understandable</h3>
                  <p>Information and operation of UI must be understandable to users.</p>
                </div>
                <div className={styles.standardItem}>
                  <h3>Robust</h3>
                  <p>Content must be robust enough for interpretation by assistive technologies.</p>
                </div>
              </div>
            </div>

            <div className={styles.feedbackSection}>
              <div className={styles.feedbackCard}>
                <h2>Accessibility Feedback</h2>
                <p>
                  We continuously work to improve the accessibility of our website. 
                  If you encounter any accessibility barriers or have suggestions for improvement, 
                  please don't hesitate to contact us.
                </p>
                
                <div className={styles.contactMethods}>
                  <div className={styles.contactMethod}>
                    <strong>Email:</strong> accessibility@deeperlifechurch.org
                  </div>
                  <div className={styles.contactMethod}>
                    <strong>Phone:</strong> +233 (0) 32 123 4567
                  </div>
                  <div className={styles.contactMethod}>
                    <Link to="/feedback" className={styles.inlineLink}>
                      Submit Feedback Form
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityPage;