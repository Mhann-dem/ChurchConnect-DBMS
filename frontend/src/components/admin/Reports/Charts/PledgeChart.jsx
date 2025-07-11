import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart 
} from 'recharts';
import { DollarSign, TrendingUp, Users, Calendar, Target, PieChart as PieChartIcon } from 'lucide-react';

const PledgeChart = ({ data = [], isLoading = false, error = null }) => {
  const [chartType, setChartType] = useState('bar');
  const [timeRange, setTimeRange] = useState('12months');
  const [viewType, setViewType] = useState('amount'); // 'amount' or 'count'
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

  // Calculate pledge statistics
  const calculatePledgeStats = () => {
    if (!filteredData || filteredData.length === 0) return null;

    const totalAmount = filteredData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const totalCount = filteredData.reduce((sum, item) => sum + (item.pledgeCount || 0), 0);
    const avgPledge = totalCount > 0 ? totalAmount / totalCount : 0;
    
    // Calculate growth from first to last data point
    const firstPeriod = filteredData[0];
    const lastPeriod = filteredData[filteredData.length - 1];
    const growthAmount = lastPeriod.totalAmount - firstPeriod.totalAmount;
    const growthPercentage = firstPeriod.totalAmount > 0 ? 
      ((growthAmount / firstPeriod.totalAmount) * 100).toFixed(1) : 0;

    return {
      totalAmount,
      totalCount,
      avgPledge,
      growthAmount,
      growthPercentage
    };
  };

  const pledgeStats = calculatePledgeStats();

  // Process data for frequency distribution pie chart
  const processFrequencyData = () => {
    if (!data || data.length === 0) return [];

    const frequencyMap = {};
    data.forEach(item => {
      if (item.frequency) {
        Object.entries(item.frequency).forEach(([freq, count]) => {
          frequencyMap[freq] = (frequencyMap[freq] || 0) + count;
        });
      }
    });

    return Object.entries(frequencyMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: ((value / Object.values(frequencyMap).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
    }));
  };

  const frequencyData = processFrequencyData();

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Custom tooltip for monetary values
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: `}
              {entry.dataKey === 'totalAmount' || entry.dataKey === 'avgAmount' ? 
                `$${entry.value.toLocaleString()}` : 
                entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Pledge Analytics</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* View Type */}
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="amount">Amount View</option>
            <option value="count">Count View</option>
          </select>

          {/* Time Range */}
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

          {/* Chart Type */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="pie">Frequency Distribution</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      {pledgeStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${pledgeStats.totalAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Pledges</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{pledgeStats.totalCount}</div>
            <div className="text-sm text-gray-600">Total Pledgers</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              ${pledgeStats.avgPledge.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Avg Pledge</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className={`text-2xl font-bold ${pledgeStats.growthAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pledgeStats.growthAmount >= 0 ? '+' : ''}{pledgeStats.growthPercentage}%
            </div>
            <div className="text-sm text-gray-600">Growth Rate</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
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
              <Bar 
                dataKey={viewType === 'amount' ? 'totalAmount' : 'pledgeCount'} 
                fill="#10b981" 
                name={viewType === 'amount' ? 'Total Amount' : 'Pledge Count'}
              />
            </BarChart>
          ) : chartType === 'line' ? (
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
                dataKey={viewType === 'amount' ? 'totalAmount' : 'pledgeCount'}
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={viewType === 'amount' ? 'Total Amount' : 'Pledge Count'}
              />
            </LineChart>
          ) : chartType === 'area' ? (
            <AreaChart
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
              <Area
                type="monotone"
                dataKey={viewType === 'amount' ? 'totalAmount' : 'pledgeCount'}
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name={viewType === 'amount' ? 'Total Amount' : 'Pledge Count'}
              />
            </AreaChart>
          ) : (
            <PieChart>
              <Pie
                data={frequencyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {frequencyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `${label}: ${frequencyData.find(d => d.name === label)?.percentage}%`}
              />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Frequency Distribution Legend (for pie chart) */}
      {chartType === 'pie' && frequencyData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {frequencyData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-sm text-gray-700">
                {entry.name}: {entry.value} ({entry.percentage}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {(!filteredData || filteredData.length === 0) && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No pledge data available</p>
          <p className="text-sm text-gray-500 mt-2">
            Data will appear here once members start making pledges
          </p>
        </div>
      )}
    </div>
  );
};

export default PledgeChart;