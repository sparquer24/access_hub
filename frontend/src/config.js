/**
 * Central configuration for API and WebSocket URLs.
 * Consolidates all environment variables and provides a single source of truth.
 */

let API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://access-alb16-o81zyqqut8kx-538769711.ap-south-1.elb.amazonaws.com";

let WS_URL = API_BASE_URL;

export const API_BASE = API_BASE_URL;
export const SOCKET_URL = WS_URL ;


export default {
  API_BASE,
  SOCKET_URL
};
