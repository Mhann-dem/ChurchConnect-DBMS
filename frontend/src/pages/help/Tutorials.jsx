import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PlayIcon, BookOpenIcon, UserIcon, CogIcon } from 'lucide-react';
import styles from './Help.module.css';

const Tutorials = () => {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedTutorial, setExpandedTutorial] = useState(null);

  const tutorialCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpenIcon,
      tutorials: [
        {
          id: 'member-registration',
          title: 'How to Register as a Member',
          duration: '3 min',
          level: 'Beginner',
          description: 'Learn how to complete the member registration form step by step.',
          steps: [
            {
              step: 1,
              title: 'Access the Registration Form',
              content: 'Visit the church website and click on "Member Registration" or go directly to /form',
              tip: 'The form is mobile-friendly and works on all devices'
            },
            {
              step: 2,
              title: 'Fill Personal Information',
              content: 'Enter your full name, email, phone number, and date of birth. All required fields are marked with an asterisk (*)',
              tip: 'Use your preferred name if different from your legal name'
            },
            {
              step: 3,
              title: 'Contact and Address Details',
              content: 'Provide your current address and preferred contact method (email, phone, or SMS)',
              tip: 'You can update this information later through the admin staff'
            },
            {
              step: 4,
              title: 'Ministry Interests',
              content: 'Select the ministries or groups you\'re interested in joining. You can select multiple options.',
              tip: 'Don\'t worry if you\'re unsure - you can change these later'
            },
            {
              step: 5,
              title: 'Pledge Information (Optional)',
              content: 'If you wish to make a financial commitment, enter your pledge amount and frequency',
              tip: 'This section is completely optional and confidential'
            },
            {
              step: 6,
              title: 'Review and Submit',
              content: 'Review all your information, accept the privacy policy, and submit your registration',
              tip: 'You\'ll receive a confirmation email with your submitted information'
            }
          ]
        },
        {
          id: 'form-accessibility',
          title: 'Accessibility Features',
          duration: '2 min',
          level: 'Beginner',
          description: 'Learn about the accessibility features available in the registration form.',
          steps: [
            {
              step: 1,
              title: 'Text Size Adjustment',
              content: 'Use your browser\'s zoom function (Ctrl/Cmd + +/-) to increase text size',
              tip: 'The form adapts to different text sizes automatically'
            },
            {
              step: 2,
              title: 'Keyboard Navigation',
              content: 'Use Tab to move between fields, Enter to submit, and Space to select checkboxes',
              tip: 'All interactive elements are keyboard accessible'
            },
            {
              step: 3,
              title: 'Screen Reader Support',
              content: 'The form includes proper labels and descriptions for screen readers',
              tip: 'Error messages are announced automatically'
            },
            {
              step: 4,
              title: 'High Contrast Mode',
              content: 'Enable high contrast mode in your device settings for better visibility',
              tip: 'The form colors adapt to your system preferences'
            }
          ]
        }
      ]
    },
    {
      id: 'admin-basics',
      title: 'Admin Basics',
      icon: UserIcon,
      tutorials: [
        {
          id: 'admin-login',
          title: 'Admin Login and Dashboard',
          duration: '4 min',
          level: 'Beginner',
          description: 'Learn how to access the admin dashboard and navigate the interface.',
          steps: [
            {
              step: 1,
              title: 'Accessing the Admin Panel',
              content: 'Go to /admin/login and enter your credentials provided by the church administrator',
              tip: 'Contact your church IT support if you forget your password'
            },
            {
              step: 2,
              title: 'Dashboard Overview',
              content: 'The dashboard shows member statistics, recent registrations, and quick actions',
              tip: 'You can customize dashboard widgets based on your role'
            },
            {
              step: 3,
              title: 'Navigation Menu',
              content: 'Use the left sidebar to navigate between Members, Groups, Pledges, and Reports',
              tip: 'The menu collapses on mobile devices to save space'
            },
            {
              step: 4,
              title: 'User Profile and Settings',
              content: 'Click on your profile picture to access account settings and preferences',
              tip: 'You can set up email notifications and customize your dashboard'
            }
          ]
        },
        {
          id: 'member-management',
          title: 'Managing Member Records',
          duration: '6 min',
          level: 'Intermediate',
          description: 'Learn how to view, edit, and manage member information effectively.',
          steps: [
            {
              step: 1,
              title: 'Viewing Member List',
              content: 'Go to Members section to see all registered members with pagination',
              tip: 'Use the search bar to quickly find specific members'
            },
            {
              step: 2,
              title: 'Member Details',
              content: 'Click on any member to view their complete profile and history',
              tip: 'The detail view shows registration date, ministry involvement, and contact history'
            },
            {
              step: 3,
              title: 'Editing Member Information',
              content: 'Click "Edit" to modify member details. All changes are tracked with timestamps',
              tip: 'Always verify information with the member before making changes'
            },
            {
              step: 4,
              title: 'Adding Notes',
              content: 'Use the notes section to record important information about member interactions',
              tip: 'Notes are private and only visible to admin users'
            },
            {
              step: 5,
              title: 'Family Relationships',
              content: 'Link family members together using the family grouping feature',
              tip: 'This helps with communication and event planning'
            }
          ]
        },
        {
          id: 'search-filter',
          title: 'Advanced Search and Filtering',
          duration: '5 min',
          level: 'Intermediate',
          description: 'Master the search and filtering capabilities to find members quickly.',
          steps: [
            {
              step: 1,
              title: 'Basic Search',
              content: 'Use the search bar to find members by name, email, or phone number',
              tip: 'Search is case-insensitive and supports partial matches'
            },
            {
              step: 2,
              title: 'Filter by Ministry',
              content: 'Use the ministry filter to see members interested in specific groups',
              tip: 'You can select multiple ministries at once'
            },
            {
              step: 3,
              title: 'Age and Date Filters',
              content: 'Filter members by age groups or registration date ranges',
              tip: 'Useful for planning age-appropriate events'
            },
            {
              step: 4,
              title: 'Pledge Status Filtering',
              content: 'Filter members by their pledge status (active, no pledge, etc.)',
              tip: 'Helpful for financial planning and stewardship'
            },
            {
              step: 5,
              title: 'Saving Searches',
              content: 'Save frequently used search combinations for quick access',
              tip: 'Saved searches appear in your dashboard for easy access'
            }
          ]
        }
      ]
    },
    {
      id: 'advanced-features',
      title: 'Advanced Features',
      icon: CogIcon,
      tutorials: [
        {
          id: 'bulk-operations',
          title: 'Bulk Operations',
          duration: '4 min',
          level: 'Advanced',
          description: 'Learn how to perform actions on multiple members at once.',
          steps: [
            {
              step: 1,
              title: 'Selecting Multiple Members',
              content: 'Use checkboxes to select members, or "Select All" for all visible members',
              tip: 'Selected members remain selected when you navigate between pages'
            },
            {
              step: 2,
              title: 'Bulk Communication',
              content: 'Send emails or SMS to selected members using templates',
              tip: 'Always preview messages before sending to avoid errors'
            },
            {
              step: 3,
              title: 'Bulk Tagging',
              content: 'Add tags to multiple members simultaneously for better organization',
              tip: 'Tags help with event planning and targeted communication'
            },
            {
              step: 4,
              title: 'Bulk Export',
              content: 'Export selected member data to CSV or PDF formats',
              tip: 'Choose only the fields you need to protect privacy'
            }
          ]
        },
        {
          id: 'reports-analytics',
          title: 'Reports and Analytics',
          duration: '7 min',
          level: 'Advanced',
          description: 'Generate comprehensive reports and understand membership analytics.',
          steps: [
            {
              step: 1,
              title: 'Dashboard Analytics',
              content: 'Review growth charts, age distribution, and ministry participation on the dashboard',
              tip: 'Charts are interactive - click on segments for detailed breakdowns'
            },
            {
              step: 2,
              title: 'Membership Reports',
              content: 'Generate detailed membership reports with customizable fields',
              tip: 'Include only necessary information to respect member privacy'
            },
            {
              step: 3,
              title: 'Financial Reports',
              content: 'View pledge summaries, giving patterns, and financial commitments',
              tip: 'Financial data is sensitive - ensure proper authorization'
            },
            {
              step: 4,
              title: 'Ministry Reports',
              content: 'Track ministry participation and engagement levels',
              tip: 'Use this data to plan ministry events and resource allocation'
            },
            {
              step: 5,
              title: 'Scheduled Reports',
              content: 'Set up automatic report generation and email delivery',
              tip: 'Regular reports help leadership stay informed about church growth'
            }
          ]
        },
        {
          id: 'system-administration',
          title: 'System Administration',
          duration: '8 min',
          level: 'Advanced',
          description: 'Manage system settings, users, and configurations.',
          steps: [
            {
              step: 1,
              title: 'User Management',
              content: 'Create and manage admin user accounts with appropriate permissions',
              tip: 'Follow the principle of least privilege - give users only necessary access'
            },
            {
              step: 2,
              title: 'System Settings',
              content: 'Configure church information, contact details, and system preferences',
              tip: 'Changes to system settings affect all users'
            },
            {
              step: 3,
              title: 'Data Backup',
              content: 'Understand the backup schedule and how to request data exports',
              tip: 'Regular backups ensure data safety and compliance'
            },
            {
              step: 4,
              title: 'Security Settings',
              content: 'Configure password policies, session timeouts, and access controls',
              tip: 'Strong security settings protect member data and privacy'
            },
            {
              step: 5,
              title: 'Troubleshooting',
              content: 'Learn common troubleshooting steps and when to contact support',
              tip: 'Keep a log of any issues encountered for better support'
            }
          ]
        }
      ]
    }
  ];

  const toggleTutorial = (tutorialId) => {
    setExpandedTutorial(expandedTutorial === tutorialId ? null : tutorialId);
  };

  const currentCategory = tutorialCategories.find(cat => cat.id === activeCategory);

  return (
    <div className={styles.tutorialsContainer}>
      <div className={styles.tutorialsHeader}>
        <h1>Video Tutorials & Step-by-Step Guides</h1>
        <p>Learn how to use ChurchConnect DBMS effectively with our comprehensive tutorials.</p>
      </div>

      <div className={styles.tutorialsContent}>
        {/* Category Navigation */}
        <div className={styles.categoryNav}>
          <h3>Tutorial Categories</h3>
          <ul>
            {tutorialCategories.map(category => {
              const IconComponent = category.icon;
              return (
                <li key={category.id}>
                  <button
                    className={`${styles.categoryButton} ${activeCategory === category.id ? styles.active : ''}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <IconComponent size={20} />
                    <span>{category.title}</span>
                    <span className={styles.tutorialCount}>
                      {category.tutorials.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Tutorials List */}
        <div className={styles.tutorialsList}>
          <div className={styles.categoryHeader}>
            <h2>{currentCategory?.title}</h2>
            <p>{currentCategory?.tutorials.length} tutorials available</p>
          </div>

          <div className={styles.tutorials}>
            {currentCategory?.tutorials.map(tutorial => (
              <div key={tutorial.id} className={styles.tutorialCard}>
                <div className={styles.tutorialHeader}>
                  <div className={styles.tutorialInfo}>
                    <h3>{tutorial.title}</h3>
                    <div className={styles.tutorialMeta}>
                      <span className={styles.duration}>
                        <PlayIcon size={16} />
                        {tutorial.duration}
                      </span>
                      <span className={`${styles.level} ${styles[tutorial.level.toLowerCase()]}`}>
                        {tutorial.level}
                      </span>
                    </div>
                    <p className={styles.description}>{tutorial.description}</p>
                  </div>
                  <button
                    className={styles.expandButton}
                    onClick={() => toggleTutorial(tutorial.id)}
                    aria-expanded={expandedTutorial === tutorial.id}
                  >
                    {expandedTutorial === tutorial.id ? 
                      <ChevronDownIcon size={20} /> : 
                      <ChevronRightIcon size={20} />
                    }
                  </button>
                </div>

                {expandedTutorial === tutorial.id && (
                  <div className={styles.tutorialSteps}>
                    <div className={styles.stepsHeader}>
                      <h4>Step-by-Step Guide</h4>
                      <p>Follow these steps to complete the tutorial:</p>
                    </div>
                    
                    <div className={styles.steps}>
                      {tutorial.steps.map(step => (
                        <div key={step.step} className={styles.step}>
                          <div className={styles.stepNumber}>{step.step}</div>
                          <div className={styles.stepContent}>
                            <h5>{step.title}</h5>
                            <p>{step.content}</p>
                            {step.tip && (
                              <div className={styles.stepTip}>
                                <strong>💡 Tip:</strong> {step.tip}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.tutorialActions}>
                      <button className={styles.primaryButton}>
                        <PlayIcon size={16} />
                        Start Tutorial
                      </button>
                      <button className={styles.secondaryButton}>
                        Download Guide
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className={styles.additionalResources}>
        <h3>Additional Resources</h3>
        <div className={styles.resourceGrid}>
          <div className={styles.resourceCard}>
            <h4>Quick Reference Cards</h4>
            <p>Download printable reference cards for common tasks</p>
            <button className={styles.resourceButton}>Download PDF</button>
          </div>
          <div className={styles.resourceCard}>
            <h4>Video Library</h4>
            <p>Access our complete video tutorial library</p>
            <button className={styles.resourceButton}>View Videos</button>
          </div>
          <div className={styles.resourceCard}>
            <h4>Training Schedule</h4>
            <p>Join our live training sessions for hands-on learning</p>
            <button className={styles.resourceButton}>View Schedule</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorials;