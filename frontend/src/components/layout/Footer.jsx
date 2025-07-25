// src/components/layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Layout.module.css';
import logoLight from '../../assets/images/logo-dark.png';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import { FaX } from 'react-icons/fa6';

const Footer = ({ isAdmin = false }) => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    quickLinks: [
      { name: 'Home', path: '/' },
      { name: 'Member Registration', path: '/form' },
      { name: 'Events', path: '/events' },
      { name: 'Ministries', path: '/ministries' }
    ],
    support: [
      { name: 'Help Center', path: '/help' },
      { name: 'FAQ', path: '/help/faq' },
      { name: 'Contact Support', path: 'mailto:support@churchconnect.org' },
      { name: 'Feedback', path: '/feedback' }
    ],
    legal: [
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'Cookie Policy', path: '/cookies' }
    ],
    social: [
      { name: 'Facebook', path: 'https://web.facebook.com/dlcfknust', icon: <FaFacebook /> },
      { name: 'Instagram', path: 'https://instagram.com/churchconnect', icon: <FaInstagram /> },
      { name: 'YouTube', path: 'https://www.youtube.com/@dlcfknust', icon: <FaYoutube /> },
      { name: 'Twitter', path: 'https://x.com/DlcfKnust', icon: <FaX /> }
    ]
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <div className={styles.logoContainer}>
              <Link to="/" className={styles.footerLogo}>
                <img 
                  src={logoLight} 
                  alt="ChurchConnect" 
                  className={styles.footerLogoImg}
                  width="140"
                  height="35"
                />
              </Link>
            </div>
            <p className={styles.footerDescription}>
              Connecting our church family through technology and faith
            </p>
            <div className={styles.socialLinks}>
              {footerLinks.social.map((link) => (
                <a 
                  key={link.name}
                  href={link.path} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {!isAdmin && (
            <div className={styles.footerColumn}>
              <h3 className={styles.footerHeading}>Quick Links</h3>
              <ul className={styles.footerList}>
                {footerLinks.quickLinks.map((link) => (
                  <li key={link.name} className={styles.footerItem}>
                    <Link to={link.path} className={styles.footerLink}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.footerColumn}>
            <h3 className={styles.footerHeading}>Support</h3>
            <ul className={styles.footerList}>
              {footerLinks.support.map((link) => (
                <li key={link.name} className={styles.footerItem}>
                  {link.path.startsWith('mailto:') ? (
                    <a href={link.path} className={styles.footerLink}>
                      {link.name}
                    </a>
                  ) : (
                    <Link to={link.path} className={styles.footerLink}>
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h3 className={styles.footerHeading}>Legal</h3>
            <ul className={styles.footerList}>
              {footerLinks.legal.map((link) => (
                <li key={link.name} className={styles.footerItem}>
                  <Link to={link.path} className={styles.footerLink}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.footerCopyright}>
            &copy; {currentYear} ChurchConnect DBMS. All rights reserved.
          </div>
          <div className={styles.footerMeta}>
            <Link to="/sitemap" className={styles.footerMetaLink}>
              Sitemap
            </Link>
            <span className={styles.footerMetaSeparator}>•</span>
            <Link to="/accessibility" className={styles.footerMetaLink}>
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;