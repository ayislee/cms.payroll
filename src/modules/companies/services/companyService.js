// ========================================
// COMPANY SERVICE
// ========================================

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class CompanyService {
  // Get companies list with pagination and search
  async getCompanies(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.rows) queryParams.append('rows', params.rows);
      if (params.search) queryParams.append('search', params.search);
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active);

      const url = `${API_ENDPOINTS.COMPANIES.LIST}?${queryParams.toString()}`;
      const response = await apiClient.get(url);

      // Handle the actual backend response structure
      return response.data || { total: 0, data: [] };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get company by ID
  async getCompanyById(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COMPANIES.DETAIL(id));
      // Handle the updated API.md response structure: direct in data
      return response.data || null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new company
  async createCompany(companyData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.COMPANIES.CREATE, companyData);
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update company
  async updateCompany(id, companyData) {
    try {
      const requestData = {
        company_id: parseInt(id),
        ...companyData
      };

      const response = await apiClient.put(API_ENDPOINTS.COMPANIES.UPDATE, requestData);
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete company (soft delete)
  async deleteCompany(id) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.COMPANIES.DELETE(id));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Toggle company status
  async toggleCompanyStatus(id) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.COMPANIES.TOGGLE_STATUS(id));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get company statistics
  async getCompanyStats(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COMPANIES.STATS(id));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Search companies
  async searchCompanies(searchTerm, params = {}) {
    try {
      return await this.getCompanies({
        ...params,
        search: searchTerm
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get active companies only
  async getActiveCompanies(params = {}) {
    try {
      return await this.getCompanies({
        ...params,
        is_active: true
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Bulk create companies
  async bulkCreateCompanies(companies) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.COMPANIES.BULK_CREATE, { companies });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Validate company data
  validateCompanyData(data) {
    const errors = {};

    // Required fields validation
    if (!data.company_id && !data.name) {
      errors.name = 'Company name is required';
    } else if (data.name && data.name.length < 2) {
      errors.name = 'Company name must be at least 2 characters';
    }

    if (!data.code) {
      errors.code = 'Company code is required';
    } else if (data.code.length < 2) {
      errors.code = 'Company code must be at least 2 characters';
    } else if (data.code.length > 50) {
      errors.code = 'Company code cannot exceed 50 characters';
    }

    // Optional fields validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (data.phone && !/^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(data.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (data.address && data.address.length > 500) {
      errors.address = 'Address cannot exceed 500 characters';
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
          return new Error('Company not found');
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

  // Format company data for display
  formatCompanyForDisplay(company) {
    return {
      ...company,
      display_name: company.name,
      full_address: company.address || 'No address provided',
      contact_info: {
        phone: company.phone || 'No phone',
        email: company.email || 'No email'
      },
      status: company.is_active ? 'Active' : 'Inactive',
      status_color: company.is_active ? 'success' : 'danger'
    };
  }

  // Get company dropdown options
  async getCompanyOptions() {
    try {
      const response = await this.getActiveCompanies({ page: 1, rows: 100 });
      return (response.data || []).map(company => ({
        value: company.company_id,
        label: `${company.name}`,
        company: company
      }));
    } catch (error) {
      console.error('Error fetching company options:', error);
      return [];
    }
  }
}

// Create singleton instance
const companyService = new CompanyService();

export default companyService;
