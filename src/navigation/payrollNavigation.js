// ========================================
// PAYROLL SYSTEM NAVIGATION
// ========================================

import React from 'react';
import CIcon from '@coreui/icons-react';
import {
  cilSpeedometer,
  cilPeople,
  cilBuilding,
  cilUser,
  cilSettings,
  cilCash,
  cilCalendar,
  cilChart,
  cilClipboard
} from '@coreui/icons';
import { PERMISSIONS, USER_ROLES } from '../constants/userRoles';

const payrollNavigation = [
  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW'
    }
  },
  {
    component: 'CNavTitle',
    name: 'Master Data'
  },
  {
    component: 'CNavGroup',
    name: 'Employee Management',
    to: '/employees',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    requiredPermissions: [PERMISSIONS.EMPLOYEES_VIEW],
    items: [
      {
        component: 'CNavItem',
        name: 'Employee List',
        to: '/employees',
        requiredPermissions: [PERMISSIONS.EMPLOYEES_VIEW]
      },
      {
        component: 'CNavItem',
        name: 'Add Employee',
        to: '/employees/create',
        requiredPermissions: [PERMISSIONS.EMPLOYEES_CREATE]
      }
    ]
  },
  {
    component: 'CNavGroup',
    name: 'Company Management',
    to: '/companies',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
    requiredPermissions: [PERMISSIONS.COMPANIES_VIEW],
    items: [
      {
        component: 'CNavItem',
        name: 'Company List',
        to: '/companies',
        requiredPermissions: [PERMISSIONS.COMPANIES_VIEW]
      },
      {
        component: 'CNavItem',
        name: 'Add Company',
        to: '/companies/create',
        requiredPermissions: [PERMISSIONS.COMPANIES_CREATE]
      }
    ]
  },
  {
    component: 'CNavGroup',
    name: 'User Management',
    to: '/users',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
    requiredPermissions: [PERMISSIONS.USERS_VIEW],
    requiredRoles: [USER_ROLES.ADMIN],
    items: [
      {
        component: 'CNavItem',
        name: 'User List',
        to: '/users',
        requiredPermissions: [PERMISSIONS.USERS_VIEW]
      },
      {
        component: 'CNavItem',
        name: 'Add User',
        to: '/users/create',
        requiredPermissions: [PERMISSIONS.USERS_CREATE]
      }
    ]
  },
  {
    component: 'CNavGroup',
    name: 'Payroll Components',
    to: '/components',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
    requiredPermissions: [PERMISSIONS.COMPONENTS_VIEW],
    items: [
      {
        component: 'CNavItem',
        name: 'Component List',
        to: '/components',
        requiredPermissions: [PERMISSIONS.COMPONENTS_VIEW]
      },
      {
        component: 'CNavItem',
        name: 'Add Component',
        to: '/components/create',
        requiredPermissions: [PERMISSIONS.COMPONENTS_CREATE]
      }
    ]
  },
  {
    component: 'CNavTitle',
    name: 'Payroll Operations'
  },
  {
    component: 'CNavGroup',
    name: 'Payroll Management',
    to: '/payroll',
    icon: <CIcon icon={cilCash} customClassName="nav-icon" />,
    requiredPermissions: [PERMISSIONS.PAYROLL_VIEW],
    items: [
      {
        component: 'CNavItem',
        name: 'Payroll List',
        to: '/payroll',
        requiredPermissions: [PERMISSIONS.PAYROLL_VIEW]
      },
      {
        component: 'CNavItem',
        name: 'Generate Payroll',
        to: '/payroll/generate',
        requiredPermissions: [PERMISSIONS.PAYROLL_GENERATE]
      },
      {
        component: 'CNavItem',
        name: 'Mass Generate',
        to: '/payroll/mass-generate',
        requiredPermissions: [PERMISSIONS.PAYROLL_MASS_GENERATE]
      }
    ]
  },
  {
    component: 'CNavGroup',
    name: 'Attendance',
    to: '/attendance',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
    requiredPermissions: [PERMISSIONS.ATTENDANCE_VIEW],
    items: [
      {
        component: 'CNavItem',
        name: 'Attendance Data',
        to: '/attendance',
        requiredPermissions: [PERMISSIONS.ATTENDANCE_VIEW]
      },
      {
        component: 'CNavItem',
        name: 'Sync Attendance',
        to: '/attendance/sync',
        requiredPermissions: [PERMISSIONS.ATTENDANCE_SYNC]
      }
    ]
  },
  {
    component: 'CNavTitle',
    name: 'Reports & Analytics'
  },
  {
    component: 'CNavGroup',
    name: 'Reports',
    to: '/reports',
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
    requiredPermissions: [PERMISSIONS.REPORTS_VIEW],
    items: [
      {
        component: 'CNavItem',
        name: 'All Reports',
        to: '/reports',
        requiredPermissions: [PERMISSIONS.REPORTS_VIEW]
      },
      {
        component: 'CNavItem',
        name: 'Payroll Report',
        to: '/reports/payroll',
        requiredPermissions: [PERMISSIONS.REPORTS_VIEW]
      },
      {
        component: 'CNavItem',
        name: 'Employee Report',
        to: '/reports/employee',
        requiredPermissions: [PERMISSIONS.REPORTS_VIEW]
      }
    ]
  },
  {
    component: 'CNavItem',
    name: 'System Health',
    to: '/system/health',
    icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
    requiredPermissions: [PERMISSIONS.SYSTEM_HEALTH],
    requiredRoles: [USER_ROLES.ADMIN]
  }
];

export default payrollNavigation;
