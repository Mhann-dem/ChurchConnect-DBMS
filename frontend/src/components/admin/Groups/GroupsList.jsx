import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Users, Mail, Phone, MapPin, Calendar, MoreVertical } from 'lucide-react';
import groupsService from '../../../services/groups';
import GroupForm from './GroupForm';
import { useToast } from '../../../hooks/useToast';

const GroupsList = ({ onFiltersChange, initialSearch = '', initialStatus = 'all' }) => {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [showForm, setShowForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Fetch groups data
  const fetchGroups = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filters = {
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        ...params
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => 
        filters[key] === undefined && delete filters[key]
      );

      const response = await groupsService.getGroups(filters);
      
      if (response.success) {
        setGroups(response.data.results || []);
        setPagination({
          count: response.data.count || 0,
          next: response.data.next,
          previous: response.data.previous
        });
      } else {
        throw new Error(response.error || 'Failed to fetch groups');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError(error.message);
      showToast(error.message || 'Failed to fetch groups', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, showToast]);

  // Initial load
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Handle search changes
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    onFiltersChange({ search: value, status: statusFilter });
  }, [statusFilter, onFiltersChange]);

  // Handle status filter changes
  const handleStatusChange = useCallback((value) => {
    setStatusFilter(value);
    onFiltersChange({ search: searchQuery, status: value });
  }, [searchQuery, onFiltersChange]);

  // Handle create group
  const handleCreateGroup = useCallback(async (groupData) => {
    try {
      const response = await groupsService.createGroup(groupData);
      
      if (response.success) {
        showToast('Group created successfully', 'success');
        setShowForm(false);
        setSelectedGroup(null);
        await fetchGroups(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      showToast(error.message || 'Failed to create group', 'error');
      throw error; // Re-throw so form can handle it
    }
  }, [fetchGroups, showToast]);

  // Handle update group
  const handleUpdateGroup = useCallback(async (groupData) => {
    if (!selectedGroup?.id) return;
    
    try {
      const response = await groupsService.updateGroup(selectedGroup.id, groupData);
      
      if (response.success) {
        showToast('Group updated successfully', 'success');
        setShowForm(false);
        setSelectedGroup(null);
        await fetchGroups(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      showToast(error.message || 'Failed to update group', 'error');
      throw error; // Re-throw so form can handle it
    }
  }, [selectedGroup, fetchGroups, showToast]);

  // Handle delete group
  const handleDeleteGroup = useCallback(async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await groupsService.deleteGroup(groupId);
      
      if (response.success) {
        showToast('Group deleted successfully', 'success');
        await fetchGroups(); // Refresh the list
      } else {
        throw new Error(response.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      showToast(error.message || 'Failed to delete group', 'error');
    }
  }, [fetchGroups, showToast]);

  // Handle edit group
  const handleEditGroup = useCallback((group) => {
    setSelectedGroup(group);
    setShowForm(true);
  }, []);

  // Handle form close
  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setSelectedGroup(null);
  }, []);

  // Format group status
  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles.inactive}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  if (isLoading && groups.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Groups</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        {/* Add Group Button */}
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Group
        </button>
      </div>

      {/* Groups Count */}
      {pagination.count > 0 && (
        <div className="text-sm text-gray-600">
          Showing {groups.length} of {pagination.count} groups
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => fetchGroups()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && groups.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'No groups match your current filters.'
              : 'Get started by creating your first group.'
            }
          </p>
          {searchQuery || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                handleSearchChange('');
                handleStatusChange('all');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus size={20} className="mr-2" />
              Create Your First Group
            </button>
          )}
        </div>
      )}

      {/* Groups Grid */}
      {groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(group.active ? 'active' : 'inactive')}
                      {group.category && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {group.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="relative group">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <MoreVertical size={16} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit size={16} className="mr-2" />
                        Edit Group
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete Group
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {group.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {group.description}
                  </p>
                )}

                {/* Group Details */}
                <div className="space-y-2 text-sm">
                  {group.leader_name && (
                    <div className="flex items-center text-gray-600">
                      <Users size={16} className="mr-2" />
                      <span>Leader: {group.leader_name}</span>
                    </div>
                  )}
                  
                  {group.meeting_schedule && (
                    <div className="flex items-center text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      <span>{group.meeting_schedule}</span>
                    </div>
                  )}
                  
                  {group.meeting_location && (
                    <div className="flex items-center text-gray-600">
                      <MapPin size={16} className="mr-2" />
                      <span>{group.meeting_location}</span>
                    </div>
                  )}
                  
                  {group.contact_email && (
                    <div className="flex items-center text-gray-600">
                      <Mail size={16} className="mr-2" />
                      <span className="truncate">{group.contact_email}</span>
                    </div>
                  )}
                  
                  {group.contact_phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone size={16} className="mr-2" />
                      <span>{group.contact_phone}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <Users size={16} className="mr-1" />
                    <span>{group.member_count || 0} members</span>
                    {group.max_members && (
                      <span> / {group.max_members}</span>
                    )}
                  </div>
                  
                  <div className="text-gray-500">
                    {group.is_public ? 'Public' : 'Private'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && groups.length > 0 && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )}

      {/* Group Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedGroup ? 'Edit Group' : 'Create New Group'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <GroupForm
              group={selectedGroup}
              onSuccess={selectedGroup ? handleUpdateGroup : handleCreateGroup}
              onCancel={handleCloseForm}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsList;