import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups';
import { useToast } from '../../hooks/useToast';
import GroupsList from '../../components/admin/Groups/GroupsList';
import GroupForm from '../../components/admin/Groups/GroupForm';
import GroupDetail from '../../components/admin/Groups/GroupDetail';
import SearchBar from '../../components/shared/SearchBar';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { PlusIcon, FilterIcon } from 'lucide-react';
import styles from './AdminPages.module.css';

const GroupsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    hasLeader: 'all',
    memberCount: 'all'
  });

  const {
    groups,
    loading,
    error,
    totalGroups,
    pagination,
    createGroup,
    updateGroup,
    deleteGroup,
    fetchGroups,
    searchGroups
  } = useGroups();

  const { showToast } = useToast();

  useEffect(() => {
    if (searchTerm) {
      searchGroups(searchTerm, filters);
    } else {
      fetchGroups(filters);
    }
  }, [searchTerm, filters]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term) {
      setSearchParams({ search: term });
    } else {
      setSearchParams({});
    }
  };

  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setShowGroupForm(true);
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setShowGroupForm(true);
  };

  const handleViewGroup = (group) => {
    setSelectedGroup(group);
    setShowGroupDetail(true);
  };

  const handleSaveGroup = async (groupData) => {
    try {
      if (selectedGroup) {
        await updateGroup(selectedGroup.id, groupData);
        showToast('Group updated successfully', 'success');
      } else {
        await createGroup(groupData);
        showToast('Group created successfully', 'success');
      }
      setShowGroupForm(false);
      setSelectedGroup(null);
    } catch (error) {
      showToast(error.message || 'Failed to save group', 'error');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        await deleteGroup(groupId);
        showToast('Group deleted successfully', 'success');
        if (selectedGroup && selectedGroup.id === groupId) {
          setSelectedGroup(null);
          setShowGroupDetail(false);
        }
      } catch (error) {
        showToast(error.message || 'Failed to delete group', 'error');
      }
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filteredGroupsCount = groups?.length || 0;

  if (loading && !groups) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <p>Loading groups...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Groups & Ministries</h1>
          <p className={styles.pageDescription}>
            Manage church groups, ministries, and small groups
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={FilterIcon}
          >
            Filters
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateGroup}
            icon={PlusIcon}
          >
            Add Group
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>Total Groups</h3>
            <span className={styles.statValue}>{totalGroups}</span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>Active Groups</h3>
            <span className={styles.statValue}>
              {groups?.filter(g => g.active).length || 0}
            </span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>Without Leaders</h3>
            <span className={styles.statValue}>
              {groups?.filter(g => !g.leader_name).length || 0}
            </span>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>Total Members</h3>
            <span className={styles.statValue}>
              {groups?.reduce((sum, g) => sum + (g.member_count || 0), 0) || 0}
            </span>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search groups by name, description, or leader..."
          className={styles.searchBar}
        />
        
        {showFilters && (
          <Card className={styles.filtersCard}>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange({ ...filters, category: e.target.value })}
                >
                  <option value="all">All Categories</option>
                  <option value="ministry">Ministry</option>
                  <option value="small-group">Small Group</option>
                  <option value="committee">Committee</option>
                  <option value="service">Service Team</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Leadership</label>
                <select
                  value={filters.hasLeader}
                  onChange={(e) => handleFilterChange({ ...filters, hasLeader: e.target.value })}
                >
                  <option value="all">All Groups</option>
                  <option value="yes">Has Leader</option>
                  <option value="no">Needs Leader</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Size</label>
                <select
                  value={filters.memberCount}
                  onChange={(e) => handleFilterChange({ ...filters, memberCount: e.target.value })}
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small (1-10)</option>
                  <option value="medium">Medium (11-25)</option>
                  <option value="large">Large (26+)</option>
                </select>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Results Summary */}
      <div className={styles.resultsInfo}>
        <p>
          Showing {filteredGroupsCount} of {totalGroups} groups
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      {/* Groups List */}
      {error ? (
        <Card className={styles.errorCard}>
          <p>Error loading groups: {error}</p>
          <Button onClick={() => fetchGroups(filters)} variant="outline">
            Try Again
          </Button>
        </Card>
      ) : (
        <GroupsList
          groups={groups}
          loading={loading}
          onEdit={handleEditGroup}
          onView={handleViewGroup}
          onDelete={handleDeleteGroup}
          pagination={pagination}
          onPageChange={(page) => fetchGroups(filters, page)}
        />
      )}

      {/* Group Form Modal */}
      <Modal
        isOpen={showGroupForm}
        onClose={() => {
          setShowGroupForm(false);
          setSelectedGroup(null);
        }}
        title={selectedGroup ? 'Edit Group' : 'Create New Group'}
        size="large"
      >
        <GroupForm
          group={selectedGroup}
          onSave={handleSaveGroup}
          onCancel={() => {
            setShowGroupForm(false);
            setSelectedGroup(null);
          }}
        />
      </Modal>

      {/* Group Detail Modal */}
      <Modal
        isOpen={showGroupDetail}
        onClose={() => {
          setShowGroupDetail(false);
          setSelectedGroup(null);
        }}
        title="Group Details"
        size="large"
      >
        <GroupDetail
          group={selectedGroup}
          onEdit={handleEditGroup}
          onDelete={handleDeleteGroup}
          onClose={() => {
            setShowGroupDetail(false);
            setSelectedGroup(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default GroupsPage;