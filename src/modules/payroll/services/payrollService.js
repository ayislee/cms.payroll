// ========================================
// PAYROLL SERVICE
// ========================================

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class PayrollService {
  // Get all payrolls with pagination and search
  async getPayrolls(params = {}) {
    try {
      const {
        page = 1,
        rows = 5,
        search = '',
        payroll_periode = '',
        employee_name = ''
      } = params;

      console.log('Payroll service params:', params);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('rows', rows);
      
      if (search) queryParams.append('search', search);
      if (payroll_periode) queryParams.append('payroll_periode', payroll_periode);
      if (employee_name) queryParams.append('employee_name', employee_name);

      const url = `${API_ENDPOINTS.PAYROLL.LIST}?${queryParams.toString()}`;
      console.log('Fetching payrolls with URL:', url);
      
      const response = await apiClient.get(url);
      console.log('Payroll response:', response);
      
      // Handle the specific response structure we're getting:
      // { status: true, message: "...", data: { total, perPage, page, lastPage, data: [...] } }
      if (response && response.data) {
        console.log('Response has data structure:', response.data);
        if (response.data.data) {
          console.log('Response data.data structure:', response.data.data);
          
          return {
            data: response.data.data || [],
            pages: response.data.lastPage || 1,
            total: response.data.total || 0
          };
        } else {
          // Handle case where response.data is the array directly
          console.log('Response data is array directly:', response.data);
          return {
            data: Array.isArray(response.data) ? response.data : [],
            pages: 1,
            total: Array.isArray(response.data) ? response.data.length : 0
          };
        }
      }
      
      return {
        data: [],
        pages: 1,
        total: 0
      };
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      throw this.handleError(error);
    }
  }

  // Generate payroll for an employee
  async generatePayroll(employeeId, payrollPeriod) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PAYROLL.GENERATE, {
        employee_id: employeeId,
        payroll_periode: payrollPeriod
      });
      return response.data || response;
    } catch (error) {
      console.error('Error generating payroll:', error);
      throw this.handleError(error);
    }
  }

  // Generate slip for an employee
  async generateSlip(employeeId, payrollPeriod) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PAYROLL.GENERATE_SLIP, {
        employee_id: employeeId,
        payroll_periode: payrollPeriod
      });
      return response.data || response;
    } catch (error) {
      console.error('Error generating slip:', error);
      throw this.handleError(error);
    }
  }

  // Generate mass payroll for all employees
  async generateMassPayroll(payrollPeriod) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PAYROLL.MASS_GENERATE, {
        payroll_periode: payrollPeriod
      });
      return response.data || response;
    } catch (error) {
      console.error('Error generating mass payroll:', error);
      throw this.handleError(error);
    }
  }

  // Generate mass slip for all employees
  async generateMassSlip(payrollPeriod) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PAYROLL.MASS_GENERATE_SLIP, {
        payroll_periode: payrollPeriod
      });
      return response.data || response;
    } catch (error) {
      console.error('Error generating mass slip:', error);
      throw this.handleError(error);
    }
  }

  // Email payroll slip to employee
  async emailSlip(employeeId, payrollPeriod) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PAYROLL.EMAIL_SLIP, {
        employee_id: employeeId,
        payroll_periode: payrollPeriod
      });
      return response.data || response;
    } catch (error) {
      console.error('Error emailing slip:', error);
      throw this.handleError(error);
    }
  }

  // Email payroll slips for a company
  async emailMassSlip(companyId, payrollPeriod) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PAYROLL.EMAIL_SLIP_MASS, {
        company_id: companyId,
        payroll_periode: payrollPeriod
      });
      return response.data || response;
    } catch (error) {
      console.error('Error emailing mass slips:', error);
      throw this.handleError(error);
    }
  }

  // Download payroll file for a period
  async downloadPayroll(periode, companyId) {
    try {
      const baseUrl = API_ENDPOINTS.PAYROLL.DOWNLOAD(periode);
      const url = companyId ? `${baseUrl}?company_id=${companyId}` : baseUrl;
      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      console.error('Error downloading payroll:', error);
      throw this.handleError(error);
    }
  }

  // Get payroll by ID
  async getPayrollById(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PAYROLL.DETAIL(id));
      return response.data || null;
    } catch (error) {
      console.error('Error fetching payroll by ID:', error);
      throw this.handleError(error);
    }
  }

  // Update payroll status
  async updatePayroll(id, updateData) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.PAYROLL.UPDATE(id), updateData);
      return response.data || response;
    } catch (error) {
      console.error('Error updating payroll:', error);
      throw this.handleError(error);
    }
  }

  // Delete payroll
  async deletePayroll(id) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.PAYROLL.DELETE(id));
      return response.data || response;
    } catch (error) {
      console.error('Error deleting payroll:', error);
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
          return new Error('Payroll not found');
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
const payrollService = new PayrollService();

export default payrollService;

