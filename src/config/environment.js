// ========================================
// PAYROLL FRONTEND CONFIGURATION
// ========================================

const config = {
  // Application Configuration
  app: {
    name: 'Payroll Management System',
    version: '1.0.0',
    port: 7000,
    debug: false,
    logLevel: 'info'
  },

  // API Configuration
  api: {
    baseUrl: 'http://localhost:7100/api/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Authentication Configuration
  auth: {
    jwtSecretKey: 'your-jwt-secret-key-here',
    tokenStorageKey: 'payroll_auth_token',
    userStorageKey: 'payroll_user_data',
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    enableRegistration: false
  },

  // External API Configuration
  external: {
    apiKey: 'hr_system_abc123def456',
    hrSystemUrl: 'https://external-hr-system.example.com/api/v1',
    enableSync: true
  },

  // Application Features
  features: {
    massPayroll: true,
    attendanceSync: true,
    bulkOperations: true,
    advancedReports: true,
    notifications: true
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

    // System Health
    health: '/health'
  }
};

export default config;
