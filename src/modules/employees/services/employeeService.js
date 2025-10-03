// ========================================
// EMPLOYEE SERVICE
// ========================================

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { getMockEmployeeById } from '../../../components/EmployeeMockDetail';

class EmployeeService {
  // Get employees list with pagination and search
  async getEmployees(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.rows) queryParams.append('rows', params.rows);
      if (params.search) queryParams.append('search', params.search);
      if (params.company_id) queryParams.append('company_id', params.company_id);
      
      const url = `${API_ENDPOINTS.EMPLOYEES.LIST}?${queryParams.toString()}`;
      const response = await apiClient.get(url);
      
      // Handle the actual backend response structure
      return response.data || { total: 0, data: [] };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get employee by ID
  async getEmployeeById(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EMPLOYEES.DETAIL(id));
      // Handle the updated API.md response structure: direct in data
      return response.data || null;
    } catch (error) {
      // If backend API not available, use mock data as fallback
      if (error.message && error.message.includes('Not Found')) {
        console.warn('Employee detail API not available, using mock data');
        const mockEmployee = getMockEmployeeById(id);
        if (mockEmployee) {
          return mockEmployee;
        }
      }
      throw this.handleError(error);
    }
  }

  // Get next available employee ID
  async getNextEmployeeId() {
    try {
      // Get current employees to determine next ID
      const response = await this.getEmployees({ page: 1, rows: 1 });
      const totalEmployees = response.total || 0;
      return totalEmployees + 1;
    } catch (error) {
      // Fallback to timestamp if can't get from API
      return Date.now();
    }
  }

  // Create new employee
  async createEmployee(employeeData) {
    try {
      // Get next employee ID if not provided
      const employee_id = employeeData.employee_id || await this.getNextEmployeeId();
      
      // Include employee_id in the request body as per API.md
      const requestData = {
        employee_id,
        ...employeeData
      };
      
      const response = await apiClient.post(API_ENDPOINTS.EMPLOYEES.CREATE, requestData);
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update employee
  async updateEmployee(id, employeeData) {
    try {
      // Include employee_id in the request body as per API.md
      const requestData = {
        employee_id: parseInt(id),
        ...employeeData
      };
      
      const response = await apiClient.put(API_ENDPOINTS.EMPLOYEES.UPDATE, requestData);
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete employee
  async deleteEmployee(id) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.EMPLOYEES.DELETE(id));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Search employees
  async searchEmployees(searchTerm, params = {}) {
    try {
      return await this.getEmployees({
        ...params,
        search: searchTerm
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get employees by company
  async getEmployeesByCompany(companyId, params = {}) {
    try {
      return await this.getEmployees({
        ...params,
        company_id: companyId
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Validate employee data
  validateEmployeeData(data) {
    const errors = {};

    // Required fields validation
    if (!data.employee_id) {
      errors.employee_id = 'Employee ID is required';
    } else if (isNaN(data.employee_id) || data.employee_id <= 0) {
      errors.employee_id = 'Employee ID must be a positive number';
    }

    if (!data.nik?.trim()) {
      errors.nik = 'NIK is required';
    } else if (!/^[A-Z0-9]{3,10}$/.test(data.nik)) {
      errors.nik = 'NIK must be 3-10 characters (letters and numbers only)';
    }

    if (!data.name?.trim()) {
      errors.name = 'Name is required';
    } else if (data.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!data.company_id) {
      errors.company_id = 'Company is required';
    }

    if (!data.ptkp) {
      errors.ptkp = 'PTKP status is required';
    }

    // Optional fields validation
    if (data.phone && !/^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(data.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (data.rekening && data.rekening.length < 6) {
      errors.rekening = 'Account number should be at least 6 characters';
    }

    if (data.npwp && data.npwp.trim() && !/^\d+$/.test(data.npwp.replace(/[.\-]/g, ''))) {
      errors.npwp = 'NPWP should contain only numbers, dots, and dashes';
    }

    if (data.zip && !/^\d{5}$/.test(data.zip)) {
      errors.zip = 'ZIP code should be 5 digits';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      switch (status) {
        case 400:
          return new Error(`Bad Request: ${message}`);
        case 401:
          return new Error('Unauthorized: Please login again');
        case 403:
          return new Error('Forbidden: You don\'t have permission to perform this action');
        case 404:
          return new Error('Employee not found');
        case 422:
          return new Error(`Validation Error: ${message}`);
        case 500:
          return new Error('Server Error: Please try again later');
        default:
          return new Error(message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      return new Error('Network Error: Please check your connection');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Format employee data for display
  formatEmployeeForDisplay(employee) {
    return {
      ...employee,
      full_name: employee.name,
      hire_date_formatted: new Date(employee.hire_date).toLocaleDateString('id-ID'),
      company_name: employee.company?.name || 'Unknown Company',
      ptkp_label: this.getPTKPLabel(employee.ptkp)
    };
  }

  // Get PTKP label
  getPTKPLabel(ptkp) {
    const ptkpMap = {
      'TK/0': 'TK/0 - Tidak Kawin tanpa tanggungan',
      'TK/1': 'TK/1 - Tidak Kawin dengan 1 tanggungan',
      'TK/2': 'TK/2 - Tidak Kawin dengan 2 tanggungan',
      'TK/3': 'TK/3 - Tidak Kawin dengan 3 tanggungan',
      'K/0': 'K/0 - Kawin tanpa tanggungan',
      'K/1': 'K/1 - Kawin dengan 1 tanggungan',
      'K/2': 'K/2 - Kawin dengan 2 tanggungan',
      'K/3': 'K/3 - Kawin dengan 3 tanggungan'
    };
    return ptkpMap[ptkp] || ptkp;
  }

  // Get all employees for lightweight selectors / search
  async getAllEmployees(params = '') {
    try {
      const queryParams = new URLSearchParams();

      if (typeof params === 'string') {
        const trimmed = params.trim();
        if (trimmed) {
          queryParams.append('search', trimmed);
        }
      } else if (params && typeof params === 'object') {
        const { search, ...rest } = params;

        if (search && typeof search === 'string' && search.trim()) {
          queryParams.append('search', search.trim());
        }

        Object.entries(rest).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }

      const queryString = queryParams.toString();
      const url = queryString
        ? `${API_ENDPOINTS.EMPLOYEES.GET_ALL}?${queryString}`
        : API_ENDPOINTS.EMPLOYEES.GET_ALL;

      const response = await apiClient.get(url);
      return response.data?.data || response.data || [];
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Create singleton instance
const employeeService = new EmployeeService();
console.log('EmployeeService instance created with methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(employeeService)));

export default employeeService;
