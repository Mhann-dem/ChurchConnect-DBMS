import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  DocumentChartBarIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
  BellIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  HeartIcon,
  BuildingLibraryIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon,
  StarIcon,
  Cog6ToothIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import styles from './AdminPages.module.css';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [hoveredStat, setHoveredStat] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Mock user data
  const user = {
    first_name: 'John',
    last_name: 'Admin',
    role: 'Administrator',
    avatar: 'JA'
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Mock dashboard data with enhanced metrics
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          setDashboardData({
            stats: {
              totalMembers: 1248,
              activeGroups: 23,
              monthlyPledges: 45600,
              recentRegistrations: 12,
              weeklyAttendance: 892,
              activeEvents: 8,
              totalDonations: 128340,
              monthlyGrowth: 15,
              memberSatisfaction: 96,
              volunteersActive: 156
            },
            trends: {
              members: { value: 12, type: 'positive' },
              pledges: { value: 8, type: 'positive' },
              attendance: { value: 3, type: 'negative' },
              groups: { value: 15, type: 'positive' }
            },
            recentMembers: [
              { 
                id: 1, 
                name: 'Sarah Johnson', 
                joinDate: '2024-01-15', 
                status: 'active', 
                avatar: 'SJ',
                email: 'sarah.j@email.com',
                phone: '+233 123 456 789',
                ministry: 'Worship Team'
              },
              { 
                id: 2, 
                name: 'Michael Brown', 
                joinDate: '2024-01-14', 
                status: 'pending', 
                avatar: 'MB',
                email: 'michael.b@email.com',
                phone: '+233 987 654 321',
                ministry: 'Youth Ministry'
              },
              { 
                id: 3, 
                name: 'Emily Davis', 
                joinDate: '2024-01-13', 
                status: 'active', 
                avatar: 'ED',
                email: 'emily.d@email.com',
                phone: '+233 555 123 456',
                ministry: 'Children\'s Ministry'
              },
              { 
                id: 4, 
                name: 'David Wilson', 
                joinDate: '2024-01-12', 
                status: 'active', 
                avatar: 'DW',
                email: 'david.w@email.com',
                phone: '+233 777 888 999',
                ministry: 'Prayer Ministry'
              },
              { 
                id: 5, 
                name: 'Grace Miller', 
                joinDate: '2024-01-11', 
                status: 'pending', 
                avatar: 'GM',
                email: 'grace.m@email.com',
                phone: '+233 444 555 666',
                ministry: 'Outreach Team'
              },
            ],
            upcomingEvents: [
              { 
                id: 1, 
                title: 'Sunday Worship Service', 
                date: '2024-01-21', 
                time: '10:00 AM', 
                attendees: 450,
                location: 'Main Sanctuary',
                type: 'worship',
                priority: 'high'
              },
              { 
                id: 2, 
                title: 'Midweek Bible Study', 
                date: '2024-01-23', 
                time: '7:00 PM', 
                attendees: 85,
                location: 'Fellowship Hall',
                type: 'study',
                priority: 'medium'
              },
              { 
                id: 3, 
                title: 'Youth Connect Night', 
                date: '2024-01-25', 
                time: '6:00 PM', 
                attendees: 32,
                location: 'Youth Center',
                type: 'ministry',
                priority: 'medium'
              },
              { 
                id: 4, 
                title: 'Prayer & Fasting', 
                date: '2024-01-26', 
                time: '7:30 PM', 
                attendees: 67,
                location: 'Prayer Chapel',
                type: 'prayer',
                priority: 'high'
              },
            ],
            notifications: [
              { 
                id: 1, 
                title: 'New Member Alert', 
                message: 'Sarah Johnson completed registration and needs approval', 
                time: '2 hours ago', 
                type: 'member',
                priority: 'high',
                action: 'Approve'
              },
              { 
                id: 2, 
                title: 'Pledge Milestone', 
                message: '$500 monthly commitment received from the Thompson family', 
                time: '4 hours ago', 
                type: 'pledge',
                priority: 'medium',
                action: 'View'
              },
              { 
                id: 3, 
                title: 'Event Reminder', 
                message: 'Bible Study tonight - 85 members confirmed attendance', 
                time: '6 hours ago', 
                type: 'event',
                priority: 'low',
                action: 'Details'
              },
              { 
                id: 4, 
                title: 'System Update', 
                message: 'Database backup completed successfully - all data secure', 
                time: '8 hours ago', 
                type: 'system',
                priority: 'low',
                action: 'View Log'
              },
            ],
            achievements: [
              {
                title: '1000+ Members',
                description: 'Reached milestone of 1000+ active members',
                icon: TrophyIcon,
                color: 'from-yellow-400 to-orange-500',
                achieved: true
              },
              {
                title: '100% Attendance',
                description: 'Perfect attendance at last Sunday service',
                icon: FireIcon,
                color: 'from-red-400 to-pink-500',
                achieved: true
              },
              {
                title: '50 New Groups',
                description: 'Growing towards 50 active ministry groups',
                icon: SparklesIcon,
                color: 'from-purple-400 to-indigo-500',
                achieved: false,
                progress: 76
              }
            ]
          });
          setLoading(false);
        }, 1500);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Reusable Card Component
  const Card = ({ children, className = '', hover = true, ...props }) => (
    <div 
      className={`${styles.cardBase} ${hover ? styles.cardHover : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );

  // Reusable Button Component
  const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    to, 
    onClick, 
    className = '', 
    icon: Icon,
    iconPosition = 'left',
    ...props 
  }) => {
    const baseClasses = `${styles.buttonBase} ${styles[`button-${variant}`]} ${styles[`button-${size}`]} ${className}`;
    
    const content = (
      <>
        {Icon && iconPosition === 'left' && <Icon className={styles.buttonIcon} />}
        <span>{children}</span>
        {Icon && iconPosition === 'right' && <Icon className={styles.buttonIcon} />}
      </>
    );

    if (to) {
      return (
        <Link to={to} className={baseClasses} {...props}>
          {content}
        </Link>
      );
    }

    return (
      <button className={baseClasses} onClick={onClick} {...props}>
        {content}
      </button>
    );
  };

  // Reusable Badge Component
  const Badge = ({ children, variant = 'default', className = '' }) => (
    <span className={`${styles.badgeBase} ${styles[`badge-${variant}`]} ${className}`}>
      {children}
    </span>
  );

  // Reusable Avatar Component
  const Avatar = ({ name, size = 'md', status, className = '' }) => (
    <div className={`${styles.avatarBase} ${styles[`avatar-${size}`]} ${className}`}>
      <span className={styles.avatarText}>{name}</span>
      {status && <div className={`${styles.avatarStatus} ${styles[`status-${status}`]}`}></div>}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingLogo}>
            <div className={styles.logoSpinner}>
              <span className={styles.logoText}>CC</span>
            </div>
            <div className={styles.loadingRings}>
              <div className={`${styles.ring} ${styles.ring1}`}></div>
              <div className={`${styles.ring} ${styles.ring2}`}></div>
              <div className={`${styles.ring} ${styles.ring3}`}></div>
            </div>
          </div>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
          <div className={styles.loadingText}>
            <h1>Loading Dashboard</h1>
            <p>Gathering your church community data...</p>
          </div>
          <div className={styles.loadingDots}>
            <div className={`${styles.dot} ${styles.dot1}`}></div>
            <div className={`${styles.dot} ${styles.dot2}`}></div>
            <div className={`${styles.dot} ${styles.dot3}`}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <Card className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl animate-pulse">
            <ExclamationTriangleIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-red-900 mb-4">Something went wrong</h2>
            <p className="text-red-700 mb-6 text-lg">{error}</p>
            <Button 
              variant="danger"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Members',
      value: dashboardData?.stats?.totalMembers?.toLocaleString() || 0,
      icon: UsersIcon,
      change: dashboardData?.trends?.members?.value || 0,
      changeType: dashboardData?.trends?.members?.type || 'neutral',
      description: 'Active members',
      color: 'from-blue-500 to-cyan-500',
      bgPattern: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      route: '/admin/members'
    },
    {
      name: 'Active Groups',
      value: dashboardData?.stats?.activeGroups || 0,
      icon: UserGroupIcon,
      change: 3,
      changeType: 'positive',
      description: 'Ministry groups',
      color: 'from-emerald-500 to-green-500',
      bgPattern: 'bg-emerald-50',
      iconBg: 'bg-emerald-500',
      route: '/admin/groups'
    },
    {
      name: 'Monthly Pledges',
      value: `$${dashboardData?.stats?.monthlyPledges?.toLocaleString() || 0}`,
      icon: CurrencyDollarIcon,
      change: dashboardData?.trends?.pledges?.value || 0,
      changeType: dashboardData?.trends?.pledges?.type || 'neutral',
      description: 'This month',
      color: 'from-yellow-500 to-orange-500',
      bgPattern: 'bg-yellow-50',
      iconBg: 'bg-yellow-500',
      route: '/admin/pledges'
    },
    {
      name: 'Weekly Attendance',
      value: dashboardData?.stats?.weeklyAttendance?.toLocaleString() || 0,
      icon: ChartBarIcon,
      change: dashboardData?.trends?.attendance?.value || 0,
      changeType: dashboardData?.trends?.attendance?.type || 'neutral',
      description: 'This week',
      color: 'from-purple-500 to-indigo-500',
      bgPattern: 'bg-purple-50',
      iconBg: 'bg-purple-500',
      route: '/admin/reports'
    }
  ];

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getEventTypeStyles = (type, priority) => {
    const typeStyles = {
      worship: 'blue',
      study: 'emerald',
      ministry: 'purple',
      prayer: 'orange'
    };
    return typeStyles[type] || 'gray';
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'member': return UsersIcon;
      case 'pledge': return CurrencyDollarIcon;
      case 'event': return CalendarDaysIcon;
      case 'system': return ChartBarIcon;
      default: return BellIcon;
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        
        {/* Enhanced Welcome Header */}
        <Card className={styles.welcomeCard} hover={false}>
          <div className="relative p-8 text-white overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar name={user.first_name.charAt(0) + user.last_name.charAt(0)} size="lg" status="online" />
                  <div>
                    <h1 className={styles.welcomeTitle}>
                      Welcome back, {user?.first_name}!
                    </h1>
                    <p className={styles.welcomeSubtitle}>
                      Your church community is thriving today ✨
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <Badge variant="light" className="flex items-center space-x-2">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{formatDate(currentTime)}</span>
                  </Badge>
                  <Badge variant="light" className="flex items-center space-x-2">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatTime(currentTime)}</span>
                  </Badge>
                  <Badge variant="success" className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span>All Systems Online</span>
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="secondary"
                  to="/admin/members/new"
                  icon={PlusIcon}
                >
                  Add Member
                </Button>
                <Button 
                  variant="primary"
                  to="/admin/reports"
                  icon={DocumentChartBarIcon}
                >
                  Reports
                </Button>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className={styles.welcomeDecoration}></div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.name} 
                className={`${styles.statCard} group`}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                }}
                onMouseEnter={() => setHoveredStat(stat.name)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${styles.iconContainer} ${stat.iconBg}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      to={stat.route}
                      icon={EyeIcon}
                      iconPosition="right"
                      title={`View ${stat.name}`}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {stat.name}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-300">
                      {stat.value}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={stat.changeType === 'positive' ? 'success' : stat.changeType === 'negative' ? 'danger' : 'secondary'}
                        className="flex items-center space-x-1"
                      >
                        {stat.changeType === 'positive' ? (
                          <ArrowUpIcon className="w-3 h-3" />
                        ) : stat.changeType === 'negative' ? (
                          <ArrowDownIcon className="w-3 h-3" />
                        ) : null}
                        <span>{stat.changeType !== 'neutral' ? `${Math.abs(stat.change)}%` : '—'}</span>
                      </Badge>
                      <span className="text-xs text-gray-500 font-medium">{stat.description}</span>
                    </div>
                  </div>
                </div>
                
                {/* Hover indicator */}
                {hoveredStat === stat.name && (
                  <div className={styles.hoverIndicator}></div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Achievements Section */}
        <Card className={styles.achievementsCard} hover={false}>
          <div className={styles.sectionHeader}>
            <div className="flex items-center space-x-3">
              <div className={`${styles.iconContainer} bg-gradient-to-r from-amber-500 to-orange-500`}>
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className={styles.sectionTitle}>Church Achievements</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dashboardData?.achievements?.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <Card 
                    key={achievement.title}
                    className={`${styles.achievementCard} ${achievement.achieved ? styles.achievementCompleted : ''}`}
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`${styles.iconContainer} bg-gradient-to-r ${achievement.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{achievement.title}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                      {achievement.achieved && (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    
                    {!achievement.achieved && achievement.progress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">{achievement.progress}%</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill}
                            style={{ width: `${achievement.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className={styles.contentGrid}>
          
          {/* Recent Members Card */}
          <Card className={styles.membersCard}>
            <div className={styles.sectionHeader}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${styles.iconContainer} bg-gradient-to-r from-blue-500 to-indigo-500`}>
                    <UsersIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className={styles.sectionTitle}>Recent Members</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  to="/admin/members"
                  icon={ArrowTopRightOnSquareIcon}
                  iconPosition="right"
                >
                  View all
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.recentMembers?.slice(0, 4).map((member, index) => (
                  <Card 
                    key={member.id} 
                    className={`${styles.memberItem} group`}
                  >
                    <div className="flex items-center space-x-4 p-4">
                      <Avatar 
                        name={member.avatar}
                        status={member.status === 'active' ? 'active' : 'pending'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                          <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                            {member.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <CalendarDaysIcon className="w-3 h-3" />
                              <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-600">
                            <span className="font-medium">{member.ministry}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        to={`/admin/members/${member.id}`}
                        icon={EyeIcon}
                        className="opacity-0 group-hover:opacity-100"
                      />
                    </div>
                  </Card>
                ))}
              </div>
              
              {dashboardData?.recentMembers?.length > 4 && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <Button 
                    variant="ghost"
                    to="/admin/events/new"
                    icon={PlusIcon}
                  >
                    Create New Event
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Notifications Card */}
          <Card className={styles.notificationsCard}>
            <div className={styles.sectionHeader}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${styles.iconContainer} bg-gradient-to-r from-purple-500 to-pink-500`}>
                    <BellIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className={styles.sectionTitle}>Notifications</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  to="/admin/notifications"
                  icon={ArrowTopRightOnSquareIcon}
                  iconPosition="right"
                >
                  View all
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.notifications?.slice(0, 5).map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <Card 
                      key={notification.id} 
                      className={`${styles.notificationItem} border-l-4 ${getPriorityStyles(notification.priority)}`}
                    >
                      <div className="flex items-start space-x-3 p-4">
                        <div className="flex-shrink-0">
                          <div className={`${styles.iconContainer} bg-white shadow-sm border border-gray-100`}>
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <Button
                            variant="ghost"
                            size="xs"
                          >
                            {notification.action}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <Button
                  variant="ghost"
                  icon={BellIcon}
                >
                  Mark all as read
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className={styles.quickActionsCard} hover={false}>
          <div className={styles.sectionHeader}>
            <div className="flex items-center space-x-3">
              <div className={`${styles.iconContainer} bg-gradient-to-r from-amber-500 to-orange-500`}>
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className={styles.sectionTitle}>Quick Actions</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={`${styles.quickActionItem} group`}>
                <Link
                  to="/admin/members/new"
                  className="flex flex-col items-center justify-center p-5 text-center"
                >
                  <div className={`${styles.iconContainer} bg-blue-100 group-hover:bg-blue-200 mb-3`}>
                    <UsersIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Add Member</span>
                  <span className="text-xs text-gray-500 mt-1">New registration</span>
                </Link>
              </Card>
              
              <Card className={`${styles.quickActionItem} group`}>
                <Link
                  to="/admin/events/new"
                  className="flex flex-col items-center justify-center p-5 text-center"
                >
                  <div className={`${styles.iconContainer} bg-emerald-100 group-hover:bg-emerald-200 mb-3`}>
                    <CalendarDaysIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Create Event</span>
                  <span className="text-xs text-gray-500 mt-1">Schedule activity</span>
                </Link>
              </Card>
              
              <Card className={`${styles.quickActionItem} group`}>
                <Link
                  to="/admin/donations"
                  className="flex flex-col items-center justify-center p-5 text-center"
                >
                  <div className={`${styles.iconContainer} bg-amber-100 group-hover:bg-amber-200 mb-3`}>
                    <CurrencyDollarIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Record Donation</span>
                  <span className="text-xs text-gray-500 mt-1">Financial contribution</span>
                </Link>
              </Card>
              
              <Card className={`${styles.quickActionItem} group`}>
                <Link
                  to="/admin/reports"
                  className="flex flex-col items-center justify-center p-5 text-center"
                >
                  <div className={`${styles.iconContainer} bg-purple-100 group-hover:bg-purple-200 mb-3`}>
                    <DocumentChartBarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Generate Report</span>
                  <span className="text-xs text-gray-500 mt-1">Analytics & insights</span>
                </Link>
              </Card>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className={styles.footer}>
          <div className="text-sm text-gray-600 mb-4 md:mb-0">
            © 2024 Church Community Manager. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/privacy" className={styles.footerLink}>
              Privacy Policy
            </Link>
            <Link to="/terms" className={styles.footerLink}>
              Terms of Service
            </Link>
            <Link to="/support" className={styles.footerLink}>
              Support
            </Link>
            <Button
              variant="ghost"
              size="sm"
              to="/admin/settings"
              icon={Cog6ToothIcon}
            >
              Settings
            </Button>
            <div className="flex items-center space-x-4">
              <a href="#" className={styles.socialLink}>
                <GlobeAltIcon className="w-4 h-4" />
              </a>
              <a href="#" className={styles.socialLink}>
                <HeartIcon className="w-4 h-4" />
              </a>
              <a href="#" className={styles.socialLink}>
                <BuildingLibraryIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 