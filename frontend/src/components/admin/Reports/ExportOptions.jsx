import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Users, DollarSign, Filter, Settings, Clock, Mail } from 'lucide-react';
import styles from './Reports.module.css';

const ExportOptions = ({ 
  reportType = 'members', 
  data = [], 
  onExport, 
  isLoading = false,
  className = '' 
}) => {
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
    includeFields: [],
    filterOptions: {
      activeOnly: true,
      includeInactive: false,
      groupFilter: 'all',
      pledgeStatus: 'all',
      ageRange: 'all'
    },
    scheduledExport: {
      enabled: false,
      frequency: 'weekly',
      email: '',
      time: '09:00'
    }
  });

  const [availableFields, setAvailableFields] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);

  // Define available fields based on report type
  useEffect(() => {
    const fieldsByType = {
      members: [
        { key: 'firstName', label: 'First Name', default: true },
        { key: 'lastName', label: 'Last Name', default: true },
        { key: 'email', label: 'Email Address', default: true },
        { key: 'phone', label: 'Phone Number', default: true },
        { key: 'dateOfBirth', label: 'Date of Birth', default: false },
        { key: 'gender', label: 'Gender', default: false },
        { key: 'address', label: 'Address', default: false },
        { key: 'registrationDate', label: 'Registration Date', default: true },
        { key: 'groups', label: 'Groups/Ministries', default: true },
        { key: 'pledgeAmount', label: 'Pledge Amount', default: false },
        { key: 'preferredContact', label: 'Preferred Contact Method', default: false },
        { key: 'emergencyContact', label: 'Emergency Contact', default: false },
        { key: 'notes', label: 'Notes', default: false }
      ],
      pledges: [
        { key: 'memberName', label: 'Member Name', default: true },
        { key: 'amount', label: 'Pledge Amount', default: true },
        { key: 'frequency', label: 'Frequency', default: true },
        { key: 'startDate', label: 'Start Date', default: true },
        { key: 'endDate', label: 'End Date', default: true },
        { key: 'status', label: 'Status', default: true },
        { key: 'totalPaid', label: 'Total Paid', default: true },
        { key: 'remaining', label: 'Remaining Balance', default: true },
        { key: 'lastPayment', label: 'Last Payment Date', default: false },
        { key: 'notes', label: 'Notes', default: false }
      ],
      groups: [
        { key: 'groupName', label: 'Group Name', default: true },
        { key: 'memberCount', label: 'Member Count', default: true },
        { key: 'leaderName', label: 'Leader Name', default: true },
        { key: 'meetingSchedule', label: 'Meeting Schedule', default: true },
        { key: 'description', label: 'Description', default: false },
        { key: 'memberNames', label: 'Member Names', default: true },
        { key: 'createdDate', label: 'Created Date', default: false },
        { key: 'activeStatus', label: 'Active Status', default: true }
      ],
      attendance: [
        { key: 'memberName', label: 'Member Name', default: true },
        { key: 'eventName', label: 'Event Name', default: true },
        { key: 'attendanceDate', label: 'Attendance Date', default: true },
        { key: 'attendanceStatus', label: 'Attendance Status', default: true },
        { key: 'groupName', label: 'Group/Ministry', default: true },
        { key: 'notes', label: 'Notes', default: false }
      ]
    };

    const fields = fieldsByType[reportType] || fieldsByType.members;
    setAvailableFields(fields);
    
    // Set default included fields
    const defaultFields = fields.filter(field => field.default).map(field => field.key);
    setExportConfig(prev => ({
      ...prev,
      includeFields: defaultFields
    }));
  }, [reportType]);

  const handleFieldToggle = (fieldKey) => {
    setExportConfig(prev => ({
      ...prev,
      includeFields: prev.includeFields.includes(fieldKey)
        ? prev.includeFields.filter(key => key !== fieldKey)
        : [...prev.includeFields, fieldKey]
    }));
  };

  const handleSelectAllFields = () => {
    const allFieldKeys = availableFields.map(field => field.key);
    setExportConfig(prev => ({
      ...prev,
      includeFields: allFieldKeys
    }));
  };

  const handleDeselectAllFields = () => {
    setExportConfig(prev => ({
      ...prev,
      includeFields: []
    }));
  };

  const handleExport = async () => {
    if (exportConfig.includeFields.length === 0) {
      alert('Please select at least one field to export.');
      return;
    }

    const exportData = {
      ...exportConfig,
      reportType,
      timestamp: new Date().toISOString(),
      recordCount: data.length
    };

    try {
      await onExport(exportData);
      
      // Add to export history
      const historyItem = {
        id: Date.now(),
        type: reportType,
        format: exportConfig.format,
        date: new Date().toISOString(),
        recordCount: data.length,
        fields: exportConfig.includeFields
      };
      
      setExportHistory(prev => [historyItem, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatOptions = [
    { value: 'csv', label: 'CSV (Comma Separated)', icon: <FileText size={16} /> },
    { value: 'xlsx', label: 'Excel Spreadsheet', icon: <FileText size={16} /> },
    { value: 'pdf', label: 'PDF Document', icon: <FileText size={16} /> },
    { value: 'json', label: 'JSON Data', icon: <FileText size={16} /> }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  return (
    <div className={`${styles.exportOptions} ${className}`}>
      <div className={styles.exportHeader}>
        <h3 className={styles.exportTitle}>
          <Download size={20} />
          Export Options
        </h3>
        <p className={styles.exportSubtitle}>
          Configure and download your {reportType} report
        </p>
      </div>

      <div className={styles.exportSections}>
        {/* Format Selection */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Export Format</h4>
          <div className={styles.formatGrid}>
            {formatOptions.map(option => (
              <label key={option.value} className={styles.formatOption}>
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={exportConfig.format === option.value}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    format: e.target.value
                  }))}
                />
                <div className={styles.formatCard}>
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <Calendar size={16} />
            Date Range
          </h4>
          <select
            value={exportConfig.dateRange}
            onChange={(e) => setExportConfig(prev => ({
              ...prev,
              dateRange: e.target.value
            }))}
            className={styles.select}
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {exportConfig.dateRange === 'custom' && (
            <div className={styles.dateInputs}>
              <input
                type="date"
                value={exportConfig.customStartDate}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  customStartDate: e.target.value
                }))}
                className={styles.dateInput}
                placeholder="Start Date"
              />
              <input
                type="date"
                value={exportConfig.customEndDate}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  customEndDate: e.target.value
                }))}
                className={styles.dateInput}
                placeholder="End Date"
              />
            </div>
          )}
        </div>

        {/* Field Selection */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>
              <Users size={16} />
              Include Fields
            </h4>
            <div className={styles.fieldActions}>
              <button
                type="button"
                onClick={handleSelectAllFields}
                className={styles.linkButton}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAllFields}
                className={styles.linkButton}
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className={styles.fieldsGrid}>
            {availableFields.map(field => (
              <label key={field.key} className={styles.fieldOption}>
                <input
                  type="checkbox"
                  checked={exportConfig.includeFields.includes(field.key)}
                  onChange={() => handleFieldToggle(field.key)}
                />
                <span className={styles.fieldLabel}>{field.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className={styles.section}>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={styles.advancedToggle}
          >
            <Settings size={16} />
            Advanced Options
            <span className={`${styles.chevron} ${showAdvanced ? styles.expanded : ''}`}>
              ▼
            </span>
          </button>

          {showAdvanced && (
            <div className={styles.advancedContent}>
              {/* Filters */}
              <div className={styles.filterSection}>
                <h5 className={styles.subSectionTitle}>
                  <Filter size={14} />
                  Filters
                </h5>
                
                <div className={styles.filterGrid}>
                  <label className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={exportConfig.filterOptions.activeOnly}
                      onChange={(e) => setExportConfig(prev => ({
                        ...prev,
                        filterOptions: {
                          ...prev.filterOptions,
                          activeOnly: e.target.checked
                        }
                      }))}
                    />
                    <span>Active members only</span>
                  </label>

                  <label className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={exportConfig.filterOptions.includeInactive}
                      onChange={(e) => setExportConfig(prev => ({
                        ...prev,
                        filterOptions: {
                          ...prev.filterOptions,
                          includeInactive: e.target.checked
                        }
                      }))}
                    />
                    <span>Include inactive members</span>
                  </label>
                </div>

                <div className={styles.filterSelects}>
                  <select
                    value={exportConfig.filterOptions.groupFilter}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      filterOptions: {
                        ...prev.filterOptions,
                        groupFilter: e.target.value
                      }
                    }))}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Groups</option>
                    <option value="worship">Worship Ministry</option>
                    <option value="youth">Youth Ministry</option>
                    <option value="children">Children's Ministry</option>
                    <option value="seniors">Senior Ministry</option>
                  </select>

                  {reportType === 'pledges' && (
                    <select
                      value={exportConfig.filterOptions.pledgeStatus}
                      onChange={(e) => setExportConfig(prev => ({
                        ...prev,
                        filterOptions: {
                          ...prev.filterOptions,
                          pledgeStatus: e.target.value
                        }
                      }))}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Pledge Statuses</option>
                      <option value="active">Active Pledges</option>
                      <option value="completed">Completed Pledges</option>
                      <option value="cancelled">Cancelled Pledges</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Scheduled Export */}
              <div className={styles.scheduledSection}>
                <h5 className={styles.subSectionTitle}>
                  <Clock size={14} />
                  Scheduled Export
                </h5>
                
                <label className={styles.scheduledToggle}>
                  <input
                    type="checkbox"
                    checked={exportConfig.scheduledExport.enabled}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      scheduledExport: {
                        ...prev.scheduledExport,
                        enabled: e.target.checked
                      }
                    }))}
                  />
                  <span>Enable scheduled exports</span>
                </label>

                {exportConfig.scheduledExport.enabled && (
                  <div className={styles.scheduledOptions}>
                    <div className={styles.scheduledGrid}>
                      <select
                        value={exportConfig.scheduledExport.frequency}
                        onChange={(e) => setExportConfig(prev => ({
                          ...prev,
                          scheduledExport: {
                            ...prev.scheduledExport,
                            frequency: e.target.value
                          }
                        }))}
                        className={styles.scheduledSelect}
                      >
                        {frequencyOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="time"
                        value={exportConfig.scheduledExport.time}
                        onChange={(e) => setExportConfig(prev => ({
                          ...prev,
                          scheduledExport: {
                            ...prev.scheduledExport,
                            time: e.target.value
                          }
                        }))}
                        className={styles.timeInput}
                      />
                    </div>

                    <div className={styles.emailInput}>
                      <Mail size={16} />
                      <input
                        type="email"
                        value={exportConfig.scheduledExport.email}
                        onChange={(e) => setExportConfig(prev => ({
                          ...prev,
                          scheduledExport: {
                            ...prev.scheduledExport,
                            email: e.target.value
                          }
                        }))}
                        placeholder="Email address for scheduled exports"
                        className={styles.emailField}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Export Summary */}
        <div className={styles.section}>
          <div className={styles.exportSummary}>
            <div className={styles.summaryStats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Records:</span>
                <span className={styles.statValue}>{data.length}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Fields:</span>
                <span className={styles.statValue}>{exportConfig.includeFields.length}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Format:</span>
                <span className={styles.statValue}>{exportConfig.format.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export History */}
        {exportHistory.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Recent Exports</h4>
            <div className={styles.exportHistory}>
              {exportHistory.map(item => (
                <div key={item.id} className={styles.historyItem}>
                  <div className={styles.historyInfo}>
                    <span className={styles.historyType}>{item.type}</span>
                    <span className={styles.historyFormat}>{item.format.toUpperCase()}</span>
                    <span className={styles.historyCount}>{item.recordCount} records</span>
                  </div>
                  <div className={styles.historyDate}>
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className={styles.exportActions}>
          <button
            onClick={handleExport}
            disabled={isLoading || exportConfig.includeFields.length === 0}
            className={styles.exportButton}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                Exporting...
              </>
            ) : (
              <>
                <Download size={20} />
                Export {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportOptions;