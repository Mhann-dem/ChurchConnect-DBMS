// PledgeForm.jsx - FINAL OPTIMIZED VERSION compatible with your hooks
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useFormSubmission } from '../../../hooks/useFormSubmission';
import FormContainer from '../../shared/FormContainer';
import useMembers from '../../../hooks/useMembers';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../ui';
import { formatCurrency } from '../../../utils/formatters';
import { CheckCircle, AlertCircle, Loader, User, X, Search } from 'lucide-react';
import styles from './Pledges.module.css';

const PledgeForm = ({ pledge, onSubmit, onCancel, loading: externalLoading }) => {
  // Member search and selection state
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMemberObj, setSelectedMemberObj] = useState(null);
  const [totalCalculated, setTotalCalculated] = useState(0);

  // Refs for managing dropdown interactions
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const isSelectingRef = useRef(false);

  // Hooks
  const { showToast } = useToast();
  
  // FIXED: Use the members hook with autoFetch disabled initially
  const { 
    members = [], 
    fetchMembers, 
    loading: membersLoading,
    error: membersError 
  } = useMembers({ 
    autoFetch: false, 
    limit: 100 // Get more members for search
  });

  // Form state
  const initialValues = {
    member_id: pledge?.member_id || pledge?.member?.id || '',
    member_name: pledge?.member_name || (pledge?.member ? `${pledge.member.first_name} ${pledge.member.last_name}`.trim() : ''),
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
      if (!formData.member_id) {
        throw new Error('Please select a member');
      }

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

  // Initialize member data for editing
  useEffect(() => {
    if (pledge?.member) {
      const memberName = pledge.member.first_name && pledge.member.last_name
        ? `${pledge.member.first_name} ${pledge.member.last_name}`.trim()
        : pledge.member_name || '';
      
      setMemberSearch(memberName);
      setSelectedMemberObj(pledge.member);
    }
  }, [pledge]);

  // Fetch members on mount
  useEffect(() => {
    if (fetchMembers) {
      console.log('[PledgeForm] Fetching members...');
      fetchMembers().catch(err => {
        console.error('[PledgeForm] Error fetching members:', err);
        showToast?.('Failed to load members list', 'error');
      });
    }
  }, [fetchMembers, showToast]);

  // Handle members error
  useEffect(() => {
    if (membersError) {
      console.error('[PledgeForm] Members error:', membersError);
      showToast?.('Error loading members. Please refresh the page.', 'error');
    }
  }, [membersError, showToast]);

  // Filter members based on search - OPTIMIZED
  const filteredMembers = useMemo(() => {
    if (!memberSearch || !Array.isArray(members) || members.length === 0) {
      return [];
    }

    const searchLower = memberSearch.toLowerCase().trim();
    
    return members
      .filter(member => {
        if (!member) return false;
        
        const firstName = (member.first_name || '').toLowerCase();
        const lastName = (member.last_name || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const email = (member.email || '').toLowerCase();
        const phone = (member.phone || '').toLowerCase();
        
        return fullName.includes(searchLower) ||
               firstName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               email.includes(searchLower) ||
               phone.includes(searchLower);
      })
      .slice(0, 10); // Limit to 10 results
  }, [memberSearch, members]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target) &&
        !isSelectingRef.current
      ) {
        setShowMemberDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    const newWarnings = [];
    
    if (!values.member_id) {
      newErrors.member_id = 'Member selection is required';
    }
    
    if (!values.amount) {
      newErrors.amount = 'Pledge amount is required';
    } else {
      const amount = parseFloat(values.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a valid positive number';
      } else if (amount > 1000000) {
        newWarnings.push('This is a very large pledge amount - please verify');
      }
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
          newWarnings.push('Pledge duration exceeds 5 years - please verify this is correct');
        }
      }
    }
    
    if (values.notes && values.notes.length > 1000) {
      newErrors.notes = 'Notes cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  // Event handlers
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleMemberSelect = useCallback((member) => {
    if (!member) return;
    
    isSelectingRef.current = true;
    
    const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 
                       member.name || 
                       'Unknown Member';
    
    setValues(prev => ({
      ...prev,
      member_id: member.id,
      member_name: memberName
    }));
    
    setMemberSearch(memberName);
    setSelectedMemberObj(member);
    setShowMemberDropdown(false);
    
    if (errors.member_id) {
      setErrors(prev => ({ ...prev, member_id: null }));
    }
    
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
    
    console.log('[PledgeForm] Member selected:', { id: member.id, name: memberName });
  }, [errors.member_id]);

  const handleMemberSearchChange = useCallback((e) => {
    const value = e.target.value;
    setMemberSearch(value);
    setShowMemberDropdown(value.length > 0);
    
    if (!value) {
      setValues(prev => ({ 
        ...prev, 
        member_id: '', 
        member_name: '' 
      }));
      setSelectedMemberObj(null);
    }
  }, []);

  const handleMemberSearchFocus = useCallback(() => {
    if (memberSearch && memberSearch.length > 0) {
      setShowMemberDropdown(true);
    }
  }, [memberSearch]);

  const handleClearMemberSelection = useCallback(() => {
    setMemberSearch('');
    setValues(prev => ({ 
      ...prev, 
      member_id: '', 
      member_name: '' 
    }));
    setSelectedMemberObj(null);
    setShowMemberDropdown(false);
    searchInputRef.current?.focus();
  }, []);

  const onFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast?.('Please fix the form errors', 'error');
      return;
    }

    clearError?.();
    await handleFormSubmit(values, e);
  };

  // Computed values
  const isLoading = formSubmitting || externalLoading;
  const isValid = values.member_id && values.amount && values.frequency && values.start_date;

  const frequencyOptions = [
    { value: 'one-time', label: 'One-time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

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
            Member <span className={styles.required}>*</span>
          </label>
          <div className={styles.memberSearchContainer}>
            {selectedMemberObj && values.member_id ? (
              <div className={styles.selectedMemberChip}>
                <User size={16} />
                <span className={styles.selectedMemberName}>
                  {memberSearch}
                </span>
                {selectedMemberObj.email && (
                  <span className={styles.selectedMemberEmail}>
                    ({selectedMemberObj.email})
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClearMemberSelection}
                  className={styles.clearMemberButton}
                  disabled={isLoading}
                  aria-label="Clear member selection"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className={styles.searchInputWrapper}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={memberSearch}
                    onChange={handleMemberSearchChange}
                    onFocus={handleMemberSearchFocus}
                    className={`${styles.input} ${styles.searchInput} ${errors.member_id ? styles.inputError : ''}`}
                    disabled={isLoading || membersLoading}
                    autoComplete="off"
                  />
                  {membersLoading && (
                    <Loader size={16} className={styles.inputSpinner} />
                  )}
                </div>
                
                {showMemberDropdown && (
                  <div ref={dropdownRef} className={styles.memberDropdown}>
                    {membersLoading ? (
                      <div className={styles.memberOptionLoading}>
                        <Loader size={16} className={styles.spinner} />
                        <span>Loading members...</span>
                      </div>
                    ) : filteredMembers.length > 0 ? (
                      filteredMembers.map(member => {
                        const displayName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 
                                          'Unnamed Member';
                        
                        return (
                          <div
                            key={member.id}
                            className={styles.memberOption}
                            onClick={() => handleMemberSelect(member)}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className={styles.memberOptionContent}>
                              <div className={styles.memberName}>
                                <User size={14} />
                                {displayName}
                              </div>
                              {member.email && (
                                <div className={styles.memberEmail}>{member.email}</div>
                              )}
                              {member.phone && (
                                <div className={styles.memberPhone}>{member.phone}</div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : memberSearch ? (
                      <div className={styles.memberOptionEmpty}>
                        <AlertCircle size={16} />
                        <span>No members found matching "{memberSearch}"</span>
                      </div>
                    ) : (
                      <div className={styles.memberOptionEmpty}>
                        <Search size={16} />
                        <span>Start typing to search...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {errors.member_id && (
              <div className={styles.errorText}>
                <AlertCircle size={14} />
                {errors.member_id}
              </div>
            )}
          </div>
        </div>

        {/* Amount and Frequency */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Pledge Amount <span className={styles.required}>*</span>
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
              <div className={styles.errorText}>
                <AlertCircle size={14} />
                {errors.amount}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Frequency <span className={styles.required}>*</span>
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
              <div className={styles.errorText}>
                <AlertCircle size={14} />
                {errors.frequency}
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Start Date <span className={styles.required}>*</span>
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
              <div className={styles.errorText}>
                <AlertCircle size={14} />
                {errors.start_date}
              </div>
            )}
          </div>

          {values.frequency !== 'one-time' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                End Date <span className={styles.required}>*</span>
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
                <div className={styles.errorText}>
                  <AlertCircle size={14} />
                  {errors.end_date}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status (for edit only) */}
        {pledge && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <select
              value={values.status}
              onChange={handleChange}
              name="status"
              className={styles.select}
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

        {/* Total Calculation */}
        {values.frequency !== 'one-time' && values.amount && values.start_date && values.end_date && totalCalculated !== parseFloat(values.amount) && (
          <div className={styles.totalCalculation}>
            <div className={styles.calculationLabel}>
              Total Pledged Amount:
            </div>
            <div className={styles.calculationValue}>
              {formatCurrency(totalCalculated)}
            </div>
            <div className={styles.calculationDetails}>
              {formatCurrency(parseFloat(values.amount))} × {Math.ceil(totalCalculated / parseFloat(values.amount))} payments
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className={styles.warningsContainer}>
            <div className={styles.warningsTitle}>
              <AlertCircle size={16} />
              Please Note:
            </div>
            {warnings.map((warning, index) => (
              <div key={index} className={styles.warningItem}>
                {warning}
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Notes</label>
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
            <div className={styles.errorText}>
              <AlertCircle size={14} />
              {errors.notes}
            </div>
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
            disabled={!isValid || isLoading || showSuccess}
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