// Enhanced GroupsPage.jsx with Dashboard Integration and Improved Features
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Filter, 
  RefreshCw, 
  Download, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Eye, 
  Grid,
  List as ListIcon,
  BarChart3,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  Settings,
  Star,
  Activity
} from 'lucide-react';
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
import Avatar from '../../components/ui/Avatar';
import styles from './AdminPages.module.css';

const GroupsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Get initial state from URL params (dashboard integration)
  const initialAction = searchParams.get('action');
  const initialView = searchParams.get('view') || 'grid';
  const initialGroupId = searchParams.get('group');
  
  // State management
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupForm, setShowGroupForm] = useState(initialAction === 'create');
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState(initialView);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    category: searchParams.get('category') || 'all',
    hasLeader: searchParams.get('leader') || 'all',
    memberCount: searchParams.get('size') || 'all',
    isPublic: searchParams.get('visibility') || 'all'
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
        case 'updated':
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
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

  // Enhanced group statistics
  const groupStats = useMemo(() => {
    if (!groups) return { 
      total: 0, 
      active: 0, 
      withoutLeaders: 0, 
      totalMembers: 0, 
      avgMembers: 0,
      categories: {},
      recentActivity: 0,
      publicGroups: 0,
      privateGroups: 0
    };

    const total = groups.length;
    const active = groups.filter(g => g.active).length;
    const withoutLeaders = groups.filter(g => !g.leader_name).length;
    const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);
    const avgMembers = total > 0 ? Math.round(totalMembers / total) : 0;
    const publicGroups = groups.filter(g => g.is_public).length;
    const privateGroups = total - publicGroups;

    // Category breakdown
    const categories = groups.reduce((acc, group) => {
      const category = group.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Recent activity (groups updated in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = groups.filter(g => 
      new Date(g.updated_at) > weekAgo
    ).length;

    return { 
      total, 
      active, 
      withoutLeaders, 
      totalMembers, 
      avgMembers,
      categories,
      recentActivity,
      publicGroups,
      privateGroups
    };
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

  // Handle initial group selection from URL
  useEffect(() => {
    if (initialGroupId && groups.length > 0) {
      const group = groups.find(g => g.id === parseInt(initialGroupId));
      if (group) {
        setSelectedGroup(group);
        setShowGroupDetail(true);
      }
    }
  }, [initialGroupId, groups]);

  // Update URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (searchTerm) params.set('search', searchTerm);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.hasLeader !== 'all') params.set('leader', filters.hasLeader);
    if (filters.memberCount !== 'all') params.set('size', filters.memberCount);
    if (filters.isPublic !== 'all') params.set('visibility', filters.isPublic);
    
    setSearchParams(params);
  }, [viewMode, searchTerm, filters, setSearchParams]);

  // Handle search with debouncing
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

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
    // Update URL to include group ID
    const params = new URLSearchParams(searchParams);
    params.set('group', group.id.toString());
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

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
        // Remove group from URL
        const params = new URLSearchParams(searchParams);
        params.delete('group');
        setSearchParams(params);
      }
    } catch (error) {
      showToast(error.message || 'Failed to delete group', 'error');
    }
  }, [deleteGroup, showToast, selectedGroup, searchParams, setSearchParams]);

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

  // Tab configuration for analytics view
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'categories', label: 'Categories', icon: BarChart3 },
    { id: 'leadership', label: 'Leadership', icon: UserCheck },
    { id: 'activity', label: 'Recent Activity', icon: TrendingUp }
  ];

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
      {/* Enhanced Header */}
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

      {/* Enhanced Stats Cards */}
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
              <UserX size={24} />
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
              <Activity size={24} />
            </div>
            <div>
              <h3>Recent Activity</h3>
              <span className={styles.statValue}>{groupStats.recentActivity}</span>
            </div>
          </div>
          <div className={styles.statFooter}>
            <span className={styles.statSubtext}>
              Groups updated this week
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
              <option value="updated">Sort by Updated</option>
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
                icon={Grid}
              />
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                icon={ListIcon}
              />
              <Button
                variant={viewMode === 'analytics' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('analytics')}
                icon={BarChart3}
              />
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

      {/* Content based on view mode */}
      {viewMode === 'analytics' ? (
        <div className={styles.analyticsView}>
          {/* Analytics Tab Navigation */}
          <div className={styles.tabNavigation}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Analytics Content */}
          <div className={styles.analyticsContent}>
            {activeTab === 'overview' && (
              <div className={styles.overviewGrid}>
                <Card className={styles.analyticsCard}>
                  <h3>Group Distribution</h3>
                  <div className={styles.distributionChart}>
                    <div className={styles.chartItem}>
                      <div className={styles.chartBar} style={{ width: `${(groupStats.publicGroups / Math.max(groupStats.total, 1)) * 100}%` }}></div>
                      <span>Public Groups: {groupStats.publicGroups}</span>
                    </div>
                    <div className={styles.chartItem}>
                      <div className={styles.chartBar} style={{ width: `${(groupStats.privateGroups / Math.max(groupStats.total, 1)) * 100}%` }}></div>
                      <span>Private Groups: {groupStats.privateGroups}</span>
                    </div>
                  </div>
                </Card>

                <Card className={styles.analyticsCard}>
                  <h3>Health Indicators</h3>
                  <div className={styles.healthMetrics}>
                    <div className={styles.metric}>
                      <UserCheck size={20} />
                      <div>
                        <span className={styles.metricValue}>
                          {Math.round((groupStats.active / Math.max(groupStats.total, 1)) * 100)}%
                        </span>
                        <span className={styles.metricLabel}>Active Groups</span>
                      </div>
                    </div>
                    <div className={styles.metric}>
                      <Users size={20} />
                      <div>
                        <span className={styles.metricValue}>
                          {Math.round(((groupStats.total - groupStats.withoutLeaders) / Math.max(groupStats.total, 1)) * 100)}%
                        </span>
                        <span className={styles.metricLabel}>With Leaders</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className={styles.categoriesView}>
                <Card className={styles.analyticsCard}>
                  <h3>Groups by Category</h3>
                  <div className={styles.categoryList}>
                    {Object.entries(groupStats.categories).map(([category, count]) => (
                      <div key={category} className={styles.categoryItem}>
                        <span className={styles.categoryName}>{category}</span>
                        <Badge variant="secondary">{count} groups</Badge>
                      </div>
                    ))}
                    {Object.keys(groupStats.categories).length === 0 && (
                      <p className={styles.emptyText}>No categories found</p>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'leadership' && (
              <div className={styles.leadershipView}>
                <Card className={styles.analyticsCard}>
                  <h3>Leadership Status</h3>
                  <div className={styles.leadershipStats}>
                    <div className={styles.statRow}>
                      <span>Groups with Leaders:</span>
                      <Badge variant="success">{groupStats.total - groupStats.withoutLeaders}</Badge>
                    </div>
                    <div className={styles.statRow}>
                      <span>Groups needing Leaders:</span>
                      <Badge variant="warning">{groupStats.withoutLeaders}</Badge>
                    </div>
                    <div className={styles.statRow}>
                      <span>Leadership Coverage:</span>
                      <Badge variant={groupStats.withoutLeaders === 0 ? 'success' : 'warning'}>
                        {Math.round(((groupStats.total - groupStats.withoutLeaders) / Math.max(groupStats.total, 1)) * 100)}%
                      </Badge>
                    </div>
                  </div>
                </Card>

                {groupStats.withoutLeaders > 0 && (
                  <Card className={styles.analyticsCard}>
                    <h3>Groups Needing Leaders</h3>
                    <div className={styles.needsLeaderList}>
                      {filteredAndSortedGroups
                        .filter(group => !group.leader_name)
                        .slice(0, 5)
                        .map(group => (
                          <div key={group.id} className={styles.needsLeaderItem}>
                            <div>
                              <h4>{group.name}</h4>
                              <p>{group.category || 'Uncategorized'}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleViewGroup(group)}
                            >
                              View
                            </Button>
                          </div>
                        ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className={styles.activityView}>
                <Card className={styles.analyticsCard}>
                  <h3>Recent Activity</h3>
                  <div className={styles.activityList}>
                    {filteredAndSortedGroups
                      .filter(group => {
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        return new Date(group.updated_at) > weekAgo;
                      })
                      .slice(0, 10)
                      .map(group => (
                        <div key={group.id} className={styles.activityItem}>
                          <Avatar name={group.name} size="sm" />
                          <div className={styles.activityDetails}>
                            <h4>{group.name}</h4>
                            <p>Updated {new Date(group.updated_at).toLocaleDateString()}</p>
                          </div>
                          <Badge variant="info">{group.member_count || 0} members</Badge>
                        </div>
                      ))}
                    {groupStats.recentActivity === 0 && (
                      <p className={styles.emptyText}>No recent activity</p>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Groups List */
        error ? (
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
        )
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
          // Remove group from URL
          const params = new URLSearchParams(searchParams);
          params.delete('group');
          setSearchParams(params);
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
            const params = new URLSearchParams(searchParams);
            params.delete('group');
            setSearchParams(params);
          }}
        />
      </Modal>
    </div>
  );
};

export default GroupsPage;