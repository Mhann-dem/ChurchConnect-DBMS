import React, { useState } from 'react';
import styles from './PublicPages.module.css';

const CookiesPage = () => {
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    functional: false
  });

  const handlePreferenceChange = (type) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSavePreferences = () => {
    // Save to localStorage or send to backend
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    alert('Cookie preferences saved successfully!');
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    alert('All cookies accepted!');
  };

  return (
    <div className={styles.homePage}>
      {/* Header Section */}
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeOverlay}></div>
        <div className={`${styles.container} ${styles.welcomeContent}`}>
          <div className={styles.welcomeMessage}>
            <div className={styles.welcomeChip}>
              <span className={styles.chipIcon}>🍪</span>
              Privacy & Cookies
            </div>
            <h1 className={styles.welcomeTitle}>Cookie Policy</h1>
            <div className={styles.welcomeSubtitle}>
              "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven."
              <span className={styles.scriptureRef}>- Matthew 5:16</span>
            </div>
            <p className={styles.welcomeDescription}>
              We value your privacy and are committed to being transparent about how we use cookies 
              and similar technologies on our website to enhance your experience.
            </p>
          </div>
          
          <div className={styles.welcomeStats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>4</div>
              <div className={styles.statLabel}>Cookie Types</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>100%</div>
              <div className={styles.statLabel}>Transparent</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>You</div>
              <div className={styles.statLabel}>In Control</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Types Section */}
      <section className={styles.activitiesSection}>
        <div className={styles.activitiesBackground}></div>
        <div className={styles.activitiesOverlay}></div>
        <div className={`${styles.container} ${styles.activitiesContent}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Types of Cookies We Use</h2>
            <p className={styles.sectionSubtitle}>
              Understanding the different cookies helps you make informed choices about your privacy preferences.
            </p>
          </div>
          
          <div className={styles.activitiesGrid}>
            <div className={styles.activityCard}>
              <div className={styles.activityIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                </svg>
              </div>
              <h3 className={styles.activityTitle}>Essential Cookies</h3>
              <div className={styles.activityTime}>Always Active</div>
              <p className={styles.activityDescription}>
                These cookies are necessary for the website to function and cannot be switched off. 
                They enable basic functions like page navigation and access to secure areas.
              </p>
              <div className={styles.activityFooter}>
                <span className={styles.activityDuration}>Required</span>
              </div>
            </div>

            <div className={styles.activityCard}>
              <div className={styles.activityIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/>
                </svg>
              </div>
              <h3 className={styles.activityTitle}>Analytics Cookies</h3>
              <div className={styles.activityTime}>Optional</div>
              <p className={styles.activityDescription}>
                Help us understand how visitors interact with our website by collecting and 
                reporting information anonymously to improve our services.
              </p>
              <div className={styles.activityFooter}>
                <span className={styles.activityDuration}>30 days</span>
              </div>
            </div>

            <div className={styles.activityCard}>
              <div className={styles.activityIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <h3 className={styles.activityTitle}>Functional Cookies</h3>
              <div className={styles.activityTime}>Optional</div>
              <p className={styles.activityDescription}>
                Enable enhanced functionality and personalization, such as remembering your 
                preferences and providing customized content.
              </p>
              <div className={styles.activityFooter}>
                <span className={styles.activityDuration}>1 year</span>
              </div>
            </div>

            <div className={styles.activityCard}>
              <div className={styles.activityIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                </svg>
              </div>
              <h3 className={styles.activityTitle}>Marketing Cookies</h3>
              <div className={styles.activityTime}>Optional</div>
              <p className={styles.activityDescription}>
                Used to track visitors across websites to display relevant advertisements 
                and measure the effectiveness of our outreach campaigns.
              </p>
              <div className={styles.activityFooter}>
                <span className={styles.activityDuration}>90 days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Preferences Section */}
      <section className={styles.membershipSection}>
        <div className={styles.membershipBackground}></div>
        <div className={styles.membershipOverlay}></div>
        <div className={`${styles.container} ${styles.membershipContent}`}>
          <div className={styles.membershipText}>
            <h2 className={styles.membershipTitle}>Your Cookie Preferences</h2>
            <p className={styles.membershipDescription}>
              You have control over which cookies we use. Essential cookies are always active 
              as they're necessary for the website to function properly. You can choose to 
              enable or disable other types of cookies based on your preferences.
            </p>
            
            <div className={styles.membershipBenefits}>
              <h3 className={styles.benefitsTitle}>Privacy Benefits:</h3>
              <div className={styles.benefitsGrid}>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>✓</span>
                  Full transparency about data collection
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>✓</span>
                  Complete control over your preferences
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>✓</span>
                  Easy to update settings anytime
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>✓</span>
                  No tracking without your consent
                </div>
              </div>
            </div>
          </div>

          <div className={styles.membershipForm}>
            <div className={styles.membershipCard}>
              <h3 className={styles.cardTitle}>Cookie Settings</h3>
              <p className={styles.cardDescription}>
                Customize your cookie preferences below. Changes will be saved automatically.
              </p>
              
              <div className="cookiePreferences">
                {/* Essential Cookies */}
                <div className={styles.contactMethod}>
                  <div className={styles.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    </svg>
                  </div>
                  <div className={styles.contactDetails}>
                    <h5>Essential Cookies</h5>
                    <p>Always Active</p>
                    <small>Required for basic website functionality</small>
                  </div>
                  <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={preferences.essential} 
                      disabled 
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Required</span>
                  </label>
                </div>

                {/* Analytics Cookies */}
                <div className={styles.contactMethod}>
                  <div className={styles.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"/>
                    </svg>
                  </div>
                  <div className={styles.contactDetails}>
                    <h5>Analytics Cookies</h5>
                    <p>Help improve our website</p>
                    <small>Anonymous usage statistics</small>
                  </div>
                  <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={preferences.analytics} 
                      onChange={() => handlePreferenceChange('analytics')}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>
                      {preferences.analytics ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {/* Functional Cookies */}
                <div className={styles.contactMethod}>
                  <div className={styles.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <div className={styles.contactDetails}>
                    <h5>Functional Cookies</h5>
                    <p>Enhanced user experience</p>
                    <small>Remember your preferences</small>
                  </div>
                  <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={preferences.functional} 
                      onChange={() => handlePreferenceChange('functional')}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>
                      {preferences.functional ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {/* Marketing Cookies */}
                <div className={styles.contactMethod}>
                  <div className={styles.contactIcon}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                    </svg>
                  </div>
                  <div className={styles.contactDetails}>
                    <h5>Marketing Cookies</h5>
                    <p>Personalized content</p>
                    <small>Relevant advertisements</small>
                  </div>
                  <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={preferences.marketing} 
                      onChange={() => handlePreferenceChange('marketing')}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>
                      {preferences.marketing ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '30px', display: 'flex', gap: '15px', flexDirection: 'column' }}>
                <button 
                  onClick={handleSavePreferences}
                  style={{
                    background: 'var(--gradient-blue)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Save Preferences
                </button>
                <button 
                  onClick={handleAcceptAll}
                  style={{
                    background: 'var(--gradient-red)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Accept All Cookies
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CookiesPage;