// Temporary Simple MembersList Component
import React from 'react';

const SimpleMembersList = ({
  members = [],
  selectedMembers = new Set(),
  onMemberSelection,
  onSelectAll,
  isLoading = false,
  onNavigateToMember
}) => {

  const handleSelectAll = (e) => {
    if (onSelectAll) {
      onSelectAll(e.target.checked);
    }
  };

  const handleMemberSelect = (memberId) => {
    if (onMemberSelection) {
      const isCurrentlySelected = selectedMembers.has(memberId);
      onMemberSelection(memberId, !isCurrentlySelected);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <input
              type="checkbox"
              checked={members.length > 0 && selectedMembers.size === members.length}
              onChange={handleSelectAll}
              style={{ cursor: 'pointer' }}
            />
            Select All ({members.length} members)
          </label>
        </div>
      </div>

      {/* Members List */}
      <div>
        {members.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p>No members found</p>
          </div>
        ) : (
          members.map((member, index) => (
            <div
              key={member.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 24px',
                borderBottom: index < members.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                backgroundColor: selectedMembers.has(member.id) ? '#eff6ff' : 'white'
              }}
              onMouseEnter={(e) => {
                if (!selectedMembers.has(member.id)) {
                  e.target.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedMembers.has(member.id)) {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedMembers.has(member.id)}
                onChange={() => handleMemberSelect(member.id)}
                onClick={(e) => e.stopPropagation()}
                style={{ cursor: 'pointer' }}
              />

              {/* Avatar */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {member.first_name?.[0]}{member.last_name?.[0]}
              </div>

              {/* Member Info */}
              <div 
                style={{ flex: 1, minWidth: 0 }}
                onClick={() => onNavigateToMember && onNavigateToMember(member.id)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '4px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    {member.first_name} {member.last_name}
                  </h3>
                  
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: '500',
                    backgroundColor: member.is_active ? '#d1fae5' : '#fee2e2',
                    color: member.is_active ? '#065f46' : '#991b1b'
                  }}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {member.email && (
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      📧 {member.email}
                    </p>
                  )}
                  
                  {member.phone && (
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      📱 {member.phone}
                    </p>
                  )}
                  
                  {member.registration_date && (
                    <p style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      margin: 0
                    }}>
                      Joined: {new Date(member.registration_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateToMember) {
                      onNavigateToMember(member.id);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SimpleMembersList;