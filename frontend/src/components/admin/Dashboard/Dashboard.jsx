// Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useDashboard } from '../../../hooks/useDashboard';
import { useToast } from '../../../hooks/useToast';
import StatsCard from './StatsCard';
import RecentMembers from './RecentMembers';
import LoadingSpinner from '../../shared/LoadingSpinner';
import ErrorBoundary from '../../shared/ErrorBoundary';
import { Card, Button, Badge } from '../../ui';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Bell,
  Search
} from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState('30days');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const {
    stats,
    recentMembers,
    chartData,
    loading,
    error,
    refreshData
  } = useDashboard(dateRange);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      showToast('Dashboard refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh dashboard', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportData = () => {
    // Implementation for exporting dashboard data
    showToast('Export functionality coming soon', 'info');
  };

  const formatGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getQuickActions = () => {
    const actions = [
      { 
        title: 'Add New Member', 
        icon: UserPlus, 
        color: 'primary',
        path: '/admin/members/new'
      },
      { 
        title: 'View All Members', 
        icon: Users, 
        color: 'secondary',
        path: '/admin/members'
      },
      { 
        title: 'Generate Report', 
        icon: Download, 
        color: 'success',
        onClick: handleExportData
      },
      { 
        title: 'System Settings', 
        icon: Settings, 
        color: 'neutral',
        path: '/admin/settings'
      }
    ];

    return actions.filter(action => {
      // Filter actions based on user role
      if (user?.role === 'readonly') {
        return !['Add New Member', 'System Settings'].includes(action.title);
      }
      return true;
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Dashboard Error</h2>
        <p>{error}</p>
        <Button onClick={handleRefresh} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.dashboard}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.greeting}>
              <h1>{formatGreeting()}, {user?.first_name || 'Admin'}!</h1>
              <p className={styles.subtitle}>
                Welcome to your ChurchConnect dashboard
              </p>
            </div>
            
            <div className={styles.headerActions}>
              <div className={styles.dateRange}>
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className={styles.dateSelect}
                  aria-label="Select date range"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="year">This year</option>
                </select>
              </div>
              
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={styles.refreshButton}
                aria-label="Refresh dashboard"
              >
                <RefreshCw className={isRefreshing ? styles.spinning : ''} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards Section */}
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <StatsCard
              title="Total Members"
              value={stats?.totalMembers || 0}
              change={stats?.memberChange || 0}
              icon={Users}
              color="primary"
              trend={stats?.memberTrend}
            />
            <StatsCard
              title="New This Month"
              value={stats?.newMembersMonth || 0}
              change={stats?.newMembersChange || 0}
              icon={UserPlus}
              color="success"
              trend={stats?.newMembersTrend}
            />
            <StatsCard
              title="Active Pledges"
              value={stats?.activePledges || 0}
              change={stats?.pledgeChange || 0}
              icon={DollarSign}
              color="warning"
              trend={stats?.pledgeTrend}
              format="currency"
            />
            <StatsCard
              title="Ministry Groups"
              value={stats?.activeGroups || 0}
              change={stats?.groupChange || 0}
              icon={Activity}
              color="info"
              trend={stats?.groupTrend}
            />
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className={styles.quickActionsSection}>
          <h2>Quick Actions</h2>
          <div className={styles.quickActionsGrid}>
            {getQuickActions().map((action, index) => (
              <Card key={index} className={styles.quickActionCard}>
                <div className={styles.quickActionContent}>
                  <div className={`${styles.actionIcon} ${styles[action.color]}`}>
                    <action.icon size={24} />
                  </div>
                  <div className={styles.actionText}>
                    <h3>{action.title}</h3>
                    <p>Click to {action.title.toLowerCase()}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={action.onClick}
                  data-path={action.path}
                  className={styles.actionButton}
                >
                  Go
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.contentGrid}>
          {/* Recent Members Section */}
          <div className={styles.recentMembersSection}>
            <Card className={styles.recentMembersCard}>
              <div className={styles.cardHeader}>
                <h2>Recent Members</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/admin/members'}
                >
                  View All
                </Button>
              </div>
              <RecentMembers 
                members={recentMembers} 
                loading={loading}
                onMemberClick={(memberId) => 
                  window.location.href = `/admin/members/${memberId}`
                }
              />
            </Card>
          </div>

          {/* Charts Section */}
          <div className={styles.chartsSection}>
            <Card className={styles.chartCard}>
              <div className={styles.cardHeader}>
                <h2>Member Growth</h2>
                <div className={styles.chartControls}>
                  <Button variant="ghost" size="sm">
                    <Filter size={16} />
                  </Button>
                </div>
              </div>
              <div className={styles.chartContainer}>
                {chartData?.memberGrowth ? (
                  <div className={styles.chartPlaceholder}>
                    <TrendingUp size={48} className={styles.chartIcon} />
                    <p>Member Growth Chart</p>
                    <small>{chartData.memberGrowth.length} data points</small>
                  </div>
                ) : (
                  <div className={styles.noData}>
                    <p>No chart data available</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Notifications Section */}
          <div className={styles.notificationsSection}>
            <Card className={styles.notificationsCard}>
              <div className={styles.cardHeader}>
                <h2>
                  <Bell size={20} />
                  Notifications
                </h2>
                <Badge variant="primary" className={styles.notificationBadge}>
                  {notifications.length}
                </Badge>
              </div>
              <div className={styles.notificationsList}>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div key={index} className={styles.notificationItem}>
                      <div className={styles.notificationContent}>
                        <p>{notification.message}</p>
                        <small>{notification.timestamp}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noNotifications}>
                    <p>No new notifications</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* System Status Section */}
          <div className={styles.systemStatusSection}>
            <Card className={styles.systemStatusCard}>
              <div className={styles.cardHeader}>
                <h2>System Status</h2>
                <Badge variant="success" className={styles.statusBadge}>
                  Operational
                </Badge>
              </div>
              <div className={styles.statusList}>
                <div className={styles.statusItem}>
                  <div className={styles.statusIndicator} data-status="healthy"></div>
                  <span>Database Connection</span>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusIndicator} data-status="healthy"></div>
                  <span>API Services</span>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusIndicator} data-status="healthy"></div>
                  <span>Email Service</span>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusIndicator} data-status="warning"></div>
                  <span>Backup System</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Section */}
        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <p>Last updated: {new Date().toLocaleString()}</p>
            <div className={styles.footerActions}>
              <Button variant="ghost" size="sm">
                <Search size={16} />
                Search
              </Button>
              <Button variant="ghost" size="sm">
                Help
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;