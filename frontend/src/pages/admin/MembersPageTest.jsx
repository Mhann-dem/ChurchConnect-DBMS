import React, { useEffect, useState } from 'react';

const MembersPageTest = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDirect = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        console.log('[TEST] Token exists:', !!token);
        
        const url = 'http://localhost:8000/api/v1/members/?page=1&page_size=25&ordering=-registration_date';
        console.log('[TEST] Fetching:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('[TEST] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('[TEST] === DIRECT API RESPONSE ===');
        console.log('[TEST] Full response:', result);
        console.log('[TEST] Count:', result.count);
        console.log('[TEST] Total Members:', result.total_members);
        console.log('[TEST] Active Count:', result.active_count);
        console.log('[TEST] Results length:', result.results?.length);
        console.log('[TEST] First member:', result.results?.[0]);
        console.log('[TEST] =============================');
        
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error('[TEST] Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchDirect();
  }, []);
  
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Testing Direct API Call...</h1>
        <div style={{ marginTop: '20px' }}>Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '40px', color: 'red' }}>
        <h1>API Test Error</h1>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1 style={{ marginBottom: '20px' }}>Direct API Test Results</h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Summary Counts:</h2>
        <div style={{ fontSize: '18px', lineHeight: '1.8' }}>
          <div>✓ <strong>Total Members:</strong> {data?.total_members || data?.count || 0}</div>
          <div>✓ <strong>Active Members:</strong> {data?.active_members || data?.active_count || 0}</div>
          <div>✓ <strong>Inactive Members:</strong> {data?.inactive_members || data?.inactive_count || 0}</div>
          <div>✓ <strong>Results Array Length:</strong> {data?.results?.length || 0}</div>
        </div>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>First 3 Members:</h2>
        {data?.results?.slice(0, 3).map((member, i) => (
          <div key={i} style={{ padding: '10px', background: '#e8f5e9', margin: '10px 0', borderRadius: '4px' }}>
            <strong>{member.first_name} {member.last_name}</strong> - {member.email}
          </div>
        ))}
      </div>
      
      <details style={{ marginTop: '30px' }}>
        <summary style={{ cursor: 'pointer', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
          View Full API Response (Click to expand)
        </summary>
        <pre style={{ 
          marginTop: '10px', 
          padding: '20px', 
          background: '#1e1e1e', 
          color: '#d4d4d4', 
          borderRadius: '8px',
          overflow: 'auto',
          maxHeight: '500px'
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default MembersPageTest;