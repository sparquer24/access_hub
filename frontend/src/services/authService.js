
import { authAPI } from './api';
import { tokenUtils } from '../utils/tokenUtils';

class AuthService {
  // Token management delegates to tokenUtils
  setAccessToken(token) {
    tokenUtils.setAccessToken(token);
  }

  getAccessToken() {
    return tokenUtils.getAccessToken();
  }

  setRefreshToken(token) {
    tokenUtils.setRefreshToken(token);
  }

  getRefreshToken() {
    return tokenUtils.getRefreshToken();
  }

  setUser(user) {
    tokenUtils.setUser(user);
  }

  getUser() {
    return tokenUtils.getUser();
  }

  clearTokens() {
    tokenUtils.clearTokens();
  }

  // Auth API methods
  async login(username, password) {
    try {
      const response = await authAPI.login({
        username,
        password,
      });

      if (response.data.success) {
        const { access_token, refresh_token, user } = response.data.data;
        this.setAccessToken(access_token);
        this.setRefreshToken(refresh_token);
        this.setUser(user);

        return response.data.data;
      }

      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    }
  }

  async logout() {
    try {
      await authAPI.logout();
    } catch (error) {
      // ignore
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authAPI.refreshToken(refreshToken);

      if (response.data.success) {
        const { access_token, refresh_token } = response.data.data;
        this.setAccessToken(access_token);
        if (refresh_token) {
          this.setRefreshToken(refresh_token);
        }
        return response.data.data;
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await authAPI.getCurrentUser();

      if (response.data.success) {
        const user = response.data.data.user;
        this.setUser(user);
        return user;
      }

      throw new Error('Failed to get user');
    } catch (error) {
      throw error;
    }
  }

  async changePassword(oldPassword, newPassword) {
    try {
      const response = await authAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      throw new Error(message);
    }
  }

  async forgotPassword(email) {
    try {
      const response = await authAPI.forgotPassword({
        email,
      });

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      throw new Error(message);
    }
  }

  isAuthenticated() {
    return tokenUtils.isAuthenticated();
  }

  getUserRole() {
    const user = this.getUser();
    return user?.role?.id || user?.role?.name || null;
  }

  hasRole(roles) {
    const user = this.getUser();
    if (!user || !user.role) return false;

    const userRoleId = user.role.id;
    const userRoleName = user.role.name;

    if (Array.isArray(roles)) {
      return roles.some(role => role === userRoleId || role === userRoleName);
    }
    return userRoleId === roles || userRoleName === roles;
  }
}

export const authService = new AuthService();
export default authService;
