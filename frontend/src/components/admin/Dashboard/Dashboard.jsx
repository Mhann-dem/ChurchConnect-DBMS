// Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  DocumentChartBarIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
  BellIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../../hooks/useAuth';
import { useDashboard } from '../../../hooks/useDashboard';
import { useToast } from '../../../hooks/useToast';
import StatsCard from './StatsCard';
import RecentMembers from './RecentMembers';
import LoadingSpinner from '../../shared/LoadingSpinner';
import ErrorBoundary from '../../shared/ErrorBoundary';

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

  // Handle refresh functionality
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      showToast('Dashboard refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh dashboard', 'error');
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle data export
  const handleExportData = () => {
    showToast('Export functionality coming soon', 'info');
  };

  // Format greeting based on time of day
  const formatGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Quick action items with role-based filtering
  const getQuickActions = () => {
    const actions = [
      { 
        title: 'Manage Members', 
        icon: UsersIcon, 
        color: 'blue',
        path: '/admin/members',
        description: 'View and manage church members'
      },
      { 
        title: 'Add New Member', 
        icon: UserPlusIcon, 
        color: 'green',
        path: '/admin/members/new',
        description: 'Register a new church member'
      },
      { 
        title: 'Manage Groups', 
        icon: UserGroupIcon, 
        color: 'purple',
        path: '/admin/groups',
        description: 'Organize ministry groups'
      },
      { 
        title: 'View Pledges', 
        icon: CurrencyDollarIcon, 
        color: 'yellow',
        path: '/admin/pledges',
        description: 'Track financial pledges'
      },
      { 
        title: 'Generate Reports', 
        icon: ChartBarIcon, 
        color: 'indigo',
        path: '/admin/reports',
        description: 'Create detailed reports'
      },
      { 
        title: 'System Settings', 
        icon: Cog6ToothIcon, 
        color: 'gray',
        path: '/admin/settings',
        description: 'Configure system settings'
      }
    ];

    // Filter actions based on user role
    return actions.filter(action => {
      if (user?.role === 'readonly') {
        return !['Add New Member', 'System Settings'].includes(action.title);
      }
      return true;
    });
  };

  // Stats configuration
  const getStatsData = () => [
    {
      name: 'Total Members',
      value: stats?.totalMembers || 0,
      icon: UsersIcon,
      change: stats?.memberChange || 0,
      changeType: (stats?.memberChange || 0) >= 0 ? 'positive' : 'negative',
      description: 'from last month',
      color: 'blue'
    },
    {
      name: 'New This Month',
      value: stats?.newMembersMonth || 0,
      icon: UserPlusIcon,
      change: stats?.newMembersChange || 0,
      changeType: (stats?.newMembersChange || 0) >= 0 ? 'positive' : 'negative',
      description: 'new registrations',
      color: 'green'
    },
    {
      name: 'Active Pledges',
      value: stats?.activePledges || 0,
      icon: CurrencyDollarIcon,
      change: stats?.pledgeChange || 0,
      changeType: (stats?.pledgeChange || 0) >= 0 ? 'positive' : 'negative',
      description: 'from last month',
      format: 'currency',
      color: 'yellow'
    },
    {
      name: 'Ministry Groups',
      value: stats?.activeGroups || 0,
      icon: UserGroupIcon,
      change: stats?.groupChange || 0,
      changeType: (stats?.groupChange || 0) >= 0 ? 'positive' : 'negative',
      description: 'active groups',
      color: 'purple'
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Dashboard Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm">
          <div className="px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {formatGreeting()}, {user?.first_name || 'Admin'}! 👋
                </h1>
                <p className="text-blue-100">
                  Welcome to your ChurchConnect dashboard
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Date Range Selector */}
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-blue-500 bg-opacity-50 text-white rounded-md px-3 py-2 text-sm border border-blue-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="year">This year</option>
                </select>
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-blue-500 bg-opacity-50 hover:bg-opacity-75 text-white rounded-md px-3 py-2 text-sm border border-blue-400 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getStatsData().map((stat) => (
            <StatsCard
              key={stat.name}
              title={stat.name}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              color={stat.color}
              changeType={stat.changeType}
              description={stat.description}
              format={stat.format}
              loading={loading}
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Members */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Members</h3>
                <a 
                  href="/admin/members" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </a>
              </div>
            </div>
            <RecentMembers 
              members={recentMembers} 
              loading={loading}
              onMemberClick={(memberId) => 
                window.location.href = `/admin/members/${memberId}`
              }
            />
          </div>

          {/* Chart Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Member Growth</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <FunnelIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {chartData?.memberGrowth ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <TrendingUpIcon className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">Member Growth Chart</p>
                  <p className="text-sm">{chartData.memberGrowth.length} data points</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <ChartBarIcon className="h-12 w-12 mb-4" />
                  <p>No chart data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getQuickActions().map((action) => {
                const Icon = action.icon;
                const colorClasses = {
                  blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
                  green: 'bg-green-50 hover:bg-green-100 text-green-700',
                  purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
                  yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700',
                  indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
                  gray: 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                };

                return (
                  <a 
                    key={action.title}
                    href={action.path}
                    className={`flex items-center p-4 rounded-lg transition-colors group ${colorClasses[action.color]}`}
                  >
                    <Icon className="h-6 w-6 mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {action.title}
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {action.description}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Additional Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BellIcon className="h-5 w-5 mr-2" />
                  Notifications
                </h3>
                {notifications.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {notifications.length}
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <div key={index} className="flex items-start py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No new notifications</p>
                </div>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { name: 'Database Connection', status: 'healthy' },
                  { name: 'API Services', status: 'healthy' },
                  { name: 'Email Service', status: 'healthy' },
                  { name: 'Backup System', status: 'warning' }
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-900">{item.name}</span>
                    <div className="flex items-center">
                      <div 
                        className={`w-2 h-2 rounded-full mr-2 ${
                          item.status === 'healthy' 
                            ? 'bg-green-400' 
                            : 'bg-yellow-400'
                        }`}
                      />
                      <span className={`text-xs font-medium ${
                        item.status === 'healthy' 
                          ? 'text-green-600' 
                          : 'text-yellow-600'
                      }`}>
                        {item.status === 'healthy' ? 'Healthy' : 'Warning'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>Last updated: {new Date().toLocaleString()}</p>
            <div className="flex items-center space-x-4">
              <button className="hover:text-gray-900 transition-colors">Help</button>
              <button 
                onClick={handleExportData}
                className="hover:text-gray-900 transition-colors flex items-center space-x-1"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;