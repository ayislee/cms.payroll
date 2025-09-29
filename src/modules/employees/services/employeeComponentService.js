// ========================================
// EMPLOYEE COMPONENT SERVICE
// ========================================

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class EmployeeComponentService {
  // Get employee components by employee ID
  async getEmployeeComponents(employeeId) {
    try {
      console.log('=== EMPLOYEE COMPONENTS SERVICE DEBUG ===');
      console.log('Fetching employee components for employee ID:', employeeId);
      console.log('API endpoint:', API_ENDPOINTS.EMPLOYEE_COMPONENTS.LIST(employeeId));
      
      // Validate employeeId
      if (!employeeId) {
        console.error('Invalid employee ID provided:', employeeId);
        throw new Error('Invalid employee ID');
      }
      
      const response = await apiClient.get(API_ENDPOINTS.EMPLOYEE_COMPONENTS.LIST(employeeId));
      console.log('Employee components response:', response);
      console.log('Response data:', response.data);
      console.log('========================================');
      return response.data || [];
    } catch (error) {
      console.error('=== EMPLOYEE COMPONENTS SERVICE ERROR ===');
      console.error('Error fetching employee components:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      console.error('=========================================');
      throw this.handleError(error);
    }
  }

  // Update employee component
  async updateEmployeeComponent(componentData) {
    try {
      console.log('Updating employee component with data:', componentData);
      const response = await apiClient.put(API_ENDPOINTS.EMPLOYEE_COMPONENTS.UPDATE, componentData);
      console.log('Employee component update response:', response);
      return response.data || response;
    } catch (error) {
      console.error('Error updating employee component:', error);
      throw this.handleError(error);
    }
  }

  // Get employee component by ID
  async getEmployeeComponentById(id) {
    try {
      console.log('Fetching employee component by ID:', id);
      const response = await apiClient.get(API_ENDPOINTS.EMPLOYEE_COMPONENTS.DETAIL(id));
      console.log('Employee component detail response:', response);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching employee component by ID:', error);
      throw this.handleError(error);
    }
  }

  // Handle API errors
  handleError(error) {
    console.error('API Error:', error);
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      console.error('Error response:', status, message);
      
      switch (status) {
        case 400:
          return new Error(`Bad Request: ${message}`);
        case 401:
          return new Error('Unauthorized: Please login again');
        case 403:
          return new Error('Forbidden: You don\'t have permission to perform this action');
        case 404:
          return new Error('Employee component not found');
        case 422:
          return new Error(`Validation Error: ${message}`);
        case 500:
          return new Error('Server Error: Please try again later');
        default:
          return new Error(message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      return new Error('Network Error: Please check your connection');
    } else {
      // Other error
      console.error('Other error:', error.message);
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Create singleton instance
const employeeComponentService = new EmployeeComponentService();

export default employeeComponentService;