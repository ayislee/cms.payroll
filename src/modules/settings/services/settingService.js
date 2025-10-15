// ========================================
// SYSTEM SETTING SERVICE
// ========================================

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';

class SettingService {
  // Fetch settings with optional filters
  async getSettings(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.search) queryParams.append('search', params.search);
      if (params.is_active !== undefined && params.is_active !== '') {
        queryParams.append('is_active', params.is_active);
      }
      if (params.per_page) queryParams.append('per_page', params.per_page);
      if (params.page) queryParams.append('page', params.page);

      const queryString = queryParams.toString();
      const url = queryString
        ? `${API_ENDPOINTS.SETTINGS.LIST}?${queryString}`
        : API_ENDPOINTS.SETTINGS.LIST;

      const response = await apiClient.get(url);

      const payload = response?.data ?? response ?? {};
      const pagination = payload?.data ?? {};
      const rows =
        Array.isArray(pagination?.data) ? pagination.data :
        Array.isArray(payload?.data) ? payload.data :
        Array.isArray(response) ? response :
        [];

      const meta = {
        total: pagination?.total ?? payload?.total ?? rows.length ?? 0,
        per_page: pagination?.perPage ?? pagination?.per_page ?? params.per_page ?? rows.length ?? 0,
        current_page: pagination?.page ?? pagination?.currentPage ?? pagination?.current_page ?? params.page ?? 1,
        last_page: pagination?.lastPage ?? pagination?.last_page ?? 1
      };

      return { data: rows, meta };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single setting detail
  async getSettingById(id) {
    if (!id) throw new Error('Setting ID is required');

    try {
      const response = await apiClient.get(API_ENDPOINTS.SETTINGS.DETAIL(id));
      return response?.data?.data ?? response?.data ?? response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create setting
  async createSetting(payload) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SETTINGS.CREATE, payload);
      return response?.data ?? response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update setting
  async updateSetting(id, payload) {
    if (!id) throw new Error('Setting ID is required');

    try {
      const response = await apiClient.put(API_ENDPOINTS.SETTINGS.UPDATE(id), payload);
      return response?.data ?? response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete setting
  async deleteSetting(id) {
    if (!id) throw new Error('Setting ID is required');

    try {
      const response = await apiClient.delete(API_ENDPOINTS.SETTINGS.DELETE(id));
      return response?.data ?? response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Toggle status
  async toggleSettingStatus(id) {
    if (!id) throw new Error('Setting ID is required');

    try {
      const response = await apiClient.put(API_ENDPOINTS.SETTINGS.TOGGLE_STATUS(id));
      return response?.data ?? response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Form validation helper
  validateSetting(setting) {
    const errors = {};

    if (!setting.key || !setting.key.trim()) {
      errors.key = 'Key wajib diisi';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(setting.key)) {
      errors.key = 'Gunakan huruf, angka, titik, garis bawah, atau strip';
    }

    if (setting.value === undefined || setting.value === null || setting.value === '') {
      errors.value = 'Value wajib diisi';
    }

    if (setting.description && setting.description.length > 255) {
      errors.description = 'Deskripsi maksimal 255 karakter';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Format status badge helper
  getStatusBadge(setting) {
    return setting?.is_active ? { color: 'success', text: 'Active' } : { color: 'secondary', text: 'Inactive' };
  }

  // Generic error handler
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
          return new Error('Forbidden: Tidak memiliki akses');
        case 404:
          return new Error('Setting tidak ditemukan');
        case 422:
          return new Error(`Validation Error: ${message}`);
        case 500:
          return new Error('Server Error: Silakan coba lagi nanti');
        default:
          return new Error(message || 'Terjadi kesalahan');
      }
    } else if (error.request) {
      return new Error('Network Error: Periksa koneksi Anda');
    }

    return new Error(error.message || 'Terjadi kesalahan yang tidak diketahui');
  }
}

const settingService = new SettingService();

export default settingService;
