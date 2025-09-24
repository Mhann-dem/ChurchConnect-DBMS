// frontend/src/services/families.js - CORRECTED VERSION
import api from './api';

const familiesService = {
  // Family management - Updated to match API endpoints
  getFamilies: (params = {}) => {
    return api.get('families/', { params });
  },

  getFamily: (id) => {
    return api.get(`families/${id}/`);
  },

  createFamily: (data) => {
    return api.post('families/', data);
  },

  updateFamily: (id, data) => {
    return api.put(`families/${id}/`, data);
  },

  patchFamily: (id, data) => {
    return api.patch(`families/${id}/`, data);
  },

  deleteFamily: (id) => {
    return api.delete(`families/${id}/`);
  },

  // Family member management - Fixed endpoints
  addMemberToFamily: (familyId, memberData) => {
    return api.post(`families/${familyId}/add-member/`, memberData);
  },

  removeMemberFromFamily: (familyId, memberId) => {
    return api.delete(`families/${familyId}/remove-member/${memberId}/`);
  },

  getFamilyMembers: (familyId) => {
    return api.get(`families/${familyId}/members/`);
  },

  updateMemberRelationship: (familyId, memberId, data) => {
    return api.patch(`families/${familyId}/update-relationship/${memberId}/`, data);
  },

  setPrimaryContact: (familyId, memberId) => {
    return api.post(`families/${familyId}/set-primary-contact/`, { member_id: memberId });
  },

  // Family analytics and reports
  getFamilyStatistics: () => {
    return api.get('families/statistics/');
  },

  getRecentFamilies: (days = 30) => {
    return api.get('families/recent-families/', { params: { days } });
  },

  getFamiliesNeedingAttention: () => {
    return api.get('families/families-needing-attention/');
  },

  bulkOperations: (operation, familyIds) => {
    return api.post('families/bulk-operations/', {
      operation,
      family_ids: familyIds
    });
  },

  // Family relationships (direct management)
  getFamilyRelationships: (params = {}) => {
    return api.get('families/relationships/', { params });
  },

  createFamilyRelationship: (data) => {
    return api.post('families/relationships/', data);
  },

  getFamilyRelationship: (id) => {
    return api.get(`families/relationships/${id}/`);
  },

  updateFamilyRelationship: (id, data) => {
    return api.put(`families/relationships/${id}/`, data);
  },

  deleteFamilyRelationship: (id) => {
    return api.delete(`families/relationships/${id}/`);
  }
};

export default familiesService;