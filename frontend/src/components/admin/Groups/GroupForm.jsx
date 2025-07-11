import React, { useState, useEffect } from 'react';
import { useForm } from '../../../hooks/useForm';
import { useToast } from '../../../hooks/useToast';
import { groupsService } from '../../../services/groups';
import { membersService } from '../../../services/members';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Modal } from '../../shared/Modal';
import styles from './Groups.module.css';

const GroupForm = ({ 
  group = null, 
  isOpen, 
  onClose, 
  onSave, 
  mode = 'create' // 'create' or 'edit'
}) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const { showToast } = useToast();

  const initialValues = {
    name: group?.name || '',
    description: group?.description || '',
    leader_name: group?.leader_name || '',
    meeting_schedule: group?.meeting_schedule || '',
    meeting_location: group?.meeting_location || '',
    capacity: group?.capacity || '',
    active: group?.active ?? true,
    category: group?.category || 'ministry',
    contact_email: group?.contact_email || '',
    contact_phone: group?.contact_phone || '',
    requirements: group?.requirements || '',
    age_group: group?.age_group || 'all',
    start_date: group?.start_date || '',
    end_date: group?.end_date || '',
    tags: group?.tags || []
  };

  const validate = (values) => {
    const errors = {};
    
    if (!values.name.trim()) {
      errors.name = 'Group name is required';
    } else if (values.name.length < 3) {
      errors.name = 'Group name must be at least 3 characters long';
    }
    
    if (!values.description.trim()) {
      errors.description = 'Description is required';
    } else if (values.description.length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    }
    
    if (values.contact_email && !/\S+@\S+\.\S+/.test(values.contact_email)) {
      errors.contact_email = 'Please enter a valid email address';
    }
    
    if (values.contact_phone && !/^\+?[\d\s\-\(\)]+$/.test(values.contact_phone)) {
      errors.contact_phone = 'Please enter a valid phone number';
    }
    
    if (values.capacity && (isNaN(values.capacity) || parseInt(values.capacity) < 1)) {
      errors.capacity = 'Capacity must be a positive number';
    }
    
    if (values.end_date && values.start_date && new Date(values.end_date) < new Date(values.start_date)) {
      errors.end_date = 'End date must be after start date';
    }
    
    return errors;
  };

  const { values, errors, handleChange, handleSubmit, setFieldValue } = useForm(
    initialValues,
    validate
  );

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      if (group && mode === 'edit') {
        fetchGroupMembers();
      }
    }
  }, [isOpen, group, mode]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await membersService.getMembers({ limit: 1000 });
      setMembers(response.data.results || []);
    } catch (error) {
      showToast('Failed to load members', 'error');
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchGroupMembers = async () => {
    if (!group?.id) return;
    
    try {
      const response = await groupsService.getGroupMembers(group.id);
      setSelectedMembers(response.data.map(member => member.id));
    } catch (error) {
      showToast('Failed to load group members', 'error');
    }
  };

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      const groupData = {
        ...formData,
        member_ids: selectedMembers
      };

      let response;
      if (mode === 'edit' && group?.id) {
        response = await groupsService.updateGroup(group.id, groupData);
        showToast('Group updated successfully', 'success');
      } else {
        response = await groupsService.createGroup(groupData);
        showToast('Group created successfully', 'success');
      }

      onSave(response.data);
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save group';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = (tagValue) => {
    const currentTags = values.tags || [];
    const newTags = currentTags.includes(tagValue)
      ? currentTags.filter(tag => tag !== tagValue)
      : [...currentTags, tagValue];
    setFieldValue('tags', newTags);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2>{mode === 'edit' ? 'Edit Group' : 'Create New Group'}</h2>
          <Button variant="ghost" onClick={onClose} className={styles.closeButton}>
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Basic Information */}
            <Card className={styles.formSection}>
              <h3>Basic Information</h3>
              
              <div className={styles.fieldGroup}>
                <label htmlFor="name" className={styles.label}>
                  Group Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.name ? styles.error : ''}`}
                  placeholder="Enter group name"
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="description" className={styles.label}>
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                  className={`${styles.textarea} ${errors.description ? styles.error : ''}`}
                  placeholder="Describe the group's purpose and activities"
                  rows="4"
                />
                {errors.description && <span className={styles.errorText}>{errors.description}</span>}
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="category" className={styles.label}>
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={values.category}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value="ministry">Ministry</option>
                    <option value="small_group">Small Group</option>
                    <option value="bible_study">Bible Study</option>
                    <option value="youth">Youth</option>
                    <option value="women">Women's Group</option>
                    <option value="men">Men's Group</option>
                    <option value="seniors">Seniors</option>
                    <option value="children">Children</option>
                    <option value="worship">Worship Team</option>
                    <option value="service">Service Team</option>
                    <option value="outreach">Outreach</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="age_group" className={styles.label}>
                    Age Group
                  </label>
                  <select
                    id="age_group"
                    name="age_group"
                    value={values.age_group}
                    onChange={handleChange}
                    className={styles.select}
                  >
                    <option value="all">All Ages</option>
                    <option value="children">Children (0-12)</option>
                    <option value="youth">Youth (13-18)</option>
                    <option value="young_adults">Young Adults (19-30)</option>
                    <option value="adults">Adults (31-55)</option>
                    <option value="seniors">Seniors (55+)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Leadership & Contact */}
            <Card className={styles.formSection}>
              <h3>Leadership & Contact</h3>
              
              <div className={styles.fieldGroup}>
                <label htmlFor="leader_name" className={styles.label}>
                  Leader Name
                </label>
                <input
                  type="text"
                  id="leader_name"
                  name="leader_name"
                  value={values.leader_name}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter leader's name"
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="contact_email" className={styles.label}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={values.contact_email}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.contact_email ? styles.error : ''}`}
                    placeholder="contact@example.com"
                  />
                  {errors.contact_email && <span className={styles.errorText}>{errors.contact_email}</span>}
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="contact_phone" className={styles.label}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    value={values.contact_phone}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.contact_phone ? styles.error : ''}`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.contact_phone && <span className={styles.errorText}>{errors.contact_phone}</span>}
                </div>
              </div>
            </Card>

            {/* Meeting Details */}
            <Card className={styles.formSection}>
              <h3>Meeting Details</h3>
              
              <div className={styles.fieldGroup}>
                <label htmlFor="meeting_schedule" className={styles.label}>
                  Meeting Schedule
                </label>
                <input
                  type="text"
                  id="meeting_schedule"
                  name="meeting_schedule"
                  value={values.meeting_schedule}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., Sundays at 10:00 AM"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="meeting_location" className={styles.label}>
                  Meeting Location
                </label>
                <input
                  type="text"
                  id="meeting_location"
                  name="meeting_location"
                  value={values.meeting_location}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., Fellowship Hall, Room 101"
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="start_date" className={styles.label}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={values.start_date}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="end_date" className={styles.label}>
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={values.end_date}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.end_date ? styles.error : ''}`}
                  />
                  {errors.end_date && <span className={styles.errorText}>{errors.end_date}</span>}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="capacity" className={styles.label}>
                  Capacity
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={values.capacity}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.capacity ? styles.error : ''}`}
                  placeholder="Maximum number of members"
                  min="1"
                />
                {errors.capacity && <span className={styles.errorText}>{errors.capacity}</span>}
              </div>
            </Card>

            {/* Additional Information */}
            <Card className={styles.formSection}>
              <h3>Additional Information</h3>
              
              <div className={styles.fieldGroup}>
                <label htmlFor="requirements" className={styles.label}>
                  Requirements
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={values.requirements}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Any requirements or prerequisites for joining"
                  rows="3"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tags</label>
                <div className={styles.tagContainer}>
                  {['beginner', 'intermediate', 'advanced', 'weekly', 'monthly', 'seasonal', 'ongoing', 'new_member_friendly'].map(tag => (
                    <label key={tag} className={styles.tagLabel}>
                      <input
                        type="checkbox"
                        checked={values.tags?.includes(tag) || false}
                        onChange={() => handleTagChange(tag)}
                        className={styles.checkbox}
                      />
                      <span className={styles.tagText}>{tag.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={values.active}
                    onChange={handleChange}
                    className={styles.checkbox}
                  />
                  <span>Active Group</span>
                </label>
              </div>
            </Card>

            {/* Member Assignment */}
            <Card className={styles.formSection}>
              <h3>Members ({selectedMembers.length} selected)</h3>
              
              {loadingMembers ? (
                <div className={styles.loadingContainer}>
                  <LoadingSpinner />
                  <span>Loading members...</span>
                </div>
              ) : (
                <div className={styles.membersList}>
                  {members.map(member => (
                    <label key={member.id} className={styles.memberItem}>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        className={styles.checkbox}
                      />
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>
                          {member.first_name} {member.last_name}
                        </span>
                        <span className={styles.memberEmail}>{member.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="small" />
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Update Group' : 'Create Group'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default GroupForm;