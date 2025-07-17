import React, { useState, useEffect } from 'react';
import { Download, Calendar, Users, DollarSign, TrendingUp, Filter } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/form/FormControls/Select';
import Checkbox from '../../components/form/FormControls/Checkbox';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import reportsService from '../../services/reports';
import MemberGrowthChart from '../../components/admin/Reports/Charts/MemberGrowthChart';
import PledgeChart from '../../components/admin/Reports/Charts/PledgeChart';
import AgeDistributionChart from '../../components/admin/Reports/Charts/AgeDistributionChart';
import MinistryChart from '../../components/admin/Reports/Charts/MinistryChart';


const ReportsPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    memberGrowth: [],
    pledgeStats: [],
    ageDistribution: [],
    ministryDistribution: []
  });

  const [filters, setFilters] = useState({
    dateRange: '30',
    reportType: 'overview',
    includeInactive: false,
    groupBy: 'month'
  });

  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    includeCharts: true,
    includeDetails: true
  });

  const [quickReports] = useState([
    { id: 'member-list', name: 'Member List', description: 'Complete member directory' },
    { id: 'pledge-summary', name: 'Pledge Summary', description: 'Financial pledges overview' },
    { id: 'group-membership', name: 'Group Membership', description: 'Members by ministry/group' },
    { id: 'attendance-report', name: 'Attendance Report', description: 'Recent attendance data' },
    { id: 'birthday-list', name: 'Birthday List', description: 'Upcoming birthdays' },
    { id: 'contact-report', name: 'Contact Report', description: 'Member contact information' }
  ]);

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [memberGrowth, pledgeStats, ageDistribution, ministryDistribution] = await Promise.all([
        reportsService.getMemberGrowth(filters),
        reportsService.getPledgeStats(filters),
        reportsService.getAgeDistribution(filters),
        reportsService.getMinistryDistribution(filters)
      ]);

      setReportData({
        memberGrowth: memberGrowth.data,
        pledgeStats: pledgeStats.data,
        ageDistribution: ageDistribution.data,
        ministryDistribution: ministryDistribution.data
      });
    } catch (error) {
      showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async (reportId) => {
    try {
      setLoading(true);
      const response = await reportsService.exportReport(reportId, exportOptions);
      
      // Create download link
      const blob = new Blob([response.data], { 
        type: exportOptions.format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportId}-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('Report exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReport = (reportId) => {
    // TODO: Implement report scheduling
    showToast('Report scheduling feature coming soon', 'info');
  };

  const dateRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 3 months' },
    { value: '365', label: 'Last year' },
    { value: 'all', label: 'All time' }
  ];

  const reportTypeOptions = [
    { value: 'overview', label: 'Overview' },
    { value: 'detailed', label: 'Detailed' },
    { value: 'summary', label: 'Summary' }
  ];

  const groupByOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and view reports on member data and church statistics</p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Date Range"
              value={filters.dateRange}
              onChange={(value) => handleFilterChange('dateRange', value)}
              options={dateRangeOptions}
            />
            <Select
              label="Report Type"
              value={filters.reportType}
              onChange={(value) => handleFilterChange('reportType', value)}
              options={reportTypeOptions}
            />
            <Select
              label="Group By"
              value={filters.groupBy}
              onChange={(value) => handleFilterChange('groupBy', value)}
              options={groupByOptions}
            />
            <div className="flex items-end">
              <Checkbox
                label="Include Inactive Members"
                checked={filters.includeInactive}
                onChange={(checked) => handleFilterChange('includeInactive', checked)}
              />
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Quick Reports */}
      <Card className="mb-8">
        <Card.Header>
          <Card.Title>Quick Reports</Card.Title>
          <Card.Description>
            Generate commonly used reports with one click
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-2">{report.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleExport(report.id)}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScheduleReport(report.id)}
                    className="flex items-center gap-1"
                  >
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Charts and Analytics */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Member Growth
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <MemberGrowthChart data={reportData.memberGrowth} />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pledge Statistics
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <PledgeChart data={reportData.pledgeStats} />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Age Distribution
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <AgeDistributionChart data={reportData.ageDistribution} />
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Ministry Distribution</Card.Title>
            </Card.Header>
            <Card.Content>
              <MinistryChart data={reportData.ministryDistribution} />
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Export Options */}
      <Card className="mt-8">
        <Card.Header>
          <Card.Title>Export Options</Card.Title>
          <Card.Description>
            Configure how reports are exported
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Format"
              value={exportOptions.format}
              onChange={(value) => setExportOptions(prev => ({ ...prev, format: value }))}
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'pdf', label: 'PDF' },
                { value: 'excel', label: 'Excel' }
              ]}
            />
            <div className="space-y-2">
              <Checkbox
                label="Include Charts"
                checked={exportOptions.includeCharts}
                onChange={(checked) => setExportOptions(prev => ({ ...prev, includeCharts: checked }))}
              />
              <Checkbox
                label="Include Details"
                checked={exportOptions.includeDetails}
                onChange={(checked) => setExportOptions(prev => ({ ...prev, includeDetails: checked }))}
              />
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default ReportsPage;
