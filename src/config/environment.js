// ========================================
// PAYROLL FRONTEND CONFIGURATION
// ========================================

const env = import.meta.env;

const getEnv = (key, fallback) => env[key] ?? fallback;

const getNumberEnv = (key, fallback) => {
  const value = Number(env[key]);
  return Number.isFinite(value) ? value : fallback;
};

const getBooleanEnv = (key, fallback) => {
  if (env[key] === undefined) return fallback;
  return env[key] === 'true';
};

const config = {
  // Application Configuration
  app: {
    name: getEnv('VITE_APP_NAME', 'Payroll Management System'),
    description: getEnv('VITE_APP_DESCRIPTION', 'TEMA INTERNAL'),
    version: getEnv('VITE_APP_VERSION', '1.0.0'),
    port: getNumberEnv('VITE_APP_PORT', 7000),
    debug: getBooleanEnv('VITE_APP_DEBUG', false),
    logLevel: getEnv('VITE_APP_LOG_LEVEL', 'info')
  },

  // API Configuration
  api: {
    baseUrl: getEnv('VITE_API_BASE_URL', 'http://localhost:7100/api/v1'),
    timeout: getNumberEnv('VITE_API_TIMEOUT', 30000),
    retryAttempts: getNumberEnv('VITE_API_RETRY_ATTEMPTS', 3),
    retryDelay: getNumberEnv('VITE_API_RETRY_DELAY', 1000)
  },

  // Authentication Configuration
  auth: {
    tokenStorageKey: getEnv('VITE_AUTH_TOKEN_STORAGE_KEY', 'payroll_auth_token_6f88ce5ae28abba7'),
    userStorageKey: getEnv('VITE_AUTH_USER_STORAGE_KEY', 'payroll_user_data_c7a60d42f7507736'),
    enableRegistration: getBooleanEnv('VITE_AUTH_ENABLE_REGISTRATION', false)
  },

  // Pagination Configuration
  pagination: {
    defaultRows: 25,
    maxRows: 100,
    pageSizeOptions: [5, 10, 25, 50, 100]
  },

  // File Upload Configuration
  upload: {
    maxSize: 10485760, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.xls', '.xlsx']
  },

  // Theme & UI Configuration
  ui: {
    defaultTheme: 'light',
    companyName: 'Your Company Name',
    companyLogo: '/assets/img/logo.png',
    notificationTimeout: 5000,
    sidebarMinimized: false,
    breadcrumbEnabled: true
  },

  // Date & Time Configuration
  datetime: {
    locale: 'id-ID',
    timezone: 'Asia/Jakarta',
    dateFormat: 'DD/MM/YYYY',
    datetimeFormat: 'DD/MM/YYYY HH:mm:ss',
    timeFormat: 'HH:mm:ss'
  },

  // Print & Export Configuration
  export: {
    enablePDF: true,
    enableExcel: true,
    printCompanyHeader: true,
    defaultFormat: 'pdf',
    quality: 'high'
  },

  // Security Configuration
  security: {
    enableCors: true,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:7100'],
    csrfProtection: true,
    sanitizeInputs: true
  },

  // API Endpoints Configuration
  endpoints: {
    // Authentication
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      profile: '/auth/profile',
      changePassword: '/user/change-password'
    },
    
    // User Management
    users: {
      list: '/user',
      detail: '/user/:id',
      create: '/user',
      update: '/user/:id',
      delete: '/user/:id',
      toggleStatus: '/user/:id/toggle-status'
    },

    // Employee Management
    employees: {
      list: '/employee',
      detail: '/employee/:id',
      create: '/employee',
      update: '/employee/:id',
      delete: '/employee/:id'
    },

    // Company Management
    companies: {
      list: '/company',
      detail: '/company/:id',
      create: '/company',
      update: '/company/:id',
      delete: '/company/:id'
    },

    // Main Component Management
    components: {
      list: '/maincomponent',
      detail: '/maincomponent/:id',
      create: '/maincomponent',
      update: '/maincomponent/:id',
      delete: '/maincomponent/:id'
    },

    // Payroll Management
    payroll: {
      list: '/payroll',
      detail: '/payroll/:id',
      generate: '/payroll',
      massGenerate: '/payroll/mass',
      update: '/payroll/:id',
      markPrinted: '/payroll/:id/print',
      delete: '/payroll/:id'
    },

    // Attendance Management
    attendance: {
      bulk: '/external/attendance/bulk',
      detail: '/external/attendance/:employee_id/:payroll_period',
      sync: '/external/attendance/sync'
    },

    // External APIs
    external: {
      registerEmployee: '/external/register-employee',
      getEmployee: '/external/employee/:employee_id',
      updateEmployee: '/external/employee/:employee_id',
      bulkRegisterEmployees: '/external/bulk-register-employees',
      registerCompany: '/external/register-company',
      health: '/external/health'
    },

    // System Settings
    settings: {
      list: '/setting',
      detail: '/setting/:id',
      create: '/setting',
      update: '/setting/:id',
      delete: '/setting/:id',
      toggleStatus: '/setting/:id/toggle-status'
    },

    // System Health
    health: '/health'
  }
};

export default config;
