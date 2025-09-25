// ========================================
// AUTH GUARD COMPONENT
// ========================================

import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, user, updateProfile } = useAuth();

  useEffect(() => {
    // Check token validity and refresh user data periodically
    const checkAuthStatus = async () => {
      if (isAuthenticated && user) {
        try {
          // Check if token is about to expire
          if (authService.isTokenExpired()) {
            // Token is expired, logout user
            authService.clearAuthData();
            window.location.href = '/login';
            return;
          }

          // Optionally refresh user profile periodically
          // await updateProfile();
        } catch (error) {
          console.error('Auth check failed:', error);
          // If profile fetch fails, it might indicate invalid token
          if (error.message && error.message.includes('Unauthorized')) {
            authService.clearAuthData();
            window.location.href = '/login';
          }
        }
      }
    };

    // Check auth status immediately
    checkAuthStatus();

    // Set up periodic auth check (every 5 minutes)
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, updateProfile]);

  // Add event listener for token expiry
  useEffect(() => {
    const handleStorageChange = (e) => {
      // If token is removed from another tab, logout current tab
      if (e.key === authService.getToken() && !e.newValue) {
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return children;
};

export default AuthGuard;
