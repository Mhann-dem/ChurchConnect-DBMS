// ============================================================================
// PAGES/PUBLIC/THANKYOUPAGE.JSX
// ============================================================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicLayout } from '../../components/layout';
import { Button, Card } from '../../components/ui';
import styles from './PublicPages.module.css';

const ThankYouPage = () => {
  const location = useLocation();
  const { memberName, submissionId } = location.state || {};

  return (
    <PublicLayout>
      <div className={styles.thankYouPage}>
        <div className={styles.container}>
          <Card className={styles.thankYouCard}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
              </svg>
            </div>
            
            <h1 className={styles.thankYouTitle}>Thank You for Registering!</h1>
            
            {memberName && (
              <p className={styles.personalMessage}>
                Dear {memberName}, your registration has been successfully submitted.
              </p>
            )}
            
            <div className={styles.thankYouContent}>
              <p>
                We're excited to welcome you to our church community! Your information 
                has been received and will be reviewed by our administrative team.
              </p>
              
              {submissionId && (
                <div className={styles.submissionInfo}>
                  <strong>Submission ID:</strong> {submissionId}
                  <br />
                  <small>Please keep this ID for your records</small>
                </div>
              )}
              
              <div className={styles.nextSteps}>
                <h3>What's Next?</h3>
                <ul>
                  <li>You'll receive a confirmation email shortly</li>
                  <li>Our team will review your information</li>
                  <li>You may be contacted for additional details</li>
                  <li>Look out for information about upcoming events</li>
                </ul>
              </div>
              
              <div className={styles.contactInfo}>
                <h3>Questions?</h3>
                <p>
                  If you have any questions, please don't hesitate to contact us:
                </p>
                <p>
                  <strong>Phone:</strong> <a href="tel:+1234567890">(123) 456-7890</a><br />
                  <strong>Email:</strong> <a href="mailto:info@churchconnect.org">info@churchconnect.org</a>
                </p>
              </div>
            </div>
            
            <div className={styles.thankYouActions}>
              <Link to="/">
                <Button variant="primary">Return to Home</Button>
              </Link>
              <Link to="/register">
                <Button variant="outline">Register Another Person</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ThankYouPage;