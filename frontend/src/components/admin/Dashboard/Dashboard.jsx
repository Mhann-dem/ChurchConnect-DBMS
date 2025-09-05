import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  DocumentChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
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
  ArrowPathIcon,
  Cog6ToothIcon,
  HeartIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // API service functions
  const apiService = {
    baseURL: '/api/v1',
    
    async request(endpoint, options = {}) {
      const token = localStorage.getItem('auth_token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers,
        },
        ...options,
      };

      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },

    async getDashboardStats(period = '30') {
      return await this.request(`/core/dashboard-stats/?period=${period}`);
    },

    async getRecentMembers(limit = 5) {
      return await this.request(`/members/?ordering=-created_at&limit=${limit}`);
    },

    async getNotifications() {
      return await this.request('/core/notifications/');
    },

    async getUpcomingEvents() {
      return await this.request('/core/events/upcoming/');
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async (period = selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API calls - replace with actual API endpoints
      const [stats, recentMembers, notifications, events] = await Promise.all([
        // Replace with actual API calls
        simulateAPICall('stats', period),
        simulateAPICall('members'),
        simulateAPICall('notifications'),
        simulateAPICall('events')
      ]);

      setDashboardData({
        stats,
        recentMembers,
        notifications,
        upcomingEvents: events,
        lastUpdated: new Date()
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simulate API calls (replace with actual API service calls)
  const simulateAPICall = async (type, period) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        switch (type) {
          case 'stats':
            resolve({
              totalMembers: 1247,
              newMembersThisMonth: 23,
              activePledges: 89600,
              totalPledgeAmount: 267800,
              activeGroups: 18,
              upcomingEvents: 6,
              memberGrowthRate: 8.5,
              pledgeGrowthRate: 12.3,
              averageAge: 42,
              femalePercentage: 58,
              malePercentage: 42
            });
          case 'members':
            resolve([
              {
                id: 1,
                first_name: 'Sarah',
                last_name: 'Johnson',
                email: 'sarah.johnson@email.com',
                phone: '+233 244 567 890',
                created_at: '2024-09-02T10:30:00Z',
                groups: ['Worship Team', 'Bible Study'],
                has_pledge: true,
                photo_url: null
              },
              {
                id: 2,
                first_name: 'Michael',
                last_name: 'Asante',
                email: 'michael.asante@email.com',
                phone: '+233 555 123 456',
                created_at: '2024-09-01T14:15:00Z',
                groups: ['Youth Ministry'],
                has_pledge: false,
                photo_url: null
              },
              {
                id: 3,
                first_name: 'Grace',
                last_name: 'Osei',
                email: 'grace.osei@email.com',
                phone: '+233 202 345 678',
                created_at: '2024-08-30T09:45:00Z',
                groups: ['Children\'s Ministry', 'Choir'],
                has_pledge: true,
                photo_url: null
              },
              {
                id: 4,
                first_name: 'Emmanuel',
                last_name: 'Boateng',
                email: 'emmanuel.boateng@email.com',
                phone: '+233 249 876 543',
                created_at: '2024-08-28T16:20:00Z',
                groups: ['Men\'s Fellowship'],
                has_pledge: true,
                photo_url: null
              }
            ]);
          case 'notifications':
            resolve([
              {
                id: 1,
                type: 'member_registration',
                title: 'New Member Registration',
                message: 'Sarah Johnson has submitted a membership application and requires approval.',
                created_at: '2024-09-05T08:30:00Z',
                is_read: false,
                priority: 'high'
              },
              {
                id: 2,
                type: 'pledge_received',
                title: 'New Pledge Commitment',
                message: 'Michael Asante committed to a monthly pledge of GH₵500.',
                created_at: '2024-09-05T07:15:00Z',
                is_read: false,
                priority: 'medium'
              },
              {
                id: 3,
                type: 'event_reminder',
                title: 'Event Reminder',
                message: 'Youth Fellowship meeting tomorrow at 6:00 PM - 45 members confirmed.',
                created_at: '2024-09-04T18:00:00Z',
                is_read: true,
                priority: 'low'
              }
            ]);
          case 'events':
            resolve([
              {
                id: 1,
                title: 'Sunday Worship Service',
                date: '2024-09-08',
                time: '10:00',
                expected_attendance: 450,
                confirmed_attendance: 387,
                location: 'Main Sanctuary'
              },
              {
                id: 2,
                title: 'Bible Study (Midweek)',
                date: '2024-09-11',
                time: '19:00',
                expected_attendance: 85,
                confirmed_attendance: 72,
                location: 'Fellowship Hall'
              },
              {
                id: 3,
                title: 'Youth Fellowship',
                date: '2024-09-06',
                time: '18:00',
                expected_attendance: 45,
                confirmed_attendance: 38,
                location: 'Youth Center'
              }
            ]);
          default:
            resolve([]);
        }
      }, Math.random() * 800 + 200); // Simulate network delay
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Handle period change
  const handlePeriodChange = async (newPeriod) => {
    setSelectedPeriod(newPeriod);
    await fetchDashboardData(newPeriod);
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Gathering your church data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Members',
      value: dashboardData?.stats?.totalMembers || 0,
      icon: UsersIcon,
      change: dashboardData?.stats?.memberGrowthRate || 0,
      changeType: 'positive',
      color: 'blue'
    },
    {
      name: 'New This Month',
      value: dashboardData?.stats?.newMembersThisMonth || 0,
      icon: PlusIcon,
      change: 15,
      changeType: 'positive',
      color: 'green'
    },
    {
      name: 'Active Pledges',
      value: formatCurrency(dashboardData?.stats?.activePledges || 0),
      icon: CurrencyDollarIcon,
      change: dashboardData?.stats?.pledgeGrowthRate || 0,
      changeType: 'positive',
      color: 'yellow',
      showCurrency: true
    },
    {
      name: 'Ministry Groups',
      value: dashboardData?.stats?.activeGroups || 0,
      icon: UserGroupIcon,
      change: 2,
      changeType: 'positive',
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-8 py-6 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold mb-2">Church Dashboard</h1>
                <p className="text-blue-100 text-lg">
                  Welcome back! Here's what's happening in your church community.
                </p>
                <div className="flex items-center mt-3 text-sm text-blue-200">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  Last updated: {dashboardData?.lastUpdated?.toLocaleString()}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="bg-white bg-opacity-20 text-white rounded-lg px-4 py-2 text-sm border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="365">This year</option>
                </select>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg px-4 py-2 text-sm border border-white border-opacity-30 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-700 border-blue-200',
              green: 'bg-green-50 text-green-700 border-green-200',
              yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
              purple: 'bg-purple-50 text-purple-700 border-purple-200'
            };

            return (
              <div
                key={stat.name}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg border ${colorClasses[stat.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUpIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">+{stat.change}%</span>
                  </div>
                </div>
                
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.name}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">from last period</p>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Members */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UsersIcon className="w-5 h-5 mr-2" />
                  Recent Members
                </h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View all
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.recentMembers?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={`${member.first_name} ${member.last_name}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {getInitials(member.first_name, member.last_name)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Joined {formatDate(member.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {member.has_pledge && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Pledged
                            </span>
                          )}
                          {member.groups?.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {member.groups.length} group{member.groups.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BellIcon className="w-5 h-5 mr-2" />
                  Notifications
                </h3>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {dashboardData?.notifications?.filter(n => !n.is_read).length || 0}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.notifications?.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      notification.priority === 'high' 
                        ? 'border-red-500 bg-red-50' 
                        : notification.priority === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-green-500 bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    {!notification.is_read && (
                      <div className="flex items-center justify-end">
                        <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarDaysIcon className="w-5 h-5 mr-2" />
              Upcoming Events
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dashboardData?.upcomingEvents?.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {event.date}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      {event.time}
                    </div>
                    <div className="flex items-center">
                      <BuildingLibraryIcon className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-2" />
                      {event.confirmed_attendance}/{event.expected_attendance} confirmed
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(event.confirmed_attendance / event.expected_attendance) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Add Member', icon: PlusIcon, href: '/admin/members/new', color: 'blue' },
                { name: 'View Reports', icon: ChartBarIcon, href: '/admin/reports', color: 'green' },
                { name: 'Manage Groups', icon: UserGroupIcon, href: '/admin/groups', color: 'purple' },
                { name: 'Settings', icon: Cog6ToothIcon, href: '/admin/settings', color: 'gray' }
              ].map((action) => {
                const Icon = action.icon;
                const colorClasses = {
                  blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
                  green: 'bg-green-50 hover:bg-green-100 text-green-700',
                  purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
                  gray: 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                };

                return (
                  <button
                    key={action.name}
                    onClick={() => window.location.href = action.href}
                    className={`${colorClasses[action.color]} p-4 rounded-lg transition-colors text-center`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">{action.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;