// frontend/src/services/families.js - Enhanced with request cancellation and better error handling
import api from './api';

class FamiliesService {
  constructor() {
    this.activeRequests = new Map();
  }

  // Helper method to handle request cancellation
  makeRequest = async (key, requestFn, config = {}) => {
    // Cancel previous request with same key
    if (this.activeRequests.has(key)) {
      this.activeRequests.get(key).abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    this.activeRequests.set(key, abortController);

    try {
      const response = await requestFn({
        ...config,
        signal: abortController.signal
      });
      
      // Remove from active requests on success
      this.activeRequests.delete(key);
      return response;
    } catch (error) {
      // Remove from active requests on error (unless aborted)
      if (error.name !== 'AbortError') {
        this.activeRequests.delete(key);
      }
      throw error;
    }
  };

  // Cancel all active requests
  cancelAllRequests = () => {
    this.activeRequests.forEach((controller) => {
      controller.abort();
    });
    this.activeRequests.clear();
  };

  // Cancel specific request
  cancelRequest = (key) => {
    if (this.activeRequests.has(key)) {
      this.activeRequests.get(key).abort();
      this.activeRequests.delete(key);
    }
  };

  // Family management - Updated with cancellation support
  getFamilies = (params = {}, config = {}) => {
    const key = `getFamilies-${JSON.stringify(params)}`;
    return this.makeRequest(key, (requestConfig) => 
      api.get('families/', { params, ...requestConfig })
    );
  };

  getFamily = (id, config = {}) => {
    const key = `getFamily-${id}`;
    return this.makeRequest(key, (requestConfig) => 
      api.get(`families/${id}/`, requestConfig)
    );
  };

  createFamily = (data, config = {}) => {
    return this.makeRequest('createFamily', (requestConfig) => 
      api.post('families/', data, requestConfig)
    );
  };

  updateFamily = (id, data, config = {}) => {
    const key = `updateFamily-${id}`;
    return this.makeRequest(key, (requestConfig) => 
      api.put(`families/${id}/`, data, requestConfig)
    );
  };

  patchFamily = (id, data, config = {}) => {
    const key = `patchFamily-${id}`;
    return this.makeRequest(key, (requestConfig) => 
      api.patch(`families/${id}/`, data, requestConfig)
    );
  };

  deleteFamily = (id, config = {}) => {
    const key = `deleteFamily-${id}`;
    return this.makeRequest(key, (requestConfig) => 
      api.delete(`families/${id}/`, requestConfig)
    );
  };

  // Family member management
  addMemberToFamily = (familyId, memberData, config = {}) => {
    const key = `addMember-${familyId}-${memberData.member_id}`;
    return this.makeRequest(key, (requestConfig) => 
      api.post(`families/${familyId}/add-member/`, memberData, requestConfig)
    );
  };

  removeMemberFromFamily = (familyId, memberId, config = {}) => {
    const key = `removeMember-${familyId}-${memberId}`;
    return this.makeRequest(key, (requestConfig) => 
      api.delete(`families/${familyId}/remove-member/${memberId}/`, requestConfig)
    );
  };

  getFamilyMembers = (familyId, config = {}) => {
    const key = `getFamilyMembers-${familyId}`;
    return this.makeRequest(key, (requestConfig) => 
      api.get(`families/${familyId}/members/`, requestConfig)
    );
  };

  updateMemberRelationship = (familyId, memberId, data, config = {}) => {
    const key = `updateRelationship-${familyId}-${memberId}`;
    return this.makeRequest(key, (requestConfig) => 
      api.patch(`families/${familyId}/update-relationship/${memberId}/`, data, requestConfig)
    );
  };

  setPrimaryContact = (familyId, memberId, config = {}) => {
    const key = `setPrimaryContact-${familyId}`;
    return this.makeRequest(key, (requestConfig) => 
      api.post(`families/${familyId}/set-primary-contact/`, { member_id: memberId }, requestConfig)
    );
  };

  // Family analytics and reports
  getFamilyStatistics = (config = {}) => {
    return this.makeRequest('getFamilyStatistics', (requestConfig) => 
      api.get('families/statistics/', requestConfig)
    );
  };

  getRecentFamilies = (days = 30, config = {}) => {
    const key = `getRecentFamilies-${days}`;
    return this.makeRequest(key, (requestConfig) => 
      api.get('families/recent-families/', { params: { days }, ...requestConfig })
    );
  };

  getFamiliesNeedingAttention = (config = {}) => {
    return this.makeRequest('getFamiliesNeedingAttention', (requestConfig) => 
      api.get('families/families-needing-attention/', requestConfig)
    );
  };

  bulkOperations = (operation, familyIds, config = {}) => {
    const key = `bulkOperations-${operation}`;
    return this.makeRequest(key, (requestConfig) => 
      api.post('families/bulk-operations/', {
        operation,
        family_ids: familyIds
      }, requestConfig)
    );
  };

  // Family relationships (direct management)
  getFamilyRelationships = (params = {}, config = {}) => {
    const key = `getFamilyRelationships-${JSON.stringify(params)}`;
    return this.makeRequest(key, (requestConfig) => 
      api.get('families/relationships/', { params, ...requestConfig })
    );
  };

  createFamilyRelationship = (data, config = {}) => {
    return this.makeRequest('createFamilyRelationship', (requestConfig) => 
      api.post('families/relationships/', data, requestConfig)
    );
  };

  getFamilyRelationship = (id, config = {}) => {
    const key = `getFamilyRelationship-${id}`;
    return this.makeRequest(key, (requestConfig) => 
      api.get(`families/relationships/${id}/`, requestConfig)
    );
  };

  updateFamilyRelationship = (id, data, config = {}) => {
    const key = `updateFamilyRelationship-${id}`;
    return this.makeRequest(key, (requestConfig) => 
      api.put(`families/relationships/${id}/`, data, requestConfig)
    );
  };

  deleteFamilyRelationship = (id, config = {}) => {
    const key = `deleteFamilyRelationship-${id}`;
    return this.makeRequest(key, (requestConfig) => 
      api.delete(`families/relationships/${id}/`, requestConfig)
    );
  };

  // Batch operations with retry mechanism
  batchRequest = async (operations, options = {}) => {
    const { 
      maxRetries = 3, 
      retryDelay = 1000,
      onProgress = null 
    } = options;

    const results = [];
    const errors = [];

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      let attempt = 0;
      let success = false;

      while (attempt < maxRetries && !success) {
        try {
          const result = await operation();
          results.push({ index: i, result, operation: operation.name });
          success = true;

          if (onProgress) {
            onProgress({
              completed: i + 1,
              total: operations.length,
              currentOperation: operation.name
            });
          }
        } catch (error) {
          attempt++;
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          } else {
            errors.push({ 
              index: i, 
              error: error.message, 
              operation: operation.name 
            });
          }
        }
      }
    }

    return {
      results,
      errors,
      success: errors.length === 0,
      completed: results.length,
      failed: errors.length
    };
  };

  // Export families data
  exportFamilies = async (familyIds = [], format = 'json', config = {}) => {
    const key = `exportFamilies-${familyIds.length}-${format}`;
    
    try {
      if (familyIds.length === 0) {
        // Export all families
        const response = await this.makeRequest(key, (requestConfig) => 
          api.get('families/', { 
            params: { page_size: 10000 }, 
            ...requestConfig 
          })
        );
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
      case 'xml':
        return this.convertToXML(families);
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

  // Convert families data to XML
  convertToXML = (families) => {
    if (!families || families.length === 0) {
      return '<?xml version="1.0" encoding="UTF-8"?><families></families>';
    }

    const escapeXML = (str) => {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const familiesXML = families.map(family => `
      <family id="${family.id}">
        <name>${escapeXML(family.family_name || '')}</name>
        <primaryContact>
          <name>${escapeXML(family.primary_contact_name || '')}</name>
          <email>${escapeXML(family.primary_contact_email || '')}</email>
          <phone>${escapeXML(family.primary_contact_phone || '')}</phone>
        </primaryContact>
        <address>${escapeXML(family.address || '')}</address>
        <memberCount>${family.member_count || 0}</memberCount>
        <adultsCount>${family.adults_count || 0}</adultsCount>
        <childrenCount>${family.children_count || 0}</childrenCount>
        <createdDate>${family.created_at || ''}</createdDate>
        <notes>${escapeXML(family.notes || '')}</notes>
      </family>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
    <families exportDate="${new Date().toISOString()}" totalCount="${families.length}">
      ${familiesXML}
    </families>`;
  };

  // Search families with advanced options
  searchFamilies = async (searchOptions, config = {}) => {
    const {
      query = '',
      filters = {},
      sortBy = 'family_name',
      sortOrder = 'asc',
      page = 1,
      pageSize = 25,
      includeMembers = false
    } = searchOptions;

    const params = {
      search: query,
      page,
      page_size: pageSize,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
      ...filters
    };

    const key = `searchFamilies-${JSON.stringify(params)}`;
    const response = await this.makeRequest(key, (requestConfig) => 
      api.get('families/', { params, ...requestConfig })
    );

    let families = response.data.results || response.data;

    // Optionally include detailed member information
    if (includeMembers && Array.isArray(families)) {
      const familiesWithMembers = await Promise.all(
        families.map(async (family) => {
          try {
            const membersResponse = await this.getFamilyMembers(family.id);
            return {
              ...family,
              detailed_members: membersResponse.data
            };
          } catch (error) {
            console.warn(`Failed to fetch members for family ${family.id}:`, error);
            return family;
          }
        })
      );
      families = familiesWithMembers;
    }

    return {
      ...response,
      data: {
        ...response.data,
        results: families
      }
    };
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

  // Get service statistics
  getServiceStats = () => {
    return {
      activeRequests: this.activeRequests.size,
      activeRequestKeys: Array.from(this.activeRequests.keys())
    };
  };

  // Cleanup method for component unmount
  cleanup = () => {
    this.cancelAllRequests();
  };
}

// Create singleton instance
const familiesService = new FamiliesService();

export default familiesService;