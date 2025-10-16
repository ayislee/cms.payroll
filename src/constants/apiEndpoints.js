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
    CREATE: `${API_BASE}/user/store`,
    UPDATE: (id) => `${API_BASE}/user/${id}`,
    DELETE: (id) => `${API_BASE}/user/${id}`,
    TOGGLE_STATUS: (id) => `${API_BASE}/user/${id}/toggle-status`,
    CHANGE_PASSWORD: (id) => `${API_BASE}/user/${id}/change-password`
  },

  // Employee Management Endpoints
  EMPLOYEES: {
    LIST: `${API_BASE}/employee`,
    DETAIL: (id) => `${API_BASE}/employee/show?employee_id=${id}`,
    CREATE: `${API_BASE}/employee`,
    UPDATE: `${API_BASE}/employee/`,
    DELETE: (id) => `${API_BASE}/employee/${id}`,
    GET_ALL: `${API_BASE}/employee/get-all-employee`,
    SYNC_EXTERNAL: `${API_BASE}/employee/sync-external`
  },

  // Employee Component Endpoints
  EMPLOYEE_COMPONENTS: {
    LIST: (employeeId) => `${API_BASE}/payroll/employee/setting?employee_id=${employeeId}`,
    UPDATE: `${API_BASE}/payroll/employee/update`,
    DETAIL: (id) => `${API_BASE}/payroll/employee/get?employee_component_id=${id}`
  },

  // Company Management Endpoints
  COMPANIES: {
    LIST: `${API_BASE}/company`,
    DETAIL: (id) => `${API_BASE}/company/show?company_id=${id}`,
    CREATE: `${API_BASE}/company`,
    UPDATE: `${API_BASE}/company`,
    DELETE: (id) => `${API_BASE}/company?company_id=${id}`,
    TOGGLE_STATUS: (id) => `${API_BASE}/company/toggle-status?company_id=${id}`,
    STATS: (id) => `${API_BASE}/company/stats?company_id=${id}`,
    BULK_CREATE: `${API_BASE}/company/bulk-create`,
    SYNC_EXTERNAL: `${API_BASE}/company/sync-external`
  },

  // Main Component Endpoints
  MAIN_COMPONENTS: {
    LIST: `${API_BASE}/maincomponent`,
    DETAIL: (id) => `${API_BASE}/maincomponent/show?main_component_id=${id}`,
    CREATE: `${API_BASE}/maincomponent`,
    UPDATE: `${API_BASE}/maincomponent/update`,
    DELETE: (id) => `${API_BASE}/maincomponent/${id}`
  },

  // Payroll Management Endpoints
  PAYROLL: {
    LIST: `${API_BASE}/payroll`,
    DETAIL: (id) => `${API_BASE}/payroll/${id}`,
    GENERATE: `${API_BASE}/payroll/generate`,
    GENERATE_SLIP: `${API_BASE}/payroll/slip`,
    MASS_GENERATE: `${API_BASE}/payroll/generate-mass`,
    MASS_GENERATE_SLIP: `${API_BASE}/payroll/slip/mass`,
    EMAIL_SLIP: `${API_BASE}/payroll/slip/email`,
    EMAIL_SLIP_MASS: `${API_BASE}/payroll/slip/email/mass`,
    DOWNLOAD: (periode) => `${API_BASE}/payroll/download/${periode}`,
    DOWNLOAD_FILE: `${API_BASE}/payroll/download/file`,
    UPDATE: (id) => `${API_BASE}/payroll/${id}`,
    MARK_PRINTED: (id) => `${API_BASE}/payroll/${id}/print`,
    DELETE: (id) => `${API_BASE}/payroll/${id}`
  },

  // Dashboard Endpoints
  DASHBOARD: {
    OVERVIEW: `${API_BASE}/dashboard/overview`
  },

  // Attendance Management Endpoints
  ATTENDANCE: {
    LIST: `${API_BASE}/attendance`,
    CREATE: `${API_BASE}/attendance/store`,
    UPDATE: `${API_BASE}/attendance/update`,
    DELETE: (id) => `${API_BASE}/attendance/delete/${id}`,
    SYNC_EXTERNAL: `${API_BASE}/attendance/sync-external`
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

  // System Settings
  SETTINGS: {
    LIST: `${API_BASE}/setting`,
    DETAIL: (id) => `${API_BASE}/setting/${id}`,
    CREATE: `${API_BASE}/setting`,
    UPDATE: (id) => `${API_BASE}/setting/${id}`,
    DELETE: (id) => `${API_BASE}/setting/${id}`,
    TOGGLE_STATUS: (id) => `${API_BASE}/setting/${id}/toggle-status`
  },

  // System Health
  HEALTH: `${API_BASE}/health`
};

export default API_ENDPOINTS;
