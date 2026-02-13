// ========================================
// MAIN COMPONENT SERVICE
// ========================================

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class ComponentService {
  // Get components list with pagination and search
  async getComponents(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.rows) queryParams.append('rows', params.rows);
      if (params.search) queryParams.append('search', params.search);
      if (params.type) queryParams.append('type', params.type);
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active);
      
      const url = `${API_ENDPOINTS.MAIN_COMPONENTS.LIST}?${queryParams.toString()}`;
      const response = await apiClient.get(url);
      
      // Handle direct array response
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          total: response.data.length,
          page: 1,
          lastPage: 1
        };
      }
      
      return response.data || { total: 0, data: [] };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get component by ID
  async getComponentById(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MAIN_COMPONENTS.DETAIL(id));

      // Ensure calculation_params is parsed as object if it's a JSON string
      if (response.data && response.data.calculation_params) {

        if (typeof response.data.calculation_params === 'string') {
          try {
            response.data.calculation_params = JSON.parse(response.data.calculation_params);
          } catch (error) {
            console.warn('ComponentDetail - Failed to parse calculation_params from API:', response.data.calculation_params);
            console.warn('ComponentDetail - Parse error:', error.message);
            // Keep as string if parsing fails
          }
        } else {
        }
      }

      return response.data || null;
    } catch (error) {
      // Fallback to mock data for demo
      if (error.message && error.message.includes('Not Found')) {
        console.warn('Component detail API not available, using mock data');
        return this.getMockComponentById(id);
      }
      throw this.handleError(error);
    }
  }

  // Create new component
  async createComponent(componentData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.MAIN_COMPONENTS.CREATE, componentData);
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update component using request body
  async updateComponent(id, componentData) {
    try {
      // Include main_component_id in the request body as per API.md
      const requestData = {
        main_component_id: parseInt(id),
        ...componentData
      };

      const response = await apiClient.put(API_ENDPOINTS.MAIN_COMPONENTS.UPDATE, requestData);

      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete component using path parameter (consistent with other modules)
  async deleteComponent(id) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.MAIN_COMPONENTS.DELETE(id));
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Validate component data
  validateComponentData(data) {
    const errors = {};

    // Required fields validation
    if (!data.name?.trim()) {
      errors.name = 'Component name is required';
    } else if (data.name.length < 2) {
      errors.name = 'Component name must be at least 2 characters';
    }

    if (!data.code?.trim()) {
      errors.code = 'Component code is required';
    } else if (!/^[A-Z0-9_-]{2,10}$/.test(data.code)) {
      errors.code = 'Code must be 2-10 characters (letters, numbers, underscore, dash only)';
    }

    if (!data.category?.trim()) {
      errors.category = 'Category is required';
    }

    if (!data.type) {
      errors.type = 'Component type is required';
    } else if (!['Earning', 'Deduction'].includes(data.type)) {
      errors.type = 'Type must be either Earning or Deduction';
    }

    if (!data.calculation_type) {
      errors.calculation_type = 'Calculation type is required';
    } else if (!['manual', 'auto'].includes(data.calculation_type)) {
      errors.calculation_type = 'Calculation type must be either manual or auto';
    }

    // Validate string format for boolean fields
    if (!['0', '1'].includes(data.is_active)) {
      errors.is_active = 'Status must be 0 or 1';
    }

    if (!['0', '1'].includes(data.is_integration)) {
      errors.is_integration = 'Integration must be 0 or 1';
    }

    if (!['0', '1'].includes(data.attendance_based)) {
      errors.attendance_based = 'Attendance based must be 0 or 1';
    }

    const allowedAttendanceTypes = ['full', 'prorate', 'daily'];
    if (data.attendance_based === '1' && !allowedAttendanceTypes.includes(data.attendance_type)) {
      errors.attendance_type = 'Attendance type must be full, prorate, or daily';
    }

    // Conditional validation
    if (data.calculation_type === 'auto' && !data.calculation_formula?.trim()) {
      errors.calculation_formula = 'Calculation formula is required for auto calculation';
    }

    if (data.calculation_params && typeof data.calculation_params === 'string') {
      try {
        JSON.parse(data.calculation_params);
      } catch (e) {
        errors.calculation_params = 'Invalid JSON format for calculation parameters';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Get mock component data for testing
  getMockComponentById(id) {
    const mockComponents = [
      {
        main_component_id: 1,
        name: "Gaji Pokok",
        category: "Gaji",
        description: "Gaji pokok karyawan per bulan",
        code: "GP",
        type: "Earning",
        is_active: 1,
        is_integration: 0,
        integration_code: null,
        calculation_type: "manual",
        calculation_formula: null,
        calculation_params: null,
        attendance_based: 0,
        attendance_type: "full",
        created_at: "2025-09-24 14:56:13",
        updated_at: "2025-09-24 14:56:13"
      },
      {
        main_component_id: 2,
        name: "BPJS Kesehatan",
        category: "Potongan",
        description: "Potongan BPJS Kesehatan 1% dari Gaji Pokok",
        code: "BPJS-K",
        type: "Deduction",
        is_active: 1,
        is_integration: 0,
        integration_code: null,
        calculation_type: "auto",
        calculation_formula: "bpjs_health_calculation",
        calculation_params: {
          "max_base": 12000000,
          "percentage": 0.01,
          "base_components": ["GP"]
        },
        attendance_based: 0,
        attendance_type: "full",
        created_at: "2025-09-24 14:56:13",
        updated_at: "2025-09-24 14:56:13"
      },
      {
        main_component_id: 3,
        name: "Tunjangan Transport",
        category: "Tunjangan",
        description: "Tunjangan transportasi bulanan",
        code: "TJ-TRANSPORT",
        type: "Earning",
        is_active: 1,
        is_integration: 0,
        integration_code: null,
        calculation_type: "manual",
        calculation_formula: null,
        calculation_params: null,
        attendance_based: 1,
        attendance_type: "full",
        created_at: "2025-09-24 14:56:13",
        updated_at: "2025-09-24 14:56:13"
      }
    ];

    return mockComponents.find(comp => comp.main_component_id === parseInt(id));
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
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
          return new Error('Component not found');
        case 422:
          return new Error(`Validation Error: ${message}`);
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

  // Format component data for display
  formatComponentForDisplay(component) {
    return {
      ...component,
      type_label: component.type === 'Earning' ? 'Pendapatan' : 'Potongan',
      calculation_type_label: this.getCalculationTypeLabel(component.calculation_type),
      status_label: component.is_active ? 'Active' : 'Inactive',
      attendance_label: component.attendance_based ? 'Yes' : 'No'
    };
  }

  // Get calculation type label
  getCalculationTypeLabel(type) {
    const typeMap = {
      'manual': 'Manual',
      'auto': 'Automatic',
      'percentage': 'Percentage',
      'formula': 'Formula'
    };
    return typeMap[type] || type;
  }

  // Get component types
  getComponentTypes() {
    return [
      { value: 'Earning', label: 'Earning (Pendapatan)' },
      { value: 'Deduction', label: 'Deduction (Potongan)' }
    ];
  }

  // Get calculation types (sesuai API constraints)
  getCalculationTypes() {
    return [
      { value: 'manual', label: 'Manual' },
      { value: 'auto', label: 'Automatic' }
    ];
  }

  // Get attendance types (sesuai API constraints)  
  getAttendanceTypes() {
    return [
      { value: 'full', label: 'Full Attendance' },
      { value: 'prorate', label: 'Prorate' }
    ];
  }
}

// Create singleton instance
const componentService = new ComponentService();

export default componentService;
