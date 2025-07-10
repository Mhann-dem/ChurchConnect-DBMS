// ===============================
// src/components/admin/Members/MemberForm.jsx
// ===============================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMembers } from '../../../hooks/useMembers';
import { useGroups } from '../../../hooks/useGroups';
import { useForm } from '../../../hooks/useForm';
import { useToast } from '../../../hooks/useToast';
import { Button, Card } from '../../ui';
import { Input, Select, TextArea, Checkbox } from '../../form/FormControls';
import { validateMember } from '../../../utils/validation';
import { Save, ArrowLeft } from 'lucide-react';
import styles from './Members.module.css';

const MemberForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const isEditing = Boolean(id);

  const { createMember, updateMember, getMemberById } = useMembers();
  const { groups } = useGroups();

  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState(null);

  const initialValues = {
    first_name: '',
    last_name: '',
    preferred_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    preferred_contact_method: 'email',
    preferred_language: 'English',
    accessibility_needs: '',
    notes: '',
    groups: [],
    is_active: true,
    communication_opt_in: true,
    emergency_contact_name: '',
    emergency_contact_phone: ''
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    isSubmitting
  } = useForm({
    initialValues,
    validate: validateMember,
    onSubmit: async (formValues) => {
      try {
        if (isEditing) {
          await updateMember(id, formValues);
          showToast('Member updated successfully', 'success');
        } else {
          await createMember(formValues);
          showToast('Member created successfully', 'success');
        }
        navigate('/admin/members');
      } catch (error) {
        showToast(error.message || 'Failed to save member', 'error');
      }
    }
  });

  useEffect(() => {
    if (isEditing) {
      const fetchMember = async () => {
        try {
          setLoading(true);
          const memberData = await getMemberById(id);
          setMember(memberData);
          setValues({
            ...memberData,
            groups: memberData.groups?.map(g => g.id) || []
          });
        } catch (error) {
          showToast('Failed to load member', 'error');
          navigate('/admin/members');
        } finally {
          setLoading(false);
        }
      };
      fetchMember();
    }
  }, [id, isEditing]);

  const handleGroupChange = (groupId) => {
    const currentGroups = values.groups || [];
    const newGroups = currentGroups.includes(groupId)
      ? currentGroups.filter(id => id !== groupId)
      : [...currentGroups, groupId];
    
    handleChange({
      target: { name: 'groups', value: newGroups }
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/members')}
          className={styles.backButton}
        >
          <ArrowLeft size={16} />
          Back to Members
        </Button>
        <h1 className={styles.formTitle}>
          {isEditing ? 'Edit Member' : 'Add New Member'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          
          <div className={styles.formGrid}>
            <Input
              name="first_name"
              label="First Name"
              value={values.first_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.first_name && errors.first_name}
              required
            />
            
            <Input
              name="last_name"
              label="Last Name"
              value={values.last_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.last_name && errors.last_name}
              required
            />
            
            <Input
              name="preferred_name"
              label="Preferred Name"
              value={values.preferred_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.preferred_name && errors.preferred_name}
              placeholder="Optional"
            />
            
            <Input
              name="date_of_birth"
              label="Date of Birth"
              type="date"
              value={values.date_of_birth}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.date_of_birth && errors.date_of_birth}
              required
            />
            
            <Select
              name="gender"
              label="Gender"
              value={values.gender}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.gender && errors.gender}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </Select>
          </div>
        </Card>

        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>Contact Information</h2>
          
          <div className={styles.formGrid}>
            <Input
              name="email"
              label="Email Address"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email}
              required
            />
            
            <Input
              name="phone"
              label="Phone Number"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone && errors.phone}
              required
            />
            
            <Input
              name="alternate_phone"
              label="Alternate Phone"
              type="tel"
              value={values.alternate_phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.alternate_phone && errors.alternate_phone}
              placeholder="Optional"
            />
            
            <Select
              name="preferred_contact_method"
              label="Preferred Contact Method"
              value={values.preferred_contact_method}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.preferred_contact_method && errors.preferred_contact_method}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="sms">SMS</option>
              <option value="mail">Mail</option>
              <option value="no_contact">No Contact</option>
            </Select>
          </div>
          
          <TextArea
            name="address"
            label="Address"
            value={values.address}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.address && errors.address}
            placeholder="Optional"
            rows={3}
          />
        </Card>

        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>Emergency Contact</h2>
          
          <div className={styles.formGrid}>
            <Input
              name="emergency_contact_name"
              label="Emergency Contact Name"
              value={values.emergency_contact_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.emergency_contact_name && errors.emergency_contact_name}
              placeholder="Optional"
            />
            
            <Input
              name="emergency_contact_phone"
              label="Emergency Contact Phone"
              type="tel"
              value={values.emergency_contact_phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.emergency_contact_phone && errors.emergency_contact_phone}
              placeholder="Optional"
            />
          </div>
        </Card>

        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>Groups & Ministries</h2>
          
          <div className={styles.groupsGrid}>
            {groups.map(group => (
              <Checkbox
                key={group.id}
                name={`group_${group.id}`}
                label={group.name}
                checked={values.groups?.includes(group.id)}
                onChange={() => handleGroupChange(group.id)}
              />
            ))}
          </div>
        </Card>

        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>Additional Information</h2>
          
          <div className={styles.formGrid}>
            <Select
              name="preferred_language"
              label="Preferred Language"
              value={values.preferred_language}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.preferred_language && errors.preferred_language}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          
          <TextArea
            name="accessibility_needs"
            label="Accessibility Needs"
            value={values.accessibility_needs}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.accessibility_needs && errors.accessibility_needs}
            placeholder="Optional - Any special accommodations needed"
            rows={3}
          />
          
          <TextArea
            name="notes"
            label="Notes"
            value={values.notes}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.notes && errors.notes}
            placeholder="Optional - Any additional notes"
            rows={4}
          />
        </Card>

        <Card className={styles.formCard}>
          <h2 className={styles.sectionTitle}>Status & Preferences</h2>
          
          <div className={styles.checkboxGrid}>
            <Checkbox
              name="is_active"
              label="Active Member"
              checked={values.is_active}
              onChange={(e) => handleChange({
                target: { name: 'is_active', value: e.target.checked }
              })}
            />
            
            <Checkbox
              name="communication_opt_in"
              label="Allow Communications"
              checked={values.communication_opt_in}
              onChange={(e) => handleChange({
                target: { name: 'communication_opt_in', value: e.target.checked }
              })}
            />
          </div>
        </Card>

        <div className={styles.formActions}>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/members')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            <Save size={16} />
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Member' : 'Create Member'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;
