// services/auth.js - Fixed version with improved token management
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
  USER_PERMISSIONS: 'auth/permissions/',
  TEST: 'auth/test/'
};

class AuthService {
  constructor() {
    this.user = null;
    this.tokens = {
      access: null,
      refresh: null
    };
    this.tokenRefreshPromise = null; // Prevent concurrent token refreshes
    this.isRefreshing = false;
    
    // Initialize from localStorage
    this.loadFromStorage();
  }
  
  // Enhanced storage methods with error handling
  saveToStorage(tokens, user) {
    try {
      console.log('[AuthService] Saving to storage:', { 
        hasAccess: !!tokens?.access, 
        hasRefresh: !!tokens?.refresh, 
        hasUser: !!user 
      });

      if (tokens?.access) {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('authToken', tokens.access); // Backwards compatibility
      }
      if (tokens?.refresh) {
        localStorage.setItem('refresh_token', tokens.refresh);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      // Update instance variables
      if (tokens) {
        this.tokens = { ...this.tokens, ...tokens };
      }
      if (user) {
        this.user = user;
      }
      
    } catch (error) {
      console.error('[AuthService] Failed to save to storage:', error);
    }
  }
  
  loadFromStorage() {
    try {
      const accessToken = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refresh_token');
      const userString = localStorage.getItem('user');
      
      this.tokens = {
        access: accessToken,
        refresh: refreshToken
      };
      
      if (userString) {
        this.user = JSON.parse(userString);
      }
      
      console.log('[AuthService] Loaded from storage:', {
        hasAccessToken: !!this.tokens.access,
        hasRefreshToken: !!this.tokens.refresh,
        hasUser: !!this.user,
        userRole: this.user?.role
      });
      
      return this.isAuthenticated();
    } catch (error) {
      console.error('[AuthService] Failed to load from storage:', error);
      this.clearStorage();
      return false;
    }
  }
  
  clearStorage() {
    try {
      const keysToRemove = ['access_token', 'authToken', 'refresh_token', 'user'];
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      this.tokens = { access: null, refresh: null };
      this.user = null;
      this.isRefreshing = false;
      this.tokenRefreshPromise = null;
      
      console.log('[AuthService] Cleared storage and reset state');
    } catch (error) {
      console.error('[AuthService] Failed to clear storage:', error);
    }
  }
  
  // Enhanced login with better error handling
  async login(credentials) {
    try {
      console.log('[AuthService] Login attempt for:', credentials.email);
      
      // Validate credentials
      if (!credentials.email?.trim() || !credentials.password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }
      
      // Clear any existing auth data
      this.clearStorage();
      
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password
      });
      
      console.log('[AuthService] Login response status:', response.status);
      
      if (response.data) {
        const { access, refresh, user } = response.data;
        
        if (!access || !user) {
          throw new Error('Invalid response format: missing access token or user data');
        }
        
        // Validate token format (basic check)
        if (!access.includes('.')) {
          throw new Error('Invalid token format');
        }
        
        // Store tokens and user
        this.saveToStorage({ access, refresh }, user);
        
        console.log('[AuthService] Login successful for user:', user.email);
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
      
      // Clear any partial auth data on error
      this.clearStorage();
      
      let errorMessage = 'Login failed';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 403) {
        errorMessage = 'Account is disabled';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
      };
    }
  }
  
  async logout() {
    try {
      console.log('[AuthService] Logout attempt');
      
      // Try to logout on server with refresh token
      if (this.tokens.refresh) {
        try {
          await api.post(AUTH_ENDPOINTS.LOGOUT, {
            refresh: this.tokens.refresh
          });
          console.log('[AuthService] Server logout successful');
        } catch (error) {
          console.warn('[AuthService] Server logout failed, proceeding with local logout:', error);
        }
      }
    } finally {
      // Always clear local storage regardless of server response
      this.clearStorage();
      console.log('[AuthService] Local logout completed');
    }
  }
  
  async refreshToken() {
    // Prevent concurrent refresh attempts
    if (this.isRefreshing && this.tokenRefreshPromise) {
      console.log('[AuthService] Token refresh already in progress, waiting...');
      return await this.tokenRefreshPromise;
    }
    
    if (!this.tokens.refresh) {
      console.error('[AuthService] No refresh token available');
      this.clearStorage();
      return false;
    }
    
    this.isRefreshing = true;
    this.tokenRefreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.tokenRefreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.tokenRefreshPromise = null;
    }
  }
  
  async performTokenRefresh() {
    try {
      console.log('[AuthService] Refreshing token...');
      
      const response = await api.post(AUTH_ENDPOINTS.REFRESH, {
        refresh: this.tokens.refresh
      });
      
      if (response.data?.access) {
        const newTokens = {
          access: response.data.access,
          refresh: response.data.refresh || this.tokens.refresh
        };
        
        this.saveToStorage(newTokens, this.user);
        console.log('[AuthService] Token refreshed successfully');
        return true;
      }
      
      throw new Error('Invalid refresh response');
      
    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error);
      
      // If refresh fails, clear all auth data
      this.clearStorage();
      return false;
    }
  }
  
  async verifyToken() {
    try {
      if (!this.tokens.access) {
        console.log('[AuthService] No access token to verify');
        return false;
      }
      
      console.log('[AuthService] Verifying token...');
      
      const response = await api.get(AUTH_ENDPOINTS.VERIFY);
      
      if (response.data?.user) {
        // Update user data if it's newer
        if (response.data.user.updated_at !== this.user?.updated_at) {
          this.user = response.data.user;
          this.saveToStorage(this.tokens, this.user);
        }
        
        console.log('[AuthService] Token verified successfully');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('[AuthService] Token verification failed:', error);
      
      // Try to refresh token if verification fails with 401
      if (error.response?.status === 401) {
        console.log('[AuthService] Token expired, attempting refresh...');
        return await this.refreshToken();
      }
      
      return false;
    }
  }
  
  // FIXED: Enhanced authentication check
  isAuthenticated() {
    const hasToken = !!this.tokens.access;
    const hasUser = !!this.user;
    const hasValidToken = hasToken && this.tokens.access.includes('.');
    
    // Simple check - if we have token and user, consider authenticated
    // Let the API handle token expiration on actual requests
    return hasToken && hasUser && hasValidToken;
  }
  
  // FIXED: Check if token is expired (basic JWT parsing)
  isTokenExpired() {
    if (!this.tokens.access) return true;
    
    try {
      // Parse JWT payload without verification (for expiration check only)
      const payload = JSON.parse(atob(this.tokens.access.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp && payload.exp < now;
    } catch (error) {
      console.warn('[AuthService] Failed to parse token:', error);
      return true; // Assume expired if we can't parse
    }
  }
  
  // Getters
  getCurrentUser() {
    return this.user;
  }
  
  getAccessToken() {
    return this.tokens.access;
  }
  
  getRefreshToken() {
    return this.tokens.refresh;
  }
  
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

  // Health check method
  async healthCheck() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.TEST);
      return {
        success: true,
        data: response.data,
        authenticated: response.data.authenticated || false
      };
    } catch (error) {
      console.error('[AuthService] Health check failed:', error);
      return {
        success: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;