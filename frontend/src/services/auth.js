// services/auth.js - Fixed version
import api from './api';

const AUTH_ENDPOINTS = {
  LOGIN: 'auth/login/',
  LOGOUT: 'auth/logout/',
  VERIFY: 'auth/verify/',
  REFRESH: 'auth/token/refresh/',
  CHANGE_PASSWORD: 'auth/change-password/',
  RESET_PASSWORD: 'auth/password-reset/request/',
  RESET_PASSWORD_CONFIRM: 'auth/password-reset/confirm/',
  USER_PROFILE: 'auth/profile/',
  USER_PERMISSIONS: 'auth/permissions/'
};

class AuthService {
  constructor() {
    this.user = null;
    this.tokens = {
      access: null,
      refresh: null
    };
    
    // Initialize from localStorage
    this.loadFromStorage();
  }
  
  // Storage methods
  saveToStorage(tokens, user) {
    try {
      if (tokens?.access) {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('authToken', tokens.access); // For backwards compatibility
      }
      if (tokens?.refresh) {
        localStorage.setItem('refresh_token', tokens.refresh);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      console.log('[AuthService] Saved to storage:', { hasTokens: !!tokens?.access, hasUser: !!user });
    } catch (error) {
      console.error('[AuthService] Failed to save to storage:', error);
    }
  }
  
  loadFromStorage() {
    try {
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refresh_token');
      const userString = localStorage.getItem('user');
      
      if (accessToken) {
        this.tokens.access = accessToken;
      }
      if (refreshToken) {
        this.tokens.refresh = refreshToken;
      }
      if (userString) {
        this.user = JSON.parse(userString);
      }
      
      console.log('[AuthService] Loaded from storage:', {
        hasAccessToken: !!this.tokens.access,
        hasRefreshToken: !!this.tokens.refresh,
        hasUser: !!this.user
      });
    } catch (error) {
      console.error('[AuthService] Failed to load from storage:', error);
      this.clearStorage();
    }
  }
  
  clearStorage() {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      this.tokens = { access: null, refresh: null };
      this.user = null;
      console.log('[AuthService] Cleared storage');
    } catch (error) {
      console.error('[AuthService] Failed to clear storage:', error);
    }
  }
  
  // Authentication methods
  async login(credentials) {
    try {
      console.log('[AuthService] Login attempt:', { email: credentials.email });
      
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, credentials);
      console.log('[AuthService] Login response:', response.data);
      
      if (response.data) {
        const { access, refresh, user } = response.data;
        
        if (!access || !user) {
          throw new Error('Invalid response format: missing access token or user data');
        }
        
        // Store tokens and user
        this.tokens = { access, refresh };
        this.user = user;
        this.saveToStorage(this.tokens, user);
        
        console.log('[AuthService] Login successful');
        return {
          success: true,
          user: user,
          access_token: access,
          refresh_token: refresh
        };
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Login failed';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  async logout() {
    try {
      console.log('[AuthService] Logout attempt');
      
      // Try to logout on server with refresh token
      if (this.tokens.refresh) {
        await api.post(AUTH_ENDPOINTS.LOGOUT, {
          refresh: this.tokens.refresh
        });
      }
    } catch (error) {
      console.error('[AuthService] Logout API error:', error);
    } finally {
      // Always clear local storage
      this.clearStorage();
      console.log('[AuthService] Logout completed');
    }
  }
  
  async refreshToken() {
    try {
      if (!this.tokens.refresh) {
        throw new Error('No refresh token available');
      }
      
      console.log('[AuthService] Refreshing token');
      
      const response = await api.post(AUTH_ENDPOINTS.REFRESH, {
        refresh: this.tokens.refresh
      });
      
      if (response.data?.access) {
        this.tokens.access = response.data.access;
        if (response.data.refresh) {
          this.tokens.refresh = response.data.refresh;
        }
        
        this.saveToStorage(this.tokens, this.user);
        console.log('[AuthService] Token refreshed successfully');
        return true;
      }
      
      throw new Error('Invalid refresh response');
      
    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error);
      this.clearStorage();
      return false;
    }
  }
  
  async verifyToken() {
    try {
      if (!this.tokens.access) {
        return false;
      }
      
      console.log('[AuthService] Verifying token');
      
      const response = await api.get(AUTH_ENDPOINTS.VERIFY);
      
      if (response.data?.user) {
        this.user = response.data.user;
        this.saveToStorage(this.tokens, this.user);
        console.log('[AuthService] Token verified successfully');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('[AuthService] Token verification failed:', error);
      
      // Try to refresh token if verification fails
      if (error.response?.status === 401) {
        return await this.refreshToken();
      }
      
      return false;
    }
  }
  
  // Getters
  isAuthenticated() {
    const hasToken = !!this.tokens.access;
    const hasUser = !!this.user;
    console.log('[AuthService] isAuthenticated check:', { hasToken, hasUser });
    return hasToken && hasUser;
  }
  
  getCurrentUser() {
    return this.user;
  }
  
  getAccessToken() {
    return this.tokens.access;
  }
  
  getRefreshToken() {
    return this.tokens.refresh;
  }
  
  // Profile management
  async getUserProfile() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.USER_PROFILE);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AuthService] Get profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get user profile'
      };
    }
  }
  
  async updateUserProfile(profileData) {
    try {
      const response = await api.patch(AUTH_ENDPOINTS.USER_PROFILE, profileData);
      
      // Update stored user data
      this.user = { ...this.user, ...response.data };
      this.saveToStorage(this.tokens, this.user);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AuthService] Update profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update profile',
        validationErrors: error.response?.data
      };
    }
  }
  
  async getUserPermissions() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.USER_PERMISSIONS);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[AuthService] Get permissions error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get permissions'
      };
    }
  }
  
  // Password management
  async changePassword(passwordData) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
      return {
        success: true,
        message: response.data.message || 'Password changed successfully'
      };
    } catch (error) {
      console.error('[AuthService] Change password error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to change password',
        validationErrors: error.response?.data
      };
    }
  }
  
  async requestPasswordReset(email) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, { email });
      return {
        success: true,
        message: response.data.message || 'Password reset email sent'
      };
    } catch (error) {
      console.error('[AuthService] Password reset request error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to request password reset'
      };
    }
  }
  
  async confirmPasswordReset(resetData) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.RESET_PASSWORD_CONFIRM, resetData);
      return {
        success: true,
        message: response.data.message || 'Password reset successfully'
      };
    } catch (error) {
      console.error('[AuthService] Password reset confirm error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to reset password',
        validationErrors: error.response?.data
      };
    }
  }
  
  // Utility methods
  getUserRole() {
    return this.user?.role || null;
  }
  
  hasPermission(permission) {
    const userPermissions = this.user?.permissions || {};
    return userPermissions[permission] || false;
  }
  
  isAdmin() {
    const role = this.getUserRole();
    return role === 'admin' || role === 'super_admin';
  }
  
  isSuperAdmin() {
    return this.getUserRole() === 'super_admin';
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;