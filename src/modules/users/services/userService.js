// ========================================
// USER SERVICE
// ========================================

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import { USER_ROLES } from '../../../constants/userRoles';

const USER_ROLE_VALUES = Object.values(USER_ROLES);

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'active'].includes(normalized)) {
      return true;
    }
  }

  return false;
};

const normalizeUserType = (type) => {
  if (!type || typeof type !== 'string') {
    return USER_ROLES.USER;
  }

  const normalized = type.trim().toLowerCase();
  if (normalized === 'member') {
    return USER_ROLES.USER;
  }
  return USER_ROLE_VALUES.includes(normalized) ? normalized : USER_ROLES.USER;
};

const extractCompanyName = (user) => {
  if (!user || typeof user !== 'object') {
    return '';
  }

  if (typeof user.company === 'string') {
    return user.company;
  }

  if (user.company && typeof user.company === 'object') {
    const { name, company_name, companyName, title } = user.company;
    return name || company_name || companyName || title || '';
  }

  const { company_name, companyName, company_title } = user;
  return company_name || companyName || company_title || '';
};

const extractCompanyId = (user) => {
  if (!user || typeof user !== 'object') {
    return undefined;
  }

  if (user.company_id !== undefined && user.company_id !== null) {
    return user.company_id;
  }

  if (user.companyId !== undefined && user.companyId !== null) {
    return user.companyId;
  }

  if (user.company && typeof user.company === 'object') {
    const { company_id, companyId, id } = user.company;
    return company_id ?? companyId ?? id;
  }

  return undefined;
};

const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') {
    return user;
  }

  const isActiveSource = user.is_active !== undefined ? user.is_active : user.status;
  const isActive = normalizeBoolean(isActiveSource);

  const fullName = user.name && user.name.trim()
    ? user.name
    : [user.firstname, user.lastname].filter(Boolean).join(' ').trim();

  const typeValue = normalizeUserType(user.type);

  const statusText =
    typeof user.status === 'string' && user.status.trim().length > 0
      ? user.status
      : isActive ? 'active' : 'inactive';

  const companyName = extractCompanyName(user);
  const companyId = extractCompanyId(user);

  return {
    ...user,
    name: fullName || user.name,
    is_active: isActive,
    status: statusText,
    type: typeValue,
    company_id: companyId,
    company_name: companyName
  };
};

const prepareUserPayload = (data) => {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const payload = { ...data };

  if (payload.type) {
    payload.type = normalizeUserType(payload.type);
  }

  if (payload.company_name !== undefined) {
    delete payload.company_name;
  }
  if (payload.company !== undefined) {
    delete payload.company;
  }

  if (payload.type !== USER_ROLES.USER || payload.company_id === '' || payload.company_id === undefined || payload.company_id === null) {
    delete payload.company_id;
  } else {
    const parsedCompanyId = Number(payload.company_id);
    if (Number.isNaN(parsedCompanyId)) {
      delete payload.company_id;
    } else {
      payload.company_id = parsedCompanyId;
    }
  }

  if (payload.type === USER_ROLES.USER) {
    payload.type = 'member';
  }

  return payload;
};

const extractUsersFromPayload = (payload) => {
  if (!payload) {
    return { list: [], meta: {} };
  }

  // When payload already contains pagination fields with data array
  if (Array.isArray(payload.data)) {
    return { list: payload.data, meta: payload };
  }

  // Nested under payload.users or payload.data.users
  const nestedSources = [
    payload.users,
    payload.data,
    payload.data?.users
  ];

  for (const source of nestedSources) {
    if (source && typeof source === 'object') {
      if (Array.isArray(source.data)) {
        return { list: source.data, meta: source };
      }
      if (Array.isArray(source.users?.data)) {
        return { list: source.users.data, meta: source.users };
      }
    }
  }

  // When payload itself is an array
  if (Array.isArray(payload)) {
    return {
      list: payload,
      meta: {
        total: payload.length,
        perPage: payload.length,
        page: 1,
        lastPage: 1
      }
    };
  }

  return { list: [], meta: {} };
};

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
      const payload = response.data || {};
      const { list, meta } = extractUsersFromPayload(payload);
      const users = list.map(normalizeUser);

      const total =
        meta.total ??
        payload.total ??
        payload.data?.total ??
        payload.users?.total ??
        users.length;

      let perPage =
        meta.perPage ??
        payload.perPage ??
        payload.data?.perPage ??
        payload.users?.perPage ??
        params.rows ??
        users.length;

      if (!perPage || perPage <= 0) {
        perPage = params.rows || users.length || 10;
      }

      const page =
        meta.page ??
        payload.page ??
        payload.data?.page ??
        payload.users?.page ??
        params.page ??
        1;

      const lastPage =
        meta.lastPage ??
        payload.lastPage ??
        payload.data?.lastPage ??
        payload.users?.lastPage ??
        (perPage ? Math.max(Math.ceil(total / perPage), 1) : 1);

      return {
        total,
        perPage,
        page,
        lastPage,
        data: users
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.DETAIL(id));
      const user = response.data || null;
      return normalizeUser(user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const payload = prepareUserPayload(userData);
      const response = await apiClient.post(API_ENDPOINTS.USERS.CREATE, payload);
      return response.data || response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update user
  async updateUser(id, userData) {
    try {
      const payload = prepareUserPayload(userData);
      const requestData = {
        user_id: parseInt(id, 10),
        ...payload
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
      const user = response.data?.user || response.data || null;
      return normalizeUser(user);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Change user password
  async changePassword(id, passwordData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.USERS.CHANGE_PASSWORD(id), passwordData);
      return response.data || response;
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

    if (data.phone && data.phone.length > 20) {
      errors.phone = 'Phone number cannot exceed 20 characters.';
    }

    const normalizedTypeForValidation = normalizeUserType(data.type);
    if (!normalizedTypeForValidation || ![USER_ROLES.ADMIN, USER_ROLES.USER].includes(normalizedTypeForValidation)) {
      errors.type = 'Please select a valid user type.';
    }

    if (normalizeUserType(data.type) === USER_ROLES.USER) {
      const companyId = data.company_id;
      if (companyId === undefined || companyId === null || String(companyId).trim() === '') {
        errors.company_id = 'Company is required for member users.';
      }
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
