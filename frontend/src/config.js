/**
 * Central configuration for API and WebSocket URLs.
 * Consolidates all environment variables and provides a single source of truth.
 */

const DEFAULT_PROD_API = 'https://202-53-72-149.sslip.io';

// Prefer explicit env var. Fall back to local backend for dev and hosted API for production.
let API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_PROD_API;

let WS_URL = API_BASE_URL;

export const API_BASE = API_BASE_URL;
export const SOCKET_URL = WS_URL ;

if (process.env.NODE_ENV === 'development') {
  console.log('--- Dev Environment Configuration ---');
  console.log('API Base URL:', API_BASE);
  console.log('Socket URL:', SOCKET_URL);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('-------------------------------------');
}

const config = {
  API_BASE,
  SOCKET_URL
};

export default config;
