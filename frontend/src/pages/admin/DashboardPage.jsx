import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  HeartIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import dashboardService from '../../services/dashboardService';
import { useToast } from '../../context/ToastContext';
import styles from './AdminPages.module.css';

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  // State management
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    memberStats: null,
    pledgeStats: null,
    groupStats: null,
    recentMembers: [],
    recentPledges: [],
    systemHealth: null,
    alerts: []
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data from backend
  const fetchDashboardData = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      setError(null);

      // Fetch all dashboard data concurrently
      const [
        systemStats,
        memberStats,
        pledgeStats,
        groupStats,
        recentMembers,
        recentPledges,
        systemHealth,
        alerts
      ] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getMemberStats('30d'),
        dashboardService.getPledgeStats('30d'),
        dashboardService.getGroupStats(),
        dashboardService.getRecentMembers(5),
        dashboardService.getRecentPledges(5),
        dashboardService.getSystemHealth(),
        dashboardService.getAlerts()
      ]);

      // Process results safely
      const processResult = (result, fallback = null) => {
        if (result.status === 'fulfilled') {
          return result.value?.data || result.value || fallback;
        } else {
          console.warn('Dashboard API call failed:', result.reason);
          return fallback;
        }
      };

      const newDashboardData = {
        stats: processResult(systemStats, { 
          total_members: 0, 
          total_groups: 0, 
          total_pledges: 0,
          monthly_revenue: 0 
        }),
        memberStats: processResult(memberStats, { 
          total_members: 0, 
          new_members: 0, 
          growth_rate: 0,
          active_members: 0 
        }),
        pledgeStats: processResult(pledgeStats, { 
          total_amount: 0, 
          active_pledges: 0, 
          growth_rate: 0,
          monthly_total: 0 
        }),
        groupStats: processResult(groupStats, { 
          total_groups: 0, 
          active_groups: 0, 
          growth_rate: 0 
        }),
        recentMembers: processResult(recentMembers, { results: [] }).results || [],
        recentPledges: processResult(recentPledges, { results: [] }).results || [],
        systemHealth: processResult(systemHealth, { status: 'unknown' }),
        alerts: processResult(alerts, { results: [] }).results || []
      };

      setDashboardData(newDashboardData);
      setLastRefresh(new Date());
      
      if (!showLoadingSpinner) {
        showToast('Dashboard data refreshed successfully', 'success');
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchDashboardData(false);
  };

  // Reusable components
  const Card = ({ children, className = '', hover = true, ...props }) => (
    <div 
      className={`${styles.cardBase} ${hover ? styles.cardHover : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );

  const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    to, 
    onClick, 
    className = '', 
    icon: Icon,
    iconPosition = 'left',
    disabled = false,
    ...props 
  }) => {
    const baseClasses = `${styles.buttonBase} ${styles[`button-${variant}`]} ${styles[`button-${size}`]} ${className} ${disabled ? styles.buttonDisabled : ''}`;
    
    const content = (
      <>
        {Icon && iconPosition === 'left' && <Icon className={styles.buttonIcon} />}
        <span>{children}</span>
        {Icon && iconPosition === 'right' && <Icon className={styles.buttonIcon} />}
      </>
    );

    if (to && !disabled) {
      return (
        <Link to={to} className={baseClasses} {...props}>
          {content}
        </Link>
      );
    }

    return (
      <button className={baseClasses} onClick={onClick} disabled={disabled} {...props}>
        {content}
      </button>
    );
  };

  const Badge = ({ children, variant = 'default', className = '' }) => (
    <span className={`${styles.badgeBase} ${styles[`badge-${variant}`]} ${className}`}>
      {children}
    </span>
  );

  const Avatar = ({ name, size = 'md', status, className = '' }) => {
    const getInitials = (fullName) => {
      if (!fullName) return 'U';
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
      <div className={`${styles.avatarBase} ${styles[`avatar-${size}`]} ${className}`}>
        <span className={styles.avatarText}>{getInitials(name)}</span>
        {status && <div className={`${styles.avatarStatus} ${styles[`status-${status}`]}`}></div>}
      </div>
    );
  };

  // Loading state
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
            <p>Fetching real-time church community data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData.stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <Card className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
            <ExclamationTriangleIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-red-900 mb-4">Connection Error</h2>
            <p className="text-red-700 mb-6 text-lg">{error}</p>
            <Button 
              variant="danger"
              onClick={() => fetchDashboardData()}
              icon={ArrowPathIcon}
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Generate stats with real data
  const stats = [
    {
      name: 'Total Members',
      value: dashboardData?.memberStats?.total_members?.toLocaleString() || '0',
      icon: UsersIcon,
      change: dashboardData?.memberStats?.growth_rate || 0,
      changeType: (dashboardData?.memberStats?.growth_rate || 0) >= 0 ? 'positive' : 'negative',
      description: `${dashboardData?.memberStats?.new_members || 0} new this month`,
      color: 'from-blue-500 to-cyan-500',
      bgPattern: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      route: '/admin/members'
    },
    {
      name: 'Active Groups',
      value: dashboardData?.groupStats?.active_groups?.toLocaleString() || '0',
      icon: UserGroupIcon,
      change: dashboardData?.groupStats?.growth_rate || 0,
      changeType: (dashboardData?.groupStats?.growth_rate || 0) >= 0 ? 'positive' : 'negative',
      description: `${dashboardData?.groupStats?.total_groups || 0} total groups`,
      color: 'from-emerald-500 to-green-500',
      bgPattern: 'bg-emerald-50',
      iconBg: 'bg-emerald-500',
      route: '/admin/groups'
    },
    {
      name: 'Monthly Pledges',
      value: `$${dashboardData?.pledgeStats?.monthly_total?.toLocaleString() || '0'}`,
      icon: CurrencyDollarIcon,
      change: dashboardData?.pledgeStats?.growth_rate || 0,
      changeType: (dashboardData?.pledgeStats?.growth_rate || 0) >= 0 ? 'positive' : 'negative',
      description: `${dashboardData?.pledgeStats?.active_pledges || 0} active pledges`,
      color: 'from-yellow-500 to-orange-500',
      bgPattern: 'bg-yellow-50',
      iconBg: 'bg-yellow-500',
      route: '/admin/pledges'
    },
    {
      name: 'System Health',
      value: dashboardData?.systemHealth?.status === 'healthy' ? 'Excellent' : 'Attention',
      icon: ChartBarIcon,
      change: 0,
      changeType: 'neutral',
      description: dashboardData?.systemHealth?.uptime || 'System monitoring',
      color: 'from-purple-500 to-indigo-500',
      bgPattern: 'bg-purple-50',
      iconBg: dashboardData?.systemHealth?.status === 'healthy' ? 'bg-green-500' : 'bg-orange-500',
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

  const getRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
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
                  <Avatar 
                    name={user ? `${user.first_name} ${user.last_name}` : 'Admin'} 
                    size="lg" 
                    status="online" 
                  />
                  <div>
                    <h1 className={styles.welcomeTitle}>
                      Welcome back, {user?.first_name || 'Admin'}!
                    </h1>
                    <p className={styles.welcomeSubtitle}>
                      Your church community dashboard - Real-time data
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
                  <Badge variant={dashboardData?.systemHealth?.status === 'healthy' ? 'success' : 'warning'} 
                        className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      dashboardData?.systemHealth?.status === 'healthy' ? 'bg-emerald-400' : 'bg-orange-400'
                    }`}></div>
                    <span>
                      {dashboardData?.systemHealth?.status === 'healthy' ? 'All Systems Online' : 'System Status: Checking'}
                    </span>
                  </Badge>
                  {lastRefresh && (
                    <Badge variant="light" className="flex items-center space-x-2">
                      <ArrowPathIcon className="w-4 h-4" />
                      <span>Updated {getRelativeTime(lastRefresh)}</span>
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="secondary"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  icon={ArrowPathIcon}
                  className={refreshing ? 'animate-spin' : ''}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
                <Button 
                  variant="secondary"
                  to="/register"
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

        {/* Stats Grid with Real Data */}
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
                        <span>{stat.changeType !== 'neutral' ? `${Math.abs(stat.change).toFixed(1)}%` : '—'}</span>
                      </Badge>
                      <span className="text-xs text-gray-500 font-medium">{stat.description}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

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
                  View all ({dashboardData?.memberStats?.total_members || 0})
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.recentMembers?.length > 0 ? (
                  dashboardData.recentMembers.slice(0, 4).map((member, index) => (
                    <Card 
                      key={member.id} 
                      className={`${styles.memberItem} group`}
                    >
                      <div className="flex items-center space-x-4 p-4">
                        <Avatar 
                          name={`${member.first_name} ${member.last_name}`}
                          status={member.is_active ? 'active' : 'inactive'}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {member.first_name} {member.last_name}
                            </p>
                            <Badge variant={member.is_active ? 'success' : 'warning'}>
                              {member.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <CalendarDaysIcon className="w-3 h-3" />
                                <span>Joined {new Date(member.registration_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              {member.email && (
                                <div className="flex items-center space-x-1">
                                  <EnvelopeIcon className="w-3 h-3" />
                                  <span className="truncate">{member.email}</span>
                                </div>
                              )}
                              {member.phone && (
                                <div className="flex items-center space-x-1">
                                  <PhoneIcon className="w-3 h-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent member registrations</p>
                    <Button 
                      variant="ghost"
                      to="/register"
                      icon={PlusIcon}
                      className="mt-2"
                    >
                      Add First Member
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Alerts/Notifications Card */}
          <Card className={styles.notificationsCard}>
            <div className={styles.sectionHeader}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${styles.iconContainer} bg-gradient-to-r from-purple-500 to-pink-500`}>
                    <BellIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className={styles.sectionTitle}>System Alerts</h3>
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
                {dashboardData?.alerts?.length > 0 ? (
                  dashboardData.alerts.slice(0, 5).map((alert) => (
                    <Card 
                      key={alert.id} 
                      className={`${styles.notificationItem} border-l-4 border-l-blue-500 bg-blue-50`}
                    >
                      <div className="flex items-start space-x-3 p-4">
                        <div className="flex-shrink-0">
                          <div className={`${styles.iconContainer} bg-white shadow-sm border border-gray-100`}>
                            <BellIcon className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                            <span className="text-xs text-gray-500">{getRelativeTime(alert.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-green-300" />
                    <p>All systems running smoothly</p>
                    <p className="text-xs">No alerts or notifications</p>
                  </div>
                )}
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
                  to="/register"
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
                  to="/admin/groups/new"
                  className="flex flex-col items-center justify-center p-5 text-center"
                >
                  <div className={`${styles.iconContainer} bg-emerald-100 group-hover:bg-emerald-200 mb-3`}>
                    <UserGroupIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Create Group</span>
                  <span className="text-xs text-gray-500 mt-1">Ministry/small group</span>
                </Link>
              </Card>
              
              <Card className={`${styles.quickActionItem} group`}>
                <Link
                  to="/admin/pledges/new"
                  className="flex flex-col items-center justify-center p-5 text-center"
                >
                  <div className={`${styles.iconContainer} bg-amber-100 group-hover:bg-amber-200 mb-3`}>
                    <CurrencyDollarIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Record Pledge</span>
                  <span className="text-xs text-gray-500 mt-1">Financial commitment</span>
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
            © 2024 ChurchConnect DBMS. Serving your community with real-time data.
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/admin/privacy" className={styles.footerLink}>
              Privacy Policy
            </Link>
            <Link to="/admin/terms" className={styles.footerLink}>
              Terms of Service
            </Link>
            <Link to="/admin/support" className={styles.footerLink}>
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
            <div className="text-xs text-gray-500">
              v1.2.0 | {user?.role || 'Admin'} Access
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;