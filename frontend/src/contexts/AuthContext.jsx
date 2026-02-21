import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getAccessToken();
        if (token) {
          // First try to get user from localStorage (faster)
          const cachedUser = authService.getUser();
          if (cachedUser) {
            setUser(cachedUser);
            setIsAuthenticated(true);
            setLoading(false);
            
            // Then verify token in background and update if needed
            try {
              const userData = await authService.getCurrentUser();
              setUser(userData);
            } catch (error) {
              // If verification fails, clear everything
              console.error('Token verification failed:', error);
              authService.clearTokens();
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // No cached user, fetch from API
            const userData = await authService.getCurrentUser();
            setUser(userData);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        authService.clearTokens();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const response = await authService.login(username, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      authService.clearTokens();
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  }, []);

  const hasRole = useCallback((roles) => {
    if (!user || !user.role) return false;
    
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
    
    if (Array.isArray(roles)) {
      return roles.some(role => 
        role === userRoleId || 
        role === userRoleName ||
        normalizeRoleName(role) === normalizeRoleName(userRoleId) ||
        normalizeRoleName(role) === normalizeRoleName(userRoleName)
      );
    }
    
    return roles === userRoleId || 
           roles === userRoleName ||
           normalizeRoleName(roles) === normalizeRoleName(userRoleId) ||
           normalizeRoleName(roles) === normalizeRoleName(userRoleName);
  }, [user]);

  // Helper function to normalize role names for comparison
  const normalizeRoleName = (roleName) => {
    if (!roleName) return '';
    return roleName.toLowerCase().replace(/\s+/g, '_');
  };

  const hasPermission = useCallback((resource, action) => {
    if (!user || !user.role || !user.role.permissions) return false;
    const permissions = user.role.permissions[resource] || [];
    return permissions.includes(action) || permissions.includes('*');
  }, [user]);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
