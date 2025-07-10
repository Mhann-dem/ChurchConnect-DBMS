// ===============================
// src/components/admin/Members/MembersList.jsx
// ===============================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembers } from '../../../hooks/useMembers';
import { useToast } from '../../../hooks/useToast';
import MemberCard from './MemberCard';
import MemberFilters from './MemberFilters';
import BulkActions from './BulkActions';
import { SearchBar, Pagination, LoadingSpinner, EmptyState } from '../../shared';
import { Button } from '../../ui';
import { Plus, Filter, Download, Users } from 'lucide-react';
import styles from './Members.module.css';

const MembersList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    group: '',
    ageRange: '',
    pledgeStatus: '',
    registrationDate: '',
    status: 'active'
  });

  const {
    members,
    loading,
    error,
    totalPages,
    totalMembers,
    fetchMembers,
    deleteMember,
    updateMemberStatus
  } = useMembers({
    page: currentPage,
    search: searchQuery,
    filters
  });

  useEffect(() => {
    fetchMembers();
  }, [currentPage, searchQuery, filters]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleMemberSelect = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(member => member.id));
    }
  };

  const handleMemberDelete = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await deleteMember(memberId);
        showToast('Member deleted successfully', 'success');
        setSelectedMembers(prev => prev.filter(id => id !== memberId));
      } catch (error) {
        showToast('Failed to delete member', 'error');
      }
    }
  };

  const handleStatusChange = async (memberId, newStatus) => {
    try {
      await updateMemberStatus(memberId, newStatus);
      showToast(`Member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
      showToast('Failed to update member status', 'error');
    }
  };

  const handleExport = () => {
    // Export functionality will be implemented
    showToast('Export functionality coming soon', 'info');
  };

  if (loading && !members.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error loading members: {error}</p>
        <Button onClick={fetchMembers}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <Users className={styles.titleIcon} />
            Members
          </h1>
          <p className={styles.subtitle}>
            {totalMembers} total members
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={styles.filterButton}
          >
            <Filter size={16} />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className={styles.exportButton}
          >
            <Download size={16} />
            Export
          </Button>
          <Button
            onClick={() => navigate('/admin/members/new')}
            className={styles.addButton}
          >
            <Plus size={16} />
            Add Member
          </Button>
        </div>
      </div>

      <div className={styles.controls}>
        <SearchBar
          placeholder="Search members by name, email, or phone..."
          onSearch={handleSearch}
          className={styles.searchBar}
        />
        
        {showFilters && (
          <MemberFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        )}

        {selectedMembers.length > 0 && (
          <BulkActions
            selectedMembers={selectedMembers}
            onClearSelection={() => setSelectedMembers([])}
            onRefresh={fetchMembers}
          />
        )}
      </div>

      <div className={styles.content}>
        {members.length === 0 ? (
          <EmptyState
            title="No members found"
            description="Try adjusting your search or filters"
            icon={Users}
          />
        ) : (
          <>
            <div className={styles.memberGrid}>
              {members.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isSelected={selectedMembers.includes(member.id)}
                  onSelect={() => handleMemberSelect(member.id)}
                  onDelete={() => handleMemberDelete(member.id)}
                  onStatusChange={(status) => handleStatusChange(member.id, status)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className={styles.pagination}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MembersList;
