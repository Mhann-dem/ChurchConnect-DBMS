// Debug Dashboard Component - Replace your Dashboard.jsx with this version to find the issue

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
  const [debugInfo, setDebugInfo] = useState([]);

  // Enhanced debug logging
  const addDebugLog = useCallback((message, data) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data: JSON.stringify(data, null, 2)
    };
    console.log(`[Dashboard Debug] ${message}`, data);
    setDebugInfo(prev => [...prev, logEntry].slice(-10)); // Keep last 10 logs
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      addDebugLog('🚀 Starting dashboard data fetch', {});

      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      addDebugLog('🔑 Token check', { 
        hasAccessToken: !!localStorage.getItem('access_token'),
        hasAuthToken: !!localStorage.getItem('authToken'),
        tokenLength: token?.length || 0,
        tokenStart: token?.substring(0, 20) + '...' || 'none'
      });

      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const baseURL = 'http://localhost:8000';
      addDebugLog('🌐 API Base URL', { baseURL, headers: { ...headers, Authorization: 'Bearer [HIDDEN]' } });

      // Test individual API calls with detailed logging
      const apiCalls = [
        {
          name: 'Member Stats',
          url: `${baseURL}/api/v1/members/statistics/?range=30d`,
          key: 'memberStats'
        },
        {
          name: 'Group Stats',
          url: `${baseURL}/api/v1/groups/statistics/`,
          key: 'groupStats'
        },
        {
          name: 'Family Stats',
          url: `${baseURL}/api/v1/families/statistics/`,
          key: 'familyStats'
        },
        {
          name: 'Recent Members',
          url: `${baseURL}/api/v1/members/recent/?limit=5`,
          key: 'recentMembers'
        }
      ];

      const results = {};
      
      // Execute each API call individually with detailed logging
      for (const apiCall of apiCalls) {
        try {
          addDebugLog(`📡 Fetching ${apiCall.name}`, { url: apiCall.url });
          
          const response = await fetch(apiCall.url, { headers });
          
          addDebugLog(`📨 ${apiCall.name} Response Status`, { 
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          addDebugLog(`📊 ${apiCall.name} Raw Data`, {
            dataType: typeof data,
            isArray: Array.isArray(data),
            keys: Object.keys(data || {}),
            data: data
          });

          results[apiCall.key] = data;

        } catch (error) {
          addDebugLog(`❌ ${apiCall.name} Failed`, { 
            error: error.message,
            stack: error.stack
          });
          results[apiCall.key] = null;
        }
      }

      addDebugLog('🔄 All API calls completed', { results: Object.keys(results) });

      // Process each response individually
      const memberStatsData = results.memberStats;
      const groupStatsData = results.groupStats;
      const familyStatsData = results.familyStats;
      const recentMembersData = results.recentMembers;

      addDebugLog('🧮 Processing Member Stats', {
        raw: memberStatsData,
        summaryExists: !!(memberStatsData && memberStatsData.summary),
        totalMembers: memberStatsData?.summary?.total_members,
        activeMembers: memberStatsData?.summary?.active_members,
        directTotal: memberStatsData?.total_members
      });

      addDebugLog('👥 Processing Recent Members', {
        raw: recentMembersData,
        hasSuccess: recentMembersData?.success,
        hasResults: !!(recentMembersData?.results),
        resultsLength: recentMembersData?.results?.length || 0,
        firstResult: recentMembersData?.results?.[0]
      });

      // Extract data with maximum flexibility
      const extractedData = {
        // Try multiple possible paths for member data
        totalMembers: memberStatsData?.summary?.total_members || 
                     memberStatsData?.total_members || 
                     memberStatsData?.count || 
                     0,
        
        activeMembers: memberStatsData?.summary?.active_members || 
                      memberStatsData?.active_members || 
                      0,
        
        newMembers: memberStatsData?.summary?.recent_registrations || 
                   memberStatsData?.new_members || 
                   memberStatsData?.recent_registrations ||
                   0,

        // Try multiple possible paths for groups
        totalGroups: groupStatsData?.total_groups || 0,
        activeGroups: groupStatsData?.active_groups || 0,

        // Try multiple possible paths for families
        totalFamilies: familyStatsData?.total_families || 0,

        // Try multiple possible paths for recent members
        recentMembers: recentMembersData?.success ? recentMembersData.results : 
                      recentMembersData?.results || 
                      (Array.isArray(recentMembersData) ? recentMembersData : []),

        lastUpdated: new Date(),
        
        // Full debug data
        rawData: {
          memberStatsData,
          groupStatsData,
          familyStatsData,
          recentMembersData
        }
      };

      addDebugLog('✅ Final Extracted Data', extractedData);

      if (!mountedRef.current) return;
      setDashboardData(extractedData);

    } catch (error) {
      addDebugLog('💥 Fatal Error', { error: error.message, stack: error.stack });
      console.error('[Dashboard] Fatal error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addDebugLog]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const mountedRef = React.useRef(true);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
        
        {/* Debug logs during loading */}
        {debugInfo.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '600px',
            maxHeight: '300px',
            overflow: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <h4>🔍 Live Debug Logs:</h4>
            {debugInfo.map((log, index) => (
              <div key={index} style={{ marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                <strong>{log.message}</strong>
                <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap', fontSize: '10px' }}>
                  {log.data}
                </pre>
              </div>
            ))}
          </div>
        )}
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
        
        {/* Show debug info even on error */}
        {debugInfo.length > 0 && (
          <div style={{
            background: '#f8f9fa',
            border: '2px solid #dc3545',
            borderRadius: '8px',
            padding: '16px',
            maxWidth: '800px',
            maxHeight: '400px',
            overflow: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace',
            textAlign: 'left'
          }}>
            <h4 style={{ color: '#dc3545' }}>🐛 Debug Information:</h4>
            {debugInfo.map((log, index) => (
              <div key={index} style={{ marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                <strong>{log.message}</strong>
                <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap', fontSize: '10px' }}>
                  {log.data}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

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
      name: 'New This Month',
      value: (dashboardData?.newMembers || 0).toLocaleString(),
      icon: CalendarDaysIcon,
      description: 'new registrations',
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
              Dashboard Debug Mode - Tracing Data Flow
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
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
                color: stat.value === '0' ? '#dc2626' : '#1f2937', // Red if zero
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
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        marginBottom: '32px'
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
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#dc2626' }}>
              <UsersIcon style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#dc2626' }} />
              <p>No recent members data found</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                Debug: Total count shows {dashboardData?.totalMembers || 0}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ENHANCED DEBUG PANEL - Always visible */}
      <div style={{
        background: '#f8f9fa',
        border: '2px solid #007bff',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '24px'
      }}>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#007bff' }}>
          🔍 DASHBOARD DEBUG PANEL
        </h4>
        
        {/* Current Values */}
        <div style={{ marginBottom: '16px', padding: '12px', background: '#fff', borderRadius: '4px' }}>
          <h5 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Current Display Values:</h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px' }}>
            <div>Total Members: <strong style={{ color: dashboardData?.totalMembers > 0 ? '#28a745' : '#dc3545' }}>{dashboardData?.totalMembers || 0}</strong></div>
            <div>Active Members: <strong style={{ color: dashboardData?.activeMembers > 0 ? '#28a745' : '#dc3545' }}>{dashboardData?.activeMembers || 0}</strong></div>
            <div>Recent Members: <strong style={{ color: (dashboardData?.recentMembers?.length || 0) > 0 ? '#28a745' : '#dc3545' }}>{dashboardData?.recentMembers?.length || 0}</strong></div>
            <div>Total Families: <strong style={{ color: dashboardData?.totalFamilies > 0 ? '#28a745' : '#dc3545' }}>{dashboardData?.totalFamilies || 0}</strong></div>
          </div>
        </div>

        {/* Debug Logs */}
        {debugInfo.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h5 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Recent Debug Logs:</h5>
            <div style={{ maxHeight: '300px', overflow: 'auto', fontSize: '10px', fontFamily: 'monospace' }}>
              {debugInfo.slice(-5).map((log, index) => (
                <details key={index} style={{ marginBottom: '8px', border: '1px solid #ddd', padding: '4px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>
                    {log.message} - {new Date(log.timestamp).toLocaleTimeString()}
                  </summary>
                  <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap', fontSize: '9px', maxHeight: '150px', overflow: 'auto' }}>
                    {log.data}
                  </pre>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Raw Data Viewer */}
        {dashboardData?.rawData && (
          <details style={{ marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📊 Raw API Response Data</summary>
            <pre style={{ 
              fontSize: '10px', 
              fontFamily: 'monospace', 
              background: '#fff', 
              padding: '12px', 
              borderRadius: '4px', 
              maxHeight: '400px', 
              overflow: 'auto', 
              marginTop: '8px',
              border: '1px solid #ddd'
            }}>
              {JSON.stringify(dashboardData.rawData, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default Dashboard;