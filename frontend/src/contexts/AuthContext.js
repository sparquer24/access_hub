/**
 * Authentication Context
 * Manages user authentication state, JWT tokens, and user data
 */
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Token storage keys
const ACCESS_TOKEN_KEY = 'accesshub_access_token';
const REFRESH_TOKEN_KEY = 'accesshub_refresh_token';
const USER_DATA_KEY = 'accesshub_user_data';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get tokens from localStorage
  const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

  // Save tokens to localStorage
  const saveTokens = (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, `${accessToken}`);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  };

  // Clear tokens from localStorage
  const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  };

  // Save user data to localStorage
  const saveUserData = (userData) => {
    if (userData) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
  };

  // Get user data from localStorage
  const getUserData = () => {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  };

  // Refresh token function - moved up and memoized to prevent dependency issues
  const refreshToken = useCallback(async () => {
    try {
      const refreshTok = getRefreshToken();
      if (!refreshTok) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(refreshTok);
      
      if (response.data.success) {
        const { access_token, refresh_token } = response.data.data;
        saveTokens(access_token, refresh_token);
        return access_token;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  // Load user data from token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      const savedUser = getUserData();

      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
        
        // Verify token is still valid
        try {
          const response = await authAPI.getCurrentUser();
          if (response.data.success) {
            const userData = response.data.data.user;
            setUser(userData);
            saveUserData(userData);
          }
        } catch (error) {
          // Token might be expired, try to refresh
          await refreshToken();
        }
      }

      setLoading(false);
    };

    initAuth();
  }, [refreshToken]);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      
      if (response.data.success) {
        const { user: userData, access_token, refresh_token } = response.data.data;
        
        // Save tokens and user data
        saveTokens(access_token, refresh_token);
        saveUserData(userData);
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout API to blacklist token
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Check if user has specific role
  const hasRole = (role) => {
    if (!user) return false;
    
    // Get the user's role - prioritize ID, then name, then string
    let userRoleId = '';
    let userRoleName = '';
    
    if (typeof user.role === 'string') {
      userRoleId = user.role;
      userRoleName = user.role;
    } else if (user.role) {
      userRoleId = user.role.id || '';
      userRoleName = user.role.name || '';
    } else {
      return false;
    }
    
    if (Array.isArray(role)) {
      return role.some(r => 
        r === userRoleId || 
        r === userRoleName ||
        normalizeRoleName(r) === normalizeRoleName(userRoleId) ||
        normalizeRoleName(r) === normalizeRoleName(userRoleName)
      );
    }
    
    return role === userRoleId || 
           role === userRoleName ||
           normalizeRoleName(role) === normalizeRoleName(userRoleId) ||
           normalizeRoleName(role) === normalizeRoleName(userRoleName);
  };

  // Helper function to normalize role names for comparison
  const normalizeRoleName = (roleName) => {
    if (!roleName) return '';
    return roleName.toLowerCase().replace(/\s+/g, '_');
  };

  // Check if user has specific permission
  const hasPermission = (resource, action) => {
    if (!user || !user.role || !user.role.permissions) return false;
    const permissions = user.role.permissions[resource] || [];
    return permissions.includes(action) || permissions.includes('*');
  };

  // Get redirect path based on user role
  const getDefaultRoute = () => {
    if (!user || !user.role) return '/';
    
    // Use role.id first, then fallback to role.name
    const roleName = user.role.id || user.role.name || user.role;
    console.log('Determining default route for role:', {roleName, userRole: user.role});
    switch (roleName) {
      case 'super_admin':
        return '/super-admin/dashboard';
      case 'org_admin':
        // Redirect org_admin to their dashboard
        return '/org-admin/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'employee':
        return '/employee/dashboard';
      default:
        return '/';
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    hasRole,
    hasPermission,
    getDefaultRoute,
    getAccessToken,
    getRefreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
