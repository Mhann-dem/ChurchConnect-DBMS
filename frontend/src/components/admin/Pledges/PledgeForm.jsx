// frontend/src/components/admin/Pledges/PledgeForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import useForm from '../../../hooks/useForm';
import { useMembers } from '../../../hooks/useMembers';
import { useToast } from '../../../hooks/useToast';
import { Button, Card } from '../../ui';
import Input from '../../form/FormControls/Input';
import Select from '../../form/FormControls/Select';
import TextArea from '../../form/FormControls/TextArea';
import DatePicker from '../../form/FormControls/DatePicker';
import { validateRequired, validateNumber, validateDate } from '../../../utils/validation';
import { formatCurrency } from '../../../utils/formatters';
import styles from './Pledges.module.css';

const PledgeForm = ({ pledge, onSubmit, onCancel, loading: externalLoading }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [totalCalculated, setTotalCalculated] = useState(0);

  const { members, fetchMembers, loading: membersLoading } = useMembers() || {};
  const { showToast } = useToast();

  // Form initial values with better defaults
  const initialValues = {
    member_id: pledge?.member_id || pledge?.member?.id || '',
    member_name: pledge?.member_name || pledge?.member?.name || '',
    amount: pledge?.amount || '',
    frequency: pledge?.frequency || 'monthly',
    start_date: pledge?.start_date || new Date().toISOString().split('T')[0],
    end_date: pledge?.end_date || '',
    notes: pledge?.notes || '',
    status: pledge?.status || 'active'
  };

  // Enhanced validation rules
  const validationRules = {
    member_id: [
      (value) => validateRequired(value, 'Member selection is required')
    ],
    amount: [
      (value) => validateRequired(value, 'Pledge amount is required'),
      (value) => validateNumber(value, 'Amount must be a valid number'),
      (value) => {
        const num = parseFloat(value);
        if (num <= 0) return 'Amount must be greater than 0';
        if (num > 1000000) return 'Amount seems unusually large - please verify';
        return null;
      }
    ],
    frequency: [
      (value) => validateRequired(value, 'Frequency is required')
    ],
    start_date: [
      (value) => validateRequired(value, 'Start date is required'),
      (value) => validateDate(value, 'Invalid start date'),
      (value) => {
        const today = new Date();
        const startDate = new Date(value);
        const diffMonths = (startDate.getFullYear() - today.getFullYear()) * 12 + 
                          (startDate.getMonth() - today.getMonth());
        if (diffMonths < -12) {
          return 'Start date cannot be more than 1 year in the past';
        }
        return null;
      }
    ],
    end_date: [
      (value, formValues) => {
        if (formValues.frequency === 'one-time') return null;
        if (!value) return 'End date is required for recurring pledges';
        return validateDate(value, 'Invalid end date');
      },
      (value, formValues) => {
        if (formValues.frequency === 'one-time' || !value || !formValues.start_date) return null;
        const startDate = new Date(formValues.start_date);
        const endDate = new Date(value);
        
        if (endDate <= startDate) {
          return 'End date must be after start date';
        }
        
        // Check for reasonable duration
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth());
        
        if (monthsDiff > 60) { // 5 years
          return 'Pledge duration exceeds 5 years - please verify this is correct';
        }
        
        if (monthsDiff < 1 && formValues.frequency !== 'weekly') {
          return 'Pledge duration is less than 1 month';
        }
        
        return null;
      }
    ],
    notes: [
      (value) => {
        if (value && value.length > 1000) {
          return 'Notes cannot exceed 1000 characters';
        }
        return null;
      }
    ]
  };

  const { values, errors, warnings, handleChange, handleSubmit, isValid, setFieldValue, validateField } = useForm(
    initialValues,
    validationRules
  );

  // Frequency options with descriptions
  const frequencyOptions = [
    { value: 'one-time', label: 'One-time', description: 'Single payment' },
    { value: 'weekly', label: 'Weekly', description: 'Every week' },
    { value: 'monthly', label: 'Monthly', description: 'Every month' },
    { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
    { value: 'annually', label: 'Annually', description: 'Once per year' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', description: 'Currently active' },
    { value: 'completed', label: 'Completed', description: 'Fully paid' },
    { value: 'cancelled', label: 'Cancelled', description: 'No longer active' }
  ];

  // Initialize member search with existing pledge data
  useEffect(() => {
    if (pledge?.member_name && !memberSearch) {
      setMemberSearch(pledge.member_name);
    }
  }, [pledge?.member_name, memberSearch]);

  // Fetch members on component mount
  useEffect(() => {
    if (fetchMembers && typeof fetchMembers === 'function') {
      fetchMembers().catch(err => {
        console.error('Error fetching members:', err);
        if (showToast) {
          showToast('Failed to load members list', 'error');
        }
      });
    }
  }, [fetchMembers, showToast]);

  // Filter members based on search
  useEffect(() => {
    if (memberSearch && Array.isArray(members)) {
      const filtered = members.filter(member => {
        if (!member) return false;
        const name = member.name || member.full_name || '';
        const email = member.email || '';
        const searchLower = memberSearch.toLowerCase();
        return name.toLowerCase().includes(searchLower) ||
               email.toLowerCase().includes(searchLower);
      });
      setFilteredMembers(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredMembers([]);
    }
  }, [memberSearch, members]);

  // Calculate total pledged amount
  const calculateTotalPledged = useMemo(() => {
    if (!values.amount || values.frequency === 'one-time') {
      return parseFloat(values.amount || 0);
    }
    
    if (!values.start_date || !values.end_date) {
      return parseFloat(values.amount || 0);
    }
    
    try {
      const start = new Date(values.start_date);
      const end = new Date(values.end_date);
      const amount = parseFloat(values.amount);
      
      if (isNaN(amount) || end <= start) {
        return amount;
      }
      
      const monthsDiff = ((end.getFullYear() - start.getFullYear()) * 12) + 
                        (end.getMonth() - start.getMonth());
      
      switch (values.frequency) {
        case 'weekly':
          return amount * Math.ceil(monthsDiff * 4.33);
        case 'monthly':
          return amount * Math.max(1, monthsDiff);
        case 'quarterly':
          return amount * Math.max(1, Math.ceil(monthsDiff / 3));
        case 'annually':
          return amount * Math.max(1, Math.ceil(monthsDiff / 12));
        default:
          return amount;
      }
    } catch (error) {
      console.error('Error calculating total pledged:', error);
      return parseFloat(values.amount || 0);
    }
  }, [values.amount, values.frequency, values.start_date, values.end_date]);

  useEffect(() => {
    setTotalCalculated(calculateTotalPledged);
  }, [calculateTotalPledged]);

  // Member selection handlers
  const handleMemberSelect = (member) => {
    if (!member) return;
    
    setFieldValue('member_id', member.id);
    setFieldValue('member_name', member.name || member.full_name || '');
    setMemberSearch(member.name || member.full_name || '');
    setShowMemberDropdown(false);
    
    // Clear member validation error
    validateField('member_id', member.id);
  };

  const handleMemberSearchChange = (e) => {
    const value = e.target.value;
    setMemberSearch(value);
    setShowMemberDropdown(value.length > 0);
    
    if (!value) {
      setFieldValue('member_id', '');
      setFieldValue('member_name', '');
    }
  };

  const handleMemberSearchBlur = () => {
    // Delay hiding dropdown to allow for member selection
    setTimeout(() => {
      setShowMemberDropdown(false);
    }, 200);
  };

  // Form submission
  const onFormSubmit = async (formData) => {
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate member selection
      if (!formData.member_id) {
        if (showToast) {
          showToast('Please select a member', 'error');
        }
        return;
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        // Ensure end_date is null for one-time pledges
        end_date: formData.frequency === 'one-time' ? null : formData.end_date,
        // Add calculated total if needed
        calculated_total: totalCalculated
      };

      console.log('PledgeForm: Submitting data:', submissionData);
      
      await onSubmit(submissionData);
      
      if (showToast) {
        showToast(
          pledge ? 'Pledge updated successfully' : 'Pledge created successfully', 
          'success'
        );
      }
    } catch (error) {
      console.error('PledgeForm: Submission error:', error);
      if (showToast) {
        showToast(
          error.message || (pledge ? 'Failed to update pledge' : 'Failed to create pledge'),
          'error'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || externalLoading;

  return (
    <Card className={styles.pledgeForm}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          {pledge ? 'Edit Pledge' : 'Create New Pledge'}
        </h2>
        <Button
          variant="outline"
          onClick={onCancel}
          className={styles.closeButton}
          disabled={isLoading}
        >
          ×
        </Button>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className={styles.form}>
        {/* Member Selection */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Member *
          </label>
          <div className={styles.memberSearchContainer}>
            <Input
              type="text"
              placeholder="Search for member by name or email..."
              value={memberSearch}
              onChange={handleMemberSearchChange}
              onBlur={handleMemberSearchBlur}
              onFocus={() => setShowMemberDropdown(memberSearch.length > 0)}
              error={errors.member_id}
              disabled={isLoading || membersLoading}
            />
            
            {showMemberDropdown && filteredMembers.length > 0 && (
              <div className={styles.memberDropdown}>
                {filteredMembers.map(member => (
                  <div
                    key={member.id}
                    className={styles.memberOption}
                    onClick={() => handleMemberSelect(member)}
                  >
                    <div className={styles.memberName}>
                      {member.name || member.full_name || 'Unnamed Member'}
                    </div>
                    {member.email && (
                      <div className={styles.memberEmail}>{member.email}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {memberSearch && filteredMembers.length === 0 && !membersLoading && (
              <div className={styles.memberDropdown}>
                <div className={styles.memberOption}>
                  No members found matching "{memberSearch}"
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.formRow}>
          {/* Amount */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Pledge Amount *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1000000"
              placeholder="0.00"
              value={values.amount}
              onChange={handleChange}
              name="amount"
              error={errors.amount}
              disabled={isLoading}
            />
          </div>

          {/* Frequency */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Payment Frequency *
            </label>
            <Select
              value={values.frequency}
              onChange={handleChange}
              name="frequency"
              options={frequencyOptions}
              error={errors.frequency}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Date Fields */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Start Date *
            </label>
            <DatePicker
              value={values.start_date}
              onChange={handleChange}
              name="start_date"
              error={errors.start_date}
              disabled={isLoading}
            />
          </div>

          {values.frequency !== 'one-time' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                End Date *
              </label>
              <DatePicker
                value={values.end_date}
                onChange={handleChange}
                name="end_date"
                error={errors.end_date}
                disabled={isLoading}
                min={values.start_date}
              />
            </div>
          )}
        </div>

        {/* Status - only show for existing pledges */}
        {pledge && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Status
            </label>
            <Select
              value={values.status}
              onChange={handleChange}
              name="status"
              options={statusOptions}
              error={errors.status}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Total Calculation Display */}
        {values.frequency !== 'one-time' && values.amount && values.start_date && values.end_date && totalCalculated !== parseFloat(values.amount) && (
          <div className={styles.totalCalculation}>
            <div className={styles.calculationLabel}>
              Total Pledged Amount:
            </div>
            <div className={styles.calculationValue}>
              {formatCurrency(totalCalculated)}
            </div>
            <div className={styles.calculationDetails}>
              {formatCurrency(values.amount)} × {Math.ceil(totalCalculated / parseFloat(values.amount))} payments
            </div>
          </div>
        )}

        {/* Warnings Display */}
        {warnings && warnings.length > 0 && (
          <div className={styles.warningsContainer}>
            <div className={styles.warningsTitle}>Please Note:</div>
            {warnings.map((warning, index) => (
              <div key={index} className={styles.warningItem}>
                ⚠️ {warning}
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Notes
          </label>
          <TextArea
            placeholder="Additional notes about this pledge..."
            value={values.notes}
            onChange={handleChange}
            name="notes"
            rows={3}
            error={errors.notes}
            disabled={isLoading}
            maxLength={1000}
          />
          {values.notes && (
            <div className={styles.characterCount}>
              {values.notes.length}/1000 characters
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={!isValid || isLoading || !values.member_id}
            loading={isLoading}
          >
            {isLoading 
              ? (pledge ? 'Updating...' : 'Creating...')
              : (pledge ? 'Update Pledge' : 'Create Pledge')
            }
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PledgeForm;