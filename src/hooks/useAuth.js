// ========================================
// AUTHENTICATION HOOK
// ========================================

import { useState, useEffect, useContext, createContext } from 'react';
import authService from '../services/authService';
import { USER_ROLES, hasPermission } from '../constants/userRoles';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true
  });

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = () => {
    try {
      const authData = authService.initializeAuth();
      setAuthState({
        isAuthenticated: authData.isAuthenticated,
        user: authData.user,
        token: authData.token,
        loading: false
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      });
    }
  };

  const login = async (credentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const response = await authService.login(credentials);
      
      setAuthState({
        isAuthenticated: true,
        user: response.data.user,
        token: response.data.token,
        loading: false
      });
      
      return response;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const response = await authService.register(userData);
      
      setAuthState(prev => ({ ...prev, loading: false }));
      
      return response;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      await authService.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      });
    } catch (error) {
      // Even if logout fails, clear local state
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      });
    }
  };

  const updateProfile = async () => {
    try {
      const user = await authService.getProfile();
      setAuthState(prev => ({ ...prev, user }));
      return user;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Helper methods
  const hasRole = (role) => {
    return authState.user?.type === role;
  };

  const hasPermissionCheck = (permission) => {
    if (!authState.user) return false;
    return hasPermission(authState.user.type, permission);
  };

  const isAdmin = () => {
    return hasRole(USER_ROLES.ADMIN);
  };

  const isHR = () => {
    return hasRole(USER_ROLES.HR);
  };

  const isFinance = () => {
    return hasRole(USER_ROLES.FINANCE);
  };

  const isManager = () => {
    return hasRole(USER_ROLES.MANAGER);
  };

  const value = {
    // State
    ...authState,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    
    // Helper methods
    hasRole,
    hasPermission: hasPermissionCheck,
    isAdmin,
    isHR,
    isFinance,
    isManager
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for route protection
export const withAuth = (WrappedComponent, requiredPermissions = []) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, hasPermission, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>; // Or your loading component
    }
    
    if (!isAuthenticated) {
      // Redirect to login or show unauthorized
      return <div>Please login to access this page</div>;
    }
    
    // Check permissions if required
    if (requiredPermissions.length > 0) {
      const hasRequiredPermission = requiredPermissions.some(permission => 
        hasPermission(permission)
      );
      
      if (!hasRequiredPermission) {
        return <div>You don't have permission to access this page</div>;
      }
    }
    
    return <WrappedComponent {...props} />;
  };
};

export default useAuth;
