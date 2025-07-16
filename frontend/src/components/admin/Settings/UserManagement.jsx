import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';  // Changed from named to default import
import { useToast } from '../../../hooks/useToast';  // Changed from named to default import
import Button from '../../ui/Button';  // Changed from named to default import
import Card from '../../ui/Card';  // Changed from named to default import
import Badge from '../../ui/Badge';  // Changed from named to default import
import Modal from '../../shared/Modal';  // Changed from named to default import
import ConfirmDialog from '../../shared/ConfirmDialog';  // Changed from named to default import
import DataTable from '../../shared/DataTable';  // Changed from named to default import
import SearchBar from '../../shared/SearchBar';  // Changed from named to default import
import LoadingSpinner from '../../shared/LoadingSpinner';  // Changed from named to default import
import EmptyState from '../../shared/EmptyState';  // Changed from named to default import
import authService from '../../../services/auth';  // Changed from namespace to default import
import styles from './Settings.module.css';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'readonly',
    active: true,
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const roles = [
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
    { value: 'admin', label: 'Admin', description: 'Standard admin access' },
    { value: 'readonly', label: 'Read Only', description: 'View-only access' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authService.getUsers();
      setUsers(response.data);
    } catch (error) {
      showToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'readonly',
      active: true,
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      active: user.active,
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!selectedUser) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        active: formData.active
      };

      if (!selectedUser) {
        userData.password = formData.password;
      }

      if (selectedUser) {
        await authService.updateUser(selectedUser.id, userData);
        showToast('User updated successfully', 'success');
      } else {
        await authService.createUser(userData);
        showToast('User created successfully', 'success');
      }

      setShowUserModal(false);
      fetchUsers();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to save user', 'error');
    }
  };

  const confirmDeleteUser = async () => {
    try {
      await authService.deleteUser(userToDelete.id);
      showToast('User deleted successfully', 'success');
      setShowDeleteDialog(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      showToast('Failed to delete user', 'error');
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      await authService.updateUser(user.id, { active: !user.active });
      showToast(`User ${user.active ? 'deactivated' : 'activated'} successfully`, 'success');
      fetchUsers();
    } catch (error) {
      showToast('Failed to update user status', 'error');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'username',
      label: 'Username',
      render: (user) => (
        <div className={styles.userInfo}>
          <div className={styles.username}>{user.username}</div>
          <div className={styles.fullName}>{user.firstName} {user.lastName}</div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (user) => user.email
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <Badge 
          variant={user.role === 'super_admin' ? 'primary' : user.role === 'admin' ? 'secondary' : 'default'}
        >
          {roles.find(r => r.value === user.role)?.label || user.role}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        <Badge variant={user.active ? 'success' : 'danger'}>
          {user.active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (user) => (
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <div className={styles.userActions}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleEditUser(user)}
            disabled={currentUser.id === user.id && currentUser.role !== 'super_admin'}
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleToggleUserStatus(user)}
            disabled={currentUser.id === user.id}
          >
            {user.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => handleDeleteUser(user)}
            disabled={currentUser.id === user.id || currentUser.role !== 'super_admin'}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.userManagement}>
      <div className={styles.header}>
        <h2>User Management</h2>
        <Button onClick={handleCreateUser} disabled={currentUser.role !== 'super_admin'}>
          Add New User
        </Button>
      </div>

      <Card className={styles.usersCard}>
        <div className={styles.cardHeader}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search users..."
          />
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No users match your search criteria"
          />
        ) : (
          <DataTable
            data={filteredUsers}
            columns={columns}
            keyField="id"
          />
        )}
      </Card>

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={selectedUser ? 'Edit User' : 'Create New User'}
        size="medium"
      >
        <form onSubmit={handleSubmitUser} className={styles.userForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={formErrors.username ? styles.error : ''}
                disabled={selectedUser}
              />
              {formErrors.username && <span className={styles.errorText}>{formErrors.username}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={formErrors.email ? styles.error : ''}
              />
              {formErrors.email && <span className={styles.errorText}>{formErrors.email}</span>}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={formErrors.firstName ? styles.error : ''}
              />
              {formErrors.firstName && <span className={styles.errorText}>{formErrors.firstName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={formErrors.lastName ? styles.error : ''}
              />
              {formErrors.lastName && <span className={styles.errorText}>{formErrors.lastName}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={currentUser.role !== 'super_admin'}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          {!selectedUser && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={formErrors.password ? styles.error : ''}
                />
                {formErrors.password && <span className={styles.errorText}>{formErrors.password}</span>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={formErrors.confirmPassword ? styles.error : ''}
                />
                {formErrors.confirmPassword && <span className={styles.errorText}>{formErrors.confirmPassword}</span>}
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              Active User
            </label>
          </div>

          <div className={styles.formActions}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowUserModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete user "${userToDelete?.username}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default UserManagement;
