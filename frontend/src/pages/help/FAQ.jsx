import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/shared/SearchBar';
import styles from './Help.module.css';

const FAQ = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState([]);

  const faqData = [
    {
      category: 'general',
      title: 'General Questions',
      icon: '🏛️',
      color: 'blue',
      questions: [
        {
          id: 'general-1',
          question: 'What is ChurchConnect DBMS?',
          answer: 'ChurchConnect DBMS is a comprehensive church management system designed to help churches efficiently manage member information, track pledges, organize groups and ministries, and generate reports. It includes both a public registration form for members and an admin dashboard for church staff.'
        },
        {
          id: 'general-2',
          question: 'Who can use ChurchConnect?',
          answer: 'ChurchConnect is designed for church members, administrators, and leadership. Members can register and update their information through the public form, while church staff can access the admin dashboard to manage all church data and generate reports.'
        },
        {
          id: 'general-3',
          question: 'Is my personal information secure?',
          answer: 'Yes, we take data security very seriously. All personal information is encrypted and stored securely. We comply with data protection regulations and have implemented multiple layers of security to protect your information.'
        },
        {
          id: 'general-4',
          question: 'Can I access ChurchConnect on my mobile device?',
          answer: 'Absolutely! ChurchConnect is fully responsive and works on all devices including smartphones, tablets, and desktop computers. The interface automatically adapts to your screen size for the best experience.'
        }
      ]
    },
    {
      category: 'registration',
      title: 'Registration & Forms',
      icon: '📝',
      color: 'red',
      questions: [
        {
          id: 'reg-1',
          question: 'How do I register as a new member?',
          answer: 'To register as a new member, simply visit the registration form on our website. Fill out the required information including your name, contact details, and any ministry interests. The form will guide you through each step and should take about 5-10 minutes to complete.'
        },
        {
          id: 'reg-2',
          question: 'What information is required to register?',
          answer: 'Required information includes your full name, email address, phone number, date of birth, and gender. Optional information includes your address, ministry interests, pledge information, and family member details.'
        },
        {
          id: 'reg-3',
          question: 'Can I save my progress and complete the form later?',
          answer: 'Yes! The registration form has a "Save and Continue Later" feature. We\'ll send you a secure link via email that allows you to return and complete your registration at any time.'
        },
        {
          id: 'reg-4',
          question: 'How do I update my information after registering?',
          answer: 'You can update your information by contacting the church office directly or by filling out a new registration form with your updated details. Our admin team will merge the information with your existing record.'
        },
        {
          id: 'reg-5',
          question: 'What if I need help filling out the form?',
          answer: 'If you need assistance with the registration form, you can contact our church office during business hours. We also offer in-person assistance sessions and can help you complete the form over the phone if needed.'
        }
      ]
    },
    {
      category: 'technical',
      title: 'Technical Support',
      icon: '⚙️',
      color: 'blue',
      questions: [
        {
          id: 'tech-1',
          question: 'Which browsers are supported?',
          answer: 'ChurchConnect works best with modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.'
        },
        {
          id: 'tech-2',
          question: 'The form is not loading properly. What should I do?',
          answer: 'Try refreshing the page, clearing your browser cache, or trying a different browser. If the problem persists, please contact our support team with details about your device and browser version.'
        },
        {
          id: 'tech-3',
          question: 'Can I use ChurchConnect without an internet connection?',
          answer: 'ChurchConnect requires an internet connection to function. However, if you lose connection while filling out the form, your progress will be saved locally and restored when you reconnect.'
        },
        {
          id: 'tech-4',
          question: 'What accessibility features are available?',
          answer: 'ChurchConnect includes screen reader compatibility, keyboard navigation, adjustable text sizes, high contrast mode, and supports various assistive technologies. All forms are designed to meet accessibility standards.'
        }
      ]
    }
  ];

  // Add admin-specific FAQ if user is authenticated
  if (isAuthenticated && user?.role) {
    faqData.push(
      {
        category: 'admin',
        title: 'Admin & Management',
        icon: '👨‍💼',
        color: 'red',
        questions: [
          {
            id: 'admin-1',
            question: 'How do I log into the admin dashboard?',
            answer: 'Use the admin login page with your assigned username and password. If you forgot your password, use the "Forgot Password" link to reset it. Contact your system administrator if you need help with your account.'
          },
          {
            id: 'admin-2',
            question: 'How do I search for specific members?',
            answer: 'Use the search bar at the top of the members page. You can search by name, email, phone number, or other criteria. You can also use filters to narrow down results by ministry, age group, or registration date.'
          },
          {
            id: 'admin-3',
            question: 'How do I generate reports?',
            answer: 'Go to the Reports section in the admin dashboard. Choose from pre-built reports or create custom reports by selecting the data fields you need. Reports can be exported as PDF or CSV files.'
          },
          {
            id: 'admin-4',
            question: 'Can I send bulk emails to members?',
            answer: 'Yes, you can send bulk communications to members through the admin dashboard. Select the members you want to contact, choose email or SMS, and use our templates or create custom messages.'
          },
          {
            id: 'admin-5',
            question: 'How do I manage user permissions?',
            answer: 'User permissions are managed in the Settings section. Super administrators can create new admin accounts, assign roles (Super Admin, Admin, or Read-only), and modify permissions for existing users.'
          }
        ]
      }
    );
  }

  const filteredFAQ = faqData.filter(category => {
    if (selectedCategory !== 'all' && category.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return category.questions.some(q => 
        q.question.toLowerCase().includes(query) ||
        q.answer.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const toggleExpanded = (questionId) => {
    setExpandedItems(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  return (
    <div className={styles.helpPage}>
      {/* Hero Section (keep this the same) */}
      <div className={`${styles.helpHero} ${styles.faqHero}`}>
        <div className={styles.helpHeroContent}>
          <div className={styles.faqHeroIcon}>❓</div>
          <h1 className={styles.helpHeroTitle}>Frequently Asked Questions</h1>
          <p className={styles.helpHeroSubtitle}>Find quick answers to common questions about ChurchConnect</p>
        </div>
      </div>

      <div className={styles.helpContainer}>
        {/* Search and Filter Section (keep this the same) */}
        <div className={styles.faqControls}>          
          <div className={styles.categoryFilters}>
            <button
              className={`${styles['filter-btn']} ${selectedCategory === 'all' ? styles.active : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className={styles.filterIcon}>📋</span>
              All Categories
            </button>
            {faqData.map(category => (
              <button
                key={category.category}
                className={`${styles['filter-btn']} ${selectedCategory === category.category ? styles.active : ''} ${category.color}`}
                onClick={() => setSelectedCategory(category.category)}
              >
                <span className={styles.filterIcon}>{category.icon}</span>
                {category.title}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats (keep this the same) */}
        <div className={styles.faqStats}>
          <div className={`${styles['stat-card']} ${styles.blue}`}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{faqData.reduce((total, cat) => total + cat.questions.length, 0)}</span>
              <span className={styles.statLabel}>Total Questions</span>
            </div>
          </div>
          <div className={`${styles['stat-card']} ${styles.red}`}>
            <div className={styles.statIcon}>📂</div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{faqData.length}</span>
              <span className={styles.statLabel}>Categories</span>
            </div>
          </div>
          <div className={`${styles['stat-card']} ${styles.blue}`}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>95%</span>
              <span className={styles.statLabel}>Questions Resolved</span>
            </div>
          </div>
        </div>

        {/* FAQ Categories - UPDATED SECTION */}
        <div className={styles.faqCategories}>
          {filteredFAQ.map(category => (
            <div key={category.category} className={`${styles['faq-category-card']} ${styles[category.color]}`}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryTitle}>
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <h2>{category.title}</h2>
                </div>
                <div className={styles.categoryBadge}>
                  {category.questions.filter(q => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return q.question.toLowerCase().includes(query) ||
                           q.answer.toLowerCase().includes(query);
                  }).length} questions
                </div>
              </div>
              
              <div className={styles.faqQuestions}>
                {category.questions
                  .filter(q => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return q.question.toLowerCase().includes(query) ||
                           q.answer.toLowerCase().includes(query);
                  })
                  .map(question => (
                    <div key={question.id} className={styles.faqItem}>
                      <button 
                        className={styles.faqQuestion}
                        onClick={() => toggleExpanded(question.id)}
                        aria-expanded={expandedItems.includes(question.id)}
                      >
                        <div className={styles.questionContent}>
                          <h3>{question.question}</h3>
                        </div>
                      </button>
                      <div className={`${styles.faqAnswer} ${expandedItems.includes(question.id) ? styles.show : ''}`}>
                        <div className={styles.answerContent}>
                          <p>{question.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Help Contact (keep this the same) */}
        <div className={styles.faqContact}>
          <div className={styles.contactCard}>
            <div className={styles.contactIcon}>💬</div>
            <h3>Still need help?</h3>
            <p>If you couldn't find the answer you're looking for, don't hesitate to contact our support team.</p>
            <div className={styles.contactActions}>
              <Button 
                variant="primary" 
                onClick={() => window.location.href = '/help'}
                className={`${styles.contactBtn} ${styles.primary}`}
              >
                <span className={styles.btnIcon}>📞</span>
                Contact Support
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/help/tutorials'}
                className={`${styles.contactBtn} ${styles.secondary}`}
              >
                <span className={styles.btnIcon}>🎥</span>
                Watch Tutorials
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;