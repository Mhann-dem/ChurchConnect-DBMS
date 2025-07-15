import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, TrendingUp, Percent, BarChart3 } from 'lucide-react';

const AgeDistributionChart = ({ 
  data = [], 
  title = "Age Distribution", 
  showPercentages = true,
  chartType = "pie" // "pie" or "bar"
}) => {
  const [chartData, setChartData] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [averageAge, setAverageAge] = useState(0);

  // Default age groups if no data provided
  const defaultAgeGroups = [
    { ageGroup: '0-17', count: 0, percentage: 0 },
    { ageGroup: '18-25', count: 0, percentage: 0 },
    { ageGroup: '26-40', count: 0, percentage: 0 },
    { ageGroup: '41-60', count: 0, percentage: 0 },
    { ageGroup: '61-80', count: 0, percentage: 0 },
    { ageGroup: '80+', count: 0, percentage: 0 }
  ];

  // Color palette for age groups
  const COLORS = [
    '#8884d8', // 0-17 - Light purple
    '#82ca9d', // 18-25 - Light green
    '#ffc658', // 26-40 - Yellow
    '#ff7300', // 41-60 - Orange
    '#8dd1e1', // 61-80 - Light blue
    '#d084d0'  // 80+ - Pink
  ];

  useEffect(() => {
    if (data && data.length > 0) {
      const processedData = processAgeData(data);
      setChartData(processedData);
      calculateStats(processedData);
    } else {
      setChartData(defaultAgeGroups);
      setTotalMembers(0);
      setAverageAge(0);
    }
  }, [data]);

  const processAgeData = (rawData) => {
    const total = rawData.reduce((sum, item) => sum + item.count, 0);
    setTotalMembers(total);

    return rawData.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0
    }));
  };

  const calculateStats = (processedData) => {
    // Calculate weighted average age using midpoint of each age group
    const ageGroupMidpoints = {
      '0-17': 8.5,
      '18-25': 21.5,
      '26-40': 33,
      '41-60': 50.5,
      '61-80': 70.5,
      '80+': 85
    };

    let totalWeightedAge = 0;
    let totalCount = 0;

    processedData.forEach(item => {
      const midpoint = ageGroupMidpoints[item.ageGroup] || 0;
      totalWeightedAge += midpoint * item.count;
      totalCount += item.count;
    });

    const avgAge = totalCount > 0 ? (totalWeightedAge / totalCount).toFixed(1) : 0;
    setAverageAge(avgAge);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`Age Group: ${data.ageGroup}`}</p>
          <p className="text-blue-600">{`Members: ${data.count}`}</p>
          {showPercentages && (
            <p className="text-green-600">{`Percentage: ${data.percentage}%`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">
              {entry.value}: {chartData.find(d => d.ageGroup === entry.value)?.count || 0}
              {showPercentages && (
                <span className="text-gray-500 ml-1">
                  ({chartData.find(d => d.ageGroup === entry.value)?.percentage || 0}%)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const StatCard = ({ icon: Icon, title, value, subtitle }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <Icon className="w-8 h-8 text-blue-500" />
      </div>
    </div>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percentage }) => showPercentages ? `${percentage}%` : null}
          outerRadius={120}
          fill="#8884d8"
          dataKey="count"
          nameKey="ageGroup"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="ageGroup" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5" />
          {title}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={`Switch to ${chartType === 'pie' ? 'Bar' : 'Pie'} Chart`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={Users}
          title="Total Members"
          value={totalMembers.toLocaleString()}
          subtitle="All age groups"
        />
        <StatCard
          icon={TrendingUp}
          title="Average Age"
          value={averageAge}
          subtitle="years"
        />
        <StatCard
          icon={Percent}
          title="Largest Group"
          value={chartData.length > 0 ? chartData.reduce((prev, current) => 
            prev.count > current.count ? prev : current
          ).ageGroup : 'N/A'}
          subtitle={chartData.length > 0 ? `${chartData.reduce((prev, current) => 
            prev.count > current.count ? prev : current
          ).percentage}%` : ''}
        />
      </div>

      {/* Chart */}
      <div className="mb-4">
        {chartType === 'pie' ? renderPieChart() : renderBarChart()}
      </div>

      {/* Age Group Breakdown Table */}
      <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-700 mb-3">Age Group Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-600">Age Group</th>
                <th className="text-right py-2 px-3 text-gray-600">Members</th>
                <th className="text-right py-2 px-3 text-gray-600">Percentage</th>
                <th className="text-left py-2 px-3 text-gray-600">Visual</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, index) => (
                <tr key={item.ageGroup} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium text-gray-800">{item.ageGroup}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{item.count}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{item.percentage}%</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${item.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      {chartData.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Key Insights</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Most members are in the {chartData.reduce((prev, current) => 
              prev.count > current.count ? prev : current
            ).ageGroup} age group ({chartData.reduce((prev, current) => 
              prev.count > current.count ? prev : current
            ).percentage}%)</li>
            <li>• Average congregation age is {averageAge} years</li>
            <li>• {chartData.filter(group => ['0-17', '18-25'].includes(group.ageGroup))
              .reduce((sum, group) => sum + parseInt(group.count), 0)} members are under 26 years old</li>
            <li>• {chartData.filter(group => ['61-80', '80+'].includes(group.ageGroup))
              .reduce((sum, group) => sum + parseInt(group.count), 0)} members are over 60 years old</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AgeDistributionChart;