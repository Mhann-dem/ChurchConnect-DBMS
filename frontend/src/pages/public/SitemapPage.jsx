import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PublicPages.module.css';

const SitemapPage = () => {
  const sitemapSections = [
    {
      title: "Main Pages",
      icon: "🏠",
      links: [
        { path: "/", label: "Home", description: "Welcome to Deeper Life Christian Church" },
        { path: "/registration", label: "Member Registration", description: "Join our church family" },
        { path: "/events", label: "Events", description: "Upcoming church events and activities" },
        { path: "/thank-you", label: "Thank You", description: "Registration confirmation" }
      ]
    },
    {
      title: "Church Activities",
      icon: "⛪",
      links: [
        { path: "/activities/sunday-service", label: "Sunday Service", description: "Weekly worship service" },
        { path: "/activities/bible-study", label: "Bible Study", description: "Midweek Bible study sessions" },
        { path: "/activities/prayer-meeting", label: "Prayer Meeting", description: "Community prayer gatherings" },
        { path: "/activities/youth-fellowship", label: "Youth Fellowship", description: "Activities for young people" },
        { path: "/activities/womens-ministry", label: "Women's Ministry", description: "Women's fellowship and activities" },
        { path: "/activities/mens-ministry", label: "Men's Ministry", description: "Men's fellowship and activities" }
      ]
    },
    {
      title: "Administration",
      icon: "⚙️",
      links: [
        { path: "/admin", label: "Admin Dashboard", description: "Administrative access (login required)" },
        { path: "/admin/members", label: "Member Management", description: "Manage church members" },
        { path: "/admin/groups", label: "Group Management", description: "Manage church groups" },
        { path: "/admin/reports", label: "Reports", description: "Generate church reports" }
      ]
    },
    {
      title: "Resources & Support",
      icon: "📚",
      links: [
        { path: "/help", label: "Help Center", description: "Get help and support" },
        { path: "/feedback", label: "Feedback", description: "Share your thoughts with us" },
        { path: "/help/faq", label: "FAQ", description: "Frequently asked questions" },
        { path: "/help/tutorials", label: "Tutorials", description: "How-to guides" }
      ]
    },
    {
      title: "Legal & Policies",
      icon: "📋",
      links: [
        { path: "/terms", label: "Terms of Service", description: "Terms and conditions" },
        { path: "/privacy", label: "Privacy Policy", description: "How we protect your privacy" },
        { path: "/cookies", label: "Cookie Policy", description: "Our use of cookies" },
        { path: "/accessibility", label: "Accessibility", description: "Accessibility commitment and features" }
      ]
    }
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
                <span className={styles.breadcrumbCurrent}>Sitemap</span>
              </div>
              
              <h1 className={styles.pageTitle}>Site Map</h1>
              <p className={styles.pageSubtitle}>
                Find all the pages and resources available on our website
              </p>
            </div>

            <div className={styles.sitemapGrid}>
              {sitemapSections.map((section, index) => (
                <div key={index} className={styles.sitemapSection}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionIcon} role="img" aria-label={section.title}>
                      {section.icon}
                    </span>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                  </div>
                  
                  <ul className={styles.sitemapList}>
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex} className={styles.sitemapItem}>
                        <Link to={link.path} className={styles.sitemapLink}>
                          <div className={styles.linkContent}>
                            <h3 className={styles.linkTitle}>{link.label}</h3>
                            <p className={styles.linkDescription}>{link.description}</p>
                          </div>
                          <span className={styles.linkArrow}>→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className={styles.sitemapFooter}>
              <div className={styles.footerCard}>
                <h3>Need Help Finding Something?</h3>
                <p>
                  If you can't find what you're looking for, please don't hesitate to 
                  <Link to="/feedback" className={styles.inlineLink}> contact us</Link> 
                  or visit our <Link to="/help" className={styles.inlineLink}>Help Center</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitemapPage;