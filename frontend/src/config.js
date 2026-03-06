/**
 * Central configuration for API and WebSocket URLs.
 * Consolidates all environment variables and provides a single source of truth.
 */

// API Base URL - Priority: Env variable > Fallback Cloud ALB > Local fallback
let API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://access-alb16-o81zyqqut8kx-538769711.ap-south-1.elb.amazonaws.com";

// WebSocket URL - Priority: Env variable > API_BASE_URL fallback
let WS_URL = process.env.REACT_APP_WS_URL || API_BASE_URL;

// Export constants
export const API_BASE = API_BASE_URL;
export const SOCKET_URL = WS_URL ;

// Debug log for configuration (useful for deployment troubleshooting)
if (process.env.NODE_ENV === 'development') {
  console.log('🌐 App Configuration:', {
    API_BASE,
    SOCKET_URL,
    env: process.env.REACT_APP_ENV || 'development'
  });
}

export default {
  API_BASE,
  SOCKET_URL
};
