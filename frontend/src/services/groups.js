// services/groups.js
import { api } from './api';

const GROUPS_ENDPOINTS = {
  LIST: '/groups/',
  DETAIL: (id) => `/groups/${id}/`,
  CREATE: '/groups/',
  UPDATE: (id) => `/groups/${id}/`,
  DELETE: (id) => `/groups/${id}/`,
  MEMBERS: (id) => `/groups/${id}/members/`,
  ADD_MEMBER: (id) => `/groups/${id}/add-member/`,
  REMOVE_MEMBER: (id) => `/groups/${id}/remove-member/`,
  STATS: '/groups/stats/',
};

class GroupsService {
  async getGroups(params = {}) {
    try {
      const response = await api.get(GROUPS_ENDPOINTS.LIST, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch groups',
      };
    }
  }

  async getGroup(id) {
    try {
      const response = await api.get(GROUPS_ENDPOINTS.DETAIL(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch group',
      };
    }
  }

  async createGroup(groupData) {
    try {
      const response = await api.post(GROUPS_ENDPOINTS.CREATE, groupData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create group',
        validationErrors: error.response?.data?.errors,
      };
    }
  }

  async updateGroup(id, groupData) {
    try {
      const response = await api.put(GROUPS_ENDPOINTS.UPDATE(id), groupData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update group',
        validationErrors: error.response?.data?.errors,
      };
    }
  }

  async deleteGroup(id) {
    try {
      await api.delete(GROUPS_ENDPOINTS.DELETE(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete group',
      };
    }
  }

  async getGroupMembers(id) {
    try {
      const response = await api.get(GROUPS_ENDPOINTS.MEMBERS(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch group members',
      };
    }
  }

  async addMemberToGroup(groupId, memberId, role = '') {
    try {
      const response = await api.post(GROUPS_ENDPOINTS.ADD_MEMBER(groupId), {
        member_id: memberId,
        role,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to add member to group',
      };
    }
  }

  async removeMemberFromGroup(groupId, memberId) {
    try {
      const response = await api.post(GROUPS_ENDPOINTS.REMOVE_MEMBER(groupId), {
        member_id: memberId,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove member from group',
      };
    }
  }

  async getGroupStats() {
    try {
      const response = await api.get(GROUPS_ENDPOINTS.STATS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch group stats',
      };
    }
  }
}

export default new GroupsService();