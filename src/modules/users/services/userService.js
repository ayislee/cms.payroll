// ========================================
// USER SERVICE
// ========================================

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class UserService {
  // Get users list with pagination and search
  async getUsers(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.rows) queryParams.append('rows', params.rows);
      if (params.search) queryParams.append('search', params.search);
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active);

      const url = `${API_ENDPOINTS.USERS.LIST}?${queryParams.toString()}`;
      const response = await apiClient.get(url);

      return response.data || { total: 0, data: [] };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.DETAIL(id));
      return response.data || null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.USERS.CREATE, userData);
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update user
  async updateUser(id, userData) {
    try {
      const requestData = {
        user_id: parseInt(id),
        ...userData
      };
      const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(id), requestData);
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete user (soft delete)
  async deleteUser(id) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.USERS.DELETE(id));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Toggle user status (activate/deactivate)
  async toggleUserStatus(id) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.USERS.TOGGLE_STATUS(id));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get only active users (for dropdowns, etc.)
  async getActiveUsers(params = {}) {
    return this.getUsers({ ...params, is_active: true });
  }

  // Get users formatted for select/dropdown options
  async getUserOptions(params = {}) {
    try {
      const response = await this.getActiveUsers(params);
      return response.data.map(user => ({
        value: user.user_id,
        label: user.name
      }));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Client-side validation for user data
  validateUserData(data) {
    const errors = {};

    if (!data.name?.trim()) {
      errors.name = 'User name is required.';
    } else if (data.name.length < 2) {
      errors.name = 'User name must be at least 2 characters.';
    } else if (data.name.length > 255) {
      errors.name = 'User name cannot exceed 255 characters.';
    }

    if (!data.email?.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format.';
    } else if (data.email.length > 100) {
      errors.email = 'Email cannot exceed 100 characters.';
    }

    if (!data.username?.trim()) {
      errors.username = 'Username is required.';
    } else if (data.username.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    } else if (data.username.length > 50) {
      errors.username = 'Username cannot exceed 50 characters.';
    }

    if (data.phone && data.phone.length > 20) {
      errors.phone = 'Phone number cannot exceed 20 characters.';
    }

    if (data.address && data.address.length > 500) {
      errors.address = 'Address cannot exceed 500 characters.';
    }

    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
      errors.is_active = 'Is active must be a boolean value.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      const errors = error.response.data?.errors || [];

      switch (status) {
        case 400:
          return new Error(`Bad Request: ${message}`);
        case 401:
          return new Error('Unauthorized: Please login again');
        case 403:
          return new Error('Forbidden: You don\'t have permission to perform this action');
        case 404:
          return new Error('User not found');
        case 422:
          // For validation errors, return a structured error message
          return new Error(`Validation Error: ${JSON.stringify({ message, errors })}`);
        case 500:
          return new Error('Server Error: Please try again later');
        default:
          return new Error(message || 'An error occurred');
      }
    } else if (error.request) {
      return new Error('Network Error: Please check your connection');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

const userService = new UserService();
export default userService;
