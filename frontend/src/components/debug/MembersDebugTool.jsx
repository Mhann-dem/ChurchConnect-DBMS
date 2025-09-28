// src/components/debug/MembersDebugTool.jsx
// Use this component to test your API endpoints directly
// Add this route to your router: <Route path="/debug/members" element={<MembersDebugTool />} />

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Server, Database, Code } from 'lucide-react';

const MembersDebugTool = () => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  const testEndpoint = async (url, description) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      console.log(`Testing: ${description} - ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      return {
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        message: description,
        data: data,
        dataType: Array.isArray(data) ? 'array' : typeof data,
        count: data?.count || (Array.isArray(data) ? data.length : 0),
        hasResults: !!data?.results,
        resultsCount: data?.results?.length || 0
      };
    } catch (error) {
      return {
        status: 'error',
        message: description,
        error: error.message
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    
    const baseURL = 'http://localhost:8000/api/v1';
    const tests = [
      {
        key: 'members',
        url: `${baseURL}/members/`,
        description: 'Main Members List'
      },
      {
        key: 'membersPaginated',
        url: `${baseURL}/members/?page=1&page_size=25&ordering=-registration_date`,
        description: 'Members with Pagination'
      },
      {
        key: 'recent',
        url: `${baseURL}/members/recent/?limit=5`,
        description: 'Recent Members'
      },
      {
        key: 'statistics',
        url: `${baseURL}/members/statistics/?range=30d`,
        description: 'Member Statistics'
      },
      {
        key: 'health',
        url: `${baseURL}/core/dashboard/health/`,
        description: 'System Health'
      }
    ];

    const results = {};
    
    for (const test of tests) {
      const result = await testEndpoint(test.url, test.description);
      results[test.key] = result;
      
      if (test.key === 'members' || test.key === 'membersPaginated') {
        setApiResponse(result.data);
      }
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-500" size={16} />;
      case 'error': return <AlertCircle className="text-red-500" size={16} />;
      default: return <AlertCircle className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Members API Debug Tool</h1>
              <p className="text-blue-100 mt-1">Test your Django API endpoints</p>
            </div>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={16} className={isRunning ? 'animate-spin' : ''} />
              {isRunning ? 'Testing...' : 'Run Tests'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="p-6 space-y-4">
          {Object.entries(testResults).map(([key, result]) => (
            <div
              key={key}
              className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    {result.message}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Status: {result.statusCode} • 
                    Type: {result.dataType} • 
                    Count: {result.count}
                    {result.hasResults && ` • Results: ${result.resultsCount}`}
                  </p>
                </div>
              </div>
              
              {result.error && (
                <div className="mt-2 text-sm text-red-600">
                  Error: {result.error}
                </div>
              )}
              
              {result.data && result.status === 'success' && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium">Show Response</summary>
                  <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-x-auto max-h-48">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Analysis */}
        {apiResponse && (
          <div className="border-t p-6 bg-gray-50">
            <h3 className="font-medium mb-3">Response Analysis</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Data Structure:</strong>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• Has 'results' array: {apiResponse.results ? 'Yes' : 'No'}</li>
                  <li>• Has 'count' field: {apiResponse.count !== undefined ? 'Yes' : 'No'}</li>
                  <li>• Has 'next/previous': {apiResponse.next !== undefined ? 'Yes' : 'No'}</li>
                  <li>• Is paginated: {apiResponse.results && apiResponse.count !== undefined ? 'Yes' : 'No'}</li>
                </ul>
              </div>
              <div>
                <strong>Member Data:</strong>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• Total records: {apiResponse.count || (Array.isArray(apiResponse) ? apiResponse.length : 0)}</li>
                  <li>• Current page: {apiResponse.results?.length || 0}</li>
                  <li>• Has members: {(apiResponse.results?.length || 0) > 0 ? 'Yes' : 'No'}</li>
                  <li>• First member: {apiResponse.results?.[0]?.first_name || 'None'}</li>
                </ul>
              </div>
            </div>
            
            {apiResponse.results?.length > 0 && (
              <div className="mt-4">
                <strong className="text-sm">Sample Member Fields:</strong>
                <div className="mt-1 text-xs bg-white p-2 rounded border">
                  {Object.keys(apiResponse.results[0]).join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Fixes */}
        <div className="border-t p-6">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('authToken');
                alert('Tokens cleared. Please login again.');
              }}
              className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Clear Auth Tokens
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                console.log('Auth State:', {
                  access_token: localStorage.getItem('access_token'),
                  authToken: localStorage.getItem('authToken'),
                  user: localStorage.getItem('user')
                });
              }}
              className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Log Auth State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersDebugTool;