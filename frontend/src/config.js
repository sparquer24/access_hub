/**
 * Central configuration for API and WebSocket URLs.
 * Consolidates all environment variables and provides a single source of truth.
 */

const IS_DEV = process.env.NODE_ENV !== 'production';
const DEFAULT_DEV_API = 'http://localhost:5001';
const DEFAULT_PROD_API = 'http://api.accesshub.sparquer.ai';

// Prefer explicit env var. Fall back to local backend for dev and hosted API for production.
let API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (IS_DEV ? DEFAULT_DEV_API : DEFAULT_PROD_API);

let WS_URL = API_BASE_URL;

export const API_BASE = API_BASE_URL;
export const SOCKET_URL = WS_URL ;

console.log('--- Dev Environment Configuration ---');
console.log('API Base URL:', API_BASE);
console.log('Socket URL:', SOCKET_URL);
console.log('Environment:', process.env.NODE_ENV);
console.log('-------------------------------------');


export default {
  API_BASE,
  SOCKET_URL
};
