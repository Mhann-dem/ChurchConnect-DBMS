import { api } from './api';

/**
 * Notification Service
 * Handles in-app notifications, email/SMS notifications, and push notifications
 */

class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.notificationQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Subscribe to notification events
   * @param {string} type - Notification type
   * @param {Function} callback - Callback function
   */
  subscribe(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  /**
   * Emit notification to all subscribers
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  emit(type, data) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification callback:', error);
        }
      });
    }
  }

  /**
   * Send email notification
   * @param {Object} emailData - Email notification data
   * @returns {Promise<Object>} Response from API
   */
  async sendEmail(emailData) {
    try {
      const response = await api.post('/notifications/email/', {
        to: emailData.to,
        subject: emailData.subject,
        message: emailData.message,
        template: emailData.template || 'default',
        context: emailData.context || {},
        priority: emailData.priority || 'normal',
        schedule_time: emailData.scheduleTime || null
      });

      this.emit('email_sent', {
        success: true,
        messageId: response.data.message_id,
        recipients: emailData.to
      });

      return response.data;
    } catch (error) {
      this.emit('email_failed', {
        success: false,
        error: error.response?.data?.message || 'Failed to send email',
        recipients: emailData.to
      });
      throw error;
    }
  }

  /**
   * Send SMS notification
   * @param {Object} smsData - SMS notification data
   * @returns {Promise<Object>} Response from API
   */
  async sendSMS(smsData) {
    try {
      const response = await api.post('/notifications/sms/', {
        to: smsData.to,
        message: smsData.message,
        template: smsData.template || null,
        context: smsData.context || {},
        priority: smsData.priority || 'normal',
        schedule_time: smsData.scheduleTime || null
      });

      this.emit('sms_sent', {
        success: true,
        messageId: response.data.message_id,
        recipients: smsData.to
      });

      return response.data;
    } catch (error) {
      this.emit('sms_failed', {
        success: false,
        error: error.response?.data?.message || 'Failed to send SMS',
        recipients: smsData.to
      });
      throw error;
    }
  }

  /**
   * Send bulk notifications
   * @param {Object} bulkData - Bulk notification data
   * @returns {Promise<Object>} Response from API
   */
  async sendBulkNotification(bulkData) {
    try {
      const response = await api.post('/notifications/bulk/', {
        recipients: bulkData.recipients,
        message: bulkData.message,
        subject: bulkData.subject,
        channels: bulkData.channels || ['email'], // ['email', 'sms', 'push']
        template: bulkData.template || 'default',
        context: bulkData.context || {},
        priority: bulkData.priority || 'normal',
        schedule_time: bulkData.scheduleTime || null,
        filter_preferences: bulkData.filterPreferences !== false
      });

      this.emit('bulk_notification_sent', {
        success: true,
        jobId: response.data.job_id,
        estimatedRecipients: bulkData.recipients.length
      });

      return response.data;
    } catch (error) {
      this.emit('bulk_notification_failed', {
        success: false,
        error: error.response?.data?.message || 'Failed to send bulk notification'
      });
      throw error;
    }
  }

  /**
   * Get notification templates
   * @returns {Promise<Array>} List of available templates
   */
  async getTemplates() {
    try {
      const response = await api.get('/notifications/templates/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      throw error;
    }
  }

  /**
   * Create or update notification template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created/updated template
   */
  async saveTemplate(templateData) {
    try {
      const url = templateData.id 
        ? `/notifications/templates/${templateData.id}/`
        : '/notifications/templates/';
      
      const method = templateData.id ? 'put' : 'post';
      
      const response = await api[method](url, {
        name: templateData.name,
        type: templateData.type, // 'email', 'sms', 'push'
        subject: templateData.subject,
        content: templateData.content,
        variables: templateData.variables || [],
        is_active: templateData.isActive !== false
      });

      this.emit('template_saved', {
        success: true,
        template: response.data
      });

      return response.data;
    } catch (error) {
      this.emit('template_save_failed', {
        success: false,
        error: error.response?.data?.message || 'Failed to save template'
      });
      throw error;
    }
  }

  /**
   * Get notification history
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Notification history with pagination
   */
  async getHistory(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.recipient) params.append('recipient', filters.recipient);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await api.get(`/notifications/history/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Notification statistics
   */
  async getStats(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.type) params.append('type', filters.type);

      const response = await api.get(`/notifications/stats/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled notification
   * @param {string} jobId - Job ID of scheduled notification
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelScheduledNotification(jobId) {
    try {
      const response = await api.delete(`/notifications/scheduled/${jobId}/`);
      
      this.emit('notification_cancelled', {
        success: true,
        jobId: jobId
      });

      return response.data;
    } catch (error) {
      this.emit('notification_cancel_failed', {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel notification',
        jobId: jobId
      });
      throw error;
    }
  }

  /**
   * Get scheduled notifications
   * @returns {Promise<Array>} List of scheduled notifications
   */
  async getScheduledNotifications() {
    try {
      const response = await api.get('/notifications/scheduled/');
      return response.data;
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * Test notification settings
   * @param {Object} testData - Test notification data
   * @returns {Promise<Object>} Test result
   */
  async testNotification(testData) {
    try {
      const response = await api.post('/notifications/test/', {
        type: testData.type, // 'email', 'sms'
        recipient: testData.recipient,
        message: testData.message || 'Test notification from ChurchConnect',
        subject: testData.subject || 'Test Notification'
      });

      this.emit('test_notification_sent', {
        success: true,
        type: testData.type,
        recipient: testData.recipient
      });

      return response.data;
    } catch (error) {
      this.emit('test_notification_failed', {
        success: false,
        error: error.response?.data?.message || 'Test notification failed',
        type: testData.type,
        recipient: testData.recipient
      });
      throw error;
    }
  }

  /**
   * Update notification preferences for a member
   * @param {string} memberId - Member ID
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateMemberPreferences(memberId, preferences) {
    try {
      const response = await api.put(`/members/${memberId}/notification-preferences/`, {
        email_notifications: preferences.emailNotifications,
        sms_notifications: preferences.smsNotifications,
        push_notifications: preferences.pushNotifications,
        notification_types: preferences.notificationTypes || [],
        preferred_time: preferences.preferredTime || null,
        frequency: preferences.frequency || 'immediate'
      });

      this.emit('preferences_updated', {
        success: true,
        memberId: memberId,
        preferences: response.data
      });

      return response.data;
    } catch (error) {
      this.emit('preferences_update_failed', {
        success: false,
        error: error.response?.data?.message || 'Failed to update preferences',
        memberId: memberId
      });
      throw error;
    }
  }

  /**
   * Queue notification for retry
   * @param {Object} notificationData - Notification data
   * @param {number} attempt - Current attempt number
   */
  async queueForRetry(notificationData, attempt = 1) {
    if (attempt > this.retryAttempts) {
      this.emit('notification_failed_permanently', {
        data: notificationData,
        attempts: attempt
      });
      return;
    }

    setTimeout(async () => {
      try {
        switch (notificationData.type) {
          case 'email':
            await this.sendEmail(notificationData);
            break;
          case 'sms':
            await this.sendSMS(notificationData);
            break;
          case 'bulk':
            await this.sendBulkNotification(notificationData);
            break;
        }
      } catch (error) {
        await this.queueForRetry(notificationData, attempt + 1);
      }
    }, this.retryDelay * attempt);
  }

  /**
   * Get notification delivery status
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Delivery status
   */
  async getDeliveryStatus(messageId) {
    try {
      const response = await api.get(`/notifications/status/${messageId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery status:', error);
      throw error;
    }
  }

  /**
   * Send automated birthday notifications
   * @returns {Promise<Object>} Birthday notification results
   */
  async sendBirthdayNotifications() {
    try {
      const response = await api.post('/notifications/automated/birthdays/');
      
      this.emit('birthday_notifications_sent', {
        success: true,
        count: response.data.notifications_sent
      });

      return response.data;
    } catch (error) {
      this.emit('birthday_notifications_failed', {
        success: false,
        error: error.response?.data?.message || 'Failed to send birthday notifications'
      });
      throw error;
    }
  }

  /**
   * Send event reminders
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Reminder results
   */
  async sendEventReminders(eventId) {
    try {
      const response = await api.post(`/notifications/automated/event-reminders/${eventId}/`);
      
      this.emit('event_reminders_sent', {
        success: true,
        eventId: eventId,
        count: response.data.notifications_sent
      });

      return response.data;
    } catch (error) {
      this.emit('event_reminders_failed', {
        success: false,
        error: error.response?.data?.message || 'Failed to send event reminders',
        eventId: eventId
      });
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.listeners.clear();
    this.notificationQueue = [];
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export both the service instance and class
export { notificationService as default, NotificationService };

// Helper functions for common notification patterns
export const notificationHelpers = {
  /**
   * Send welcome email to new member
   * @param {Object} member - Member data
   * @returns {Promise<Object>} Email response
   */
  async sendWelcomeEmail(member) {
    return notificationService.sendEmail({
      to: [member.email],
      subject: 'Welcome to Our Church Family!',
      template: 'welcome_member',
      context: {
        first_name: member.first_name,
        last_name: member.last_name,
        registration_date: member.registration_date
      }
    });
  },

  /**
   * Send pledge confirmation
   * @param {Object} member - Member data
   * @param {Object} pledge - Pledge data
   * @returns {Promise<Object>} Email response
   */
  async sendPledgeConfirmation(member, pledge) {
    return notificationService.sendEmail({
      to: [member.email],
      subject: 'Thank You for Your Pledge',
      template: 'pledge_confirmation',
      context: {
        first_name: member.first_name,
        pledge_amount: pledge.amount,
        pledge_frequency: pledge.frequency
      }
    });
  },

  /**
   * Send group invitation
   * @param {Object} member - Member data
   * @param {Object} group - Group data
   * @returns {Promise<Object>} Email response
   */
  async sendGroupInvitation(member, group) {
    return notificationService.sendEmail({
      to: [member.email],
      subject: `You're Invited to Join ${group.name}`,
      template: 'group_invitation',
      context: {
        first_name: member.first_name,
        group_name: group.name,
        group_description: group.description,
        leader_name: group.leader_name
      }
    });
  },

  /**
   * Send event notification
   * @param {Array} recipients - List of member emails
   * @param {Object} event - Event data
   * @returns {Promise<Object>} Bulk notification response
   */
  async sendEventNotification(recipients, event) {
    return notificationService.sendBulkNotification({
      recipients: recipients,
      subject: `Upcoming Event: ${event.title}`,
      message: `Join us for ${event.title} on ${event.date}`,
      template: 'event_notification',
      context: {
        event_title: event.title,
        event_date: event.date,
        event_time: event.time,
        event_location: event.location,
        event_description: event.description
      },
      channels: ['email', 'sms']
    });
  }
};