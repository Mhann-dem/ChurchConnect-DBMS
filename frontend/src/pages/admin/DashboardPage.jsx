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
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Mock dashboard data - replace with actual API call
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Simulate API call
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
              monthlyGrowth: 15
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
                name: 'John Doe', 
                joinDate: '2024-01-15', 
                status: 'active', 
                avatar: 'JD',
                email: 'john.doe@email.com',
                phone: '+233 123 456 789'
              },
              { 
                id: 2, 
                name: 'Mary Smith', 
                joinDate: '2024-01-14', 
                status: 'pending', 
                avatar: 'MS',
                email: 'mary.smith@email.com',
                phone: '+233 987 654 321'
              },
              { 
                id: 3, 
                name: 'David Johnson', 
                joinDate: '2024-01-13', 
                status: 'active', 
                avatar: 'DJ',
                email: 'david.johnson@email.com',
                phone: '+233 555 123 456'
              },
              { 
                id: 4, 
                name: 'Sarah Wilson', 
                joinDate: '2024-01-12', 
                status: 'active', 
                avatar: 'SW',
                email: 'sarah.wilson@email.com',
                phone: '+233 777 888 999'
              },
              { 
                id: 5, 
                name: 'Michael Brown', 
                joinDate: '2024-01-11', 
                status: 'pending', 
                avatar: 'MB',
                email: 'michael.brown@email.com',
                phone: '+233 444 555 666'
              },
            ],
            upcomingEvents: [
              { 
                id: 1, 
                title: 'Sunday Service', 
                date: '2024-01-21', 
                time: '10:00 AM', 
                attendees: 450,
                location: 'Main Sanctuary',
                type: 'worship'
              },
              { 
                id: 2, 
                title: 'Bible Study', 
                date: '2024-01-23', 
                time: '7:00 PM', 
                attendees: 85,
                location: 'Fellowship Hall',
                type: 'study'
              },
              { 
                id: 3, 
                title: 'Youth Meeting', 
                date: '2024-01-25', 
                time: '6:00 PM', 
                attendees: 32,
                location: 'Youth Center',
                type: 'ministry'
              },
              { 
                id: 4, 
                title: 'Prayer Meeting', 
                date: '2024-01-26', 
                time: '7:30 PM', 
                attendees: 67,
                location: 'Prayer Chapel',
                type: 'prayer'
              },
            ],
            notifications: [
              { 
                id: 1, 
                title: 'New member registration', 
                message: 'Sarah Wilson has registered and is pending approval', 
                time: '2 hours ago', 
                type: 'member',
                priority: 'high'
              },
              { 
                id: 2, 
                title: 'Pledge received', 
                message: '$500 monthly pledge commitment from John Doe', 
                time: '4 hours ago', 
                type: 'pledge',
                priority: 'medium'
              },
              { 
                id: 3, 
                title: 'Event reminder', 
                message: 'Bible Study tonight at 7:00 PM - 85 expected attendees', 
                time: '6 hours ago', 
                type: 'event',
                priority: 'low'
              },
              { 
                id: 4, 
                title: 'System backup', 
                message: 'Daily database backup completed successfully', 
                time: '8 hours ago', 
                type: 'system',
                priority: 'low'
              },
            ],
            quickActions: [
              { 
                name: 'Add New Member', 
                href: '/admin/members/new', 
                icon: UsersIcon, 
                color: 'blue',
                bgColor: 'from-blue-500 to-blue-600',
                description: 'Register a new church member'
              },
              { 
                name: 'Create Group', 
                href: '/admin/groups/new', 
                icon: UserGroupIcon, 
                color: 'green',
                bgColor: 'from-green-500 to-green-600',
                description: 'Start a new ministry group'
              },
              { 
                name: 'Record Pledge', 
                href: '/admin/pledges/new', 
                icon: CurrencyDollarIcon, 
                color: 'emerald',
                bgColor: 'from-emerald-500 to-emerald-600',
                description: 'Log a new pledge or donation'
              },
              { 
                name: 'Generate Report', 
                href: '/admin/reports/new', 
                icon: DocumentChartBarIcon, 
                color: 'purple',
                bgColor: 'from-purple-500 to-purple-600',
                description: 'Create analytics report'
              },
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
        console.error('Dashboard error:', err);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl mx-auto">
              <span className="text-white font-bold text-2xl">CC</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl animate-ping opacity-20"></div>
          </div>
          <LoadingSpinner size="lg" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h2>
            <p className="text-gray-600">Gathering your church data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
            <ExclamationTriangleIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Members',
      value: dashboardData?.stats?.totalMembers || 0,
      icon: UsersIcon,
      change: dashboardData?.trends?.members?.value || 0,
      changeType: dashboardData?.trends?.members?.type || 'neutral',
      description: 'from last month',
      color: 'blue',
      bgColor: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Active Groups',
      value: dashboardData?.stats?.activeGroups || 0,
      icon: UserGroupIcon,
      change: 3,
      changeType: 'positive',
      description: 'new this month',
      color: 'green',
      bgColor: 'from-green-500 to-green-600'
    },
    {
      name: 'Monthly Pledges',
      value: `$${dashboardData?.stats?.monthlyPledges?.toLocaleString() || 0}`,
      icon: CurrencyDollarIcon,
      change: dashboardData?.trends?.pledges?.value || 0,
      changeType: dashboardData?.trends?.pledges?.type || 'neutral',
      description: 'from last month',
      color: 'emerald',
      bgColor: 'from-emerald-500 to-emerald-600'
    },
    {
      name: 'Weekly Attendance',
      value: dashboardData?.stats?.weeklyAttendance || 0,
      icon: ChartBarIcon,
      change: dashboardData?.trends?.attendance?.value || 0,
      changeType: dashboardData?.trends?.attendance?.type || 'neutral',
      description: 'from last week',
      color: 'purple',
      bgColor: 'from-purple-500 to-purple-600'
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

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'worship': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'study': return 'bg-green-100 text-green-800 border-green-200';
      case 'ministry': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'prayer': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-400 bg-red-50';
      case 'medium': return 'border-yellow-400 bg-yellow-50';
      case 'low': return 'border-green-400 bg-green-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Enhanced Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative p-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-xl">👋</span>
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold">
                      Welcome back, {user?.first_name || 'Admin'}!
                    </h1>
                    <p className="text-blue-100 text-lg">Here's what's happening with your church today.</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span className="font-medium">{formatDate(currentTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                    <ClockIcon className="w-4 h-4" />
                    <span className="font-medium">{formatTime(currentTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-emerald-300/30">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">System Online</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/admin/members/new"
                  className="flex items-center bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Member
                </Link>
                <Link
                  to="/admin/reports"
                  className="flex items-center bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <DocumentChartBarIcon className="w-4 h-4 mr-2" />
                  Generate Report
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.name} 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-gray-300 overflow-hidden transform hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-r ${stat.bgColor} shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <Link
                      to={`/admin/${stat.name.toLowerCase().split(' ')[0]}`}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      title={`View ${stat.name}`}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        stat.changeType === 'positive' 
                          ? 'bg-green-100 text-green-800' 
                          : stat.changeType === 'negative' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {stat.changeType === 'positive' ? (
                          <ArrowUpIcon className="w-3 h-3" />
                        ) : stat.changeType === 'negative' ? (
                          <ArrowDownIcon className="w-3 h-3" />
                        ) : null}
                        <span>{stat.changeType !== 'neutral' ? `${Math.abs(stat.change)}%` : '—'}</span>
                      </div>
                      <span className="text-xs text-gray-500">{stat.description}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          
          {/* Recent Members Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg shadow-md">
                    <UsersIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Members</h3>
                </div>
                <Link 
                  to="/admin/members" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all duration-200"
                >
                  <span>View all</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.recentMembers?.slice(0, 4).map((member, index) => (
                  <div 
                    key={member.id} 
                    className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-medium shadow-md group-hover:scale-110 transition-transform duration-200">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <CalendarDaysIcon className="w-3 h-3" />
                          <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <EnvelopeIcon className="w-3 h-3" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {dashboardData?.recentMembers?.length > 4 && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <Link 
                    to="/admin/members" 
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View {dashboardData.recentMembers.length - 4} more members →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg shadow-md">
                    <CalendarDaysIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
                </div>
                <Link 
                  to="/admin/events" 
                  className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center space-x-1 hover:bg-green-50 px-3 py-1 rounded-lg transition-all duration-200"
                >
                  <span>View all</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.upcomingEvents?.map((event, index) => (
                  <div 
                    key={event.id} 
                    className="p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 group border border-gray-100 hover:border-gray-200"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-200">
                        <CalendarDaysIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                            {event.type}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex items-center space-x-2">
                            <CalendarDaysIcon className="w-3 h-3" />
                            <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <UsersIcon className="w-3 h-3" />
                            <span>{event.attendees} expected attendees</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity/Notifications Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500 rounded-lg shadow-md">
                    <BellIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-200">
                  {dashboardData?.notifications?.length || 0}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData?.notifications?.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-xl transition-all duration-200 group border-l-4 ${getPriorityColor(notification.priority)}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-200">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                          <p className="text-xs text-gray-600">{notification.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg shadow-md">
                <PlusIcon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData?.quickActions?.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    to={action.href}
                    className="group p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white transform hover:scale-105"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-center space-y-4">
                      <div className={`w-10 h-10 bg-gradient-to-r ${action.bgColor} rounded-lg flex items-center justify-center mx-auto shadow-md group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                          {action.name}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced System Status & Church Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* System Status Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500 rounded-lg shadow-md">
                  <ChartBarIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">Database</span>
                </div>
                <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full">
                  Online
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-800">Backup System</span>
                </div>
                <span className="text-xs text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-purple-800">API Services</span>
                </div>
                <span className="text-xs text-purple-600 font-semibold bg-purple-100 px-2 py-1 rounded-full">
                  Running
                </span>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-gray-700">Last Backup</p>
                  <p className="text-xs text-gray-600">Today at 3:00 AM</p>
                  <div className="flex items-center justify-center space-x-2 mt-3">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">All systems operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Church Information Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg shadow-md">
                  <BuildingLibraryIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Church Information</h3>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                  <span className="text-white font-bold text-xl">CC</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">ChurchConnect DBMS</h4>
                  <p className="text-sm text-gray-600">Connecting Faith & Community</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <MapPinIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-xs text-gray-600">KNUST Campus, Kumasi</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <PhoneIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Contact</p>
                    <p className="text-xs text-gray-600">+233 XX XXX XXXX</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-xs text-gray-600">info@churchconnect.org</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <GlobeAltIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Website</p>
                    <p className="text-xs text-gray-600">www.churchconnect.org</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 text-center">
                <Link 
                  to="/"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <GlobeAltIcon className="w-4 h-4 mr-2" />
                  Visit Public Site
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500 rounded-lg shadow-md">
                  <ClockIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
              </div>
              <span className="text-sm text-indigo-600 font-medium">Today</span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                <li className="relative pb-8">
                  <div className="absolute top-4 left-4 -ml-px h-6 w-0.5 bg-gray-200"></div>
                  <div className="relative flex space-x-3">
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <UsersIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">5 new members</span> registered today
                        </p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </li>
                
                <li className="relative pb-8">
                  <div className="absolute top-4 left-4 -ml-px h-6 w-0.5 bg-gray-200"></div>
                  <div className="relative flex space-x-3">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                      <CurrencyDollarIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">$2,500 in pledges</span> received
                        </p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                  </div>
                </li>
                
                <li className="relative pb-8">
                  <div className="absolute top-4 left-4 -ml-px h-6 w-0.5 bg-gray-200"></div>
                  <div className="relative flex space-x-3">
                    <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
                      <CalendarDaysIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Bible Study event</span> scheduled
                        </p>
                        <p className="text-xs text-gray-500">6 hours ago</p>
                      </div>
                    </div>
                  </div>
                </li>
                
                <li className="relative">
                  <div className="relative flex space-x-3">
                    <div className="h-8 w-8 bg-gray-400 rounded-full flex items-center justify-center shadow-md">
                      <ChartBarIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">System backup</span> completed
                        </p>
                        <p className="text-xs text-gray-500">8 hours ago</p>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Information */}
        <div className="text-center py-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2">
            <HeartIcon className="w-4 h-4 text-red-500" />
            <span>Built with love for our church community</span>
          </div>
          <p className="text-xs text-gray-500">
            ChurchConnect DBMS &copy; 2024 - Connecting Faith & Technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;