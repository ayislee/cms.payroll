// ========================================
// ATTENDANCE SERVICE
// ========================================

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class AttendanceService {
  // Get attendance list with pagination and search
  async getAttendances(params = {}) {
    try {
      const {
        page = 1,
        rows = 10,
        search = ''
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('rows', rows);
      
      if (search) queryParams.append('search', search);

      const url = `${API_ENDPOINTS.ATTENDANCE.LIST}?${queryParams.toString()}`;
      
      const response = await apiClient.get(url);
      
      // Handle the response structure:
      // { status: true, message: "...", data: { total, perPage, page, lastPage, data: [...] } }
      if (response && response.data && response.data.data) {
        return {
          data: response.data.data || [],
          pages: response.data.lastPage || 1,
          total: response.data.total || 0
        };
      }
      
      return {
        data: [],
        pages: 1,
        total: 0
      };
    } catch (error) {
      console.error('Error fetching attendances:', error);
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
          return new Error('Attendance not found');
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
const attendanceService = new AttendanceService();

export default attendanceService;