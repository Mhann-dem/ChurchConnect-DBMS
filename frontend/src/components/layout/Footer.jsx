// src/components/layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Layout.module.css';

const Footer = ({ isAdmin = false }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>ChurchConnect</h4>
            <p>Connecting our church family through technology</p>
          </div>

          {!isAdmin && (
            <div className={styles.footerSection}>
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/form">Member Registration</Link></li>
                <li><Link to="/help">Help Center</Link></li>
              </ul>
            </div>
          )}

          <div className={styles.footerSection}>
            <h4>Support</h4>
            <ul>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/help/faq">FAQ</Link></li>
              <li><a href="mailto:support@churchconnect.org">Contact Support</a></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h4>Legal</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>&copy; {currentYear} ChurchConnect DBMS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
