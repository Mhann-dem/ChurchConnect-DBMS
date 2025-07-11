// frontend/src/components/admin/Pledges/PledgeForm.jsx

import React, { useState, useEffect } from 'react';
import { useForm } from '../../../hooks/useForm';
import { useMembers } from '../../../hooks/useMembers';
import { usePledges } from '../../../hooks/usePledges';
import { useToast } from '../../../hooks/useToast';
import { Button, Card } from '../../ui';
import { Input, Select, TextArea, DatePicker } from '../../form/FormControls';
import { validateRequired, validateNumber, validateDate } from '../../../utils/validation';
import { formatCurrency } from '../../../utils/formatters';
import styles from './Pledges.module.css';

const PledgeForm = ({ pledge, onSubmit, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState([]);

  const { members, fetchMembers } = useMembers();
  const { createPledge, updatePledge } = usePledges();
  const { showToast } = useToast();

  const initialValues = {
    member_id: pledge?.member_id || '',
    member_name: pledge?.member_name || '',
    amount: pledge?.amount || '',
    frequency: pledge?.frequency || 'monthly',
    start_date: pledge?.start_date || '',
    end_date: pledge?.end_date || '',
    notes: pledge?.notes || '',
    status: pledge?.status || 'active'
  };

  const validationRules = {
    member_id: [(value) => validateRequired(value, 'Member is required')],
    amount: [
      (value) => validateRequired(value, 'Amount is required'),
      (value) => validateNumber(value, 'Amount must be a valid number'),
      (value) => value > 0 ? null : 'Amount must be greater than 0'
    ],
    frequency: [(value) => validateRequired(value, 'Frequency is required')],
    start_date: [
      (value) => validateRequired(value, 'Start date is required'),
      (value) => validateDate(value, 'Invalid start date')
    ],
    end_date: [
      (value) => {
        if (values.frequency === 'one-time') return null;
        return validateDate(value, 'Invalid end date');
      },
      (value) => {
        if (values.frequency === 'one-time' || !value || !values.start_date) return null;
        return new Date(value) > new Date(values.start_date) ? null : 'End date must be after start date';
      }
    ]
  };

  const { values, errors, handleChange, handleSubmit, isValid, setFieldValue } = useForm(
    initialValues,
    validationRules
  );

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (memberSearch) {
      const filtered = members.filter(member => 
        member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        member.email.toLowerCase().includes(memberSearch.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  }, [memberSearch, members]);

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

  const handleMemberSelect = (member) => {
    setFieldValue('member_id', member.id);
    setFieldValue('member_name', member.name);
    setMemberSearch(member.name);
    setShowMemberDropdown(false);
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

  const calculateTotalPledged = () => {
    if (!values.amount || !values.start_date || !values.end_date || values.frequency === 'one-time') {
      return values.amount || 0;
    }
    
    const start = new Date(values.start_date);
    const end = new Date(values.end_date);
    const monthsDiff = ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth());
    
    switch (values.frequency) {
      case 'weekly':
        return values.amount * Math.ceil(monthsDiff * 4.33);
      case 'monthly':
        return values.amount * monthsDiff;
      case 'quarterly':
        return values.amount * Math.ceil(monthsDiff / 3);
      case 'annually':
        return values.amount * Math.ceil(monthsDiff / 12);
      default:
        return values.amount;
    }
  };

  const onFormSubmit = async (formData) => {
    setIsSubmitting(true);
    
    try {
      if (pledge) {
        await updatePledge(pledge.id, formData);
        showToast('Pledge updated successfully', 'success');
      } else {
        await createPledge(formData);
        showToast('Pledge created successfully', 'success');
      }
      
      onSubmit();
    } catch (error) {
      showToast(
        pledge ? 'Failed to update pledge' : 'Failed to create pledge',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              onFocus={() => setShowMemberDropdown(memberSearch.length > 0)}
              error={errors.member_id}
            />
            
            {showMemberDropdown && filteredMembers.length > 0 && (
              <div className={styles.memberDropdown}>
                {filteredMembers.map(member => (
                  <div
                    key={member.id}
                    className={styles.memberOption}
                    onClick={() => handleMemberSelect(member)}
                  >
                    <div className={styles.memberName}>{member.name}</div>
                    <div className={styles.memberEmail}>{member.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Amount *
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={values.amount}
            onChange={handleChange}
            name="amount"
            error={errors.amount}
          />
        </div>

        {/* Frequency */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Frequency *
          </label>
          <Select
            value={values.frequency}
            onChange={handleChange}
            name="frequency"
            options={frequencyOptions}
            error={errors.frequency}
          />
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
            />
          </div>

          {values.frequency !== 'one-time' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                End Date
              </label>
              <DatePicker
                value={values.end_date}
                onChange={handleChange}
                name="end_date"
                error={errors.end_date}
              />
            </div>
          )}
        </div>

        {/* Status */}
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
          />
        </div>

        {/* Total Calculation */}
        {values.frequency !== 'one-time' && values.amount && values.start_date && values.end_date && (
          <div className={styles.totalCalculation}>
            <div className={styles.calculationLabel}>
              Total Pledged Amount:
            </div>
            <div className={styles.calculationValue}>
              {formatCurrency(calculateTotalPledged())}
            </div>
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
          />
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
          >
            {pledge ? 'Update Pledge' : 'Create Pledge'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PledgeForm;