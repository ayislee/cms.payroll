// ========================================
// DOCUMENT TITLE UTILITY
// ========================================

import { useEffect } from 'react';
import config from '../config/environment';

// Set document title based on page
export const setDocumentTitle = (pageTitle = '') => {
  const baseTitle = config.app.name;
  
  if (pageTitle) {
    document.title = `${pageTitle} - ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
};

// Get current page title from location
export const getPageTitle = (pathname) => {
  const routes = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/login': 'Login',
    '/employees': 'Employee Management',
    '/employees/create': 'Add Employee',
    '/employees/:id/settings': 'Employee Settings',
    '/companies': 'Company Management',
    '/users': 'User Management',
    '/components': 'Payroll Components',
    '/components/create': 'Add Component',
    '/settings': 'System Settings',
    '/payroll': 'Payroll Management',
    '/payroll/generate': 'Generate Payroll',
    '/payroll/mass-generate': 'Mass Generate Payroll',
    '/attendance': 'Attendance Management',
    '/attendance/sync': 'Sync Attendance',
    '/reports': 'Reports',
    '/reports/payroll': 'Payroll Report',
    '/reports/employee': 'Employee Report',
    '/system/health': 'System Health'
  };

  // Check for exact match first
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Check for dynamic routes (e.g., /employees/123, /employees/123/edit)
  const pathSegments = pathname.split('/').filter(Boolean);
  
  if (pathSegments.length >= 2) {
    const basePath = `/${pathSegments[0]}`;
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    if (lastSegment === 'edit') {
      const entityName = pathSegments[0].slice(0, -1); // Remove 's' from plural
      return `Edit ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`;
    }
    
    if (routes[basePath] && !isNaN(pathSegments[1])) {
      const entityName = pathSegments[0].slice(0, -1); // Remove 's' from plural
      return `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} Detail`;
    }
  }

  return 'Page Not Found';
};

// Hook to automatically set title based on current location
export const useDocumentTitle = (customTitle = '') => {
  useEffect(() => {
    if (customTitle) {
      setDocumentTitle(customTitle);
    } else {
      const pathname = window.location.pathname;
      const pageTitle = getPageTitle(pathname);
      setDocumentTitle(pageTitle);
    }
  }, [customTitle]);
};

export default {
  setDocumentTitle,
  getPageTitle,
  useDocumentTitle
};
