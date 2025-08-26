// services/members.js
import { api, publicApiLimiter } from './api';

const MEMBERS_ENDPOINTS = {
  LIST: '/members/',
  DETAIL: (id) => `/members/${id}/`,
  CREATE: '/members/',
  UPDATE: (id) => `/members/${id}/`,
  DELETE: (id) => `/members/${id}/`,
  SEARCH: '/members/search/',
  BULK_UPDATE: '/members/bulk-update/',
  BULK_DELETE: '/members/bulk-delete/',
  BULK_IMPORT: '/members/bulk-import/',
  BULK_EMAIL: '/members/bulk-email/',
  BULK_TAG: '/members/bulk-tag/',
  EXPORT: '/members/export/',
  STATS: '/members/stats/',
  RECENT: '/members/recent/',
  // Form saving functionality
  SAVE_FORM: '/forms/save/',
  GET_SAVED_FORM: (id) => `/forms/${id}/`,
  DELETE_SAVED_FORM: (id) => `/forms/${id}/`,
  SEND_CONTINUE_EMAIL: '/forms/send-continue-email/',
};

class MembersService {
  async getMembers(params = {}) {
    try {
      const response = await api.get(MEMBERS_ENDPOINTS.LIST, { params });
      return {
        success: true,
        data: response.data.results,
        pagination: {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch members',
      };
    }
  }

  async getMember(id) {
    try {
      const response = await api.get(MEMBERS_ENDPOINTS.DETAIL(id));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch member',
      };
    }
  }

  async createMember(memberData) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.CREATE, memberData);
      return response.data;
    } catch (error) {
      const errorResponse = {
        response: {
          data: {
            message: error.response?.data?.message || 'Failed to create member',
            errors: error.response?.data?.errors || {}
          }
        }
      };
      throw errorResponse;
    }
  }

  async updateMember(id, memberData) {
    try {
      const response = await api.put(MEMBERS_ENDPOINTS.UPDATE(id), memberData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update member',
        validationErrors: error.response?.data?.errors,
      };
    }
  }

  async deleteMember(id) {
    try {
      await api.delete(MEMBERS_ENDPOINTS.DELETE(id));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete member',
      };
    }
  }

  async searchMembers(query, filters = {}) {
    try {
      const params = { q: query, ...filters };
      const response = await api.get(MEMBERS_ENDPOINTS.SEARCH, { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Search failed',
      };
    }
  }

  // ENHANCED BULK OPERATIONS
  async bulkUpdateMembers(memberIds, updateData) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.BULK_UPDATE, {
        member_ids: memberIds,
        update_data: updateData,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Bulk update failed',
      };
    }
  }

  async bulkDeleteMembers(memberIds) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.BULK_DELETE, {
        member_ids: memberIds,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Bulk delete failed',
      };
    }
  }

  async bulkImportMembers(membersData, options = {}) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.BULK_IMPORT, {
        members: membersData,
        options: {
          duplicate_strategy: options.duplicateStrategy || 'skip',
          add_tags: options.addTags || [],
          send_welcome_email: options.sendWelcomeEmail || false,
          validate_strict: options.validateStrict !== false,
          ...options
        }
      });
      return { 
        success: true, 
        data: response.data,
        successful: response.data.successful || 0,
        skipped: response.data.skipped || 0,
        errors: response.data.errors || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Bulk import failed',
        details: error.response?.data?.details || []
      };
    }
  }

  async bulkEmailMembers(memberIds, emailData) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.BULK_EMAIL, {
        member_ids: memberIds,
        subject: emailData.subject,
        message: emailData.message,
        template: emailData.template || 'custom',
        send_immediately: emailData.sendImmediately !== false
      });
      return { 
        success: true, 
        data: response.data,
        sent: response.data.sent || 0,
        failed: response.data.failed || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Bulk email failed',
      };
    }
  }

  async bulkTagMembers(memberIds, tagIds) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.BULK_TAG, {
        member_ids: memberIds,
        tag_ids: tagIds,
        action: 'add' // or 'remove'
      });
      return { 
        success: true, 
        data: response.data,
        tagged: response.data.tagged || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Bulk tagging failed',
      };
    }
  }

  async bulkActivateMembers(memberIds) {
    try {
      const response = await this.bulkUpdateMembers(memberIds, { is_active: true });
      return {
        ...response,
        message: response.success ? `Activated ${memberIds.length} members` : response.error
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to activate members'
      };
    }
  }

  async bulkDeactivateMembers(memberIds) {
    try {
      const response = await this.bulkUpdateMembers(memberIds, { is_active: false });
      return {
        ...response,
        message: response.success ? `Deactivated ${memberIds.length} members` : response.error
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to deactivate members'
      };
    }
  }

  // EXPORT FUNCTIONALITY
  async exportMembers(memberIds = null, format = 'csv', fields = null) {
    try {
      const params = {
        format,
        ...(memberIds && { member_ids: memberIds.join(',') }),
        ...(fields && { fields: fields.join(',') })
      };
      
      const response = await api.get(MEMBERS_ENDPOINTS.EXPORT, { 
        params,
        responseType: 'blob' // Important for file downloads
      });

      // Create download
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `members_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { 
        success: true, 
        message: `Exported ${memberIds ? memberIds.length : 'all'} members` 
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Export failed',
      };
    }
  }

  async getMemberStats() {
    try {
      const response = await api.get(MEMBERS_ENDPOINTS.STATS);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch member stats',
      };
    }
  }

  async getRecentMembers(limit = 10) {
    try {
      const response = await api.get(MEMBERS_ENDPOINTS.RECENT, {
        params: { limit },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch recent members',
      };
    }
  }

  // FORM SAVING FUNCTIONALITY
  async saveFormProgress(formData) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.SAVE_FORM, {
        data: formData,
        timestamp: new Date().toISOString(),
        email: formData.email
      });
      return response.data;
    } catch (error) {
      const errorResponse = {
        response: {
          data: {
            message: error.response?.data?.message || 'Failed to save form progress',
            errors: error.response?.data?.errors || {}
          }
        }
      };
      throw errorResponse;
    }
  }

  async getSavedForm(formId) {
    try {
      const response = await api.get(MEMBERS_ENDPOINTS.GET_SAVED_FORM(formId));
      return response.data.data;
    } catch (error) {
      const errorResponse = {
        response: {
          data: {
            message: error.response?.data?.message || 'Failed to retrieve saved form',
            errors: error.response?.data?.errors || {}
          }
        }
      };
      throw errorResponse;
    }
  }

  async deleteSavedForm(formId) {
    try {
      await api.delete(MEMBERS_ENDPOINTS.DELETE_SAVED_FORM(formId));
      return true;
    } catch (error) {
      const errorResponse = {
        response: {
          data: {
            message: error.response?.data?.message || 'Failed to delete saved form',
            errors: error.response?.data?.errors || {}
          }
        }
      };
      throw errorResponse;
    }
  }

  async sendContinueEmail(email, formId) {
    try {
      const response = await api.post(MEMBERS_ENDPOINTS.SEND_CONTINUE_EMAIL, {
        email,
        form_id: formId
      });
      return response.data;
    } catch (error) {
      const errorResponse = {
        response: {
          data: {
            message: error.response?.data?.message || 'Failed to send continuation email',
            errors: error.response?.data?.errors || {}
          }
        }
      };
      throw errorResponse;
    }
  }

  // VALIDATION UTILITIES
  validateMemberData(data) {
    const errors = {};
    
    if (!data.first_name?.trim() && !data.firstName?.trim()) {
      errors.first_name = 'First name is required';
      errors.firstName = 'First name is required';
    }
    
    if (!data.last_name?.trim() && !data.lastName?.trim()) {
      errors.last_name = 'Last name is required';
      errors.lastName = 'Last name is required';
    }
    
    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!data.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!data.date_of_birth && !data.dateOfBirth) {
      errors.date_of_birth = 'Date of birth is required';
      errors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!data.gender) {
      errors.gender = 'Gender is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  formatDataForAPI(data) {
    const formatted = {};
    
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      dateOfBirth: 'date_of_birth',
      phoneNumber: 'phone',
      preferredName: 'preferred_name',
      alternatePhone: 'alternate_phone',
      preferredContactMethod: 'preferred_contact_method',
      preferredLanguage: 'preferred_language',
      accessibilityNeeds: 'accessibility_needs',
      ministryInterests: 'ministry_interests',
      prayerRequest: 'prayer_request',
      pledgeAmount: 'pledge_amount',
      pledgeFrequency: 'pledge_frequency',
      familyMembers: 'family_members',
      emergencyContactName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone',
      privacyPolicyAgreed: 'privacy_policy_agreed',
      communicationOptIn: 'communication_opt_in',
      internalNotes: 'internal_notes',
      registeredBy: 'registered_by',
      registrationContext: 'registration_context'
    };
    
    Object.keys(data).forEach(key => {
      const apiKey = fieldMap[key] || key;
      formatted[apiKey] = data[key];
    });
    
    return formatted;
  }

  // BULK ACTION DISPATCHER
  async performBulkAction(action, memberIds, actionData = {}) {
    switch (action) {
      case 'delete':
        return await this.bulkDeleteMembers(memberIds);
      
      case 'tag':
        return await this.bulkTagMembers(memberIds, actionData.tags);
      
      case 'email':
        return await this.bulkEmailMembers(memberIds, actionData);
      
      case 'export':
        return await this.exportMembers(memberIds);
      
      case 'activate':
        return await this.bulkActivateMembers(memberIds);
      
      case 'deactivate':
        return await this.bulkDeactivateMembers(memberIds);
      
      case 'import':
        return await this.bulkImportMembers(actionData.members, actionData.options);
      
      default:
        throw new Error(`Unknown bulk action: ${action}`);
    }
  }
}

// Export both as named and default export for compatibility
export const membersService = new MembersService();
export default membersService;