import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PublicPages.module.css';

const PrivacyPage = () => {
  const lastUpdated = "January 15, 2025";

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Privacy Policy</h1>
          <p className={styles.heroSubtitle}>
            Your privacy is important to us. Learn how we collect, use, and protect your personal information.
          </p>
          <p className={styles.lastUpdated}>Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className={styles.contentSection}>
        <div className={styles.containerNarrow}>
          <div className={styles.privacyContent}>
            
            {/* Introduction */}
            <div className={styles.section}>
              <h2>Introduction</h2>
              <p>
                ChurchConnect Data Management System ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
                use our member registration system and administrative platform.
              </p>
              <p>
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
                please do not access or use our services.
              </p>
            </div>

            {/* Information We Collect */}
            <div className={styles.section}>
              <h2>Information We Collect</h2>
              
              <h3>Personal Information</h3>
              <p>We may collect the following personal information when you register as a member:</p>
              <ul className={styles.privacyList}>
                <li><strong>Contact Information:</strong> Full name, email address, phone number, mailing address</li>
                <li><strong>Personal Details:</strong> Date of birth, gender, preferred language</li>
                <li><strong>Church Participation:</strong> Ministry interests, group affiliations, volunteer preferences</li>
                <li><strong>Financial Information:</strong> Pledge amounts and frequency (voluntary)</li>
                <li><strong>Family Information:</strong> Family member details (if provided)</li>
                <li><strong>Accessibility Needs:</strong> Special accommodations or assistance requirements</li>
                <li><strong>Communications:</strong> Prayer requests, notes, and correspondence preferences</li>
              </ul>

              <h3>Automatically Collected Information</h3>
              <p>When you use our system, we may automatically collect:</p>
              <ul className={styles.privacyList}>
                <li>IP addresses and location information</li>
                <li>Browser type and version</li>
                <li>Device information and operating system</li>
                <li>Usage patterns and interaction data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>

            {/* How We Use Information */}
            <div className={styles.section}>
              <h2>How We Use Your Information</h2>
              <p>We use the information we collect for the following purposes:</p>
              
              <h3>Church Administration</h3>
              <ul className={styles.privacyList}>
                <li>Maintaining accurate member records and directories</li>
                <li>Facilitating participation in ministries, groups, and events</li>
                <li>Processing and tracking financial pledges and contributions</li>
                <li>Coordinating volunteer opportunities and service projects</li>
              </ul>

              <h3>Communications</h3>
              <ul className={styles.privacyList}>
                <li>Sending important church announcements and updates</li>
                <li>Distributing ministry-specific communications</li>
                <li>Sharing prayer requests within appropriate groups</li>
                <li>Providing birthday and anniversary greetings</li>
                <li>Emergency communications when necessary</li>
              </ul>

              <h3>Pastoral Care</h3>
              <ul className={styles.privacyList}>
                <li>Providing appropriate pastoral support and care</li>
                <li>Coordinating visits and assistance for members in need</li>
                <li>Following up on prayer requests and spiritual needs</li>
                <li>Facilitating connections within the church community</li>
              </ul>
            </div>

            {/* Information Sharing */}
            <div className={styles.section}>
              <h2>How We Share Your Information</h2>
              
              <h3>Within Our Church</h3>
              <p>We may share your information with:</p>
              <ul className={styles.privacyList}>
                <li><strong>Pastoral Staff:</strong> For spiritual care and guidance purposes</li>
                <li><strong>Ministry Leaders:</strong> For programs you've expressed interest in joining</li>
                <li><strong>Administrative Staff:</strong> For church operations and member services</li>
                <li><strong>Prayer Teams:</strong> For prayer requests you've submitted (with your consent)</li>
              </ul>

              <h3>Third Parties</h3>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share information with:</p>
              <ul className={styles.privacyList}>
                <li><strong>Service Providers:</strong> Technical vendors who help maintain our systems</li>
                <li><strong>Legal Compliance:</strong> When required by law or to protect safety and rights</li>
                <li><strong>Emergency Services:</strong> In case of medical or safety emergencies</li>
              </ul>

              <div className={styles.importantNote}>
                <h4>🔒 Your Consent Matters</h4>
                <p>
                  We will always ask for your explicit consent before sharing sensitive information 
                  such as prayer requests, family situations, or personal struggles beyond our 
                  immediate pastoral care team.
                </p>
              </div>
            </div>

            {/* Data Security */}
            <div className={styles.section}>
              <h2>Data Security</h2>
              <p>We implement appropriate security measures to protect your personal information:</p>
              
              <h3>Technical Safeguards</h3>
              <ul className={styles.privacyList}>
                <li>SSL/TLS encryption for all data transmission</li>
                <li>Secure database storage with regular backups</li>
                <li>Multi-factor authentication for administrative access</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Restricted access on a need-to-know basis</li>
              </ul>

              <h3>Administrative Safeguards</h3>
              <ul className={styles.privacyList}>
                <li>Staff training on privacy and data protection</li>
                <li>Clear policies for data access and handling</li>
                <li>Regular review of access permissions</li>
                <li>Incident response procedures for data breaches</li>
              </ul>
            </div>

            {/* Your Rights */}
            <div className={styles.section}>
              <h2>Your Privacy Rights</h2>
              <p>You have the following rights regarding your personal information:</p>
              
              <h3>Access and Control</h3>
              <ul className={styles.privacyList}>
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (with some exceptions)</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from communications at any time</li>
              </ul>

              <h3>Communication Preferences</h3>
              <p>You can control how we communicate with you:</p>
              <ul className={styles.privacyList}>
                <li>Choose your preferred communication method (email, phone, mail, or SMS)</li>
                <li>Select specific types of communications you wish to receive</li>
                <li>Opt out of non-essential communications while maintaining membership</li>
                <li>Update your preferences at any time</li>
              </ul>
            </div>

            {/* Data Retention */}
            <div className={styles.section}>
              <h2>Data Retention</h2>
              <p>We retain your personal information for the following periods:</p>
              
              <ul className={styles.privacyList}>
                <li><strong>Active Members:</strong> While you remain an active member of our church</li>
                <li><strong>Former Members:</strong> Up to 7 years for historical and administrative purposes</li>
                <li><strong>Financial Records:</strong> As required by law and accounting standards</li>
                <li><strong>Prayer Requests:</strong> As long as relevant for ongoing pastoral care</li>
              </ul>
              
              <p>
                You may request earlier deletion of your information, and we will honor such requests 
                unless we are required to retain the information by law or for legitimate church purposes.
              </p>
            </div>

            {/* Children's Privacy */}
            <div className={styles.section}>
              <h2>Children's Privacy</h2>
              <p>
                We take special care to protect the privacy of children under 18. When collecting information 
                about minors, we:
              </p>
              
              <ul className={styles.privacyList}>
                <li>Require parental consent for registration</li>
                <li>Collect only information necessary for church activities</li>
                <li>Limit access to children's information to authorized staff</li>
                <li>Provide parents with access to their children's information</li>
                <li>Allow parents to request deletion of their children's information</li>
              </ul>
            </div>

            {/* Cookies and Tracking */}
            <div className={styles.section}>
              <h2>Cookies and Tracking Technologies</h2>
              <p>We use cookies and similar technologies to:</p>
              
              <ul className={styles.privacyList}>
                <li>Remember your preferences and login status</li>
                <li>Improve system performance and user experience</li>
                <li>Analyze usage patterns to enhance our services</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
              
              <p>
                You can control cookie settings through your browser preferences. Note that disabling 
                certain cookies may limit some functionality of our system.
              </p>
            </div>

            {/* Updates to Privacy Policy */}
            <div className={styles.section}>
              <h2>Updates to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices 
                or for legal and regulatory reasons. We will notify you of any material changes by:
              </p>
              
              <ul className={styles.privacyList}>
                <li>Posting the updated policy on our website</li>
                <li>Sending email notifications to registered members</li>
                <li>Announcing changes during church services</li>
              </ul>
              
              <p>
                Your continued use of our services after such notifications will constitute acceptance 
                of the updated Privacy Policy.
              </p>
            </div>

            {/* Contact Information */}
            <div className={styles.section}>
              <h2>Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us:
              </p>
              
              <div className={styles.contactInfo}>
                <div className={styles.contactItem}>
                  <strong>Church Data Protection Officer</strong><br/>
                  Email: privacy@churchconnect.org<br/>
                  Phone: (555) 123-4567<br/>
                  Address: 123 Church Street, Your City, State 12345
                </div>
                
                <div className={styles.contactItem}>
                  <strong>Response Time:</strong><br/>
                  We will respond to privacy-related inquiries within 30 days of receipt.
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className={styles.ctaSection}>
              <div className={styles.ctaContent}>
                <h3>Questions About Our Privacy Practices?</h3>
                <p>
                  We're here to help. Contact our privacy team with any questions or concerns 
                  about how we handle your personal information.
                </p>
                <div className={styles.ctaButtons}>
                  <Link to="/contact" className={styles.primaryButton}>
                    Contact Privacy Team
                  </Link>
                  <Link to="/form" className={styles.secondaryButton}>
                    Member Registration
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;