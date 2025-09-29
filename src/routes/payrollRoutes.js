// ========================================
// PAYROLL SYSTEM ROUTES
// ========================================

import React from 'react';
import { PERMISSIONS } from '../constants/userRoles';

// Lazy load components
const Dashboard = React.lazy(() => import('../modules/dashboard/pages/Dashboard'));

// Employee Management
const EmployeeList = React.lazy(() => import('../modules/employees/pages/EmployeeList'));
const EmployeeDetail = React.lazy(() => import('../modules/employees/pages/EmployeeDetail'));
const EmployeeForm = React.lazy(() => import('../modules/employees/pages/EmployeeForm'));

// Company Management  
const CompanyList = React.lazy(() => import('../modules/companies/pages/CompanyList'));
const CompanyDetail = React.lazy(() => import('../modules/companies/pages/CompanyDetail'));
const CompanyForm = React.lazy(() => import('../modules/companies/pages/CompanyForm'));

// User Management
const UserList = React.lazy(() => import('../modules/users/pages/UserList'));
const UserDetail = React.lazy(() => import('../modules/users/pages/UserDetail'));
const UserForm = React.lazy(() => import('../modules/users/pages/UserForm'));

// Component Management
const ComponentList = React.lazy(() => import('../modules/components/pages/ComponentList'));
const ComponentDetail = React.lazy(() => import('../modules/components/pages/ComponentDetail'));
const ComponentForm = React.lazy(() => import('../modules/components/pages/ComponentForm'));

// Payroll Management
const PayrollList = React.lazy(() => {
  return import('../modules/payroll/pages/PayrollList');
});
const PayrollDetail = React.lazy(() => import('../modules/payroll/pages/PayrollDetail'));
const PayrollGenerate = React.lazy(() => import('../modules/payroll/pages/PayrollGenerate'));
const PayrollMassGenerate = React.lazy(() => import('../modules/payroll/pages/PayrollMassGenerate'));

// Attendance Management
const AttendanceList = React.lazy(() => import('../modules/attendance/pages/AttendanceList'));
const AttendanceSync = React.lazy(() => import('../modules/attendance/pages/AttendanceSync'));

// Reports
const ReportList = React.lazy(() => import('../modules/reports/pages/ReportList'));
const PayrollReport = React.lazy(() => import('../modules/reports/pages/PayrollReport'));
const EmployeeReport = React.lazy(() => import('../modules/reports/pages/EmployeeReport'));

const payrollRoutes = [
  // Dashboard
  { 
    path: '/', 
    exact: true, 
    name: 'Home',
    element: Dashboard
  },
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    element: Dashboard 
  },

  // Employee Management Routes
  {
    path: '/employees',
    name: 'Employees',
    element: EmployeeList,
    exact: true,
    requiredPermissions: [PERMISSIONS.EMPLOYEES_VIEW]
  },
  {
    path: '/employees/create',
    name: 'Create Employee',
    element: EmployeeForm,
    requiredPermissions: [PERMISSIONS.EMPLOYEES_CREATE]
  },
  {
    path: '/employees/:id',
    name: 'Employee Detail',
    element: EmployeeDetail,
    requiredPermissions: [PERMISSIONS.EMPLOYEES_VIEW]
  },
  {
    path: '/employees/:id/edit',
    name: 'Edit Employee',
    element: EmployeeForm,
    requiredPermissions: [PERMISSIONS.EMPLOYEES_UPDATE]
  },
  {
    path: '/employees/:id/settings',
    name: 'Employee Settings',
    element: EmployeeDetail,
    requiredPermissions: [PERMISSIONS.EMPLOYEES_VIEW]
  },

  // Company Management Routes
  {
    path: '/companies',
    name: 'Companies',
    element: CompanyList,
    exact: true,
    requiredPermissions: [PERMISSIONS.COMPANIES_VIEW]
  },
  {
    path: '/companies/:id',
    name: 'Company Detail',
    element: CompanyDetail,
    requiredPermissions: [PERMISSIONS.COMPANIES_VIEW]
  },
  {
    path: '/companies/:id/edit',
    name: 'Edit Company',
    element: CompanyForm,
    requiredPermissions: [PERMISSIONS.COMPANIES_UPDATE]
  },

  // User Management Routes
  {
    path: '/users',
    name: 'Users',
    element: UserList,
    exact: true,
    requiredPermissions: [PERMISSIONS.USERS_VIEW]
  },
  {
    path: '/users/:id',
    name: 'User Detail',
    element: UserDetail,
    requiredPermissions: [PERMISSIONS.USERS_VIEW]
  },
  {
    path: '/users/:id/edit',
    name: 'Edit User',
    element: UserForm,
    requiredPermissions: [PERMISSIONS.USERS_UPDATE]
  },

  // Component Management Routes
  {
    path: '/components',
    name: 'Payroll Components',
    element: ComponentList,
    exact: true,
    requiredPermissions: [PERMISSIONS.COMPONENTS_VIEW]
  },
  {
    path: '/components/create',
    name: 'Create Component',
    element: ComponentForm,
    requiredPermissions: [PERMISSIONS.COMPONENTS_CREATE]
  },
  {
    path: '/components/:id',
    name: 'Component Detail',
    element: ComponentDetail,
    requiredPermissions: [PERMISSIONS.COMPONENTS_VIEW]
  },
  {
    path: '/components/:id/edit',
    name: 'Edit Component',
    element: ComponentForm,
    requiredPermissions: [PERMISSIONS.COMPONENTS_UPDATE]
  },

  // Payroll Management Routes
  {
    path: '/payroll',
    name: 'Payrolls',
    element: PayrollList,
    exact: true,
    requiredPermissions: [PERMISSIONS.PAYROLL_VIEW]
  },
  {
    path: '/payroll/generate',
    name: 'Generate Payroll',
    element: PayrollGenerate,
    requiredPermissions: [PERMISSIONS.PAYROLL_GENERATE]
  },
  {
    path: '/payroll/mass-generate',
    name: 'Mass Generate Payroll',
    element: PayrollMassGenerate,
    requiredPermissions: [PERMISSIONS.PAYROLL_MASS_GENERATE]
  },
  {
    path: '/payroll/:id',
    name: 'Payroll Detail',
    element: PayrollDetail,
    requiredPermissions: [PERMISSIONS.PAYROLL_VIEW]
  },

  // Attendance Management Routes
  {
    path: '/attendance',
    name: 'Attendance',
    element: AttendanceList,
    exact: true,
    requiredPermissions: [PERMISSIONS.ATTENDANCE_VIEW]
  },
  {
    path: '/attendance/sync',
    name: 'Sync Attendance',
    element: AttendanceSync,
    requiredPermissions: [PERMISSIONS.ATTENDANCE_SYNC]
  },

  // Reports Routes
  {
    path: '/reports',
    name: 'Reports',
    element: ReportList,
    exact: true,
    requiredPermissions: [PERMISSIONS.REPORTS_VIEW]
  },
  {
    path: '/reports/payroll',
    name: 'Payroll Report',
    element: PayrollReport,
    requiredPermissions: [PERMISSIONS.REPORTS_VIEW]
  },
  {
    path: '/reports/employee',
    name: 'Employee Report',
    element: EmployeeReport,
    requiredPermissions: [PERMISSIONS.REPORTS_VIEW]
  }
];

export default payrollRoutes;
