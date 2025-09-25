// ========================================
// API ENDPOINTS CONSTANTS
// ========================================

import config from '../config/environment';

const API_BASE = config.api.baseUrl;

export const API_ENDPOINTS = {
  // Authentication Endpoints
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    LOGOUT: `${API_BASE}/auth/logout`,
    PROFILE: `${API_BASE}/auth/profile`,
    CHANGE_PASSWORD: `${API_BASE}/user/change-password`
  },

  // User Management Endpoints
  USERS: {
    LIST: `${API_BASE}/user`,
    DETAIL: (id) => `${API_BASE}/user/${id}`,
    CREATE: `${API_BASE}/user`,
    UPDATE: (id) => `${API_BASE}/user/${id}`,
    DELETE: (id) => `${API_BASE}/user/${id}`,
    TOGGLE_STATUS: (id) => `${API_BASE}/user/${id}/toggle-status`
  },

  // Employee Management Endpoints
  EMPLOYEES: {
    LIST: `${API_BASE}/employee`,
    DETAIL: (id) => `${API_BASE}/employee/show?employee_id=${id}`,
    CREATE: `${API_BASE}/employee`,
    UPDATE: `${API_BASE}/employee/`,
    DELETE: (id) => `${API_BASE}/employee/${id}`
  },

  // Company Management Endpoints
  COMPANIES: {
    LIST: `${API_BASE}/company`,
    DETAIL: (id) => `${API_BASE}/company/${id}`,
    CREATE: `${API_BASE}/company`,
    UPDATE: (id) => `${API_BASE}/company/${id}`,
    DELETE: (id) => `${API_BASE}/company/${id}`
  },

  // Main Component Endpoints
  MAIN_COMPONENTS: {
    LIST: `${API_BASE}/maincomponent`,
    DETAIL: (id) => `${API_BASE}/maincomponent/show?main_component_id=${id}`,
    CREATE: `${API_BASE}/maincomponent`,
    UPDATE: `${API_BASE}/maincomponent/update`,
    DELETE: `${API_BASE}/maincomponent/`
  },

  // Payroll Management Endpoints
  PAYROLL: {
    LIST: `${API_BASE}/payroll`,
    DETAIL: (id) => `${API_BASE}/payroll/${id}`,
    GENERATE: `${API_BASE}/payroll`,
    MASS_GENERATE: `${API_BASE}/payroll/mass`,
    UPDATE: (id) => `${API_BASE}/payroll/${id}`,
    MARK_PRINTED: (id) => `${API_BASE}/payroll/${id}/print`,
    DELETE: (id) => `${API_BASE}/payroll/${id}`
  },

  // Attendance Management Endpoints
  ATTENDANCE: {
    BULK_INSERT: `${API_BASE}/external/attendance/bulk`,
    DETAIL: (employeeId, payrollPeriod) => `${API_BASE}/external/attendance/${employeeId}/${payrollPeriod}`,
    SYNC: `${API_BASE}/external/attendance/sync`
  },

  // External API Endpoints
  EXTERNAL: {
    REGISTER_EMPLOYEE: `${API_BASE}/external/register-employee`,
    GET_EMPLOYEE: (employeeId) => `${API_BASE}/external/employee/${employeeId}`,
    UPDATE_EMPLOYEE: (employeeId) => `${API_BASE}/external/employee/${employeeId}`,
    BULK_REGISTER_EMPLOYEES: `${API_BASE}/external/bulk-register-employees`,
    REGISTER_COMPANY: `${API_BASE}/external/register-company`,
    HEALTH: `${API_BASE}/external/health`
  },

  // System Health
  HEALTH: `${API_BASE}/health`
};

export default API_ENDPOINTS;
