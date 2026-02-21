/**
 * Subscription Management API Service
 * Handles subscription plans, feature access, and usage limits
 */

import api from './api';

/**
 * Subscription API Service
 */
export const subscriptionAPI = {
  /**
   * Get all available subscription plans
   * @returns {Promise} Response with available plans
   */
  getPlans: async () => {
    try {
      const response = await api.get('/api/subscriptions/plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  },

  /**
   * Get subscription status for an organization
   * @param {string} orgId - Organization ID
   * @returns {Promise} Response with subscription status
   */
  getOrganizationStatus: async (orgId) => {
    try {
      const response = await api.get(`/api/subscriptions/organization/${orgId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching organization subscription status:', error);
      throw error;
    }
  },

  /**
   * Upgrade organization subscription (Super Admin only)
   * @param {string} orgId - Organization ID
   * @param {string} subscriptionTier - New subscription tier
   * @returns {Promise} Response with upgrade result
   */
  upgradeOrganization: async (orgId, subscriptionTier) => {
    try {
      const response = await api.post(`/api/subscriptions/organization/${orgId}/upgrade`, {
        subscription_tier: subscriptionTier
      });
      return response.data;
    } catch (error) {
      console.error('Error upgrading organization subscription:', error);
      throw error;
    }
  },

  /**
   * Get accessible tabs for an organization
   * @param {string} orgId - Organization ID
   * @returns {Promise} Response with accessible tabs
   */
  getAccessibleTabs: async (orgId) => {
    try {
      const response = await api.get(`/api/subscriptions/organization/${orgId}/accessible-tabs`);
      return response.data;
    } catch (error) {
      console.error('Error fetching accessible tabs:', error);
      throw error;
    }
  },

  /**
   * Check feature access for current user's organization
   * @param {string} feature - Feature key to check
   * @returns {Promise} Response with access status
   */
  checkFeatureAccess: async (feature) => {
    try {
      const response = await api.post('/api/subscriptions/features/check', {
        feature
      });
      return response.data;
    } catch (error) {
      console.error('Error checking feature access:', error);
      throw error;
    }
  },

  /**
   * Get usage summary for current user's organization
   * @returns {Promise} Response with usage summary
   */
  getUsageSummary: async () => {
    try {
      const response = await api.get('/api/subscriptions/usage-summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching usage summary:', error);
      throw error;
    }
  }
};

export default subscriptionAPI;
