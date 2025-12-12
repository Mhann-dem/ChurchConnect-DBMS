import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PublicPages.module.css';

const TermsPage = () => {
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
                <span className={styles.breadcrumbCurrent}>Terms of Service</span>
              </div>
              
              <h1 className={styles.pageTitle}>Terms of Service</h1>
              <p className={styles.pageSubtitle}>
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <div className={styles.legalContent}>
              <div className={styles.legalSection}>
                <h2>1. Agreement to Terms</h2>
                <p>
                  By accessing and using the Deeper Life Christian Church website and services, 
                  you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>

              <div className={styles.legalSection}>
                <h2>2. Church Membership and Registration</h2>
                <div className={styles.subsection}>
                  <h3>2.1 Registration Requirements</h3>
                  <p>
                    To register as a member of Deeper Life Christian Church, you must provide 
                    accurate and complete information during the registration process. You are 
                    responsible for maintaining the confidentiality of your account information.
                  </p>
                </div>
                <div className={styles.subsection}>
                  <h3>2.2 Member Responsibilities</h3>
                  <p>
                    As a church member, you agree to participate in church activities in a 
                    manner consistent with Christian values and the teachings of our church. 
                    You agree to respect fellow members and church leadership.
                  </p>
                </div>
              </div>

              <div className={styles.legalSection}>
                <h2>3. Use of Church Services</h2>
                <div className={styles.subsection}>
                  <h3>3.1 Permitted Use</h3>
                  <p>
                    Our website and services are provided for personal, non-commercial use 
                    related to church activities, worship, fellowship, and spiritual growth.
                  </p>
                </div>
                <div className={styles.subsection}>
                  <h3>3.2 Prohibited Activities</h3>
                  <ul className={styles.legalList}>
                    <li>Using the service for any unlawful purpose</li>
                    <li>Disrupting church services or activities</li>
                    <li>Harassing or intimidating other members</li>
                    <li>Sharing false or misleading information</li>
                    <li>Attempting to gain unauthorized access to church systems</li>
                  </ul>
                </div>
              </div>

              <div className={styles.legalSection}>
                <h2>4. Privacy and Data Protection</h2>
                <p>
                  We are committed to protecting your privacy. Please review our 
                  <Link to="/privacy" className={styles.inlineLink}> Privacy Policy</Link>, 
                  which also governs your use of our services, to understand our practices.
                </p>
              </div>

              <div className={styles.legalSection}>
                <h2>5. Financial Contributions and Pledges</h2>
                <div className={styles.subsection}>
                  <h3>5.1 Voluntary Nature</h3>
                  <p>
                    All financial contributions to the church are voluntary. Pledges made 
                    through our system represent your commitment to give, but are not 
                    legally binding contracts.
                  </p>
                </div>
                <div className={styles.subsection}>
                  <h3>5.2 Tax Receipts</h3>
                  <p>
                    The church will provide appropriate tax receipts for contributions 
                    in accordance with applicable tax laws and regulations.
                  </p>
                </div>
              </div>

              <div className={styles.legalSection}>
                <h2>6. Intellectual Property</h2>
                <p>
                  The content on this website, including but not limited to text, graphics, 
                  logos, images, and software, is the property of Deeper Life Christian Church 
                  and is protected by copyright and other intellectual property laws.
                </p>
              </div>

              <div className={styles.legalSection}>
                <h2>7. Disclaimer of Warranties</h2>
                <p>
                  The information on this website is provided on an "as is" basis. To the 
                  fullest extent permitted by law, this church excludes all representations, 
                  warranties, conditions and other terms which might otherwise have effect 
                  in relation to this website.
                </p>
              </div>

              <div className={styles.legalSection}>
                <h2>8. Limitation of Liability</h2>
                <p>
                  Deeper Life Christian Church shall not be liable for any direct, indirect, 
                  incidental, consequential, or punitive damages arising out of your access 
                  to or use of our website and services.
                </p>
              </div>

              <div className={styles.legalSection}>
                <h2>9. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. We will notify 
                  users of any significant changes. Your continued use of our services 
                  after such modifications constitutes acceptance of the updated terms.
                </p>
              </div>

              <div className={styles.legalSection}>
                <h2>10. Contact Information</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className={styles.contactInfo}>
                  <p><strong>Deeper Life Christian Church</strong></p>
                  <p>Email: info@deeperlifechurch.org</p>
                  <p>Phone: +233 (0) 32 123 4567</p>
                  <p>Address: Kumasi, Ashanti Region, Ghana</p>
                </div>
              </div>
            </div>

            <div className={styles.legalFooter}>
              <p>
                By using our services, you acknowledge that you have read and understood 
                these Terms of Service and agree to be bound by them.
              </p>
              <div className={styles.legalLinks}>
                <Link to="/privacy" className={styles.legalLink}>Privacy Policy</Link>
                <Link to="/cookies" className={styles.legalLink}>Cookie Policy</Link>
                <Link to="/accessibility" className={styles.legalLink}>Accessibility</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;