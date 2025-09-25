// Fixed Dashboard Component - Correct Data Extraction for Your Django API
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

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const baseURL = 'http://localhost:8000';

      // FIXED: Correct API calls matching your Django logs exactly
      const apiCalls = [
        // Member statistics - returns your exact response format
        fetch(`${baseURL}/api/v1/members/statistics/?range=30d`, { headers }),
        
        // Groups statistics  
        fetch(`${baseURL}/api/v1/groups/statistics/`, { headers }),
        
        // Families statistics
        fetch(`${baseURL}/api/v1/families/statistics/`, { headers }),
        
        // Recent members - your working endpoint
        fetch(`${baseURL}/api/v1/members/recent/?limit=5`, { headers }),
        
        // System health
        fetch(`${baseURL}/api/v1/core/dashboard/health/`, { headers }).catch(() => null),
        
        // Alerts  
        fetch(`${baseURL}/api/v1/core/dashboard/alerts/`, { headers }).catch(() => null)
      ];

      const responses = await Promise.allSettled(apiCalls);
      
      // FIXED: Safer response processing
      const processResponse = async (responseResult, endpointName) => {
        if (responseResult.status === 'rejected') {
          console.error(`[Dashboard] ${endpointName} failed:`, responseResult.reason);
          return null;
        }

        const response = responseResult.value;
        if (!response || !response.ok) {
          console.error(`[Dashboard] ${endpointName} HTTP error:`, response?.status);
          return null;
        }

        try {
          const data = await response.json();
          console.log(`[Dashboard] ${endpointName} success:`, data);
          return data;
        } catch (parseError) {
          console.error(`[Dashboard] ${endpointName} parse error:`, parseError);
          return null;
        }
      };

      const [
        memberStatsData,
        groupStatsData, 
        familyStatsData,
        recentMembersData,
        healthData,
        alertsData
      ] = await Promise.all([
        processResponse(responses[0], 'Member Stats'),
        processResponse(responses[1], 'Group Stats'),
        processResponse(responses[2], 'Family Stats'), 
        processResponse(responses[3], 'Recent Members'),
        processResponse(responses[4], 'Health'),
        processResponse(responses[5], 'Alerts')
      ]);

      // FIXED: Correct data extraction matching your Django response structure
      const extractedData = {
        // FIXED: Member stats - handle your actual response structure
        totalMembers: memberStatsData?.summary?.total_members || 
                     memberStatsData?.total_members || 0,
        activeMembers: memberStatsData?.summary?.active_members || 
                      memberStatsData?.active_members || 0,
        newMembers: memberStatsData?.summary?.recent_registrations || 
                   memberStatsData?.new_members || 0,
        
        // FIXED: Group stats - direct properties from your API
        totalGroups: groupStatsData?.total_groups || 0,
        activeGroups: groupStatsData?.active_groups || 0,
        
        // FIXED: Family stats - direct property
        totalFamilies: familyStatsData?.total_families || 0,
        
        // FIXED: Recent members - handle your Django response format
        // Your API returns: { success: true, results: [...], count: 4 }
        recentMembers: (() => {
          if (recentMembersData?.success && recentMembersData?.results) {
            return recentMembersData.results;
          }
          if (Array.isArray(recentMembersData)) {
            return recentMembersData;
          }
          return [];
        })(),
        
        // System data with fallbacks
        systemHealth: healthData || { status: 'unknown' },
        alerts: alertsData?.results || alertsData || [],
        
        // Metadata for debugging
        lastUpdated: new Date(),
        debugInfo: {
          memberStatsRaw: memberStatsData,
          groupStatsRaw: groupStatsData,
          familyStatsRaw: familyStatsData,
          recentMembersRaw: recentMembersData,
          recentMembersProcessed: (() => {
            if (recentMembersData?.success && recentMembersData?.results) {
              return {
                format: 'django_success_response',
                count: recentMembersData.results.length,
                sample: recentMembersData.results[0] || null
              };
            }
            return { format: 'unknown', data: recentMembersData };
          })()
        }
      };

      console.log('[Dashboard] FINAL extracted data:', {
        totalMembers: extractedData.totalMembers,
        activeMembers: extractedData.activeMembers,
        recentMembersCount: extractedData.recentMembers.length,
        recentMembersFirst: extractedData.recentMembers[0]?.first_name,
        debugInfo: extractedData.debugInfo
      });
      
      setDashboardData(extractedData);

    } catch (error) {
      console.error('[Dashboard] Fetch error:', error);
      setError(error.message);
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

  // FIXED: Loading state
  if (loading && !dashboardData) {
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
        <p>Loading Dashboard Data...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // FIXED: Error state
  if (error && !dashboardData) {
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

  // FIXED: Stats with correct data
  const stats = [
    {
      name: 'Total Members',
      value: (dashboardData?.totalMembers || 0).toLocaleString(),
      icon: UsersIcon,
      description: `${dashboardData?.activeMembers || 0} active members`,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Total Families',
      value: (dashboardData?.totalFamilies || 0).toLocaleString(),
      icon: HomeIcon,
      description: 'registered families',
      color: 'from-green-500 to-teal-500'
    },
    {
      name: 'Active Groups',
      value: (dashboardData?.activeGroups || 0).toLocaleString(),
      icon: UserGroupIcon,
      description: `${dashboardData?.totalGroups || 0} total groups`,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      name: 'System Health',
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

      {/* FIXED: Stats Grid */}
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
                cursor: 'pointer',
                animationDelay: `${index * 0.1}s`,
                animation: 'fadeInUp 0.5s ease-out forwards'
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

      {/* FIXED: Recent Members Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        
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
              {dashboardData?.recentMembers?.length || 0} members
            </span>
          </div>
          
          <div style={{ padding: '24px' }}>
            {dashboardData?.recentMembers?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {dashboardData.recentMembers.slice(0, 5).map((member, index) => (
                  <div
                    key={member.id || index}
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
                      {(member.first_name?.charAt(0) || '') + (member.last_name?.charAt(0) || '')}
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
                      {member.registration_date ? 
                        new Date(member.registration_date).toLocaleDateString() : 
                        'Recently'
                      }
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                <UsersIcon style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#d1d5db' }} />
                <p>No recent members found</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Total registered: {dashboardData?.totalMembers || 0}
                </p>
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
          </div>
        </div>
      </div>

      {/* Debug Panel - Development Only */}
      {process.env.NODE_ENV === 'development' && dashboardData?.debugInfo && (
        <div style={{
          background: '#f8f9fa',
          border: '2px solid #007bff',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#007bff' }}>
            🔍 DEBUG: Data Processing Results
          </h4>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', background: '#fff', padding: '12px', borderRadius: '4px' }}>
            <p><strong>Processed Values:</strong></p>
            <p>• Total Members: {dashboardData.totalMembers}</p>
            <p>• Active Members: {dashboardData.activeMembers}</p>
            <p>• Total Groups: {dashboardData.totalGroups}</p>
            <p>• Recent Members Array Length: {dashboardData.recentMembers?.length || 0}</p>
            <p>• Recent Members Processing: {dashboardData.debugInfo.recentMembersProcessed?.format}</p>
            
            <details style={{ marginTop: '8px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Raw API Responses</summary>
              <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px', marginTop: '8px' }}>
                {JSON.stringify(dashboardData.debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;