/**
 * Subscription Context
 * Manages subscription state, feature access, and usage limits
 */
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { subscriptionAPI } from '../services/subscriptionService';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availablePlans, setAvailablePlans] = useState([]);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user?.organization_id) return;

    try {
      setLoading(true);
      const response = await subscriptionAPI.getOrganizationStatus(user.organization_id);
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setSubscriptionStatus(null);
    } finally {
      setLoading(false);
    }
  }, [user?.organization_id]);

  const fetchAvailablePlans = useCallback(async () => {
    try {
      const response = await subscriptionAPI.getPlans();
      setAvailablePlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching available plans:', error);
      setAvailablePlans([]);
    }
  }, []);

  // Fetch subscription status when user changes
  useEffect(() => {
    if (isAuthenticated && user?.organization_id) {
      fetchSubscriptionStatus();
      fetchAvailablePlans();
    } else {
      setSubscriptionStatus(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.organization_id, fetchSubscriptionStatus, fetchAvailablePlans]);

  // Check if organization has access to a specific feature
  const hasFeature = useCallback((feature) => {
    if (!subscriptionStatus) return false;
    return subscriptionStatus.features.includes(feature);
  }, [subscriptionStatus]);

  // Check if usage limit is exceeded
  const isLimitExceeded = useCallback((limitKey) => {
    if (!subscriptionStatus) return false;
    
    const current = subscriptionStatus.current_usage[limitKey] || 0;
    const limit = subscriptionStatus.limits[limitKey];
    
    if (limit === -1) return false; // Unlimited
    return current >= limit;
  }, [subscriptionStatus]);

  // Get usage percentage for a limit
  const getUsagePercentage = useCallback((limitKey) => {
    if (!subscriptionStatus) return 0;
    
    const percentage = subscriptionStatus.usage_percentages[limitKey] || 0;
    return Math.min(percentage, 100);
  }, [subscriptionStatus]);

  // Check if user is approaching a limit (80% threshold)
  const isNearLimit = useCallback((limitKey) => {
    const percentage = getUsagePercentage(limitKey);
    return percentage >= 80;
  }, [getUsagePercentage]);

  // Get accessible tabs based on subscription
  const getAccessibleTabs = useCallback(async () => {
    if (!user?.organization_id) return [];

    try {
      const response = await subscriptionAPI.getAccessibleTabs(user.organization_id);
      return response.data.accessible_tabs;
    } catch (error) {
      console.error('Error fetching accessible tabs:', error);
      return ['info']; // Default to info tab only
    }
  }, [user?.organization_id]);

  // Get current plan details
  const getCurrentPlan = useCallback(() => {
    if (!subscriptionStatus || !availablePlans.length) return null;
    
    return availablePlans.find(plan => plan.tier === subscriptionStatus.subscription_tier);
  }, [subscriptionStatus, availablePlans]);

  // Get upgrade options (plans above current tier)
  const getUpgradeOptions = useCallback(() => {
    const currentPlan = getCurrentPlan();
    if (!currentPlan) return availablePlans;

    const planOrder = ['free', 'starter', 'professional', 'enterprise'];
    const currentIndex = planOrder.indexOf(currentPlan.tier);
    
    return availablePlans.filter(plan => {
      const planIndex = planOrder.indexOf(plan.tier);
      return planIndex > currentIndex;
    });
  }, [getCurrentPlan, availablePlans]);

  // Check if a specific tab should be accessible
  const isTabAccessible = useCallback((tabName) => {
    const featureTabMapping = {
      'visitors': 'visitor_management',
      'statistics': ['visitor_analytics', 'advanced_analytics'],
      'employees': 'employee_management',
      'departments': 'department_management',
      'cameras': 'camera_integration',
      'shifts': 'shift_management',
      'alerts': 'alerts_management',
      'info': null, // Always accessible
      'rules': null // Always accessible (basic settings)
    };

    const requiredFeatures = featureTabMapping[tabName];
    
    // Always allow info and rules tabs
    if (!requiredFeatures) return true;
    
    // Handle multiple features for a tab
    if (Array.isArray(requiredFeatures)) {
      return requiredFeatures.some(feature => hasFeature(feature));
    }
    
    return hasFeature(requiredFeatures);
  }, [hasFeature]);

  // Get limitation message for a feature/limit
  const getLimitationMessage = useCallback((limitKey) => {
    if (!subscriptionStatus) return null;

    const current = subscriptionStatus.current_usage[limitKey] || 0;
    const limit = subscriptionStatus.limits[limitKey];
    const percentage = getUsagePercentage(limitKey);

    if (limit === -1) return null; // Unlimited

    if (percentage >= 100) {
      return {
        type: 'exceeded',
        message: `You've reached your ${limitKey.replace('_', ' ')} limit (${current}/${limit})`,
        action: 'Upgrade your plan to continue'
      };
    }

    if (percentage >= 80) {
      return {
        type: 'warning',
        message: `You're approaching your ${limitKey.replace('_', ' ')} limit (${current}/${limit})`,
        action: 'Consider upgrading your plan'
      };
    }

    return null;
  }, [subscriptionStatus, getUsagePercentage]);

  const value = {
    // State
    subscriptionStatus,
    loading,
    availablePlans,
    
    // Actions
    fetchSubscriptionStatus,
    fetchAvailablePlans,
    
    // Feature checks
    hasFeature,
    isTabAccessible,
    
    // Limit checks
    isLimitExceeded,
    isNearLimit,
    getUsagePercentage,
    getLimitationMessage,
    
    // Plan helpers
    getCurrentPlan,
    getUpgradeOptions,
    getAccessibleTabs,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Custom hook to use subscription context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;
