// ========================================
// AUTHENTICATION SERVICE
// ========================================

import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import config from '../config/environment';

class AuthService {
  // Login user
  async login(credentials) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      
      if (response.status && response.data) {
        // Store token and user data
        this.setAuthData(response.data.token, response.data.user);
        return response;
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      
      if (response.status && response.data) {
        return response;
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Logout user
  async logout() {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local auth data
      this.clearAuthData();
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
      
      if (response.status && response.data) {
        // Update stored user data
        this.setUserData(response.data.user);
        return response.data.user;
      }
      
      throw new Error(response.message || 'Failed to get profile');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
      
      if (response.status) {
        return response;
      }
      
      throw new Error(response.message || 'Failed to change password');
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Set authentication data in localStorage
  setAuthData(token, user) {
    localStorage.setItem(config.auth.tokenStorageKey, token);
    localStorage.setItem(config.auth.userStorageKey, JSON.stringify(user));
  }

  // Set user data in localStorage
  setUserData(user) {
    localStorage.setItem(config.auth.userStorageKey, JSON.stringify(user));
  }

  // Get stored token
  getToken() {
    return localStorage.getItem(config.auth.tokenStorageKey);
  }

  // Get stored user data
  getUser() {
    try {
      const userData = localStorage.getItem(config.auth.userStorageKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Clear authentication data
  clearAuthData() {
    localStorage.removeItem(config.auth.tokenStorageKey);
    localStorage.removeItem(config.auth.userStorageKey);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Check if token is expired (basic check)
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true; // Consider expired if can't parse
    }
  }

  // Get user role
  getUserRole() {
    const user = this.getUser();
    return user ? user.type : null;
  }

  // Check if user has specific role
  hasRole(role) {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  }

  // Handle authentication errors
  handleAuthError(error) {
    // If it's an unauthorized error, clear auth data
    if (error.message && error.message.includes('Unauthorized')) {
      this.clearAuthData();
    }
    
    return error;
  }

  // Refresh token (if implemented in backend)
  async refreshToken() {
    try {
      // This would depend on your backend implementation
      const response = await apiClient.post('/auth/refresh');
      
      if (response.status && response.data.token) {
        const user = this.getUser();
        this.setAuthData(response.data.token, user);
        return response.data.token;
      }
      
      throw new Error('Failed to refresh token');
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  // Initialize auth state from storage
  initializeAuth() {
    const token = this.getToken();
    const user = this.getUser();
    
    if (token && user && !this.isTokenExpired()) {
      return { token, user, isAuthenticated: true };
    } else {
      this.clearAuthData();
      return { token: null, user: null, isAuthenticated: false };
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
