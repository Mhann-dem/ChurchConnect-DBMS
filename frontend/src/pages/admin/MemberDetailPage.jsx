import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, UserPlus, Calendar, Phone, Mail, 
  MapPin, User, RefreshCw, Download, Plus, X, AlertCircle,
  Users, DollarSign
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

// Utility functions
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
  return phone;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

// Simple UI Components
const Card = ({ children, className = '', style = {} }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    ...style
  }} className={className}>
    {children}
  </div>
);

const Button = ({ children, variant = 'default', size = 'md', onClick, disabled = false, icon, type = 'button', ...props }) => {
  const variants = {
    default: { background: '#3b82f6', color: 'white' },
    outline: { background: 'white', color: '#374151', border: '1px solid #d1d5db' },
    ghost: { background: 'transparent', color: '#6b7280' },
    danger: { background: '#ef4444', color: 'white' },
    primary: { background: '#3b82f6', color: 'white' }
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '14px' },
    md: { padding: '10px 20px', fontSize: '16px' },
    lg: { padding: '14px 28px', fontSize: '18px' }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '8px',
        fontWeight: '500',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s',
        ...variants[variant],
        ...sizes[size]
      }}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    success: { background: '#d1fae5', color: '#065f46' },
    danger: { background: '#fee2e2', color: '#991b1b' },
    primary: { background: '#dbeafe', color: '#1e40af' },
    secondary: { background: '#f3f4f6', color: '#4b5563' },
    info: { background: '#e0e7ff', color: '#3730a3' }
  };

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500',
      ...variants[variant]
    }}>
      {children}
    </span>
  );
};

const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = { sm: '20px', md: '40px', lg: '60px' };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div style={{
        width: sizes[size],
        height: sizes[size],
        border: '3px solid #e5e7eb',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const Tabs = ({ tabs, activeTab, onTabChange }) => (
  <div style={{ borderBottom: '2px solid #e5e7eb' }}>
    <div style={{ display: 'flex', gap: '8px' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === tab.key ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === tab.key ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

// Action Buttons Component
const ActionButton = ({ icon: Icon, label, onClick, variant = 'primary' }) => {
  const variants = {
    primary: { background: '#3b82f6', color: 'white' },
    success: { background: '#10b981', color: 'white' },
    warning: { background: '#f59e0b', color: 'white' },
    outline: { background: 'white', color: '#374151', border: '1px solid #d1d5db' }
  };

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px',
        transition: 'all 0.2s',
        ...variants[variant]
      }}
    >
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );
};

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  // State
  const [member, setMember] = useState(null);
  const [memberGroups, setMemberGroups] = useState([]);
  const [memberPledges, setMemberPledges] = useState([]);
  const [memberFamily, setMemberFamily] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [showAddToFamilyModal, setShowAddToFamilyModal] = useState(false);
  const [showCreatePledgeModal, setShowCreatePledgeModal] = useState(false);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch member data
  const fetchMemberData = useCallback(async () => {
    if (!id) return;

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

      // Fetch member details
      const response = await fetch(`${baseURL}/api/v1/members/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Member not found');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!mountedRef.current) return;
      
      setMember(data);

      // Fetch additional data in parallel
      Promise.allSettled([
        // Fetch groups
        fetch(`${baseURL}/api/v1/members/${id}/groups/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : []),
        
        // Fetch pledges
        fetch(`${baseURL}/api/v1/pledges/?member=${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : { results: [] }),
        
        // Fetch activity
        fetch(`${baseURL}/api/v1/members/${id}/activity/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : [])
      ]).then(results => {
        if (!mountedRef.current) return;
        
        if (results[0].status === 'fulfilled') {
          setMemberGroups(Array.isArray(results[0].value) ? results[0].value : results[0].value?.results || []);
        }
        if (results[1].status === 'fulfilled') {
          setMemberPledges(results[1].value?.results || []);
        }
        if (results[2].status === 'fulfilled') {
          setMemberActivity(Array.isArray(results[2].value) ? results[2].value : []);
        }
      });

    } catch (err) {
      if (err.name === 'AbortError') return;
      
      console.error('Error fetching member:', err);
      
      if (mountedRef.current) {
        setError(err.message);
        if (err.message === 'Member not found') {
          setTimeout(() => navigate('/admin/members'), 2000);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  // Delete member
  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

      const response = await fetch(`${baseURL}/api/v1/members/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete member');

      navigate('/admin/members');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete member: ' + err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Add to Group Modal Component
  const AddToGroupModal = ({ isOpen, onClose, member, onSuccess }) => {
    const [availableGroups, setAvailableGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [role, setRole] = useState('member');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
      if (isOpen && !hasFetchedRef.current) {
        fetchAvailableGroups();
        hasFetchedRef.current = true;
      }
      
      // Reset when modal closes
      if (!isOpen) {
        hasFetchedRef.current = false;
        setSelectedGroup('');
        setRole('member');
        setNotes('');
      }
    }, [isOpen]);

    const fetchAvailableGroups = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

        const response = await fetch(`${baseURL}/api/v1/groups/?is_active=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableGroups(data.results || []);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedGroup) return;

      setIsSubmitting(true);
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

        const response = await fetch(`${baseURL}/api/v1/groups/${selectedGroup}/join/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            member_id: member.id,
            role,
            notes
          })
        });

        if (response.ok) {
          onSuccess && onSuccess();
          onClose();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to add member to group');
        }
      } catch (error) {
        console.error('Error adding to group:', error);
        alert('Failed to add member to group');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <Card style={{ maxWidth: '500px', width: '100%', margin: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                Add {member?.first_name} to Group
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Select a group and role for this member
              </p>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                    Group *
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select a group...</option>
                    {availableGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="leader">Leader</option>
                    <option value="co_leader">Co-Leader</option>
                    <option value="assistant">Assistant</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Any additional notes..."
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedGroup || isSubmitting || isLoading}
              >
                {isSubmitting ? 'Adding...' : 'Add to Group'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  };

  // Create Pledge Modal Component
  const CreatePledgeModal = ({ isOpen, onClose, member, onSuccess }) => {
    const [formData, setFormData] = useState({
      amount: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      setError(null);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Validation
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

        const pledgeData = {
          member: member.id,
          amount: parseFloat(formData.amount),
          frequency: formData.frequency,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          notes: formData.notes,
          status: 'active'
        };

        const response = await fetch(`${baseURL}/api/v1/pledges/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pledgeData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          onSuccess && onSuccess();
          onClose();
          // Reset form
          setFormData({
            amount: '',
            frequency: 'monthly',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            notes: ''
          });
        } else {
          setError(data.error || data.message || 'Failed to create pledge');
        }
      } catch (error) {
        console.error('Error creating pledge:', error);
        setError('Failed to create pledge. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <Card style={{ maxWidth: '500px', width: '100%', margin: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                Create Pledge for {member?.first_name} {member?.last_name}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Set up a financial pledge commitment
              </p>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                required
                placeholder="100.00"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                Frequency *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="one-time">One Time</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  min={formData.start_date}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Any additional notes about this pledge..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.amount}
              >
                {isSubmitting ? 'Creating...' : 'Create Pledge'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  };

  // Add to Family Modal Component
  const AddToFamilyModal = ({ isOpen, onClose, member, onSuccess }) => {
    const [availableFamilies, setAvailableFamilies] = useState([]);
    const [selectedFamily, setSelectedFamily] = useState('');
    const [relationshipType, setRelationshipType] = useState('other');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
      if (isOpen && !hasFetchedRef.current) {
        fetchAvailableFamilies();
        hasFetchedRef.current = true;
      }
      
      // Reset when modal closes
      if (!isOpen) {
        hasFetchedRef.current = false;
        setSelectedFamily('');
        setRelationshipType('other');
        setNotes('');
      }
    }, [isOpen]);

    const fetchAvailableFamilies = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

        const response = await fetch(`${baseURL}/api/v1/families/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableFamilies(data.results || []);
        }
      } catch (error) {
        console.error('Error fetching families:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedFamily) return;

      setIsSubmitting(true);
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

        const response = await fetch(`${baseURL}/api/v1/families/${selectedFamily}/add-member/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            member_id: member.id,
            relationship_type: relationshipType,
            notes
          })
        });

        if (response.ok) {
          onSuccess && onSuccess();
          onClose();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to add member to family');
        }
      } catch (error) {
        console.error('Error adding to family:', error);
        alert('Failed to add member to family');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <Card style={{ maxWidth: '500px', width: '100%', margin: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                Add {member?.first_name} to Family
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Select a family and relationship type
              </p>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                    Family *
                  </label>
                  <select
                    value={selectedFamily}
                    onChange={(e) => setSelectedFamily(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select a family...</option>
                    {availableFamilies.map(family => (
                      <option key={family.id} value={family.id}>
                        {family.family_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                    Relationship *
                  </label>
                  <select
                    value={relationshipType}
                    onChange={(e) => setRelationshipType(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="head">Head of Household</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="dependent">Dependent</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Any additional notes..."
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFamily || isSubmitting || isLoading}
              >
                {isSubmitting ? 'Adding...' : 'Add to Family'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner size="lg" />
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading member details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Card style={{ maxWidth: '500px', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Error Loading Member</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button onClick={fetchMemberData} variant="primary">Try Again</Button>
            <Button onClick={() => navigate('/admin/members')} variant="outline">Back to Members</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!member) return null;

  // Overview Tab Content
  const OverviewTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <Card>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} /> Contact Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Email</div>
              <a href={`mailto:${member.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{member.email}</a>
            </div>
            {member.phone && (
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Phone</div>
                <a href={`tel:${member.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{formatPhoneNumber(member.phone)}</a>
              </div>
            )}
            {member.address && (
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Address</div>
                <div>{member.address}</div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} /> Personal Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {member.date_of_birth && (
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Date of Birth</div>
                <div>{formatDate(member.date_of_birth)}</div>
              </div>
            )}
            {member.gender && (
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Gender</div>
                <div style={{ textTransform: 'capitalize' }}>{member.gender}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
              <Badge variant={member.is_active ? 'success' : 'danger'}>
                {member.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} /> Membership
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Registration Date</div>
              <div>{formatDate(member.registration_date)}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Last Updated</div>
              <div>{formatDate(member.updated_at)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Summary Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Groups Summary */}
        <Card>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} /> Groups
          </h3>
          {memberGroups.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Not a member of any groups</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {memberGroups.slice(0, 3).map(group => (
                <div key={group.id} style={{ padding: '8px', background: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>{group.name}</div>
                  {group.role && (
                    <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{group.role}</div>
                  )}
                </div>
              ))}
              {memberGroups.length > 3 && (
                <button
                  onClick={() => setActiveTab('groups')}
                  style={{
                    padding: '6px',
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  View all {memberGroups.length} groups →
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Family Summary */}
        <Card>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} /> Family
          </h3>
          {!memberFamily ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Not part of any family</p>
          ) : (
            <div>
              <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
                <div style={{ fontWeight: '500', fontSize: '14px' }}>{memberFamily.family_name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {familyMembers.length} {familyMembers.length === 1 ? 'member' : 'members'}
                </div>
              </div>
              {familyMembers.length > 0 && (
                <button
                  onClick={() => setActiveTab('family')}
                  style={{
                    padding: '6px',
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  View family members →
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Pledges Summary */}
        <Card>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} /> Pledges
          </h3>
          {memberPledges.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px' }}>No active pledges</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {memberPledges.slice(0, 2).map(pledge => (
                <div key={pledge.id} style={{ padding: '8px', background: '#f9fafb', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '600', fontSize: '16px', color: '#3b82f6' }}>
                    {formatCurrency(pledge.amount)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {pledge.frequency} • {pledge.status}
                  </div>
                </div>
              ))}
              {memberPledges.length > 2 && (
                <button
                  onClick={() => setActiveTab('pledges')}
                  style={{
                    padding: '6px',
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  View all {memberPledges.length} pledges →
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  // Groups Tab
  const GroupsTab = () => (
    <div>
      {memberGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <UserPlus size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280' }}>Not a member of any groups yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {memberGroups.map(group => (
            <Card key={group.id}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{group.name}</h4>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>{group.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Pledges Tab
  const PledgesTab = () => (
    <div>
      {memberPledges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Calendar size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280' }}>No pledges recorded</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {memberPledges.map(pledge => (
            <Card key={pledge.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {formatCurrency(pledge.amount)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    {pledge.frequency} • {formatDate(pledge.start_date)}
                  </div>
                </div>
                <Badge variant={pledge.status === 'active' ? 'success' : 'secondary'}>
                  {pledge.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Family Tab
  const FamilyTab = () => (
    <div>
      {!memberFamily ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Users size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>Not part of any family yet</p>
          <Button
            variant="primary"
            onClick={() => setShowAddToFamilyModal(true)}
            icon={<Plus size={16} />}
          >
            Add to Family
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Family Info Card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                  {memberFamily.family_name}
                </h3>
                {memberFamily.primary_contact && (
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Primary Contact: {memberFamily.primary_contact.first_name} {memberFamily.primary_contact.last_name}
                  </div>
                )}
              </div>
              <Badge variant="info">
                {familyMembers.length} {familyMembers.length === 1 ? 'Member' : 'Members'}
              </Badge>
            </div>
            {memberFamily.address && (
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {memberFamily.address}
              </div>
            )}
          </Card>

          {/* Family Members */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Family Members</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {familyMembers.map(relationship => (
                <Card key={relationship.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '16px' }}>
                        {relationship.member.first_name} {relationship.member.last_name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                        {relationship.member.email}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Badge variant="secondary" style={{ textTransform: 'capitalize' }}>
                        {relationship.relationship_type.replace('_', ' ')}
                      </Badge>
                      {relationship.member.id === member.id && (
                        <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>
                          (You)
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Activity Tab
  const ActivityTab = () => (
    <div>
      {memberActivity.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Calendar size={48} style={{ color: '#d1d5db', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280' }}>No recent activity</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {memberActivity.map((activity, idx) => (
            <Card key={idx}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px' }} />
                <div style={{ flex: 1 }}>
                  <div>{activity.description}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const tabs = [
    { key: 'overview', label: 'Overview', content: <OverviewTab /> },
    { key: 'groups', label: `Groups (${memberGroups.length})`, content: <GroupsTab /> },
    { key: 'family', label: memberFamily ? `Family (${familyMembers.length})` : 'Family', content: <FamilyTab /> },
    { key: 'pledges', label: `Pledges (${memberPledges.length})`, content: <PledgesTab /> }
  ];

  const activeTabContent = tabs.find(t => t.key === activeTab)?.content;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/members')}
            icon={<ArrowLeft size={16} />}
            style={{ marginBottom: '16px' }}
          >
            Back to Members
          </Button>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                  {member.first_name} {member.last_name}
                </h1>
                <p style={{ color: '#6b7280', margin: '0 0 12px 0' }}>{member.email}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Badge variant={member.is_active ? 'success' : 'danger'}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {member.preferred_contact_method && (
                    <Badge variant="info">{member.preferred_contact_method}</Badge>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <ActionButton
                  icon={UserPlus}
                  label="Add to Group"
                  onClick={() => setShowAddToGroupModal(true)}
                  variant="primary"
                />
                <ActionButton
                  icon={Users}
                  label="Add to Family"
                  onClick={() => setShowAddToFamilyModal(true)}
                  variant="success"
                />
                <ActionButton
                  icon={DollarSign}
                  label="Create Pledge"
                  onClick={() => setShowCreatePledgeModal(true)}
                  variant="warning"
                />
                <Button variant="ghost" onClick={fetchMemberData} icon={<RefreshCw size={16} />}>
                  Refresh
                </Button>
                <Button variant="outline" onClick={() => setShowEditModal(true)} icon={<Edit size={16} />}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setShowDeleteDialog(true)} icon={<Trash2 size={16} />}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Card style={{ padding: '0' }}>
          <div style={{ padding: '0 24px' }}>
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          <div style={{ padding: '24px' }}>
            {activeTabContent}
          </div>
        </Card>

        {/* Modals */}
        <AddToGroupModal
          isOpen={showAddToGroupModal}
          onClose={() => setShowAddToGroupModal(false)}
          member={member}
          onSuccess={() => {
            fetchMemberData();
            showToast('Member added to group successfully!', 'success');
          }}
        />

        <AddToFamilyModal
          isOpen={showAddToFamilyModal}
          onClose={() => setShowAddToFamilyModal(false)}
          member={member}
          onSuccess={() => {
            fetchMemberData();
            showToast('Member added to family successfully!', 'success');
          }}
        />

        <CreatePledgeModal
          isOpen={showCreatePledgeModal}
          onClose={() => setShowCreatePledgeModal(false)}
          member={member}
          onSuccess={() => {
            fetchMemberData();
            showToast('Pledge created successfully!', 'success');
          }}
        />

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <Card style={{ maxWidth: '500px', margin: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Delete Member</h2>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                Are you sure you want to delete {member.first_name} {member.last_name}? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete Member'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDetailPage;