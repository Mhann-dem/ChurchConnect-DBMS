// Enhanced PledgeForm.jsx with updated success feedback and error handling
import React, { useState, useEffect, useMemo } from 'react';
import { useFormSubmission } from '../../../hooks/useFormSubmission';
import FormContainer from '../../shared/FormContainer';
import { useMembers } from '../../../hooks/useMembers';
import { useToast } from '../../../hooks/useToast';
import { Button, Card } from '../../ui';
import Input from '../../form/FormControls/Input';
import Select from '../../form/FormControls/Select';
import TextArea from '../../form/FormControls/TextArea';
import DatePicker from '../../form/FormControls/DatePicker';
import { validateRequired, validateNumber, validateDate } from '../../../utils/validation';
import { formatCurrency } from '../../../utils/formatters';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import styles from './Pledges.module.css';

const PledgeForm = ({ pledge, onSubmit, onCancel, loading: externalLoading }) => {
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

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState([]);

  // Form submission handler
  const {
    isSubmitting: formSubmitting,
    showSuccess,
    submissionError,
    handleSubmit: handleFormSubmit,
    clearError
  } = useFormSubmission({
    onSubmit: async (formData) => {
      // Validate member selection
      if (!formData.member_id) {
        throw new Error('Please select a member');
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        end_date: formData.frequency === 'one-time' ? null : formData.end_date,
        calculated_total: totalCalculated
      };

      console.log('PledgeForm: Submitting data:', submissionData);
      
      return await onSubmit(submissionData);
    },
    onClose: onCancel,
    successMessage: pledge ? 'Pledge updated successfully!' : 'Pledge created successfully!',
    autoCloseDelay: 3000
  });

  // Enhanced validation rules
  const validateForm = () => {
    const newErrors = {};
    
    if (!values.member_id) {
      newErrors.member_id = 'Member selection is required';
    }
    
    if (!values.amount) {
      newErrors.amount = 'Pledge amount is required';
    } else if (isNaN(values.amount) || parseFloat(values.amount) <= 0) {
      newErrors.amount = 'Amount must be a valid positive number';
    } else if (parseFloat(values.amount) > 1000000) {
      newErrors.amount = 'Amount seems unusually large - please verify';
    }
    
    if (!values.frequency) {
      newErrors.frequency = 'Frequency is required';
    }
    
    if (!values.start_date) {
      newErrors.start_date = 'Start date is required';
    } else {
      const startDate = new Date(values.start_date);
      const today = new Date();
      const diffMonths = (startDate.getFullYear() - today.getFullYear()) * 12 + 
                        (startDate.getMonth() - today.getMonth());
      if (diffMonths < -12) {
        newErrors.start_date = 'Start date cannot be more than 1 year in the past';
      }
    }
    
    if (values.frequency !== 'one-time') {
      if (!values.end_date) {
        newErrors.end_date = 'End date is required for recurring pledges';
      } else if (values.start_date) {
        const startDate = new Date(values.start_date);
        const endDate = new Date(values.end_date);
        
        if (endDate <= startDate) {
          newErrors.end_date = 'End date must be after start date';
        }
        
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth());
        
        if (monthsDiff > 60) {
          newErrors.end_date = 'Pledge duration exceeds 5 years - please verify this is correct';
        }
      }
    }
    
    if (values.notes && values.notes.length > 1000) {
      newErrors.notes = 'Notes cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      setFilteredMembers(filtered.slice(0, 10));
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Member selection handlers
  const handleMemberSelect = (member) => {
    if (!member) return;
    
    setValues(prev => ({
      ...prev,
      member_id: member.id,
      member_name: member.name || member.full_name || ''
    }));
    setMemberSearch(member.name || member.full_name || '');
    setShowMemberDropdown(false);
    
    // Clear member validation error
    if (errors.member_id) {
      setErrors(prev => ({ ...prev, member_id: null }));
    }
  };

  const handleMemberSearchChange = (e) => {
    const value = e.target.value;
    setMemberSearch(value);
    setShowMemberDropdown(value.length > 0);
    
    if (!value) {
      setValues(prev => ({ ...prev, member_id: '', member_name: '' }));
    }
  };

  const handleMemberSearchBlur = () => {
    // Delay hiding dropdown to allow for member selection
    setTimeout(() => {
      setShowMemberDropdown(false);
    }, 200);
  };

  // Form submission
  const onFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    clearError();
    await handleFormSubmit(values, e);
  };

  const isLoading = formSubmitting || externalLoading;
  const isValid = values.member_id && values.amount && values.frequency && values.start_date;

  return (
    <FormContainer
      title={pledge ? 'Edit Pledge' : 'Create New Pledge'}
      onClose={onCancel}
      showSuccess={showSuccess}
      successMessage={pledge ? 'Pledge updated successfully!' : 'Pledge created successfully!'}
      submissionError={submissionError}
      isSubmitting={isLoading}
      maxWidth="600px"
    >
      <form onSubmit={onFormSubmit} className={styles.form}>
        {/* Member Selection */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Member *
          </label>
          <div className={styles.memberSearchContainer}>
            <input
              type="text"
              placeholder="Search for member by name or email..."
              value={memberSearch}
              onChange={handleMemberSearchChange}
              onBlur={handleMemberSearchBlur}
              onFocus={() => setShowMemberDropdown(memberSearch.length > 0)}
              className={`${styles.input} ${errors.member_id ? styles.inputError : ''}`}
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
            
            {errors.member_id && (
              <div className={styles.errorText}>{errors.member_id}</div>
            )}
          </div>
        </div>

        <div className={styles.formRow}>
          {/* Amount */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Pledge Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1000000"
              placeholder="0.00"
              value={values.amount}
              onChange={handleChange}
              name="amount"
              className={`${styles.input} ${errors.amount ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.amount && (
              <div className={styles.errorText}>{errors.amount}</div>
            )}
          </div>

          {/* Frequency */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Payment Frequency *
            </label>
            <select
              value={values.frequency}
              onChange={handleChange}
              name="frequency"
              className={`${styles.select} ${errors.frequency ? styles.inputError : ''}`}
              disabled={isLoading}
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.frequency && (
              <div className={styles.errorText}>{errors.frequency}</div>
            )}
          </div>
        </div>

        {/* Date Fields */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Start Date *
            </label>
            <input
              type="date"
              value={values.start_date}
              onChange={handleChange}
              name="start_date"
              className={`${styles.input} ${errors.start_date ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.start_date && (
              <div className={styles.errorText}>{errors.start_date}</div>
            )}
          </div>

          {values.frequency !== 'one-time' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                End Date *
              </label>
              <input
                type="date"
                value={values.end_date}
                onChange={handleChange}
                name="end_date"
                className={`${styles.input} ${errors.end_date ? styles.inputError : ''}`}
                disabled={isLoading}
                min={values.start_date}
              />
              {errors.end_date && (
                <div className={styles.errorText}>{errors.end_date}</div>
              )}
            </div>
          )}
        </div>

        {/* Status - only show for existing pledges */}
        {pledge && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Status
            </label>
            <select
              value={values.status}
              onChange={handleChange}
              name="status"
              className={`${styles.select} ${errors.status ? styles.inputError : ''}`}
              disabled={isLoading}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Total Calculation Display */}
        {values.frequency !== 'one-time' && values.amount && values.start_date && values.end_date && totalCalculated !== parseFloat(values.amount) && (
          <div className={styles.totalCalculation}>
            <div className={styles.calculationLabel}>
              Total Pledged Amount:
            </div>
            <div className={styles.calculationValue}>
              {formatCurrency ? formatCurrency(totalCalculated) : `$${totalCalculated.toFixed(2)}`}
            </div>
            <div className={styles.calculationDetails}>
              {formatCurrency ? formatCurrency(values.amount) : `$${parseFloat(values.amount).toFixed(2)}`} × {Math.ceil(totalCalculated / parseFloat(values.amount))} payments
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
          <textarea
            placeholder="Additional notes about this pledge..."
            value={values.notes}
            onChange={handleChange}
            name="notes"
            rows={3}
            className={`${styles.textarea} ${errors.notes ? styles.inputError : ''}`}
            disabled={isLoading}
            maxLength={1000}
          />
          {errors.notes && (
            <div className={styles.errorText}>{errors.notes}</div>
          )}
          {values.notes && (
            <div className={styles.characterCount}>
              {values.notes.length}/1000 characters
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!isValid || isLoading || !values.member_id || showSuccess}
            className={`${styles.submitButton} ${(!isValid || isLoading) ? styles.disabled : ''}`}
          >
            {isLoading ? (
              <div className={styles.loadingContent}>
                <Loader size={16} className={styles.spinner} />
                {pledge ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              pledge ? 'Update Pledge' : 'Create Pledge'
            )}
          </button>
        </div>
      </form>
    </FormContainer>
  );
};

export default PledgeForm;