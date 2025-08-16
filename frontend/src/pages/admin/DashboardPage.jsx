import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  DocumentChartBarIcon,
  TrendingUpIcon,
  CalendarDaysIcon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
              recentRegistrations: 12
            },
            recentMembers: [
              { id: 1, name: 'John Doe', joinDate: '2024-01-15', status: 'active' },
              { id: 2, name: 'Mary Smith', joinDate: '2024-01-14', status: 'pending' },
              { id: 3, name: 'David Johnson', joinDate: '2024-01-13', status: 'active' },
            ],
            upcomingEvents: [
              { id: 1, title: 'Sunday Service', date: '2024-01-21', time: '10:00 AM' },
              { id: 2, title: 'Bible Study', date: '2024-01-23', time: '7:00 PM' },
              { id: 3, title: 'Youth Meeting', date: '2024-01-25', time: '6:00 PM' },
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
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
      change: '+12%',
      changeType: 'positive',
      description: 'from last month'
    },
    {
      name: 'Active Groups',
      value: dashboardData?.stats?.activeGroups || 0,
      icon: UserGroupIcon,
      change: '+3',
      changeType: 'positive',
      description: 'new this month'
    },
    {
      name: 'Monthly Pledges',
      value: `$${dashboardData?.stats?.monthlyPledges?.toLocaleString() || 0}`,
      icon: CurrencyDollarIcon,
      change: '+8%',
      changeType: 'positive',
      description: 'from last month'
    },
    {
      name: 'New Registrations',
      value: dashboardData?.stats?.recentRegistrations || 0,
      icon: DocumentChartBarIcon,
      change: '+4',
      changeType: 'positive',
      description: 'this week'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm">
        <div className="px-6 py-8 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user?.first_name || 'Admin'}! 👋
          </h1>
          <p className="text-blue-100">
            Here's what's happening with your church today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      {stat.description}
                    </span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Members</h3>
              <a href="/admin/members" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </a>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData?.recentMembers?.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">Joined {new Date(member.joinDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              <a href="/admin/events" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </a>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData?.upcomingEvents?.map((event) => (
                <div key={event.id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
                  <div className="bg-blue-50 p-2 rounded-lg mr-4">
                    <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString()} at {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a 
              href="/admin/members" 
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <UsersIcon className="h-6 w-6 text-blue-600 mr-3" />
              <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800">
                Manage Members
              </span>
            </a>
            <a 
              href="/admin/groups" 
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <UserGroupIcon className="h-6 w-6 text-green-600 mr-3" />
              <span className="text-sm font-medium text-green-700 group-hover:text-green-800">
                Manage Groups
              </span>
            </a>
            <a 
              href="/admin/pledges" 
              className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors group"
            >
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <span className="text-sm font-medium text-yellow-700 group-hover:text-yellow-800">
                View Pledges
              </span>
            </a>
            <a 
              href="/admin/reports" 
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <ChartBarIcon className="h-6 w-6 text-purple-600 mr-3" />
              <span className="text-sm font-medium text-purple-700 group-hover:text-purple-800">
                Generate Reports
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;