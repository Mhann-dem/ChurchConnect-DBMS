import React, { useState, useEffect, useCallback } from 'react';
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
  BuildingLibraryIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserPlusIcon,
  CalendarIcon,
  CurrencyDollarIcon as DonationIcon,
  DocumentTextIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // API service for dashboard data
  const dashboardService = {
    async request(endpoint, options = {}) {
      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers,
        },
        ...options,
      };

      try {
        const response = await fetch(`/api/v1${endpoint}`, config);
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token expired, redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('authToken');
            window.location.href = '/admin/login';
            return null;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },

    async getStats() {
      return await this.request('/reports/stats/');
    },

    async getMemberStats(period = '30d') {
      return await this.request(`/members/stats/?range=${period}`);
    },

    async getPledgeStats(period = '30d') {
      return await this.request(`/pledges/stats/?range=${period}`);
    },

    async getGroupStats() {
      return await this.request('/groups/statistics/');
    },

    async getRecentMembers(limit = 6) {
      return await this.request(`/members/?ordering=-registration_date&limit=${limit}`);
    },

    async getRecentPledges(limit = 5) {
      return await this.request(`/pledges/?ordering=-created_at&limit=${limit}`);
    },

    async getUpcomingBirthdays(days = 7) {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      return await this.request(`/members/?upcoming_birthdays=${days}`);
    }
  };

  useEffect(() => {
    // Get current user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  // Fetch comprehensive dashboard data
  const fetchDashboardData = useCallback(async (period = selectedPeriod, showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // Parallel fetch of all dashboard data with error handling
      const [
        generalStats,
        memberStats,
        pledgeStats,
        groupStats,
        recentMembers,
        recentPledges,
        upcomingBirthdays
      ] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getMemberStats(period),
        dashboardService.getPledgeStats(period),
        dashboardService.getGroupStats(),
        dashboardService.getRecentMembers(6),
        dashboardService.getRecentPledges(5),
        dashboardService.getUpcomingBirthdays(7)
      ]);

      // Process results and handle any failures gracefully
      const processResult = (result, fallback = null) => {
        return result.status === 'fulfilled' ? result.value : fallback;
      };

      setDashboardData({
        stats: processResult(generalStats, {}),
        memberStats: processResult(memberStats, {}),
        pledgeStats: processResult(pledgeStats, {}),
        groupStats: processResult(groupStats, {}),
        recentMembers: processResult(recentMembers, { results: [] }),
        recentPledges: processResult(recentPledges, { results: [] }),
        upcomingBirthdays: processResult(upcomingBirthdays, { results: [] })
      });

      setLastUpdated(new Date());

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  // Handle refresh
  const handleRefresh = async () => {
    await fetchDashboardData(selectedPeriod, false);
  };

  // Handle period change
  const handlePeriodChange = async (newPeriod) => {
    setSelectedPeriod(newPeriod);
    await fetchDashboardData(newPeriod, false);
  };

  // Handle navigation
  const navigateTo = (path) => {
    window.location.href = path;
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(selectedPeriod, false);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchDashboardData, selectedPeriod]);

  // Format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  // Format currency (Ghana Cedis)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return 'Recently';
    }
  };

  // Get member initials for avatar
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Get trend indicator
  const getTrendIcon = (changeType) => {
    switch (changeType) {
      case 'positive': return TrendingUpIcon;
      case 'negative': return TrendingDownIcon;
      default: return null;
    }
  };

  // Get trend color
  const getTrendColor = (changeType) => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <HeartIcon className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Gathering your church community data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Calculate key statistics from API data
  const stats = [
    {
      name: 'Total Members',
      value: dashboardData?.stats?.total_members || dashboardData?.memberStats?.total_members || 0,
      icon: UsersIcon,
      change: dashboardData?.memberStats?.growth_rate || 0,
      changeType: dashboardData?.memberStats?.growth_rate > 0 ? 'positive' : dashboardData?.memberStats?.growth_rate < 0 ? 'negative' : 'neutral',
      description: `from last ${selectedPeriod}`,
      color: 'blue',
      href: '/admin/members'
    },
    {
      name: 'New Members',
      value: dashboardData?.memberStats?.new_members || 0,
      icon: UserPlusIcon,
      change: dashboardData?.memberStats?.new_members_change || 0,
      changeType: dashboardData?.memberStats?.new_members_change > 0 ? 'positive' : 'neutral',
      description: `this ${selectedPeriod === '7d' ? 'week' : selectedPeriod === '30d' ? 'month' : 'period'}`,
      color: 'green',
      href: '/admin/members?filter=recent'
    },
    {
      name: 'Active Pledges',
      value: formatCurrency(dashboardData?.pledgeStats?.total_amount || 0),
      icon: CurrencyDollarIcon,
      change: dashboardData?.pledgeStats?.growth_rate || 0,
      changeType: dashboardData?.pledgeStats?.growth_rate > 0 ? 'positive' : dashboardData?.pledgeStats?.growth_rate < 0 ? 'negative' : 'neutral',
      description: `from last ${selectedPeriod}`,
      color: 'yellow',
      href: '/admin/pledges',
      showCurrency: true
    },
    {
      name: 'Ministry Groups',
      value: dashboardData?.groupStats?.total_groups || dashboardData?.stats?.total_groups || 0,
      icon: UserGroupIcon,
      change: dashboardData?.groupStats?.growth_rate || 0,
      changeType: dashboardData?.groupStats?.growth_rate > 0 ? 'positive' : 'neutral',
      description: 'active groups',
      color: 'purple',
      href: '/admin/groups'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-4">
                    <BuildingLibraryIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Welcome back, {currentUser?.first_name || 'Admin'}!
                    </h1>
                    <p className="text-blue-100 text-lg">
                      Here's what's happening in your church community
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-blue-200">
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    System Online
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="bg-white bg-opacity-20 text-white rounded-lg px-4 py-2.5 text-sm border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 backdrop-blur-sm"
                >
                  <option value="7d" className="text-gray-900">Last 7 days</option>
                  <option value="30d" className="text-gray-900">Last 30 days</option>
                  <option value="90d" className="text-gray-900">Last 3 months</option>
                  <option value="365d" className="text-gray-900">This year</option>
                </select>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg px-4 py-2.5 text-sm border border-white border-opacity-30 transition-all flex items-center space-x-2 disabled:opacity-50 backdrop-blur-sm font-medium"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = getTrendIcon(stat.changeType);
            const colorClasses = {
              blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
              green: 'from-green-500 to-green-600 shadow-green-500/25',
              yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/25',
              purple: 'from-purple-500 to-purple-600 shadow-purple-500/25'
            };

            return (
              <div
                key={stat.name}
                className="group cursor-pointer"
                onClick={() => navigateTo(stat.href)}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses[stat.color]} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {TrendIcon && (
                      <div className={`flex items-center space-x-1 ${getTrendColor(stat.changeType)}`}>
                        <TrendIcon className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {Math.abs(stat.change)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.name}</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Members */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UsersIcon className="w-5 h-5 mr-3 text-blue-600" />
                  Recent Members
                </h3>
                <button 
                  onClick={() => navigateTo('/admin/members')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-colors"
                >
                  View all ({dashboardData?.stats?.total_members || 0})
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {dashboardData?.recentMembers?.results?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentMembers.results.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="group cursor-pointer"
                      onClick={() => navigateTo(`/admin/members/${member.id}`)}
                    >
                      <div className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200">
                        <div className="flex-shrink-0">
                          {member.photo_url ? (
                            <img
                              src={member.photo_url}
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {getInitials(member.first_name, member.last_name)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {member.first_name} {member.last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Joined {formatRelativeTime(member.registration_date || member.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {member.email && (
                                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                              )}
                              {member.phone && (
                                <PhoneIcon className="w-4 h-4 text-gray-400" />
                              )}
                              <EyeIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No recent members</h3>
                  <p className="text-sm text-gray-500 mb-4">New members will appear here when they join</p>
                  <button
                    onClick={() => navigateTo('/register')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Add Member
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Items & Alerts */}
          <div className="space-y-6">
            
            {/* Upcoming Birthdays */}
            {dashboardData?.upcomingBirthdays?.results?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CalendarDaysIcon className="w-5 h-5 mr-3 text-pink-600" />
                    Upcoming Birthdays
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {dashboardData.upcomingBirthdays.results.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {getInitials(member.first_name, member.last_name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-xs text-pink-600">
                              {formatDate(member.date_of_birth)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Pledges */}
            {dashboardData?.recentPledges?.results?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <CurrencyDollarIcon className="w-5 h-5 mr-3 text-green-600" />
                      Recent Pledges
                    </h3>
                    <button 
                      onClick={() => navigateTo('/admin/pledges')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium hover:underline transition-colors"
                    >
                      View all
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {dashboardData.recentPledges.results.slice(0, 3).map((pledge) => (
                      <div key={pledge.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {pledge.member_name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-green-600">
                            {formatCurrency(pledge.amount)} - {pledge.frequency}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(pledge.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircleIcon className="w-5 h-5 mr-3 text-green-600" />
                  System Status
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">Database</span>
                    </div>
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">API Services</span>
                    </div>
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { 
                  name: 'Add Member', 
                  icon: UserPlusIcon, 
                  href: '/register', 
                  color: 'blue',
                  description: 'Register new member'
                },
                { 
                  name: 'Create Event', 
                  icon: CalendarIcon, 
                  href: '/admin/events?action=create', 
                  color: 'green',
                  description: 'Schedule church event'
                },
                { 
                  name: 'Record Donation', 
                  icon: DonationIcon, 
                  href: '/admin/pledges/new', 
                  color: 'yellow',
                  description: 'Log contribution'
                },
                { 
                  name: 'View Reports', 
                  icon: DocumentTextIcon, 
                  href: '/admin/reports', 
                  color: 'purple',
                  description: 'Analytics & insights'
                }
              ].map((action) => {
                const Icon = action.icon;
                const colorClasses = {
                  blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
                  green: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
                  yellow: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200',
                  purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                };

                return (
                  <button
                    key={action.name}
                    onClick={() => navigateTo(action.href)}
                    className={`${colorClasses[action.color]} p-6 rounded-xl transition-all duration-200 text-center border hover:shadow-md group`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h4 className="text-sm font-semibold mb-1">{action.name}</h4>
                    <p className="text-xs opacity-75">{action.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Church Community Manager • Data updated every 5 minutes</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;