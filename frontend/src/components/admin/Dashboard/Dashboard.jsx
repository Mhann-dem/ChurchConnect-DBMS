// components/admin/Dashboard/Dashboard.jsx - COMPLETELY FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  CalendarDaysIcon,
  ArrowPathIcon,
  HomeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import useAuth from '../../hooks/useAuth';
import apiMethods from '../../services/api'; // Use the FIXED API methods

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // FIXED: Fetch dashboard data with proper error handling
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Dashboard] Fetching data from corrected endpoints...');

      // FIXED: Use Promise.allSettled to handle failures gracefully
      const [
        memberStatsResult, 
        groupStatsResult,
        familyStatsResult,
        recentMembersResult,
        systemHealthResult,
        alertsResult
      ] = await Promise.allSettled([
        // Use the CORRECTED API methods
        apiMethods.dashboard.getMemberStats('30d'),
        apiMethods.dashboard.getGroupStats(), 
        apiMethods.dashboard.getFamilyStats(),
        apiMethods.dashboard.getRecentMembers(5),
        apiMethods.dashboard.getSystemHealth(),
        apiMethods.dashboard.getAlerts()
      ]);

      // FIXED: Process results with proper fallback data structure
      const processResult = (result, fallback = null) => {
        if (result.status === 'fulfilled') {
          console.log('[Dashboard] API Success:', result.value);
          return result.value;
        } else {
          console.warn('[Dashboard] API Failed:', result.reason?.message);
          return fallback;
        }
      };

      // FIXED: Structure data to match your backend response format
      const newData = {
        // Member statistics from MemberStatisticsViewSet
        memberStats: processResult(memberStatsResult, { 
          summary: { 
            total_members: 0, 
            active_members: 0, 
            inactive_members: 0 
          }
        }),
        
        // Group statistics from GroupViewSet.statistics
        groupStats: processResult(groupStatsResult, { 
          total_groups: 0, 
          active_groups: 0 
        }),
        
        // Family statistics (if endpoint exists)
        familyStats: processResult(familyStatsResult, { 
          total_families: 0, 
          new_families: 0 
        }),
        
        // Recent members from MemberViewSet.recent
        recentMembers: processResult(recentMembersResult, { 
          results: [] 
        }),
        
        // System health from dashboard health endpoint
        systemHealth: processResult(systemHealthResult, { 
          status: 'unknown' 
        }),
        
        // Alerts from dashboard alerts endpoint
        alerts: processResult(alertsResult, { 
          results: [] 
        })
      };

      console.log('[Dashboard] Processed data:', newData);
      setDashboardData(newData);

    } catch (error) {
      console.error('[Dashboard] Error fetching data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p>Loading Dashboard...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <h2>Unable to Load Dashboard</h2>
        <p style={{ color: '#6b7280' }}>{error}</p>
        <button
          onClick={handleRefresh}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ArrowPathIcon style={{ width: '16px', height: '16px' }} />
          Try Again
        </button>
      </div>
    );
  }

  // FIXED: Extract data using the actual API response structure
  const stats = [
    {
      name: 'Total Members',
      // FIXED: Use the correct path based on your MemberStatisticsViewSet response
      value: dashboardData?.memberStats?.summary?.total_members || 0,
      icon: UsersIcon,
      description: `${dashboardData?.memberStats?.summary?.active_members || 0} active members`,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Total Families', 
      // FIXED: Use the correct path based on your families endpoint
      value: dashboardData?.familyStats?.total_families || 0,
      icon: HomeIcon,
      description: `${dashboardData?.familyStats?.new_families || 0} new families`,
      color: 'from-green-500 to-teal-500'
    },
    {
      name: 'Active Groups',
      // FIXED: Use the correct path based on your GroupViewSet.statistics response
      value: dashboardData?.groupStats?.active_groups || 0,
      icon: UserGroupIcon,
      description: `${dashboardData?.groupStats?.total_groups || 0} total groups`,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      name: 'System Health',
      // FIXED: Use the system health status
      value: dashboardData?.systemHealth?.status === 'healthy' ? 'Good' : 'Check',
      icon: ChartBarIcon,
      description: 'system status',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        padding: '32px',
        borderRadius: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              Welcome back, {user?.first_name || 'Admin'}!
            </h1>
            <p style={{ fontSize: '18px', opacity: 0.8 }}>
              Here's what's happening in your church community
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: refreshing ? 0.7 : 1
            }}
          >
            <ArrowPathIcon 
              style={{ 
                width: '16px', 
                height: '16px',
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }} 
            />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
              </div>

              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                {stat.name}
              </h3>
              <p style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '8px'
              }}>
                {stat.value}
              </p>
              <p style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Members Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        
        {/* Recent Members */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Recent Members</h3>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {dashboardData?.recentMembers?.results?.length || 0} members
            </span>
          </div>
          
          <div style={{ padding: '24px' }}>
            {dashboardData?.recentMembers?.results?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {dashboardData.recentMembers.results.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #f3f4f6'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      marginRight: '16px'
                    }}>
                      {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        {member.first_name} {member.last_name}
                      </p>
                      <p style={{ fontSize: '14px', color: '#6b7280' }}>
                        {member.email}
                      </p>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(member.registration_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                <UsersIcon style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#d1d5db' }} />
                <p>No recent members</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div style={{
          background: 'white',
          borderRadius: '12px', 
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>System Status</h3>
          </div>
          
          <div style={{ padding: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              background: dashboardData?.systemHealth?.status === 'healthy' ? '#f0f9ff' : '#fef3c7',
              borderRadius: '8px',
              border: `1px solid ${dashboardData?.systemHealth?.status === 'healthy' ? '#e0f2fe' : '#fed7aa'}`
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: dashboardData?.systemHealth?.status === 'healthy' ? '#22c55e' : '#f59e0b',
                borderRadius: '50%',
                marginRight: '12px'
              }} />
              <span style={{ fontWeight: '600' }}>
                {dashboardData?.systemHealth?.status === 'healthy' ? 'All Systems Online' : 'System Status: Checking'}
              </span>
            </div>
            
            {/* Alert Count */}
            {dashboardData?.alerts?.results?.length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                <span style={{ fontSize: '14px', color: '#dc2626' }}>
                  {dashboardData.alerts.results.length} alert{dashboardData.alerts.results.length !== 1 ? 's' : ''} need attention
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug Information (Development) */}
      {process.env.NODE_ENV === 'development' && dashboardData && (
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
            Debug Information (Development)
          </h4>
          <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
            <p><strong>API Base URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:8000'}</p>
            <p><strong>Member Stats:</strong> {JSON.stringify(dashboardData?.memberStats?.summary, null, 2)}</p>
            <p><strong>Group Stats:</strong> {JSON.stringify(dashboardData?.groupStats, null, 2)}</p>
            <p><strong>Family Stats:</strong> {JSON.stringify(dashboardData?.familyStats, null, 2)}</p>
            <p><strong>Recent Members Count:</strong> {dashboardData?.recentMembers?.results?.length || 0}</p>
            <p><strong>System Health:</strong> {dashboardData?.systemHealth?.status}</p>
            <p><strong>Alerts Count:</strong> {dashboardData?.alerts?.results?.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;