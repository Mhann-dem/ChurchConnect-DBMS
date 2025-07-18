// services/auth.js
import { api } from './api';

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login/',
  LOGOUT: '/auth/logout/',
  PASSWORD_RESET: '/auth/password-reset/',
  PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm/',
  REFRESH_TOKEN: '/auth/refresh/',
  VERIFY_TOKEN: '/auth/verify/',
  CHANGE_PASSWORD: '/auth/change-password/',
};

// Storage helper with error handling
const storage = {
  getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.warn(`Failed to get ${key} from localStorage:`, error);
    }
    return null;
  },
  
  setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to set ${key} in localStorage:`, error);
    }
    return false;
  },
  
  removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
    return false;
  }
};

class AuthService {
  constructor() {
    this.token = storage.getItem('authToken');
    this.refreshToken = storage.getItem('refreshToken');
    this.user = this.parseUser(storage.getItem('user'));
    this.refreshTimer = null;
  }

  parseUser(userString) {
    if (!userString) return null;
    try {
      return JSON.parse(userString);
    } catch (error) {
      console.warn('Failed to parse user data:', error);
      return null;
    }
  }

  validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'Invalid credentials format' };
    }
    
    const { email, username, password } = credentials;
    
    if (!password || password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long' };
    }
    
    if (!email && !username) {
      return { valid: false, error: 'Email or username is required' };
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    
    return { valid: true };
  }

  async login(credentials) {
    try {
      const validation = this.validateCredentials(credentials);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const response = await api.post(AUTH_ENDPOINTS.LOGIN, credentials);
      const { token, refresh_token, user } = response.data;
      
      if (!token || !user) {
        return { success: false, error: 'Invalid response from server' };
      }
      
      // Store auth data
      storage.setItem('authToken', token);
      if (refresh_token) {
        storage.setItem('refreshToken', refresh_token);
      }
      storage.setItem('user', JSON.stringify(user));
      
      this.token = token;
      this.refreshToken = refresh_token;
      this.user = user;
      
      // Set up token refresh if refresh token is available
      if (refresh_token) {
        this.scheduleTokenRefresh();
      }
      
      return { success: true, user, token };
    } catch (error) {
      const message = error.response?.data?.message || 
                    error.response?.data?.error || 
                    'Login failed';
      return { success: false, error: message };
    }
  }

  async logout() {
    try {
      // Clear refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
      
      // Attempt to logout on server
      if (this.token) {
        await api.post(AUTH_ENDPOINTS.LOGOUT);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      this.clearAuthData();
    }
  }

  clearAuthData() {
    storage.removeItem('authToken');
    storage.removeItem('refreshToken');
    storage.removeItem('user');
    this.token = null;
    this.refreshToken = null;
    this.user = null;
  }

  async requestPasswordReset(email) {
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Valid email address is required' };
      }

      const response = await api.post(AUTH_ENDPOINTS.PASSWORD_RESET, { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 
                    error.response?.data?.error || 
                    'Password reset request failed';
      return { success: false, error: message };
    }
  }

  async confirmPasswordReset(token, newPassword) {
    try {
      if (!token || !newPassword) {
        return { success: false, error: 'Token and new password are required' };
      }
      
      if (newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long' };
      }

      const response = await api.post(AUTH_ENDPOINTS.PASSWORD_RESET_CONFIRM, {
        token,
        new_password: newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 
                    error.response?.data?.error || 
                    'Password reset confirmation failed';
      return { success: false, error: message };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        return { success: false, error: 'Current password and new password are required' };
      }
      
      if (newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters long' };
      }
      
      if (currentPassword === newPassword) {
        return { success: false, error: 'New password must be different from current password' };
      }

      const response = await api.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 
                    error.response?.data?.error || 
                    'Password change failed';
      return { success: false, error: message };
    }
  }

  async refreshTokens() {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await api.post(AUTH_ENDPOINTS.REFRESH_TOKEN, {
        refresh_token: this.refreshToken,
      });
      
      const { token, refresh_token } = response.data;
      
      if (token) {
        this.token = token;
        storage.setItem('authToken', token);
        
        if (refresh_token) {
          this.refreshToken = refresh_token;
          storage.setItem('refreshToken', refresh_token);
        }
        
        this.scheduleTokenRefresh();
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
    }
    
    return false;
  }

  scheduleTokenRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Schedule refresh for 50 minutes (assuming 1 hour token expiry)
    this.refreshTimer = setTimeout(() => {
      this.refreshTokens();
    }, 50 * 60 * 1000);
  }

  async verifyToken() {
    if (!this.token) {
      return false;
    }
    
    try {
      await api.post(AUTH_ENDPOINTS.VERIFY_TOKEN, { token: this.token });
      return true;
    } catch (error) {
      // Try to refresh token first
      if (this.refreshToken) {
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          return true;
        }
      }
      
      this.logout();
      return false;
    }
  }

  isAuthenticated() {
    return !!(this.token && this.user);
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  hasRole(role) {
    if (!role || !this.user?.role) {
      return false;
    }
    return this.user.role === role;
  }

  hasPermission(permission) {
    if (!permission || !this.user?.role) {
      return false;
    }
    
    const rolePermissions = {
      super_admin: ['read', 'write', 'delete', 'admin'],
      admin: ['read', 'write', 'delete'],
      readonly: ['read'],
    };
    
    return rolePermissions[this.user.role]?.includes(permission) || false;
  }

  // Cleanup method for when the service is no longer needed
  destroy() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

export default new AuthService();