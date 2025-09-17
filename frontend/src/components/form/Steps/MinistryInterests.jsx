// frontend/src/components/form/Steps/MinistryInterests.jsx
import React from 'react';
import { Heart, Users, Music, BookOpen, Mic, Wrench } from 'lucide-react';
import styles from '../Form.module.css';

const MinistryInterests = ({ 
  formData = {}, 
  errors = {}, 
  touched = {}, 
  onChange, 
  onBlur, 
  setFieldValue 
}) => {
  const ministryOptions = [
    { 
      value: 'worship', 
      label: 'Worship Team (Music/Vocals)', 
      icon: Music,
      description: 'Lead congregation in musical worship' 
    },
    { 
      value: 'youth', 
      label: 'Youth Ministry', 
      icon: Users,
      description: 'Mentor and guide young people in their faith journey' 
    },
    { 
      value: 'children', 
      label: 'Children\'s Ministry', 
      icon: Heart,
      description: 'Teach and care for children during services and programs' 
    },
    { 
      value: 'seniors', 
      label: 'Senior Ministry', 
      icon: Heart,
      description: 'Support and minister to our senior members' 
    },
    { 
      value: 'outreach', 
      label: 'Community Outreach', 
      icon: Users,
      description: 'Reach out to the community and serve those in need' 
    },
    { 
      value: 'hospitality', 
      label: 'Hospitality & Welcoming', 
      icon: Heart,
      description: 'Welcome visitors and create a warm church environment' 
    },
    { 
      value: 'technical', 
      label: 'Technical/Audio-Visual', 
      icon: Wrench,
      description: 'Operate sound, lighting, and video equipment' 
    },
    { 
      value: 'administration', 
      label: 'Administration', 
      icon: BookOpen,
      description: 'Help with church administration and office tasks' 
    },
    { 
      value: 'counseling', 
      label: 'Counseling/Support', 
      icon: Heart,
      description: 'Provide pastoral care and emotional support' 
    },
    { 
      value: 'missions', 
      label: 'Missions', 
      icon: Users,
      description: 'Support local and international mission work' 
    },
    { 
      value: 'prayer', 
      label: 'Prayer Team', 
      icon: Heart,
      description: 'Lead prayer sessions and provide prayer support' 
    },
    { 
      value: 'education', 
      label: 'Bible Study/Education', 
      icon: BookOpen,
      description: 'Teach Bible classes and educational programs' 
    },
    { 
      value: 'finance', 
      label: 'Finance Committee', 
      icon: BookOpen,
      description: 'Help manage church finances and budgeting' 
    },
    { 
      value: 'maintenance', 
      label: 'Building/Maintenance', 
      icon: Wrench,
      description: 'Maintain church facilities and grounds' 
    },
    { 
      value: 'other', 
      label: 'Other Ministry', 
      icon: Mic,
      description: 'Other areas of service (please specify in notes)' 
    }
  ];

  // Ensure handlers exist and provide fallbacks
  const handleChange = onChange || ((e) => {
    console.warn('onChange not provided', e.target.name, e.target.value);
  });
  
  const handleBlur = onBlur || ((e) => {
    console.warn('onBlur not provided', e.target.name);
  });
  
  const handleSetFieldValue = setFieldValue || ((field, value) => {
    console.warn('setFieldValue not provided', field, value);
  });

  const handleMinistryChange = (value, checked) => {
    const currentInterests = formData.ministryInterests || [];
    let updatedInterests;
    
    if (checked) {
      // Add to array if checked and not already present
      updatedInterests = currentInterests.includes(value) 
        ? currentInterests 
        : [...currentInterests, value];
    } else {
      // Remove from array if unchecked
      updatedInterests = currentInterests.filter(interest => interest !== value);
    }
    
    handleSetFieldValue('ministryInterests', updatedInterests);
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <Heart className={styles.stepIcon} size={24} />
        <div>
          <h2 className={styles.stepTitle}>Ministry Interests</h2>
          <p className={styles.stepDescription}>
            Help us understand how you'd like to get involved in our church community. 
            Select all that interest you - there's no commitment required.
          </p>
        </div>
      </div>

      <div className={styles.ministryGrid}>
        <div className={styles.formGroup}>
          <label className={styles.sectionLabel}>
            Areas of Interest
          </label>
          <div className={styles.checkboxGrid}>
            {ministryOptions.map((option) => {
              const IconComponent = option.icon;
              const isChecked = (formData.ministryInterests || []).includes(option.value);
              
              return (
                <label 
                  key={option.value}
                  className={`${styles.checkboxItem} ${styles.ministryCheckbox} ${isChecked ? styles.selected : ''}`}
                >
                  <input
                    type="checkbox"
                    name={`ministry-${option.value}`}
                    checked={isChecked}
                    onChange={(e) => handleMinistryChange(option.value, e.target.checked)}
                    className={styles.checkbox}
                  />
                  <div className={styles.ministryContent}>
                    <div className={styles.ministryHeader}>
                      <IconComponent size={20} className={styles.ministryIcon} />
                      <span className={styles.ministryLabel}>{option.label}</span>
                    </div>
                    <p className={styles.ministryDescription}>{option.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
          <label htmlFor="prayerRequest">Prayer Request (Optional)</label>
          <textarea
            id="prayerRequest"
            name="prayerRequest"
            value={formData.prayerRequest || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={styles.textarea}
            placeholder="Share any prayer requests or ways our church family can support you"
            rows={4}
          />
          {errors.prayerRequest && touched.prayerRequest && (
            <span className={styles.errorMessage}>{errors.prayerRequest}</span>
          )}
          <div className={styles.helpText}>
            This information will be kept confidential and shared only with our prayer team
          </div>
        </div>
      </div>

      {/* Summary of selected ministries */}
      {formData.ministryInterests && formData.ministryInterests.length > 0 && (
        <div className={styles.selectionSummary}>
          <h4>Selected Ministry Areas:</h4>
          <div className={styles.selectedMinistries}>
            {formData.ministryInterests.map(value => {
              const ministry = ministryOptions.find(opt => opt.value === value);
              return ministry ? (
                <span key={value} className={styles.ministryTag}>
                  {ministry.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MinistryInterests;