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
        search = '',
        payroll_periode = '',
        employee_id = ''
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('rows', rows);
      
      if (search) queryParams.append('search', search);
      if (payroll_periode) queryParams.append('payroll_periode', payroll_periode);
      if (employee_id) queryParams.append('employee_id', employee_id);

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

  async createAttendance(data) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ATTENDANCE.CREATE, data);
      return response?.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateAttendance(data) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.ATTENDANCE.UPDATE, data);
      return response?.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteAttendance(attendanceId) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.ATTENDANCE.DELETE(attendanceId));
      return response?.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async syncExternal(payload) {
    try {
      const requestedPeriod = String(
        payload?.payroll_period ?? payload?.payroll_periode ?? ''
      ).trim();
      const payrollPeriod = requestedPeriod.replace(/^(\d{4})-(\d{2})$/, '$1$2');

      if (!/^\d{4}(0[1-9]|1[0-2])$/.test(payrollPeriod)) {
        throw new Error('Payroll period must use YYYYMM format.');
      }

      const response = await apiClient.post(API_ENDPOINTS.ATTENDANCE.SYNC_EXTERNAL, {
        ...payload,
        payroll_period: payrollPeriod
      });
      return response?.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async downloadAttendance(payrollPeriode) {
    try {
      const normalizedPeriod = String(payrollPeriode || '').trim();
      if (!/^\d{6}$/.test(normalizedPeriod)) {
        throw new Error('Payroll period must use YYYYMM format.');
      }

      const response = await apiClient.get(API_ENDPOINTS.ATTENDANCE.DOWNLOAD(normalizedPeriod));
      return response?.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async triggerAttendanceDownload(downloadUrl) {
    try {
      const token = localStorage.getItem('payroll_auth_token_6f88ce5ae28abba7');
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to download attendance file');
      }

      const blob = await response.blob();
      const fileNameHeader = response.headers.get('content-disposition');
      const fallbackName = fileNameHeader
        ? fileNameHeader.split('filename=')[1]?.replace(/['"]/g, '')
        : 'attendance-download.xlsx';

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fallbackName || 'attendance-download.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { fileName: fallbackName || 'attendance-download.xlsx' };
    } catch (error) {
      throw new Error(error.message || 'Failed to download attendance file');
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
