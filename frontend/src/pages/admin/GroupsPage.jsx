// Enhanced GroupsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, RefreshCw, Download, Users, TrendingUp, AlertCircle, Eye } from 'lucide-react';
import { useGroups } from '../../hooks/useGroups';
import { useToast } from '../../hooks/useToast';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import GroupsList from '../../components/admin/Groups/GroupsList';
import GroupForm from '../../components/admin/Groups/GroupForm';
import GroupDetail from '../../components/admin/Groups/GroupDetail';
import SearchBar from '../../components/shared/SearchBar';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import styles from './AdminPages.module.css';

const GroupsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    hasLeader: 'all',
    memberCount: 'all',
    isPublic: 'all'
  });

  const {
    groups,
    loading,
    error,
    pagination,
    createGroup,
    updateGroup,
    deleteGroup,
    refreshGroups,
    searchGroups,
    getGroupStats,
    exportGroupData
  } = useGroups();

  const { showToast } = useToast();

  // Real-time updates for groups
  useRealTimeUpdates('groups', {
    onUpdate: (updatedGroup) => {
      showToast(`Group "${updatedGroup.name}" was updated`, 'info');
      refreshGroups();
    },
    onDelete: (deletedGroupId) => {
      showToast('A group was deleted', 'info');
      refreshGroups();
    },
    onCreate: (newGroup) => {
      showToast(`New group "${newGroup.name}" was created`, 'success');
      refreshGroups();
    }
  });

  // Memoized filtered and sorted groups
  const filteredAndSortedGroups = useMemo(() => {
    if (!groups) return [];

    let filtered = groups.filter(group => {
      const matchesSearch = searchTerm === '' || 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.leader_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'active' && group.active) ||
        (filters.status === 'inactive' && !group.active);

      const matchesCategory = filters.category === 'all' || group.category === filters.category;

      const matchesLeader = filters.hasLeader === 'all' ||
        (filters.hasLeader === 'yes' && group.leader_name) ||
        (filters.hasLeader === 'no' && !group.leader_name);

      const matchesMemberCount = filters.memberCount === 'all' ||
        (filters.memberCount === 'small' && (group.member_count || 0) <= 10) ||
        (filters.memberCount === 'medium' && (group.member_count || 0) > 10 && (group.member_count || 0) <= 25) ||
        (filters.memberCount === 'large' && (group.member_count || 0) > 25);

      const matchesPublic = filters.isPublic === 'all' ||
        (filters.isPublic === 'public' && group.is_public) ||
        (filters.isPublic === 'private' && !group.is_public);

      return matchesSearch && matchesStatus && matchesCategory && matchesLeader && matchesMemberCount && matchesPublic;
    });

    // Sort groups
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'members':
          aValue = a.member_count || 0;
          bValue = b.member_count || 0;
          break;
        case 'created':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'leader':
          aValue = a.leader_name || '';
          bValue = b.leader_name || '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [groups, searchTerm, filters, sortBy, sortOrder]);

  // Group statistics
  const groupStats = useMemo(() => {
    if (!groups) return { total: 0, active: 0, withoutLeaders: 0, totalMembers: 0, avgMembers: 0 };

    const total = groups.length;
    const active = groups.filter(g => g.active).length;
    const withoutLeaders = groups.filter(g => !g.leader_name).length;
    const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);
    const avgMembers = total > 0 ? Math.round(totalMembers / total) : 0;

    return { total, active, withoutLeaders, totalMembers, avgMembers };
  }, [groups]);

  // Load groups on mount and when filters change
  useEffect(() => {
    const loadGroups = async () => {
      try {
        if (searchTerm) {
          await searchGroups(searchTerm, filters);
        } else {
          await refreshGroups(filters);
        }
      } catch (error) {
        showToast('Failed to load groups', 'error');
      }
    };

    loadGroups();
  }, [searchTerm, filters, refreshGroups, searchGroups, showToast]);

  // Handle search with debouncing
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (term) {
      setSearchParams({ search: term });
    } else {
      setSearchParams({});
    }
  }, [setSearchParams]);

  // Group management handlers
  const handleCreateGroup = useCallback(() => {
    setSelectedGroup(null);
    setShowGroupForm(true);
  }, []);

  const handleEditGroup = useCallback((group) => {
    setSelectedGroup(group);
    setShowGroupForm(true);
  }, []);

  const handleViewGroup = useCallback((group) => {
    setSelectedGroup(group);
    setShowGroupDetail(true);
  }, []);

  const handleSaveGroup = useCallback(async (groupData) => {
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
      throw error; // Re-throw to let form handle it
    }
  }, [selectedGroup, updateGroup, createGroup, showToast]);

  const handleDeleteGroup = useCallback(async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`)) {
      return;
    }

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
  }, [deleteGroup, showToast, selectedGroup]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleExport = useCallback(async () => {
    try {
      await exportGroupData(filteredAndSortedGroups.map(g => g.id));
      showToast('Groups exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export groups', 'error');
    }
  }, [filteredAndSortedGroups, exportGroupData, showToast]);

  const handleRefresh = useCallback(async () => {
    try {
      await refreshGroups(filters);
      showToast('Groups refreshed', 'success');
    } catch (error) {
      showToast('Failed to refresh groups', 'error');
    }
  }, [refreshGroups, filters, showToast]);

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      category: 'all',
      hasLeader: 'all',
      memberCount: 'all',
      isPublic: 'all'
    });
    setSearchTerm('');
    setSearchParams({});
  }, [setSearchParams]);

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
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Groups & Ministries</h1>
          <p className={styles.pageDescription}>
            Manage church groups, ministries, and small groups with real-time updates
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="outline"
            onClick={handleRefresh}
            icon={RefreshCw}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={Filter}
          >
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            icon={Download}
            disabled={filteredAndSortedGroups.length === 0}
          >
            Export
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateGroup}
            icon={Plus}
          >
            Add Group
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <Users size={24} />
            </div>
            <div>
              <h3>Total Groups</h3>
              <span className={styles.statValue}>{groupStats.total}</span>
            </div>
          </div>
          <div className={styles.statFooter}>
            <Badge variant={groupStats.active === groupStats.total ? 'success' : 'warning'}>
              {groupStats.active} active
            </Badge>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <TrendingUp size={24} />
            </div>
            <div>
              <h3>Total Members</h3>
              <span className={styles.statValue}>{groupStats.totalMembers}</span>
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statSubtext}>
              Avg {groupStats.avgMembers} per group
            </span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <AlertCircle size={24} />
            </div>
            <div>
              <h3>Need Leaders</h3>
              <span className={styles.statValue}>{groupStats.withoutLeaders}</span>
            </div>
          </div>
          <div className={styles.statFooter}>
            <Badge variant={groupStats.withoutLeaders > 0 ? 'warning' : 'success'}>
              {groupStats.withoutLeaders === 0 ? 'All have leaders' : 'Action needed'}
            </Badge>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statIcon}>
              <Eye size={24} />
            </div>
            <div>
              <h3>Filtered Results</h3>
              <span className={styles.statValue}>{filteredAndSortedGroups.length}</span>
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statSubtext}>
              {filteredAndSortedGroups.length === groupStats.total ? 'Showing all' : 'Filtered view'}
            </span>
          </div>
        </Card>
      </div>

      {/* Search and Controls */}
      <div className={styles.searchSection}>
        <div className={styles.searchControls}>
          <SearchBar
            onSearch={handleSearch}
            value={searchTerm}
            placeholder="Search groups by name, description, or leader..."
            className={styles.searchBar}
          />
          
          <div className={styles.viewControls}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="name">Sort by Name</option>
              <option value="members">Sort by Members</option>
              <option value="created">Sort by Created</option>
              <option value="category">Sort by Category</option>
              <option value="leader">Sort by Leader</option>
            </select>
            
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={styles.sortOrder}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
            
            <div className={styles.viewModeToggle}>
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className={styles.filtersCard}>
            <div className={styles.filtersHeader}>
              <h3>Advanced Filters</h3>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value })}
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
                  onChange={(e) => handleFilterChange({ category: e.target.value })}
                >
                  <option value="all">All Categories</option>
                  <option value="ministry">Ministry</option>
                  <option value="small-group">Small Group</option>
                  <option value="committee">Committee</option>
                  <option value="service">Service Team</option>
                  <option value="youth">Youth Group</option>
                  <option value="seniors">Seniors Group</option>
                  <option value="worship">Worship Team</option>
                  <option value="outreach">Outreach</option>
                  <option value="prayer">Prayer Group</option>
                  <option value="study">Bible Study</option>
                  <option value="support">Support Group</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label>Leadership</label>
                <select
                  value={filters.hasLeader}
                  onChange={(e) => handleFilterChange({ hasLeader: e.target.value })}
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
                  onChange={(e) => handleFilterChange({ memberCount: e.target.value })}
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small (1-10)</option>
                  <option value="medium">Medium (11-25)</option>
                  <option value="large">Large (26+)</option>
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <label>Visibility</label>
                <select
                  value={filters.isPublic}
                  onChange={(e) => handleFilterChange({ isPublic: e.target.value })}
                >
                  <option value="all">All Groups</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Results Summary */}
      <div className={styles.resultsInfo}>
        <p>
          Showing {filteredAndSortedGroups.length} of {groupStats.total} groups
          {searchTerm && ` matching "${searchTerm}"`}
          {Object.values(filters).some(v => v !== 'all') && ' with filters applied'}
        </p>
        {filteredAndSortedGroups.length !== groupStats.total && (
          <Button variant="link" onClick={clearFilters} size="sm">
            Show all groups
          </Button>
        )}
      </div>

      {/* Groups List */}
      {error ? (
        <Card className={styles.errorCard}>
          <div className={styles.errorContent}>
            <AlertCircle size={48} className={styles.errorIcon} />
            <h3>Error Loading Groups</h3>
            <p>{error}</p>
            <Button onClick={handleRefresh} variant="primary">
              Try Again
            </Button>
          </div>
        </Card>
      ) : (
        <GroupsList
          groups={filteredAndSortedGroups}
          loading={loading}
          viewMode={viewMode}
          onEdit={handleEditGroup}
          onView={handleViewGroup}
          onDelete={handleDeleteGroup}
          emptyMessage={
            searchTerm || Object.values(filters).some(v => v !== 'all')
              ? 'No groups match your current filters.'
              : 'No groups have been created yet.'
          }
          emptyAction={
            searchTerm || Object.values(filters).some(v => v !== 'all')
              ? { label: 'Clear Filters', action: clearFilters }
              : { label: 'Create First Group', action: handleCreateGroup }
          }
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
        className={styles.groupFormModal}
      >
        <GroupForm
          group={selectedGroup}
          onSave={handleSaveGroup}
          onCancel={() => {
            setShowGroupForm(false);
            setSelectedGroup(null);
          }}
          loading={loading}
        />
      </Modal>

      {/* Group Detail Modal */}
      <Modal
        isOpen={showGroupDetail}
        onClose={() => {
          setShowGroupDetail(false);
          setSelectedGroup(null);
        }}
        title={selectedGroup?.name || 'Group Details'}
        size="large"
        className={styles.groupDetailModal}
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