import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/shared/SearchBar';
import './Help.module.css';


const FAQ = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState([]);

  const faqData = [
    {
      category: 'general',
      title: 'General Questions',
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
    <div className="faq-page">
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <p>Find quick answers to common questions about ChurchConnect</p>
      </div>

      {/* Search and Filter */}
      <div className="faq-search-section">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search FAQ..."
        />
        
        <div className="category-filter">
          <Button
            variant={selectedCategory === 'all' ? 'primary' : 'outline'}
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </Button>
          {faqData.map(category => (
            <Button
              key={category.category}
              variant={selectedCategory === category.category ? 'primary' : 'outline'}
              onClick={() => setSelectedCategory(category.category)}
            >
              {category.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="faq-stats">
        <div className="stat-item">
          <span className="stat-number">{faqData.reduce((total, cat) => total + cat.questions.length, 0)}</span>
          <span className="stat-label">Total Questions</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{faqData.length}</span>
          <span className="stat-label">Categories</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">95%</span>
          <span className="stat-label">Questions Resolved</span>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="faq-categories">
        {filteredFAQ.map(category => (
          <Card key={category.category} className="faq-category">
            <div className="category-header">
              <h2>{category.title}</h2>
              <p>{category.questions.length} questions</p>
            </div>
            
            <div className="faq-questions">
              {category.questions
                .filter(q => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return q.question.toLowerCase().includes(query) ||
                         q.answer.toLowerCase().includes(query);
                })
                .map(question => (
                  <div key={question.id} className="faq-item">
                    <div 
                      className="faq-question"
                      onClick={() => toggleExpanded(question.id)}
                    >
                      <h3>{question.question}</h3>
                      <span className={`expand-icon ${expandedItems.includes(question.id) ? 'expanded' : ''}`}>
                        ▼
                      </span>
                    </div>
                    {expandedItems.includes(question.id) && (
                      <div className="faq-answer">
                        <p>{question.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Help Contact */}
      <div className="faq-contact">
        <Card className="contact-card">
          <h3>Still need help?</h3>
          <p>If you couldn't find the answer you're looking for, don't hesitate to contact our support team.</p>
          <div className="contact-options">
            <Button variant="primary" onClick={() => window.location.href = '/help'}>
              Contact Support
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/help/tutorials'}>
              Watch Tutorials
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;