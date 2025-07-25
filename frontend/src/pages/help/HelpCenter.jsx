import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/shared/SearchBar';
import PublicLayout from '../../components/layout/PublicLayout';
import AdminLayout from '../../components/layout/AdminLayout';
import { 
  BookOpen, 
  Users, 
  HelpCircle, 
  Video, 
  Mail, 
  Phone, 
  MessageCircle,
  FileText,
  Settings,
  UserPlus,
  TrendingUp,
  PieChart,
  Calendar,
  Star,
  Clock,
  ArrowRight,
  Search,
  ExternalLink
} from 'lucide-react';
import styles from './Help.module.css';

const HelpCenter = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: UserPlus,
      color: 'bg-blue-100 text-blue-600',
      description: 'New to ChurchConnect? Start here for basics and registration',
      articles: [
        {
          title: 'How to Register as a New Member',
          type: 'Tutorial',
          duration: '4 min',
          popularity: 'Most Popular'
        },
        {
          title: 'Understanding the Registration Form',
          type: 'Guide',
          duration: '3 min',
          popularity: 'Popular'
        },
        {
          title: 'Mobile Registration Tips',
          type: 'Tips',
          duration: '2 min',
          popularity: null
        }
      ]
    },
    {
      id: 'member-features',
      title: 'Member Features',
      icon: Users,
      color: 'bg-green-100 text-green-600',
      description: 'Learn about features available to church members',
      articles: [
        {
          title: 'Managing Your Profile Information',
          type: 'Guide',
          duration: '5 min',
          popularity: 'Popular'
        },
        {
          title: 'Joining Groups and Ministries',
          type: 'Tutorial',
          duration: '4 min',
          popularity: null
        },
        {
          title: 'Privacy Settings and Communication Preferences',
          type: 'Guide',
          duration: '3 min',
          popularity: null
        }
      ]
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      icon: HelpCircle,
      color: 'bg-purple-100 text-purple-600',
      description: 'Accessibility features and assistance options',
      articles: [
        {
          title: 'Screen Reader Compatibility',
          type: 'Guide',
          duration: '5 min',
          popularity: null
        },
        {
          title: 'Keyboard Navigation',
          type: 'Tutorial',
          duration: '3 min',
          popularity: null
        },
        {
          title: 'Display Settings and Customization',
          type: 'Guide',
          duration: '2 min',
          popularity: null
        }
      ]
    }
  ];

  const adminCategories = [
    {
      id: 'admin-dashboard',
      title: 'Admin Dashboard',
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600',
      description: 'Master the admin interface and management tools',
      articles: [
        {
          title: 'Dashboard Overview and Navigation',
          type: 'Tutorial',
          duration: '6 min',
          popularity: 'Most Popular'
        },
        {
          title: 'Understanding Key Statistics',
          type: 'Guide',
          duration: '4 min',
          popularity: 'Popular'
        },
        {
          title: 'Customizing Your Dashboard',
          type: 'Tips',
          duration: '3 min',
          popularity: null
        }
      ]
    },
    {
      id: 'member-management',
      title: 'Member Management',
      icon: Users,
      color: 'bg-red-100 text-red-600',
      description: 'Tools for managing member records and information',
      articles: [
        {
          title: 'Adding and Editing Member Records',
          type: 'Tutorial',
          duration: '8 min',
          popularity: 'Most Popular'
        },
        {
          title: 'Advanced Search and Filtering',
          type: 'Guide',
          duration: '6 min',
          popularity: 'Popular'
        },
        {
          title: 'Bulk Operations and Mass Updates',
          type: 'Advanced',
          duration: '7 min',
          popularity: null
        }
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: PieChart,
      color: 'bg-indigo-100 text-indigo-600',
      description: 'Generate reports and analyze church data',
      articles: [
        {
          title: 'Creating Custom Reports',
          type: 'Tutorial',
          duration: '10 min',
          popularity: 'Popular'
        },
        {
          title: 'Exporting Data to Excel/CSV',
          type: 'Guide',
          duration: '5 min',
          popularity: 'Popular'
        },
        {
          title: 'Scheduled Reports Setup',
          type: 'Advanced',
          duration: '8 min',
          popularity: null
        }
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step video guides',
      icon: Video,
      link: '/help/tutorials',
      color: 'bg-blue-500'
    },
    {
      title: 'FAQ',
      description: 'Find answers to common questions',
      icon: HelpCircle,
      link: '/help/faq',
      color: 'bg-green-500'
    },
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: MessageCircle,
      link: '/help/contact',
      color: 'bg-purple-500'
    },
    {
      title: 'System Status',
      description: 'Check current system status',
      icon: Settings,
      link: '/help/status',
      color: 'bg-orange-500'
    }
  ];

  const recentUpdates = [
    {
      title: 'New Mobile Registration Features',
      date: '2025-07-10',
      type: 'Feature Update',
      description: 'Enhanced mobile experience with improved touch controls and auto-save functionality.'
    },
    {
      title: 'Admin Dashboard Improvements',
      date: '2025-07-05',
      type: 'Enhancement',
      description: 'Updated dashboard with new charts and faster loading times.'
    },
    {
      title: 'Accessibility Enhancements',
      date: '2025-06-28',
      type: 'Accessibility',
      description: 'Improved screen reader support and keyboard navigation.'
    }
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search logic here
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const displayCategories = isAuthenticated ? 
    [...helpCategories, ...adminCategories] : 
    helpCategories;

  const filteredCategories = selectedCategory === 'all' 
    ? displayCategories 
    : displayCategories.filter(cat => cat.id === selectedCategory);

  const Layout = isAuthenticated ? AdminLayout : PublicLayout;

  return (
    <Layout>
      <div className={styles.helpPage}>
        {/* Hero Section */}
        <div className={styles.helpHero}>
          <div className={styles.helpHeroContent}>
            <h1 className={styles.helpHeroTitle}>How can we help you today?</h1>
            <p className={styles.helpHeroSubtitle}>Find answers, watch tutorials, and get support for ChurchConnect</p>
            <div className={styles.helpSearch}>
              <SearchBar 
                placeholder="Search help articles..."
                onSearch={handleSearch}
                value={searchQuery}
                className={styles.searchInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.helpContainer}>
          {/* Quick Actions */}
          <div className={styles.quickActions}>
            {quickActions.map((action, index) => (
              <Card key={index} className={styles.quickActionCard}>
                <Link to={action.link} className="block p-6 text-center">
                  <div className={styles.quickActionIcon}>
                    <action.icon size={24} />
                  </div>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </Link>
              </Card>
            ))}
          </div>

          {/* Category Filters */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Help Categories</h2>
            <p className={styles.sectionSubtitle}>Browse articles by category</p>
            <div className={styles.categoryFilters}>
              <Button 
                variant={selectedCategory === 'all' ? 'primary' : 'secondary'}
                onClick={() => handleCategoryFilter('all')}
                size="sm"
              >
                All Categories
              </Button>
              {displayCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'primary' : 'secondary'}
                  onClick={() => handleCategoryFilter(category.id)}
                  size="sm"
                >
                  {category.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Help Categories */}
          <div className={styles.helpCategories}>
            {filteredCategories.map((category) => (
              <Card key={category.id} className={styles.helpCategory}>
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={styles.categoryIcon}>
                      <category.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                      <p className="text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {category.articles.map((article, index) => (
                      <div key={index} className={styles.articleItem}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{article.title}</h4>
                            {article.popularity && (
                              <Badge variant="secondary" size="sm">
                                {article.popularity}
                              </Badge>
                            )}
                          </div>
                          <div className={styles.articleMeta}>
                            <span>
                              <FileText size={14} />
                              {article.type}
                            </span>
                            <span>
                              <Clock size={14} />
                              {article.duration}
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Recent Updates */}
          <div className={styles.recentUpdates}>
            <h2 className={styles.sectionTitle}>Recent Updates</h2>
            <div className="space-y-4">
              {recentUpdates.map((update, index) => (
                <Card key={index} className={styles.updateCard}>
                  <div className="flex items-start gap-4">
                    <div className={styles.updateIcon}>
                      <Star size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{update.title}</h3>
                        <Badge variant="secondary" size="sm">
                          {update.type}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{update.description}</p>
                      <p className={styles.updateDate}>
                        {new Date(update.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <div>
            <h2 className={styles.sectionTitle}>Need More Help?</h2>
            <Card className={styles.contactSupport}>
              <h3>Contact Support</h3>
              <div className="space-y-4">
                <div className={styles.contactMethod}>
                  <Mail size={20} className={styles.contactMethodIcon} />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600">support@churchconnect.com</p>
                  </div>
                </div>
                <div className={styles.contactMethod}>
                  <Phone size={20} className={styles.contactMethodIcon} />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className={styles.contactMethod}>
                  <MessageCircle size={20} className={styles.contactMethodIcon} />
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-sm text-gray-600">Available 9 AM - 5 PM</p>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6">
                <ExternalLink size={16} className="mr-2" />
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HelpCenter;