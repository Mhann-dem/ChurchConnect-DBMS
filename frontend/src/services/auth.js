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

class AuthService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async login(credentials) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, credentials);
      const { token, user } = response.data;
      
      // Store auth data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      this.token = token;
      this.user = user;
      
      return { success: true, user, token };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, error: message };
    }
  }

  async logout() {
    try {
      await api.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      this.token = null;
      this.user = null;
    }
  }

  async requestPasswordReset(email) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.PASSWORD_RESET, { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset request failed';
      return { success: false, error: message };
    }
  }

  async confirmPasswordReset(token, newPassword) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.PASSWORD_RESET_CONFIRM, {
        token,
        new_password: newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset confirmation failed';
      return { success: false, error: message };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      return { success: false, error: message };
    }
  }

  async verifyToken() {
    if (!this.token) return false;
    
    try {
      await api.post(AUTH_ENDPOINTS.VERIFY_TOKEN, { token: this.token });
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }

  hasRole(role) {
    return this.user?.role === role;
  }

  hasPermission(permission) {
    const rolePermissions = {
      super_admin: ['read', 'write', 'delete', 'admin'],
      admin: ['read', 'write', 'delete'],
      readonly: ['read'],
    };
    
    return rolePermissions[this.user?.role]?.includes(permission) || false;
  }
}

export default new AuthService();