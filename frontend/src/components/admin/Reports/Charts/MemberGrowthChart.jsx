import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, TrendingUp, Users, Filter } from 'lucide-react';

const MemberGrowthChart = ({ data = [], isLoading = false, error = null }) => {
  const [timeRange, setTimeRange] = useState('12months');
  const [chartType, setChartType] = useState('line');
  const [filteredData, setFilteredData] = useState([]);

  // Filter data based on selected time range
  useEffect(() => {
    if (!data || data.length === 0) return;

    const now = new Date();
    let filtered = [...data];

    switch (timeRange) {
      case '3months':
        filtered = data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= new Date(now.getFullYear(), now.getMonth() - 3, 1);
        });
        break;
      case '6months':
        filtered = data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= new Date(now.getFullYear(), now.getMonth() - 6, 1);
        });
        break;
      case '12months':
        filtered = data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= new Date(now.getFullYear() - 1, now.getMonth(), 1);
        });
        break;
      case '24months':
        filtered = data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= new Date(now.getFullYear() - 2, now.getMonth(), 1);
        });
        break;
      default:
        filtered = data;
    }

    setFilteredData(filtered);
  }, [data, timeRange]);

  // Calculate growth statistics
  const calculateGrowthStats = () => {
    if (!filteredData || filteredData.length < 2) return null;

    const latest = filteredData[filteredData.length - 1];
    const previous = filteredData[filteredData.length - 2];
    
    const totalGrowth = latest.totalMembers - filteredData[0].totalMembers;
    const monthlyGrowth = latest.totalMembers - previous.totalMembers;
    const growthPercentage = ((totalGrowth / filteredData[0].totalMembers) * 100).toFixed(1);

    return {
      totalMembers: latest.totalMembers,
      totalGrowth,
      monthlyGrowth,
      growthPercentage,
      averageMonthlyGrowth: (totalGrowth / filteredData.length).toFixed(1)
    };
  };

  const growthStats = calculateGrowthStats();

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          <p className="text-blue-600">
            {`Total Members: ${payload[0].value}`}
          </p>
          {payload[1] && (
            <p className="text-green-600">
              {`New Members: ${payload[1].value}`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error Loading Chart</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-0">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Member Growth</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
            <option value="24months">Last 24 Months</option>
            <option value="all">All Time</option>
          </select>

          {/* Chart Type Selector */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      {/* Growth Statistics */}
      {growthStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{growthStats.totalMembers}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">+{growthStats.totalGrowth}</div>
            <div className="text-sm text-gray-600">Growth ({timeRange})</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{growthStats.growthPercentage}%</div>
            <div className="text-sm text-gray-600">Growth Rate</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{growthStats.averageMonthlyGrowth}</div>
            <div className="text-sm text-gray-600">Avg/Month</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart
              data={filteredData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                }}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalMembers"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Total Members"
              />
              <Line
                type="monotone"
                dataKey="newMembers"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="New Members"
              />
            </LineChart>
          ) : (
            <BarChart
              data={filteredData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
                }}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="newMembers" fill="#10b981" name="New Members" />
              <Bar dataKey="totalMembers" fill="#3b82f6" name="Total Members" opacity={0.6} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Empty State */}
      {(!filteredData || filteredData.length === 0) && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No member growth data available</p>
          <p className="text-sm text-gray-500 mt-2">
            Data will appear here once members start registering
          </p>
        </div>
      )}
    </div>
  );
};

export default MemberGrowthChart;