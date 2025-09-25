// ========================================
// PROTECTED ROUTE COMPONENT
// ========================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CSpinner, CContainer, CRow, CCol, CAlert } from '@coreui/react';

const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [],
  fallbackComponent = null 
}) => {
  const { isAuthenticated, user, loading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-row align-items-center">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={6} className="text-center">
              <CSpinner color="primary" />
              <div className="mt-3">Checking authentication...</div>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return (
        <CContainer className="mt-4">
          <CAlert color="danger">
            <h4>Access Denied</h4>
            <p>You don't have the required role to access this page.</p>
            <p>Required roles: {requiredRoles.join(', ')}</p>
            <p>Your role: {user?.type || 'Unknown'}</p>
          </CAlert>
        </CContainer>
      );
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = requiredPermissions.some(permission => 
      hasPermission(permission)
    );
    
    if (!hasRequiredPermission) {
      if (fallbackComponent) {
        return fallbackComponent;
      }
      
      return (
        <CContainer className="mt-4">
          <CAlert color="warning">
            <h4>Insufficient Permissions</h4>
            <p>You don't have the required permissions to access this page.</p>
            <p>Contact your administrator if you believe this is an error.</p>
          </CAlert>
        </CContainer>
      );
    }
  }

  // Render the protected content
  return children;
};

export default ProtectedRoute;
