import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MembersList, MemberForm, MemberFilters, BulkActions } from '../../components/admin/Members';
import { SearchBar, LoadingSpinner, Toast, Pagination } from '../../components/shared';
import { Button, Card } from '../../components/ui';
import { useMembers } from '../../hooks/useMembers';
import { useToast } from '../../hooks/useToast';
import './AdminPages.module.css';

const MembersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('pageSize')) || 25);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [ageFilter, setAgeFilter] = useState(searchParams.get('age') || 'all');
  const [groupFilter, setGroupFilter] = useState(searchParams.get('group') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [joinDateFilter, setJoinDateFilter] = useState(searchParams.get('joinDate') || 'all');

  const {
    members,
    totalMembers,
    loading,
    error,
    createMember,
    updateMember,
    deleteMember,
    bulkDeleteMembers,
    bulkUpdateMembers,
    searchMembers,
    exportMembers
  } = useMembers();

  const { showToast } = useToast();

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (ageFilter !== 'all') params.set('age', ageFilter);
    if (groupFilter !== 'all') params.set('group', groupFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (joinDateFilter !== 'all') params.set('joinDate', joinDateFilter);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    if (pageSize !== 25) params.set('pageSize', pageSize.toString());
    setSearchParams(params);
  }, [searchQuery, ageFilter, groupFilter, statusFilter, joinDateFilter, currentPage, pageSize, setSearchParams]);

  // Fetch members when filters change
  useEffect(() => {
    const filters = {
      search: searchQuery,
      age: ageFilter !== 'all' ? ageFilter : null,
      group: groupFilter !== 'all' ? groupFilter : null,
      status: statusFilter !== 'all' ? statusFilter : null,
      joinDate: joinDateFilter !== 'all' ? joinDateFilter : null,
      page: currentPage,
      pageSize: pageSize
    };
    searchMembers(filters);
  }, [searchQuery, ageFilter, groupFilter, statusFilter, joinDateFilter, currentPage, pageSize, searchMembers]);

  const handleCreateMember = async (memberData) => {
    try {
      const newMember = await createMember(memberData);
      setShowForm(false);
      showToast('Member created successfully', 'success');
      // Navigate to member detail page
      navigate(`/admin/members/${newMember.id}`);
    } catch (error) {
      showToast('Failed to create member', 'error');
    }
  };

  const handleUpdateMember = async (memberId, memberData) => {
    try {
      await updateMember(memberId, memberData);
      setSelectedMember(null);
      setShowForm(false);
      showToast('Member updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update member', 'error');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      try {
        await deleteMember(memberId);
        showToast('Member deleted successfully', 'success');
        // Remove from selected members if present
        setSelectedMembers(prev => prev.filter(id => id !== memberId));
      } catch (error) {
        showToast('Failed to delete member', 'error');
      }
    }
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowForm(true);
  };

  const handleViewMember = (memberId) => {
    navigate(`/admin/members/${memberId}`);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedMember(null);
  };

  const handleSelectMember = (memberId) => {
    setSelectedMembers(prev => {
      const isSelected = prev.includes(memberId);
      if (isSelected) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAllMembers = (selectAll) => {
    if (selectAll) {
      setSelectedMembers(members.map(member => member.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedMembers.length} members? This action cannot be undone.`)) {
      try {
        await bulkDeleteMembers(selectedMembers);
        setSelectedMembers([]);
        setShowBulkActions(false);
        showToast(`${selectedMembers.length} members deleted successfully`, 'success');
      } catch (error) {
        showToast('Failed to delete selected members', 'error');
      }
    }
  };

  const handleBulkUpdate = async (updateData) => {
    try {
      await bulkUpdateMembers(selectedMembers, updateData);
      setSelectedMembers([]);
      setShowBulkActions(false);
      showToast(`${selectedMembers.length} members updated successfully`, 'success');
    } catch (error) {
      showToast('Failed to update selected members', 'error');
    }
  };

  const handleExportMembers = async () => {
    try {
      const filters = {
        search: searchQuery,
        age: ageFilter !== 'all' ? ageFilter : null,
        group: groupFilter !== 'all' ? groupFilter : null,
        status: statusFilter !== 'all' ? statusFilter : null,
        joinDate: joinDateFilter !== 'all' ? joinDateFilter : null
      };
      await exportMembers(filters);
      showToast('Members exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export members', 'error');
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const clearFilters = () => {
    setSearchQuery('');
    setAgeFilter('all');
    setGroupFilter('all');
    setStatusFilter('all');
    setJoinDateFilter('all');
    setCurrentPage(1);
  };

  if (loading && !members.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const totalPages = Math.ceil(totalMembers / pageSize);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members Management</h1>
          <p className="text-gray-600 mt-1">
            Manage church members and their information ({totalMembers} total)
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleExportMembers}
            disabled={!members.length}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
          >
            Add New Member
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedMembers.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-800">
                {selectedMembers.length} members selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(true)}
              >
                Bulk Actions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700"
              >
                Delete Selected
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMembers([])}
            >
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search members by name, email, or phone..."
              />
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!searchQuery && ageFilter === 'all' && groupFilter === 'all' && statusFilter === 'all' && joinDateFilter === 'all'}
            >
              Clear Filters
            </Button>
          </div>
          
          <MemberFilters
            ageFilter={ageFilter}
            groupFilter={groupFilter}
            statusFilter={statusFilter}
            joinDateFilter={joinDateFilter}
            onAgeChange={setAgeFilter}
            onGroupChange={setGroupFilter}
            onStatusChange={setStatusFilter}
            onJoinDateChange={setJoinDateFilter}
          />
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <MembersList
        members={members}
        selectedMembers={selectedMembers}
        onSelectMember={handleSelectMember}
        onSelectAllMembers={handleSelectAllMembers}
        onEdit={handleEditMember}
        onDelete={handleDeleteMember}
        onView={handleViewMember}
        loading={loading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">per page</span>
          </div>
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Member Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedMember ? 'Edit Member' : 'Add New Member'}
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
            <MemberForm
              member={selectedMember}
              onSubmit={selectedMember ? 
                (data) => handleUpdateMember(selectedMember.id, data) : 
                handleCreateMember
              }
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Bulk Actions ({selectedMembers.length} members)
              </h2>
              <button
                onClick={() => setShowBulkActions(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <BulkActions
              selectedCount={selectedMembers.length}
              onBulkUpdate={handleBulkUpdate}
              onBulkDelete={handleBulkDelete}
              onCancel={() => setShowBulkActions(false)}
            />
          </div>
        </div>
      )}

      <Toast />
    </div>
  );
};

export default MembersPage;