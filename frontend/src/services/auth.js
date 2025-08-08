// ============================================================================
// services/auth.js - Updated version with better error handling
// ============================================================================
import { api } from './api';

const AUTH_ENDPOINTS = {
  LOGIN: 'auth/login/',
  LOGOUT: 'auth/logout/',
  VERIFY: 'auth/verify/',
  PASSWORD_RESET: 'auth/password/reset/',
  PASSWORD_RESET_CONFIRM: 'auth/password/reset/confirm/',
  REFRESH_TOKEN: 'auth/token/refresh/',
  CHANGE_PASSWORD: 'auth/password/change/',
  PROFILE: 'auth/profile/',
};

class AuthService {
  constructor() {
    this.refreshTimer = null;
  }

  // Validate credentials format
  validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return { valid: false, error: 'Invalid credentials format' };
    }
    
    const { email, password } = credentials;
    
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    
    if (!password) {
      return { valid: false, error: 'Password is required' };
    }
    
    if (password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long' };
    }
    
    return { valid: true };
  }

  // Login method - Fixed to return consistent format
  async login(credentials) {
    try {
      console.log('[AuthService] Starting login process...');
      
      // Validate credentials
      const validation = this.validateCredentials(credentials);
      if (!validation.valid) {
        console.error('[AuthService] Validation failed:', validation.error);
        return { success: false, error: validation.error };
      }

      console.log(`[AuthService] Making login request to: ${api.defaults.baseURL}${AUTH_ENDPOINTS.LOGIN}`);
      console.log('[AuthService] Credentials:', { email: credentials.email, password: '***' });
      
      // Make the login request
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, {
        email: credentials.email,
        password: credentials.password
      });
      
      console.log('[AuthService] Login response received:', response.data);
      
      // Extract tokens and user data from response
      const responseData = response.data;
      const { 
        access, 
        access_token, 
        refresh, 
        refresh_token, 
        token,
        user 
      } = responseData;
      
      // Handle different possible token field names
      const accessToken = access || access_token || token;
      const refreshTokenValue = refresh || refresh_token;
      
      if (!accessToken) {
        console.error('[AuthService] No access token in response:', responseData);
        return { success: false, error: 'Invalid response: no access token received' };
      }
      
      if (!user) {
        console.error('[AuthService] No user data in response:', responseData);
        return { success: false, error: 'Invalid response: no user data received' };
      }
      
      // Store tokens and user data
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('authToken', accessToken); // Backward compatibility
      
      if (refreshTokenValue) {
        localStorage.setItem('refresh_token', refreshTokenValue);
      }
      
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('[AuthService] Login successful, tokens stored');
      
      // Set up token refresh if refresh token is available
      if (refreshTokenValue) {
        this.scheduleTokenRefresh();
      }
      
      return {
        success: true,
        user,
        access_token: accessToken,
        token: accessToken, // Provide both for compatibility
        refresh_token: refreshTokenValue
      };
      
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      
      // Handle different error types
      if (error.response) {
        // Server responded with error
        const errorData = error.response.data;
        const message = errorData.detail || 
                       errorData.message || 
                       errorData.error ||
                       errorData.non_field_errors?.[0] ||
                       (typeof errorData === 'string' ? errorData : null) ||
                       Object.values(errorData)[0] ||
                       'Login failed. Please check your credentials.';
        
        return { success: false, error: message };
      } else if (error.request) {
        // Network error
        return { success: false, error: 'Unable to connect to server. Please check your connection.' };
      } else {
        // Other error
        return { success: false, error: error.message || 'An unexpected error occurred.' };
      }
    }
  }

  // Logout method
  async logout() {
    try {
      console.log('[AuthService] Starting logout process...');
      
      // Clear refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
      
      // Try to logout on server (optional)
      const token = this.getAccessToken();
      if (token) {
        try {
          await api.post(AUTH_ENDPOINTS.LOGOUT);
          console.log('[AuthService] Server logout successful');
        } catch (error) {
          console.warn('[AuthService] Server logout failed (continuing anyway):', error.message);
        }
      }
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
    } finally {
      // Always clear local storage
      this.clearAuthData();
      console.log('[AuthService] Auth data cleared');
    }
  }

  // Clear authentication data
  clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  // Verify token
  async verifyToken() {
    try {
      const response = await api.get(AUTH_ENDPOINTS.VERIFY);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[AuthService] Token verification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Password reset request
  async requestPasswordReset(email) {
    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Valid email address is required');
      }

      const response = await api.post(AUTH_ENDPOINTS.PASSWORD_RESET, { email });
      return { success: true, message: response.data.message || 'Password reset email sent' };
    } catch (error) {
      const message = error.response?.data?.detail || 
                    error.response?.data?.message || 
                    error.response?.data?.error || 
                    error.message ||
                    'Password reset request failed';
      throw new Error(message);
    }
  }

  // Password reset confirmation
  async resetPassword(token, newPassword) {
    try {
      if (!token || !newPassword) {
        throw new Error('Token and new password are required');
      }
      
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const response = await api.post(AUTH_ENDPOINTS.PASSWORD_RESET_CONFIRM, {
        token,
        new_password: newPassword,
      });
      
      return { success: true, message: response.data.message || 'Password reset successful' };
    } catch (error) {
      const message = error.response?.data?.detail || 
                    error.response?.data?.message || 
                    error.response?.data?.error || 
                    error.message ||
                    'Password reset failed';
      throw new Error(message);
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
      }
      
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }
      
      if (currentPassword === newPassword) {
        throw new Error('New password must be different from current password');
      }

      const response = await api.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      return { success: true, message: response.data.message || 'Password changed successfully' };
    } catch (error) {
      const message = error.response?.data?.detail || 
                    error.response?.data?.message || 
                    error.response?.data?.error || 
                    error.message ||
                    'Password change failed';
      throw new Error(message);
    }
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await api.patch(AUTH_ENDPOINTS.PROFILE, userData);
      const updatedUser = response.data.user || response.data;
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.detail || 
                    error.response?.data?.message || 
                    error.response?.data?.error || 
                    error.message ||
                    'Profile update failed';
      throw new Error(message);
    }
  }

  // Refresh tokens
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post(AUTH_ENDPOINTS.REFRESH_TOKEN, {
        refresh: refreshToken,
      });
      
      const { access } = response.data;
      
      if (access) {
        localStorage.setItem('access_token', access);
        localStorage.setItem('authToken', access); // Backward compatibility
        this.scheduleTokenRefresh();
        return access;
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error);
      this.clearAuthData();
      throw new Error('Session expired. Please login again.');
    }
  }

  // Schedule token refresh
  scheduleTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Schedule refresh for 50 minutes (assuming 1 hour token expiry)
    this.refreshTimer = setTimeout(() => {
      this.refreshToken().catch(error => {
        console.error('[AuthService] Automatic token refresh failed:', error);
      });
    }, 50 * 60 * 1000);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getAccessToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Get current user
  getCurrentUser() {
    try {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('[AuthService] Error parsing user data:', error);
      return null;
    }
  }

  // Get access token
  getAccessToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('authToken');
  }

  // Get refresh token
  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  // Get user (alias for getCurrentUser)
  getUser() {
    return this.getCurrentUser();
  }

  // Get token (alias for getAccessToken)
  getToken() {
    return this.getAccessToken();
  }

  // Cleanup
  destroy() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

export default new AuthService();