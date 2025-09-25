// services/auth.js - SECURE & SIMPLIFIED VERSION
import api from './api';

// Production-safe logging
const logger = {
  info: (msg, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AuthService] ${msg}`, data);
    }
  },
  error: (msg, error) => {
    console.error(`[AuthService] ${msg}`, error);
  },
  warn: (msg, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[AuthService] ${msg}`, data);
    }
  }
};

const AUTH_ENDPOINTS = {
  LOGIN: 'auth/login/',
  LOGOUT: 'auth/logout/',
  VERIFY: 'auth/verify/',
  REFRESH: 'auth/token/refresh/',
  PROFILE: 'auth/profile/',
};

class AuthService {
  constructor() {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.refreshPromise = null; // Prevent concurrent refreshes
    
    this.loadFromStorage();
  }
  
  // SECURE: Simplified token management
  saveToStorage(tokens, user) {
    try {
      if (tokens?.access) {
        // FIXED: Store with multiple keys for compatibility
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('authToken', tokens.access); // Backup key
        this.accessToken = tokens.access;
      }
      if (tokens?.refresh) {
        localStorage.setItem('refresh_token', tokens.refresh);
        this.refreshToken = tokens.refresh;
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        this.user = user;
      }
      logger.info('Auth data saved successfully');
    } catch (error) {
      logger.error('Failed to save auth data:', error);
    }
  }
  
  loadFromStorage() {
    try {
      // FIXED: Try both token keys
      this.accessToken = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      this.refreshToken = localStorage.getItem('refresh_token');
      const userString = localStorage.getItem('user');
      this.user = userString ? JSON.parse(userString) : null;
      
      logger.info('Auth data loaded from storage', {
        hasToken: !!this.accessToken,
        hasUser: !!this.user,
        tokenLength: this.accessToken?.length || 0
      });
    } catch (error) {
      logger.error('Failed to load auth data:', error);
      this.clearStorage();
    }
  }
  
  clearStorage() {
    try {
      // FIXED: Clear all possible token keys
      const keysToRemove = ['access_token', 'authToken', 'refresh_token', 'user'];
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key); // Also clear sessionStorage
      });
      
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      this.refreshPromise = null;
      
      logger.info('Auth data cleared');
    } catch (error) {
      logger.error('Failed to clear auth data:', error);
    }
  }

  // Add this helper method:
  getTokenExpirationTime(token) {
    if (!token) return null;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp ? new Date(payload.exp * 1000).toISOString() : null;
    } catch (error) {
      logger.warn('Failed to parse token expiration:', error);
      return null;
    }
  }
  
  // SIMPLIFIED: Basic login without excessive error handling
  async login(credentials) {
    try {
      // Input validation
      if (!credentials?.email?.trim() || !credentials?.password) {
        return { success: false, error: 'Email and password are required' };
      }
      
      this.clearStorage(); // Clear any existing auth
      
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password
      });
      
      console.log('[AuthService] Login response:', response.data);
      
      const { access, refresh, user } = response.data;
      
      if (access && user) {
        // FIXED: Store tokens with consistent keys
        this.saveToStorage({ access, refresh }, user);
        
        // FIXED: Return consistent format that AuthContext expects
        return { 
          success: true, 
          user, 
          access_token: access, // AuthContext looks for this key
          token: access,        // Backup key
          refresh_token: refresh,
          expires_at: this.getTokenExpirationTime(access)
        };
      }
      
      return { success: false, error: 'Invalid response from server' };
      
    } catch (error) {
      logger.error('Login failed:', error);
      this.clearStorage();
      
      // SECURE: Don't expose detailed error information
      let message = 'Login failed';
      if (error.response?.status === 401) {
        message = 'Invalid email or password';
      } else if (error.response?.status === 429) {
        message = 'Too many attempts. Please try again later.';
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }
      
      return { success: false, error: message };
    }
  }
  
  async logout() {
    try {
      if (this.refreshToken) {
        await api.post(AUTH_ENDPOINTS.LOGOUT, { refresh: this.refreshToken });
      }
    } catch (error) {
      logger.warn('Server logout failed:', error);
    } finally {
      this.clearStorage();
      logger.info('Logout completed');
    }
  }
  
  // SECURE: Single refresh promise prevents race conditions
  async refreshToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    if (!this.refreshToken) {
      this.clearStorage();
      return false;
    }
    
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }
  
  async performTokenRefresh() {
    try {
      const response = await api.post(AUTH_ENDPOINTS.REFRESH, {
        refresh: this.refreshToken
      });
      
      if (response.data?.access) {
        const newTokens = {
          access: response.data.access,
          refresh: response.data.refresh || this.refreshToken
        };
        
        this.saveToStorage(newTokens, this.user);
        logger.info('Token refreshed successfully');
        return true;
      }
      
      throw new Error('Invalid refresh response');
      
    } catch (error) {
      logger.error('Token refresh failed:', error);
      this.clearStorage();
      return false;
    }
  }
  
  async verifyToken() {
    if (!this.accessToken) {
      return false;
    }
    
    try {
      const response = await api.get(AUTH_ENDPOINTS.VERIFY);
      
      if (response.data?.user) {
        // Update user data if needed
        this.user = response.data.user;
        this.saveToStorage({ access: this.accessToken, refresh: this.refreshToken }, this.user);
        return true;
      }
      
      return false;
      
    } catch (error) {
      if (error.response?.status === 401) {
        return await this.refreshToken();
      }
      return false;
    }
  }
  
  // SIMPLIFIED: Basic authentication check
  isAuthenticated() {
    return !!(this.accessToken && this.user && !this.isTokenExpired());
  }
  
  // SECURE: Basic token expiration check
  isTokenExpired() {
    if (!this.accessToken) return true;
    
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp < now;
    } catch (error) {
      logger.warn('Failed to parse token:', error);
      return true; // Assume expired if we can't parse
    }
  }
  
  // Simple getters
  getCurrentUser() {
    return this.user;
  }
  
  getAccessToken() {
    return this.accessToken;
  }
  
  getUserRole() {
    return this.user?.role || null;
  }
  
  isAdmin() {
    const role = this.getUserRole();
    return role === 'admin' || role === 'super_admin';
  }
  
  isSuperAdmin() {
    return this.getUserRole() === 'super_admin';
  }
  
  // Profile management
  async updateProfile(profileData) {
    try {
      const response = await api.patch(AUTH_ENDPOINTS.PROFILE, profileData);
      
      if (response.data) {
        this.user = { ...this.user, ...response.data };
        this.saveToStorage({ access: this.accessToken, refresh: this.refreshToken }, this.user);
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Update failed' };
      
    } catch (error) {
      logger.error('Profile update failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Update failed',
        validationErrors: error.response?.data
      };
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;