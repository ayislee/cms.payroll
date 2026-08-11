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
      const raw = response.data || {};

      const topLevel = raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw;

      let pagination = topLevel;
      if (pagination && typeof pagination === 'object') {
        if (Array.isArray(pagination.data)) {
          pagination = {
            ...pagination,
            data: pagination.data
          };
        } else if (pagination.data && typeof pagination.data === 'object' && Array.isArray(pagination.data.data)) {
          pagination = {
            ...pagination,
            ...pagination.data,
            data: pagination.data.data
          };
        }
      }

      const companies = Array.isArray(pagination?.data)
        ? pagination.data
        : Array.isArray(topLevel)
        ? topLevel
        : [];

      const totalSource =
        pagination?.total ??
        pagination?.count ??
        raw?.total ??
        raw?.count ??
        companies.length ??
        0;
      const total = Number(totalSource) || 0;

      const perPageSource =
        pagination?.perPage ??
        pagination?.per_page ??
        params.rows ??
        companies.length ??
        0;
      const perPage = Number(perPageSource) || (params.rows || companies.length || 1);

      const pageSource =
        pagination?.page ??
        pagination?.current_page ??
        raw?.page ??
        params.page ??
        1;
      const page = Number(pageSource) || 1;

      const computedLastPage = perPage > 0 ? Math.ceil(total / perPage) : 1;
      const lastPageSource =
        pagination?.lastPage ??
        pagination?.last_page ??
        raw?.lastPage ??
        raw?.last_page ??
        computedLastPage ??
        1;
      const lastPage = Number(lastPageSource) || 1;

      return {
        status: raw.status ?? true,
        message: raw.message ?? '',
        data: companies,
        total,
        perPage,
        page,
        lastPage,
        meta: {
          raw
        }
      };
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
      const response = await this.getCompanies({
        ...params,
        search: searchTerm
      });

      return response;
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

  async syncExternalCompanies() {
    try {
      const response = await apiClient.post(API_ENDPOINTS.COMPANIES.SYNC_EXTERNAL);
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCompanyBenefits(companyId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('company_id', companyId);
      queryParams.append('page', params.page || 1);
      queryParams.append('rows', params.rows || 100);

      if (params.search) queryParams.append('search', params.search);
      if (params.benefit_type) queryParams.append('benefit_type', params.benefit_type);
      if (params.is_active !== undefined && params.is_active !== '') {
        queryParams.append('is_active', params.is_active);
      }

      const response = await apiClient.get(`${API_ENDPOINTS.COMPANY_BENEFITS.LIST}?${queryParams.toString()}`);
      const raw = response || {};
      const pagination = raw.data || {};
      const benefits = Array.isArray(pagination.data)
        ? pagination.data
        : Array.isArray(pagination)
        ? pagination
        : [];

      return {
        status: raw.status ?? true,
        message: raw.message ?? '',
        data: benefits.map((benefit) => this.formatCompanyBenefit(benefit)),
        total: Number(pagination.total ?? benefits.length) || 0,
        perPage: Number(pagination.perPage ?? pagination.per_page ?? params.rows ?? 100) || 100,
        page: Number(pagination.page ?? pagination.current_page ?? params.page ?? 1) || 1,
        lastPage: Number(pagination.lastPage ?? pagination.last_page ?? 1) || 1
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCompanyBenefit(benefitData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.COMPANY_BENEFITS.CREATE, benefitData);
      const benefit = response?.data || response;
      return this.formatCompanyBenefit(benefit);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCompanyBenefit(id, benefitData) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.COMPANY_BENEFITS.UPDATE(id), benefitData);
      const benefit = response?.data || response;
      return this.formatCompanyBenefit(benefit);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCompanyBenefit(id) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.COMPANY_BENEFITS.DELETE(id));
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  validateCompanyBenefitData(data) {
    const errors = {};
    const employeePercentage = Number(data.employee_percentage || 0);
    const employerPercentage = Number(data.employer_percentage || 0);
    const maxBase = data.max_base === '' || data.max_base === null || data.max_base === undefined
      ? null
      : Number(data.max_base);

    if (!data.name?.trim()) {
      errors.name = 'Benefit name is required';
    }

    if (!Number.isFinite(employeePercentage) || employeePercentage < 0 || employeePercentage > 100) {
      errors.employee_percentage = 'Employee percentage must be between 0 and 100';
    }

    if (!Number.isFinite(employerPercentage) || employerPercentage < 0 || employerPercentage > 100) {
      errors.employer_percentage = 'Employer percentage must be between 0 and 100';
    }

    if (Number.isFinite(employeePercentage) && Number.isFinite(employerPercentage) && employeePercentage + employerPercentage > 100) {
      errors.employer_percentage = 'Total percentage cannot exceed 100';
    }

    if (maxBase !== null && (!Number.isFinite(maxBase) || maxBase < 0)) {
      errors.max_base = 'Max base must be a non-negative number';
    }

    if (data.effective_date && data.expired_date && data.expired_date < data.effective_date) {
      errors.expired_date = 'Expired date must be after effective date';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
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

  // Format company list item with fallbacks
  formatCompanyListItem(company) {
    if (!company || typeof company !== 'object') {
      return {
        company_id: null,
        name: 'Unknown Company',
        email: '-',
        phone: '-',
        address: '',
        is_active: false,
        created_at: null,
        updated_at: null
      };
    }

    return {
      company_id: company.company_id ?? company.id ?? null,
      name: company.name ?? company.company_name ?? 'Unnamed Company',
      email: company.email ?? company.contact_email ?? '',
      phone: company.phone ?? company.contact_phone ?? '',
      address: company.address ?? company.location ?? '',
      is_active: company.is_active ?? company.active ?? true,
      created_at: company.created_at ?? company.createdAt ?? null,
      updated_at: company.updated_at ?? company.updatedAt ?? null,
      stats: company.stats ?? company.metrics ?? {}
    };
  }

  formatCompanyBenefit(benefit) {
    const mainComponent = benefit?.mainComponent || benefit?.main_component || benefit?.main_component_data || null;
    const employeePercentage = Number(benefit?.employee_percentage ?? 0);
    const employerPercentage = Number(benefit?.employer_percentage ?? 0);
    const totalPercentage = Number(benefit?.total_percentage ?? employeePercentage + employerPercentage);
    const rawIsActive = benefit?.is_active;
    const isActive = rawIsActive === undefined || rawIsActive === null
      ? true
      : rawIsActive === true || rawIsActive === 1 || rawIsActive === '1' || rawIsActive === 'true';
    const rawIsTaxable = benefit?.is_taxable;
    const isTaxable = rawIsTaxable === undefined || rawIsTaxable === null
      ? false
      : rawIsTaxable === true || rawIsTaxable === 1 || rawIsTaxable === '1' || rawIsTaxable === 'true';

    return {
      company_benefit_id: benefit?.company_benefit_id ?? benefit?.id ?? null,
      company_id: benefit?.company_id ?? null,
      name: benefit?.name ?? 'Benefit',
      benefit_type: benefit?.benefit_type ?? '',
      description: benefit?.description ?? '',
      employee_percentage: Number.isFinite(employeePercentage) ? employeePercentage : 0,
      employer_percentage: Number.isFinite(employerPercentage) ? employerPercentage : 0,
      total_percentage: Number.isFinite(totalPercentage) ? totalPercentage : 0,
      main_component_id: benefit?.main_component_id ?? null,
      main_component: mainComponent,
      max_base: benefit?.max_base ?? null,
      is_active: isActive,
      is_taxable: isTaxable,
      effective_date: benefit?.effective_date ?? '',
      expired_date: benefit?.expired_date ?? '',
      created_at: benefit?.created_at ?? null,
      updated_at: benefit?.updated_at ?? null
    };
  }

  buildSearchIndex(companies = []) {
    const tokens = new Set();

    companies.forEach((company) => {
      const item = this.formatCompanyListItem(company);
      [item.name, item.email, item.phone]
        .filter(Boolean)
        .forEach((value) => {
          value
            .toString()
            .toLowerCase()
            .split(/\s|,|\.|-/)
            .filter(Boolean)
            .forEach((token) => tokens.add(token));
        });
    });

    return Array.from(tokens);
  }

  calculateSummary(companies = []) {
    const normalised = companies.map((company) => this.formatCompanyListItem(company));
    const total = normalised.length;

    const active = normalised.filter((company) => company.is_active).length;
    const inactive = total - active;

    const latestUpdate = normalised
      .map((company) => company.updated_at || company.created_at)
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      total,
      active,
      inactive,
      latestUpdate
    };
  }
}

// Create singleton instance
const companyService = new CompanyService();

export default companyService;
