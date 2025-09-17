// frontend/src/components/admin/Families/MemberSelector.jsx
import React, { useState, useEffect } from 'react';
import { useMembers } from '../../../hooks/useMembers';
import SearchBar from '../../shared/SearchBar';
import LoadingSpinner from '../../shared/LoadingSpinner';
import './Families.module.css';

const MemberSelector = ({ 
  onMemberSelect, 
  selectedMemberId, 
  excludeMembers = [],
  placeholder = "Search and select a member..." 
}) => {
  const { members, fetchMembers, loading } = useMembers();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch members without families
    fetchMembers({ family_id__isnull: true });
  }, [fetchMembers]);

  useEffect(() => {
    if (members) {
      let filtered = members.filter(member => 
        !excludeMembers.includes(member.id) &&
        (searchTerm === '' || 
         `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
         member.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredMembers(filtered);
      setIsDropdownOpen(searchTerm.length > 0 || filtered.length > 0);
    }
  }, [members, searchTerm, excludeMembers]);

  const handleMemberClick = (member) => {
    onMemberSelect(member);
    setSearchTerm(`${member.first_name} ${member.last_name}`);
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (!value) {
      onMemberSelect(null);
      setIsDropdownOpen(false);
    }
  };

  const selectedMember = selectedMemberId 
    ? members?.find(m => m.id === selectedMemberId)
    : null;

  return (
    <div className="member-selector">
      <SearchBar
        value={searchTerm || (selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : '')}
        onChange={handleSearchChange}
        placeholder={placeholder}
        onFocus={() => setIsDropdownOpen(true)}
      />

      {isDropdownOpen && (
        <div className="member-dropdown">
          {loading && <LoadingSpinner size="sm" />}
          
          {!loading && filteredMembers.length === 0 && (
            <div className="no-members-dropdown">
              {searchTerm ? 'No members found matching your search.' : 'No available members.'}
            </div>
          )}

          {!loading && filteredMembers.length > 0 && (
            <div className="members-dropdown-list">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="member-dropdown-item"
                  onClick={() => handleMemberClick(member)}
                >
                  <div className="member-dropdown-info">
                    <div className="member-dropdown-name">
                      {member.first_name} {member.last_name}
                    </div>
                    <div className="member-dropdown-details">
                      {member.email && <span>{member.email}</span>}
                      {member.phone && <span>{member.phone}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberSelector;