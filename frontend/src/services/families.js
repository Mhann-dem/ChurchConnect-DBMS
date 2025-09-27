// frontend/src/services/families.js - SIMPLIFIED & FIXED VERSION
import api from './api';

class FamiliesService {
  
  // Family management - Simplified without complex cancellation
  getFamilies = (params = {}) => {
    console.log('FamiliesService: Getting families with params:', params);
    return api.get('families/', { params });
  };

  getFamily = (id) => {
    console.log('FamiliesService: Getting family:', id);
    return api.get(`families/${id}/`);
  };

  createFamily = (data) => {
    console.log('FamiliesService: Creating family:', data);
    return api.post('families/', data);
  };

  updateFamily = (id, data) => {
    console.log('FamiliesService: Updating family:', id, data);
    return api.put(`families/${id}/`, data);
  };

  patchFamily = (id, data) => {
    console.log('FamiliesService: Patching family:', id, data);
    return api.patch(`families/${id}/`, data);
  };

  deleteFamily = (id) => {
    console.log('FamiliesService: Deleting family:', id);
    return api.delete(`families/${id}/`);
  };

  // Family member management
  addMemberToFamily = (familyId, memberData) => {
    console.log('FamiliesService: Adding member to family:', familyId, memberData);
    return api.post(`families/${familyId}/add-member/`, memberData);
  };

  removeMemberFromFamily = (familyId, memberId) => {
    console.log('FamiliesService: Removing member from family:', familyId, memberId);
    return api.delete(`families/${familyId}/remove-member/${memberId}/`);
  };

  getFamilyMembers = (familyId) => {
    console.log('FamiliesService: Getting family members:', familyId);
    return api.get(`families/${familyId}/members/`);
  };

  updateMemberRelationship = (familyId, memberId, data) => {
    console.log('FamiliesService: Updating member relationship:', familyId, memberId, data);
    return api.patch(`families/${familyId}/update-relationship/${memberId}/`, data);
  };

  setPrimaryContact = (familyId, memberId) => {
    console.log('FamiliesService: Setting primary contact:', familyId, memberId);
    return api.post(`families/${familyId}/set-primary-contact/`, { member_id: memberId });
  };

  // Family analytics and reports
  getFamilyStatistics = () => {
    console.log('FamiliesService: Getting family statistics');
    return api.get('families/statistics/');
  };

  bulkOperations = (operation, familyIds) => {
    console.log('FamiliesService: Bulk operations:', operation, familyIds);
    return api.post('families/bulk-operations/', {
      operation,
      family_ids: familyIds
    });
  };

  // Simple export functionality
  exportFamilies = async (familyIds = [], format = 'json') => {
    console.log('FamiliesService: Exporting families:', familyIds, format);
    
    try {
      if (familyIds.length === 0) {
        // Export all families
        const response = await api.get('families/', { 
          params: { page_size: 10000 } 
        });
        return this.formatExportData(response.data.results || response.data, format);
      } else {
        // Export specific families
        const familyPromises = familyIds.map(id => 
          this.getFamily(id).then(response => response.data)
        );
        const families = await Promise.all(familyPromises);
        return this.formatExportData(families, format);
      }
    } catch (error) {
      throw new Error(`Failed to export families: ${error.message}`);
    }
  };

  // Format export data
  formatExportData = (families, format) => {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.convertToCSV(families);
      case 'json':
      default:
        return {
          exportDate: new Date().toISOString(),
          totalFamilies: families.length,
          families: families
        };
    }
  };

  // Convert families data to CSV
  convertToCSV = (families) => {
    if (!families || families.length === 0) {
      return 'No data available';
    }

    const headers = [
      'Family Name',
      'Primary Contact',
      'Primary Email',
      'Primary Phone',
      'Address',
      'Member Count',
      'Adults Count',
      'Children Count',
      'Created Date',
      'Notes'
    ];

    const rows = families.map(family => [
      family.family_name || '',
      family.primary_contact_name || '',
      family.primary_contact_email || '',
      family.primary_contact_phone || '',
      family.address || '',
      family.member_count || 0,
      family.adults_count || 0,
      family.children_count || 0,
      family.created_at ? new Date(family.created_at).toLocaleDateString() : '',
      (family.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  // Health check for the service
  healthCheck = async () => {
    try {
      await api.get('families/statistics/', { timeout: 5000 });
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };
}

// Create singleton instance
const familiesService = new FamiliesService();

export default familiesService;