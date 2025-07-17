import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import Button from '../../../ui/Button';
import Tabs from '../../../ui/Tabs';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Calendar,
  Target,
  Download,
  RefreshCw
} from 'lucide-react';

const MinistryChart = ({ 
  data = [], 
  timeRange = '6months',
  showEngagement = true,
  showTrends = true,
  exportCallback,
  onMinistryClick
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  // Color palette for different ministries
  const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280',
    '#14B8A6', '#F472B6', '#A78BFA', '#34D399', '#FBBF24'
  ];

  // Mock data structure for demonstration
  const mockData = [
    {
      name: 'Youth Ministry',
      members: 45,
      active: 38,
      engagement: 84,
      events: 12,
      growth: 15,
      leader: 'Sarah Johnson',
      meetingFrequency: 'Weekly',
      lastActivity: '2 days ago',
      trend: 'up'
    },
    {
      name: 'Children\'s Ministry',
      members: 62,
      active: 55,
      engagement: 89,
      events: 18,
      growth: 22,
      leader: 'Michael Chen',
      meetingFrequency: 'Weekly',
      lastActivity: '1 day ago',
      trend: 'up'
    },
    {
      name: 'Senior Adults',
      members: 38,
      active: 32,
      engagement: 76,
      events: 8,
      growth: -2,
      leader: 'Dorothy Williams',
      meetingFrequency: 'Bi-weekly',
      lastActivity: '3 days ago',
      trend: 'down'
    },
    {
      name: 'Worship Team',
      members: 28,
      active: 26,
      engagement: 93,
      events: 24,
      growth: 8,
      leader: 'David Rodriguez',
      meetingFrequency: 'Weekly',
      lastActivity: '1 day ago',
      trend: 'up'
    },
    {
      name: 'Small Groups',
      members: 156,
      active: 142,
      engagement: 91,
      events: 48,
      growth: 18,
      leader: 'Multiple Leaders',
      meetingFrequency: 'Weekly',
      lastActivity: '1 day ago',
      trend: 'up'
    },
    {
      name: 'Outreach Ministry',
      members: 34,
      active: 28,
      engagement: 82,
      events: 15,
      growth: 5,
      leader: 'Patricia Davis',
      meetingFrequency: 'Monthly',
      lastActivity: '5 days ago',
      trend: 'stable'
    },
    {
      name: 'Prayer Ministry',
      members: 42,
      active: 38,
      engagement: 88,
      events: 6,
      growth: 12,
      leader: 'Robert Thompson',
      meetingFrequency: 'Weekly',
      lastActivity: '2 days ago',
      trend: 'up'
    },
    {
      name: 'Media Ministry',
      members: 15,
      active: 14,
      engagement: 87,
      events: 20,
      growth: 3,
      leader: 'Jessica Martinez',
      meetingFrequency: 'As needed',
      lastActivity: '1 day ago',
      trend: 'stable'
    }
  ];

  // Historical data for trends
  const trendData = [
    { month: 'Jan', youth: 32, children: 48, seniors: 35, worship: 24, groups: 128 },
    { month: 'Feb', youth: 35, children: 52, seniors: 36, worship: 25, groups: 135 },
    { month: 'Mar', youth: 38, children: 55, seniors: 37, worship: 26, groups: 142 },
    { month: 'Apr', youth: 41, children: 58, seniors: 38, worship: 27, groups: 148 },
    { month: 'May', youth: 43, children: 60, seniors: 38, worship: 28, groups: 152 },
    { month: 'Jun', youth: 45, children: 62, seniors: 38, worship: 28, groups: 156 }
  ];

  useEffect(() => {
    setFilteredData(data.length > 0 ? data : mockData);
  }, [data]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real implementation, this would fetch fresh data
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (exportCallback) {
      exportCallback(filteredData, activeTab);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getEngagementColor = (engagement) => {
    if (engagement >= 90) return 'bg-green-100 text-green-800';
    if (engagement >= 80) return 'bg-yellow-100 text-yellow-800';
    if (engagement >= 70) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ministry Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Ministry Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="members"
              >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engagement Levels Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Engagement Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="engagement" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderTrendsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Ministry Growth Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="youth" stroke="#3B82F6" name="Youth Ministry" />
              <Line type="monotone" dataKey="children" stroke="#10B981" name="Children's Ministry" />
              <Line type="monotone" dataKey="seniors" stroke="#F59E0B" name="Senior Adults" />
              <Line type="monotone" dataKey="worship" stroke="#EF4444" name="Worship Team" />
              <Line type="monotone" dataKey="groups" stroke="#8B5CF6" name="Small Groups" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Member vs Active Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="members" fill="#E5E7EB" name="Total Members" />
              <Bar dataKey="active" fill="#3B82F6" name="Active Members" />
              <Line type="monotone" dataKey="engagement" stroke="#EF4444" name="Engagement %" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderDetailsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredData.map((ministry, index) => (
        <Card 
          key={ministry.name} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onMinistryClick && onMinistryClick(ministry)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{ministry.name}</CardTitle>
              {getTrendIcon(ministry.trend)}
            </div>
            <p className="text-sm text-gray-600">Led by {ministry.leader}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Members</span>
              <Badge variant="secondary">{ministry.members}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active</span>
              <Badge variant="default">{ministry.active}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Engagement</span>
              <Badge className={getEngagementColor(ministry.engagement)}>
                {ministry.engagement}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Events (6mo)</span>
              <Badge variant="outline">{ministry.events}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Growth</span>
              <Badge 
                variant={ministry.growth > 0 ? 'default' : 'destructive'}
                className={ministry.growth > 0 ? 'bg-green-100 text-green-800' : ''}
              >
                {ministry.growth > 0 ? '+' : ''}{ministry.growth}%
              </Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Meets {ministry.meetingFrequency}</span>
                <span>Active {ministry.lastActivity}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSummaryStats = () => {
    const totalMembers = filteredData.reduce((sum, ministry) => sum + ministry.members, 0);
    const totalActive = filteredData.reduce((sum, ministry) => sum + ministry.active, 0);
    const avgEngagement = filteredData.reduce((sum, ministry) => sum + ministry.engagement, 0) / filteredData.length;
    const totalEvents = filteredData.reduce((sum, ministry) => sum + ministry.events, 0);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{totalMembers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold">{totalActive}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                <p className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{totalEvents}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ministry Analytics</h2>
          <p className="text-gray-600">Overview of ministry participation and engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      {renderSummaryStats()}

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderOverviewTab()}
        </TabsContent>
        
        <TabsContent value="trends" className="mt-6">
          {renderTrendsTab()}
        </TabsContent>
        
        <TabsContent value="details" className="mt-6">
          {renderDetailsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MinistryChart;