// ========================================
// USER ROLES & PERMISSIONS CONSTANTS
// ========================================

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  HR: 'hr',
  FINANCE: 'finance',
  MANAGER: 'manager'
};

export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Employee Management
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_UPDATE: 'employees.update',
  EMPLOYEES_DELETE: 'employees.delete',

  // Company Management
  COMPANIES_VIEW: 'companies.view',
  COMPANIES_CREATE: 'companies.create',
  COMPANIES_UPDATE: 'companies.update',
  COMPANIES_DELETE: 'companies.delete',

  // Component Management
  COMPONENTS_VIEW: 'components.view',
  COMPONENTS_CREATE: 'components.create',
  COMPONENTS_UPDATE: 'components.update',
  COMPONENTS_DELETE: 'components.delete',

  // Payroll Management
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_GENERATE: 'payroll.generate',
  PAYROLL_MASS_GENERATE: 'payroll.mass_generate',
  PAYROLL_UPDATE: 'payroll.update',
  PAYROLL_DELETE: 'payroll.delete',
  PAYROLL_PRINT: 'payroll.print',

  // Attendance Management
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_SYNC: 'attendance.sync',
  ATTENDANCE_BULK_INSERT: 'attendance.bulk_insert',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_ADVANCED: 'reports.advanced',

  // System
  SYSTEM_HEALTH: 'system.health',
  SYSTEM_SETTINGS: 'system.settings'
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    // Full access to everything
    ...Object.values(PERMISSIONS)
  ],
  
  [USER_ROLES.HR]: [
    // Employee & User Management
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_CREATE,
    PERMISSIONS.EMPLOYEES_UPDATE,
    PERMISSIONS.EMPLOYEES_DELETE,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    
    // Company Management (read-only)
    PERMISSIONS.COMPANIES_VIEW,
    
    // Attendance Management
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_SYNC,
    PERMISSIONS.ATTENDANCE_BULK_INSERT,
    
    // Reports
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],
  
  [USER_ROLES.FINANCE]: [
    // Payroll Management
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.PAYROLL_GENERATE,
    PERMISSIONS.PAYROLL_MASS_GENERATE,
    PERMISSIONS.PAYROLL_UPDATE,
    PERMISSIONS.PAYROLL_PRINT,
    
    // Component Management
    PERMISSIONS.COMPONENTS_VIEW,
    PERMISSIONS.COMPONENTS_CREATE,
    PERMISSIONS.COMPONENTS_UPDATE,
    
    // Employee View (for payroll purposes)
    PERMISSIONS.EMPLOYEES_VIEW,
    
    // Company View
    PERMISSIONS.COMPANIES_VIEW,
    
    // Reports
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.REPORTS_ADVANCED
  ],
  
  [USER_ROLES.MANAGER]: [
    // View permissions for oversight
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.COMPANIES_VIEW,
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.REPORTS_ADVANCED
  ],
  
  [USER_ROLES.USER]: [
    // Basic view permissions
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.COMPANIES_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ]
};

// Helper function to check if user has permission
export const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Helper function to check if user has any of the given permissions
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Helper function to check if user has all of the given permissions
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

export default {
  USER_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions
};
