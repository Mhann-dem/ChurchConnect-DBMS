import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import styles from './Members.module.css';

// Simple UI components
const Button = ({ children, variant = 'default', size = 'md', onClick, disabled = false, className = '', type = 'button', ...props }) => {
  const variantClasses = {
    default: styles.buttonDefault,
    outline: styles.buttonOutline,
    primary: styles.buttonPrimary,
    ghost: styles.buttonGhost
  };
  
  return (
    <button 
      type={type}
      className={`${styles.button} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`${styles.card} ${className}`}>{children}</div>
);

// Form control components
const Input = ({ 
  name, 
  label, 
  type = 'text', 
  value = '', 
  onChange, 
  onBlur, 
  error, 
  touched, 
  required = false, 
  placeholder = '', 
  helpText = '',
  className = '',
  ...props 
}) => (
  <div className={`${styles.formGroup} ${className}`}>
    <label htmlFor={name} className={styles.label}>
      {label}
      {required && <span className={styles.required}>*</span>}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`${styles.input} ${error && touched ? styles.inputError : ''}`}
      required={required}
      {...props}
    />
    {helpText && <span className={styles.helpText}>{helpText}</span>}
    {error && touched && <span className={styles.errorText}>{error}</span>}
  </div>
);

const Select = ({ 
  name, 
  label, 
  value = '', 
  onChange, 
  onBlur, 
  error, 
  touched, 
  required = false, 
  children, 
  className = '',
  ...props 
}) => (
  <div className={`${styles.formGroup} ${className}`}>
    <label htmlFor={name} className={styles.label}>
      {label}
      {required && <span className={styles.required}>*</span>}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className={`${styles.select} ${error && touched ? styles.inputError : ''}`}
      required={required}
      {...props}
    >
      {children}
    </select>
    {error && touched && <span className={styles.errorText}>{error}</span>}
  </div>
);

const TextArea = ({ 
  name, 
  label, 
  value = '', 
  onChange, 
  onBlur, 
  error, 
  touched, 
  required = false, 
  placeholder = '', 
  rows = 3,
  className = '',
  ...props 
}) => (
  <div className={`${styles.formGroup} ${className}`}>
    <label htmlFor={name} className={styles.label}>
      {label}
      {required && <span className={styles.required}>*</span>}
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={rows}
      className={`${styles.textarea} ${error && touched ? styles.inputError : ''}`}
      required={required}
      {...props}
    />
    {error && touched && <span className={styles.errorText}>{error}</span>}
  </div>
);

const Checkbox = ({ 
  name, 
  label, 
  checked = false, 
  onChange, 
  className = '',
  ...props 
}) => (
  <div className={`${styles.checkboxGroup} ${className}`}>
    <label className={styles.checkboxLabel}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className={styles.checkbox}
        {...props}
      />
      <span className={styles.checkboxText}>{label}</span>
    </label>
  </div>
);

// Mock hooks for demonstration
const useMembers = () => ({
  createMember: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id: Date.now(), ...data };
  },
  updateMember: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id, ...data };
  },
  getMemberById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockMemberData;
  }
});

const useGroups = () => ({
  groups: [
    { id: 1, name: 'Youth Ministry' },
    { id: 2, name: 'Choir' },
    { id: 3, name: 'Bible Study' },
    { id: 4, name: 'Community Outreach' }
  ]
});

const useToast = () => ({
  showToast: (message, type) => {
    console.log(`Toast: ${type} - ${message}`);
  }
});

// Mock validation function
const validateMemberForm = (values) => {
  const errors = {};
  
  if (!values.first_name?.trim()) {
    errors.first_name = 'First name is required';
  }
  
  if (!values.last_name?.trim()) {
    errors.last_name = 'Last name is required';
  }
  
  if (!values.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!values.phone?.trim()) {
    errors.phone = 'Phone number is required';
  }
  
  if (!values.date_of_birth) {
    errors.date_of_birth = 'Date of birth is required';
  }
  
  if (!values.gender) {
    errors.gender = 'Gender is required';
  }
  
  return errors;
};

// Simple form hook
const useForm = ({ initialValues, validate, onSubmit }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validate) {
      const fieldErrors = validate(values);
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validate ? validate(values) : {};
    setErrors(formErrors);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(values).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    isSubmitting
  };
};

const mockMemberData = {
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  preferred_name: 'Johnny',
  email: 'john.doe@email.com',
  phone: '5551234567',
  alternate_phone: '5559876543',
  date_of_birth: '1985-06-15',
  gender: 'male',
  address: '123 Main St, City, State 12345',
  preferred_contact_method: 'email',
  preferred_language: 'English',
  accessibility_needs: '',
  notes: '',
  groups: [1, 2],
  is_active: true,
  communication_opt_in: true,
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '5555551234'
};

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
    validate: validateMemberForm,
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
            groups: memberData.groups || []
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
      ? currentGroups.filter(gId => gId !== groupId)
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
              error={errors.first_name}
              touched={touched.first_name}
              required
            />
            
            <Input
              name="last_name"
              label="Last Name"
              value={values.last_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.last_name}
              touched={touched.last_name}
              required
            />
            
            <Input
              name="preferred_name"
              label="Preferred Name"
              value={values.preferred_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.preferred_name}
              touched={touched.preferred_name}
              placeholder="Optional"
            />
            
            <Input
              name="date_of_birth"
              label="Date of Birth"
              type="date"
              value={values.date_of_birth}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.date_of_birth}
              touched={touched.date_of_birth}
              required
            />
            
            <Select
              name="gender"
              label="Gender"
              value={values.gender}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.gender}
              touched={touched.gender}
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
              error={errors.email}
              touched={touched.email}
              required
            />
            
            <Input
              name="phone"
              label="Phone Number"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.phone}
              touched={touched.phone}
              required
            />
            
            <Input
              name="alternate_phone"
              label="Alternate Phone"
              type="tel"
              value={values.alternate_phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.alternate_phone}
              touched={touched.alternate_phone}
              placeholder="Optional"
            />
            
            <Select
              name="preferred_contact_method"
              label="Preferred Contact Method"
              value={values.preferred_contact_method}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.preferred_contact_method}
              touched={touched.preferred_contact_method}
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
            error={errors.address}
            touched={touched.address}
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
              error={errors.emergency_contact_name}
              touched={touched.emergency_contact_name}
              placeholder="Optional"
            />
            
            <Input
              name="emergency_contact_phone"
              label="Emergency Contact Phone"
              type="tel"
              value={values.emergency_contact_phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.emergency_contact_phone}
              touched={touched.emergency_contact_phone}
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
                checked={(values.groups || []).includes(group.id)}
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
              error={errors.preferred_language}
              touched={touched.preferred_language}
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
            error={errors.accessibility_needs}
            touched={touched.accessibility_needs}
            placeholder="Optional - Any special accommodations needed"
            rows={3}
          />
          
          <TextArea
            name="notes"
            label="Notes"
            value={values.notes}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.notes}
            touched={touched.notes}
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