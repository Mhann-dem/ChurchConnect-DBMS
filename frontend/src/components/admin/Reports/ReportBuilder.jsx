import React, { useState, useEffect } from 'react';
import { Card, Button, Tabs, Checkbox } from '../ui';
import { useForm } from '../../hooks/useForm';
import { useReports } from '../../hooks/useReports';
import Input from '../form/FormControls/Input';
import Select from '../form/FormControls/Select';
import TextArea from '../form/FormControls/TextArea';
import DatePicker from '../form/FormControls/DatePicker';
import { MemberGrowthChart, PledgeChart, AgeDistributionChart, MinistryChart } from './Charts';
import { validation } from '../../utils/validation';
import styles from './Reports.module.css';

const ReportBuilder = ({ reportId, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [previewData, setPreviewData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { createReport, updateReport, getReportPreview } = useReports();

  const initialData = {
    name: '',
    description: '',
    type: 'members',
    format: 'csv',
    status: 'draft',
    filters: {
      dateRange: {
        start: '',
        end: ''
      },
      ageRange: {
        min: '',
        max: ''
      },
      groups: [],
      pledgeStatus: 'all',
      memberStatus: 'active'
    },
    fields: {
      members: {
        basic: ['first_name', 'last_name', 'email', 'phone'],
        contact: ['address', 'emergency_contact_name', 'emergency_contact_phone'],
        demographic: ['date_of_birth', 'gender', 'preferred_language'],
        engagement: ['registration_date', 'last_contact_date', 'groups'],
        custom: []
      },
      pledges: {
        basic: ['member_name', 'amount', 'frequency', 'status'],
        dates: ['start_date', 'end_date', 'created_at'],
        details: ['notes', 'payment_method'],
        custom: []
      },
      groups: {
        basic: ['name', 'description', 'leader_name'],
        members: ['member_count', 'active_members'],
        schedule: ['meeting_schedule', 'location'],
        custom: []
      }
    },
    schedule: {
      enabled: false,
      frequency: 'monthly',
      day: 1,
      time: '09:00',
      recipients: []
    },
    visualization: {
      enabled: false,
      chartType: 'bar',
      groupBy: 'registration_date',
      aggregation: 'count'
    }
  };

  const {
    formData,
    errors,
    isValid,
    handleChange,
    handleSubmit,
    setFieldValue,
    resetForm
  } = useForm(initialData, {
    name: validation.required('Report name is required'),
    type: validation.required('Report type is required'),
    format: validation.required('Format is required')
  });

  useEffect(() => {
    if (reportId) {
      // Load existing report data
      // This would typically come from an API call
    }
  }, [reportId]);

  const handleFieldToggle = (category, field) => {
    const currentFields = formData.fields[formData.type][category] || [];
    const updatedFields = currentFields.includes(field)
      ? currentFields.filter(f => f !== field)
      : [...currentFields, field];
    
    setFieldValue(`fields.${formData.type}.${category}`, updatedFields);
  };

  const handleFilterChange = (filterType, value) => {
    setFieldValue(`filters.${filterType}`, value);
  };

  const handlePreview = async () => {
    setIsGenerating(true);
    try {
      const preview = await getReportPreview(formData);
      setPreviewData(preview);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReport = async (data) => {
    try {
      if (reportId) {
        await updateReport(reportId, data);
      } else {
        await createReport(data);
      }
      onSave && onSave();
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const availableFields = {
    members: {
      basic: [
        { value: 'first_name', label: 'First Name' },
        { value: 'last_name', label: 'Last Name' },
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
        { value: 'preferred_name', label: 'Preferred Name' }
      ],
      contact: [
        { value: 'address', label: 'Address' },
        { value: 'alternate_phone', label: 'Alternate Phone' },
        { value: 'emergency_contact_name', label: 'Emergency Contact Name' },
        { value: 'emergency_contact_phone', label: 'Emergency Contact Phone' },
        { value: 'preferred_contact_method', label: 'Preferred Contact Method' }
      ],
      demographic: [
        { value: 'date_of_birth', label: 'Date of Birth' },
        { value: 'gender', label: 'Gender' },
        { value: 'preferred_language', label: 'Preferred Language' },
        { value: 'accessibility_needs', label: 'Accessibility Needs' }
      ],
      engagement: [
        { value: 'registration_date', label: 'Registration Date' },
        { value: 'last_contact_date', label: 'Last Contact Date' },
        { value: 'groups', label: 'Groups/Ministries' },
        { value: 'pledge_status', label: 'Pledge Status' },
        { value: 'communication_opt_in', label: 'Communication Opt-in' }
      ]
    },
    pledges: {
      basic: [
        { value: 'member_name', label: 'Member Name' },
        { value: 'amount', label: 'Amount' },
        { value: 'frequency', label: 'Frequency' },
        { value: 'status', label: 'Status' }
      ],
      dates: [
        { value: 'start_date', label: 'Start Date' },
        { value: 'end_date', label: 'End Date' },
        { value: 'created_at', label: 'Created Date' }
      ],
      details: [
        { value: 'notes', label: 'Notes' },
        { value: 'payment_method', label: 'Payment Method' }
      ]
    },
    groups: {
      basic: [
        { value: 'name', label: 'Group Name' },
        { value: 'description', label: 'Description' },
        { value: 'leader_name', label: 'Leader Name' }
      ],
      members: [
        { value: 'member_count', label: 'Total Members' },
        { value: 'active_members', label: 'Active Members' }
      ],
      schedule: [
        { value: 'meeting_schedule', label: 'Meeting Schedule' },
        { value: 'location', label: 'Location' }
      ]
    }
  };

  const renderBasicSettings = () => (
    <div className={styles.tabContent}>
      <div className={styles.formGroup}>
        <Input
          label="Report Name"
          value={formData.name}
          onChange={(value) => handleChange('name', value)}
          error={errors.name}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <TextArea
          label="Description"
          value={formData.description}
          onChange={(value) => handleChange('description', value)}
          placeholder="Describe what this report contains..."
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <Select
            label="Report Type"
            value={formData.type}
            onChange={(value) => handleChange('type', value)}
            options={[
              { value: 'members', label: 'Members Report' },
              { value: 'pledges', label: 'Pledges Report' },
              { value: 'groups', label: 'Groups Report' },
              { value: 'attendance', label: 'Attendance Report' },
              { value: 'custom', label: 'Custom Report' }
            ]}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            label="Format"
            value={formData.format}
            onChange={(value) => handleChange('format', value)}
            options={[
              { value: 'csv', label: 'CSV' },
              { value: 'excel', label: 'Excel' },
              { value: 'pdf', label: 'PDF' },
              { value: 'json', label: 'JSON' }
            ]}
            required
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <Select
          label="Status"
          value={formData.status}
          onChange={(value) => handleChange('status', value)}
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'active', label: 'Active' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'archived', label: 'Archived' }
          ]}
        />
      </div>
    </div>
  );

  const renderFieldSelection = () => (
    <div className={styles.tabContent}>
      <p className={styles.sectionDescription}>
        Select the fields you want to include in your report:
      </p>
      
      {Object.entries(availableFields[formData.type] || {}).map(([category, fields]) => (
        <div key={category} className={styles.fieldCategory}>
          <h4 className={styles.categoryTitle}>
            {category.charAt(0).toUpperCase() + category.slice(1)} Information
          </h4>
          <div className={styles.fieldGrid}>
            {fields.map(field => (
              <Checkbox
                key={field.value}
                label={field.label}
                checked={formData.fields[formData.type][category]?.includes(field.value) || false}
                onChange={() => handleFieldToggle(category, field.value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderFilters = () => (
    <div className={styles.tabContent}>
      <div className={styles.filterSection}>
        <h4>Date Range</h4>
        <div className={styles.formRow}>
          <DatePicker
            label="Start Date"
            value={formData.filters.dateRange.start}
            onChange={(value) => handleFilterChange('dateRange.start', value)}
          />
          <DatePicker
            label="End Date"
            value={formData.filters.dateRange.end}
            onChange={(value) => handleFilterChange('dateRange.end', value)}
          />
        </div>
      </div>

      {formData.type === 'members' && (
        <>
          <div className={styles.filterSection}>
            <h4>Age Range</h4>
            <div className={styles.formRow}>
              <Input
                label="Minimum Age"
                type="number"
                value={formData.filters.ageRange.min}
                onChange={(value) => handleFilterChange('ageRange.min', value)}
              />
              <Input
                label="Maximum Age"
                type="number"
                value={formData.filters.ageRange.max}
                onChange={(value) => handleFilterChange('ageRange.max', value)}
              />
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Member Status</h4>
            <Select
              value={formData.filters.memberStatus}
              onChange={(value) => handleFilterChange('memberStatus', value)}
              options={[
                { value: 'all', label: 'All Members' },
                { value: 'active', label: 'Active Only' },
                { value: 'inactive', label: 'Inactive Only' }
              ]}
            />
          </div>
        </>
      )}

      {formData.type === 'pledges' && (
        <div className={styles.filterSection}>
          <h4>Pledge Status</h4>
          <Select
            value={formData.filters.pledgeStatus}
            onChange={(value) => handleFilterChange('pledgeStatus', value)}
            options={[
              { value: 'all', label: 'All Pledges' },
              { value: 'active', label: 'Active Only' },
              { value: 'completed', label: 'Completed Only' },
              { value: 'cancelled', label: 'Cancelled Only' }
            ]}
          />
        </div>
      )}
    </div>
  );

  const renderScheduling = () => (
    <div className={styles.tabContent}>
      <div className={styles.formGroup}>
        <Checkbox
          label="Enable Automatic Scheduling"
          checked={formData.schedule.enabled}
          onChange={(value) => setFieldValue('schedule.enabled', value)}
        />
      </div>

      {formData.schedule.enabled && (
        <>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <Select
                label="Frequency"
                value={formData.schedule.frequency}
                onChange={(value) => setFieldValue('schedule.frequency', value)}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'annually', label: 'Annually' }
                ]}
              />
            </div>

            <div className={styles.formGroup}>
              <Input
                label="Day"
                type="number"
                min="1"
                max="31"
                value={formData.schedule.day}
                onChange={(value) => setFieldValue('schedule.day', value)}
              />
            </div>

            <div className={styles.formGroup}>
              <Input
                label="Time"
                type="time"
                value={formData.schedule.time}
                onChange={(value) => setFieldValue('schedule.time', value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <TextArea
              label="Recipients (comma-separated emails)"
              value={formData.schedule.recipients.join(', ')}
              onChange={(value) => setFieldValue('schedule.recipients', value.split(',').map(e => e.trim()))}
              placeholder="admin@church.org, pastor@church.org"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderVisualization = () => (
    <div className={styles.tabContent}>
      <div className={styles.formGroup}>
        <Checkbox
          label="Enable Data Visualization"
          checked={formData.visualization.enabled}
          onChange={(value) => setFieldValue('visualization.enabled', value)}
        />
      </div>

      {formData.visualization.enabled && (
        <>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <Select
                label="Chart Type"
                value={formData.visualization.chartType}
                onChange={(value) => setFieldValue('visualization.chartType', value)}
                options={[
                  { value: 'bar', label: 'Bar Chart' },
                  { value: 'line', label: 'Line Chart' },
                  { value: 'pie', label: 'Pie Chart' },
                  { value: 'area', label: 'Area Chart' }
                ]}
              />
            </div>

            <div className={styles.formGroup}>
              <Select
                label="Group By"
                value={formData.visualization.groupBy}
                onChange={(value) => setFieldValue('visualization.groupBy', value)}
                options={[
                  { value: 'registration_date', label: 'Registration Date' },
                  { value: 'age_group', label: 'Age Group' },
                  { value: 'gender', label: 'Gender' },
                  { value: 'groups', label: 'Groups' }
                ]}
              />
            </div>
          </div>

          <div className={styles.chartPreview}>
            <h4>Chart Preview</h4>
            {formData.type === 'members' && <MemberGrowthChart />}
            {formData.type === 'pledges' && <PledgeChart />}
            {formData.type === 'groups' && <MinistryChart />}
          </div>
        </>
      )}
    </div>
  );

  const renderPreview = () => (
    <div className={styles.tabContent}>
      <div className={styles.previewHeader}>
        <h4>Report Preview</h4>
        <Button
          onClick={handlePreview}
          disabled={isGenerating}
          variant="secondary"
        >
          {isGenerating ? 'Generating...' : 'Generate Preview'}
        </Button>
      </div>

      {previewData && (
        <div className={styles.previewData}>
          <div className={styles.previewStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{previewData.recordCount}</span>
              <span className={styles.statLabel}>Total Records</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{previewData.fieldCount}</span>
              <span className={styles.statLabel}>Fields</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{previewData.estimatedSize}</span>
              <span className={styles.statLabel}>Estimated Size</span>
            </div>
          </div>

          <div className={styles.previewTable}>
            <table>
              <thead>
                <tr>
                  {previewData.headers.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.sampleData.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'basic', label: 'Basic Settings', content: renderBasicSettings },
    { id: 'fields', label: 'Field Selection', content: renderFieldSelection },
    { id: 'filters', label: 'Filters', content: renderFilters },
    { id: 'schedule', label: 'Scheduling', content: renderScheduling },
    { id: 'visualization', label: 'Visualization', content: renderVisualization },
    { id: 'preview', label: 'Preview', content: renderPreview }
  ];

  return (
    <div className={styles.reportBuilder}>
      <div className={styles.builderHeader}>
        <h2>{reportId ? 'Edit Report' : 'Create New Report'}</h2>
        <div className={styles.builderActions}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSubmit(handleSaveReport)}
            disabled={!isValid}
          >
            {reportId ? 'Update Report' : 'Create Report'}
          </Button>
        </div>
      </div>

      <Card className={styles.builderCard}>
        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />
      </Card>
    </div>
  );
};

export default ReportBuilder;