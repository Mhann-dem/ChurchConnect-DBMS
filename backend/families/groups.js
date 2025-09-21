// services/groups.js - Improved version with proper Django REST Framework integration
import api from './api';

const GROUPS_ENDPOINTS = {
  // Base endpoints matching Django URLs
  LIST: 'groups/',
  CREATE: 'groups/',
  DETAIL: (id) => `groups/${id}/`,
  UPDATE: (id) => `groups/${id}/`,
  DELETE: (id) => `groups/${id}/`,
  
  // Member management endpoints
  MEMBERS: (id) => `groups/${id}/members/`,
  JOIN: (id) => `groups/${id}/join/`,
  REMOVE_MEMBER: (id, memberId) => `groups/${id}/remove-member/${memberId}/`,
  UPDATE_MEMBERSHIP: (id, memberId) => `groups/${id}/update-membership/${memberId}/`,
  APPROVE_MEMBER: (id, memberId) => `groups/${id}/approve-member/${memberId}/`,
  DECLINE_MEMBER: (id, memberId) => `groups/${id}/decline-member/${memberId}/`,
  
  // Statistics and categories
  STATISTICS: 'groups/statistics/',
  PUBLIC: 'groups/public/',
  EXPORT: (id) => `groups/${id}/export/`,
  
  // Categories
  CATEGORIES: 'groups/categories/',
  CATEGORY_DETAIL: (id) => `groups/categories/${id}/`,
  CATEGORY_GROUPS: (id) => `groups/categories/${id}/groups/`,
  CATEGORIES_WITH_COUNTS: 'groups/categories/with-counts/',
  
  // Memberships
  MEMBERSHIPS: 'groups/memberships/',
  MEMBERSHIP_DETAIL: (id) => `groups/memberships/${id}/`,
  ACTIVATE_MEMBERSHIP: (id) => `groups/memberships/${id}/activate/`,
  DEACTIVATE_MEMBERSHIP: (id) => `groups/memberships/${id}/deactivate/`,
  PENDING_MEMBERSHIPS: 'groups/memberships/pending/',
  MEMBERSHIP_STATISTICS: 'groups/memberships/statistics/'
};

class GroupsService {
  // Get all groups with pagination and filters
  async getGroups(params = {}) {
    try {
      console.log('[GroupsService] Fetching groups with params:', params);
      const response = await api.get(GROUPS_ENDPOINTS.LIST, { params });
      
      // Handle both paginated and non-paginated responses
      const data = response.data;
      
      if (data.results) {
        // Paginated response
        return {
          success: true,
          data: {
            results: data.results,
            count: data.count,
            next: data.next,
            previous: data.previous,
            page: params.page || 1,
            limit: params.limit || data.results.length
          }
        };
      } else {
        // Non-paginated response
        return {
          success: true,
          data: {
            results: Array.isArray(data) ? data : [data],
            count: Array.isArray(data) ? data.length : 1,
            page: 1,
            limit: Array.isArray(data) ? data.length : 1
          }
        };
      }
    } catch (error) {
      console.error('[GroupsService] Error fetching groups:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               error.message || 
               'Failed to fetch groups',
        status: error.response?.status
      };
    }
  }

  // Get single group by ID
  async getGroup(id) {
    try {
      console.log('[GroupsService] Fetching group:', id);
      const response = await api.get(GROUPS_ENDPOINTS.DETAIL(id));
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error fetching group:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to fetch group',
        status: error.response?.status
      };
    }
  }

  // Create new group
  async createGroup(groupData) {
    try {
      console.log('[GroupsService] Creating group:', groupData);
      
      // Ensure required fields
      const payload = {
        name: groupData.name,
        description: groupData.description || '',
        leader_name: groupData.leader_name || '',
        meeting_schedule: groupData.meeting_schedule || '',
        category: groupData.category || null,
        active: groupData.active !== undefined ? groupData.active : true,
        max_members: groupData.max_members || null,
        is_public: groupData.is_public !== undefined ? groupData.is_public : true,
        ...groupData
      };
      
      const response = await api.post(GROUPS_ENDPOINTS.CREATE, payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error creating group:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to create group',
        validationErrors: error.response?.data?.errors || error.response?.data,
        status: error.response?.status
      };
    }
  }

  // Update existing group
  async updateGroup(id, groupData) {
    try {
      console.log('[GroupsService] Updating group:', id, groupData);
      const response = await api.put(GROUPS_ENDPOINTS.UPDATE(id), groupData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error updating group:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to update group',
        validationErrors: error.response?.data?.errors || error.response?.data,
        status: error.response?.status
      };
    }
  }

  // Partial update group
  async patchGroup(id, groupData) {
    try {
      console.log('[GroupsService] Patching group:', id, groupData);
      const response = await api.patch(GROUPS_ENDPOINTS.UPDATE(id), groupData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error patching group:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to update group',
        validationErrors: error.response?.data?.errors || error.response?.data,
        status: error.response?.status
      };
    }
  }

  // Delete group
  async deleteGroup(id) {
    try {
      console.log('[GroupsService] Deleting group:', id);
      await api.delete(GROUPS_ENDPOINTS.DELETE(id));
      return { success: true };
    } catch (error) {
      console.error('[GroupsService] Error deleting group:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to delete group',
        status: error.response?.status
      };
    }
  }

  // Get group members
  async getGroupMembers(id, params = {}) {
    try {
      console.log('[GroupsService] Fetching group members:', id);
      const response = await api.get(GROUPS_ENDPOINTS.MEMBERS(id), { params });
      
      // Handle both paginated and non-paginated responses
      const data = response.data;
      if (data.results) {
        return { success: true, data };
      } else {
        return { 
          success: true, 
          data: { 
            results: Array.isArray(data) ? data : [data],
            count: Array.isArray(data) ? data.length : 1
          } 
        };
      }
    } catch (error) {
      console.error('[GroupsService] Error fetching group members:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to fetch group members',
        status: error.response?.status
      };
    }
  }

  // Add member to group
  async addMemberToGroup(groupId, memberData) {
    try {
      console.log('[GroupsService] Adding member to group:', groupId, memberData);
      
      const payload = {
        member_id: memberData.member_id || memberData.memberId,
        role: memberData.role || '',
        status: memberData.status || 'active'
      };
      
      const response = await api.post(GROUPS_ENDPOINTS.JOIN(groupId), payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error adding member to group:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to add member to group',
        status: error.response?.status
      };
    }
  }

  // Remove member from group
  async removeMemberFromGroup(groupId, memberId) {
    try {
      console.log('[GroupsService] Removing member from group:', groupId, memberId);
      await api.delete(GROUPS_ENDPOINTS.REMOVE_MEMBER(groupId, memberId));
      return { success: true };
    } catch (error) {
      console.error('[GroupsService] Error removing member from group:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to remove member from group',
        status: error.response?.status
      };
    }
  }

  // Update member's role/status in group
  async updateMembership(groupId, memberId, updateData) {
    try {
      console.log('[GroupsService] Updating membership:', groupId, memberId, updateData);
      const response = await api.patch(GROUPS_ENDPOINTS.UPDATE_MEMBERSHIP(groupId, memberId), updateData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error updating membership:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to update membership',
        status: error.response?.status
      };
    }
  }

  // Get group statistics
  async getGroupStats() {
    try {
      console.log('[GroupsService] Fetching group statistics');
      const response = await api.get(GROUPS_ENDPOINTS.STATISTICS);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error fetching group stats:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to fetch group statistics',
        status: error.response?.status
      };
    }
  }

  // Get public groups
  async getPublicGroups(params = {}) {
    try {
      console.log('[GroupsService] Fetching public groups');
      const response = await api.get(GROUPS_ENDPOINTS.PUBLIC, { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error fetching public groups:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to fetch public groups',
        status: error.response?.status
      };
    }
  }

  // Export group data
  async exportGroup(id, format = 'csv') {
    try {
      console.log('[GroupsService] Exporting group data:', id, format);
      const response = await api.get(GROUPS_ENDPOINTS.EXPORT(id), {
        params: { format },
        responseType: 'blob'
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error exporting group data:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to export group data',
        status: error.response?.status
      };
    }
  }

  // Search groups
  async searchGroups(query, params = {}) {
    try {
      console.log('[GroupsService] Searching groups:', query, params);
      const searchParams = {
        search: query,
        ...params
      };
      
      return await this.getGroups(searchParams);
    } catch (error) {
      console.error('[GroupsService] Error searching groups:', error);
      return {
        success: false,
        error: 'Failed to search groups',
        status: error.response?.status
      };
    }
  }

  // Category Management
  async getCategories(params = {}) {
    try {
      console.log('[GroupsService] Fetching categories');
      const response = await api.get(GROUPS_ENDPOINTS.CATEGORIES, { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error fetching categories:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to fetch categories',
        status: error.response?.status
      };
    }
  }

  async createCategory(categoryData) {
    try {
      console.log('[GroupsService] Creating category:', categoryData);
      const response = await api.post(GROUPS_ENDPOINTS.CATEGORIES, categoryData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error creating category:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to create category',
        validationErrors: error.response?.data?.errors || error.response?.data,
        status: error.response?.status
      };
    }
  }

  async updateCategory(id, categoryData) {
    try {
      console.log('[GroupsService] Updating category:', id, categoryData);
      const response = await api.put(GROUPS_ENDPOINTS.CATEGORY_DETAIL(id), categoryData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error updating category:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to update category',
        validationErrors: error.response?.data?.errors || error.response?.data,
        status: error.response?.status
      };
    }
  }

  async deleteCategory(id) {
    try {
      console.log('[GroupsService] Deleting category:', id);
      await api.delete(GROUPS_ENDPOINTS.CATEGORY_DETAIL(id));
      return { success: true };
    } catch (error) {
      console.error('[GroupsService] Error deleting category:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to delete category',
        status: error.response?.status
      };
    }
  }

  // Get categories with group counts
  async getCategoriesWithCounts() {
    try {
      console.log('[GroupsService] Fetching categories with counts');
      const response = await api.get(GROUPS_ENDPOINTS.CATEGORIES_WITH_COUNTS);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error fetching categories with counts:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to fetch categories with counts',
        status: error.response?.status
      };
    }
  }

  // Membership Management
  async getMemberships(params = {}) {
    try {
      console.log('[GroupsService] Fetching memberships');
      const response = await api.get(GROUPS_ENDPOINTS.MEMBERSHIPS, { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error fetching memberships:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to fetch memberships',
        status: error.response?.status
      };
    }
  }

  async getPendingMemberships() {
    try {
      console.log('[GroupsService] Fetching pending memberships');
      const response = await api.get(GROUPS_ENDPOINTS.PENDING_MEMBERSHIPS);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error fetching pending memberships:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to fetch pending memberships',
        status: error.response?.status
      };
    }
  }

  async getMembershipStatistics() {
    try {
      console.log('[GroupsService] Fetching membership statistics');
      const response = await api.get(GROUPS_ENDPOINTS.MEMBERSHIP_STATISTICS);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[GroupsService] Error fetching membership statistics:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 
               error.response?.data?.message || 
               'Failed to fetch membership statistics',
        status: error.response?.status
      };
    }
  }
}

// Create and export singleton instance
const groupsService = new GroupsService();
export default groupsService;