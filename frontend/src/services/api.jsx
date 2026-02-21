// Get current user info

import axios from "axios";
import io from "socket.io-client";
import { tokenUtils } from "../utils/tokenUtils";

export const profileAPI = {
  me: () => api.get('/api/me'),
};

// Base URL for API calls
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

// DEBUG: Log the API URL being used
console.log('🌐 API Configuration:');
console.log('  REACT_APP_API_BASE_URL from env:', process.env.REACT_APP_API_BASE_URL);
console.log('  Final API_BASE_URL:', API_BASE_URL);
console.log('  All REACT_APP_ vars:', Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')));

// Export this so components can prefix image URLs coming from the backend
export const API_BASE = API_BASE_URL;


// Axios instance - JWT-based APIs don't need credentials (cookies/sessions)
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // JWT doesn't need cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach Authorization header
api.interceptors.request.use(
  (config) => {
    try {
      // Use tokenUtils to get token (it handles the correct key internally)
      const token = tokenUtils.getAccessToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error attaching token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenUtils.getRefreshToken();
        if (refreshToken) {
          // Call refresh endpoint
          const response = await axios.post(
            `${API_BASE_URL}/api/v2/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );

          if (response.data.success) {
            const { access_token, refresh_token } = response.data.data;
            tokenUtils.setAccessToken(access_token);
            if (refresh_token) {
              tokenUtils.setRefreshToken(refresh_token);
            }

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        // Clear all possible token keys (both old and new formats)
        tokenUtils.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data?.message);
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data?.message);
    }

    return Promise.reject(error);
  }
);

export const statsAPI = {
  visitorCount: () => api.get('/api/stats/visitors/count'), // returns { count: number }
  overview: () => api.get('/api/stats/overview'), // returns comprehensive stats overview
  organizationAnalytics: (organizationId) => {
    // If organizationId is provided, fetch stats for that organization
    // Otherwise, fetch overall stats
    const params = organizationId ? { organization_id: organizationId } : {};
    return api.get('/api/stats/organization-analytics', { params });
  },
};

// Socket: include token in `auth` payload so backend can accept Bearer JWTs
const socketAuth = {};
const _tok = tokenUtils.getAccessToken();
if (_tok) socketAuth.token = _tok;

export const socket = io(`${API_BASE_URL}/stats`, {
  autoConnect: false,
  withCredentials: false, // JWT doesn't need cookies
  auth: socketAuth,
});

// =======================
// 🔹 Auth APIs
// =======================
// Use the new v2 auth endpoints which return JWTs. Legacy `/api/login`
// authenticates against `UserDetails` (legacy model) and will fail if
// only v2 `User` records are seeded.
export const authAPI = {
  login: (payload) => api.post("/api/v2/auth/login", payload),
  logout: () => api.post("/api/v2/auth/logout"),
  register: (registerData) => api.post("/api/v2/auth/register", registerData),
  refreshToken: (token) => {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    return api.post("/api/v2/auth/refresh", {}, config);
  },
  getCurrentUser: () => api.get("/api/v2/auth/me"),
  changePassword: (payload) => api.post("/api/v2/auth/change-password", payload),
  forgotPassword: (payload) => api.post("/api/v2/auth/forgot-password", payload),
};

// =======================
// 🔹 CSRF API (Legacy Support)
// =======================
// JWT-based auth doesn't need CSRF tokens, but we keep this for backward compatibility
// with existing code that calls csrfAPI.fetchToken()
export const csrfAPI = {
  fetchToken: () => Promise.resolve(), // No-op for JWT auth
};

// =======================
// 🔹 Users APIs (Admin)
// =======================
export const usersAPI = {
  // create new user
  create: (payload) => api.post("/api/users", payload),

  // list all users
  list: () => api.get("/api/users"),

  // update user details
  update: (id, data) => api.put(`/api/users/${id}`, data),

  // change user password
  changePassword: (id, data) => api.patch(`/api/users/${id}/password`, data),
};

// =======================
// 🔹 Optional legacy endpoints
// =======================
export const mainAPI = {
  home: (aadharData) => api.post("/home", aadharData),
  captureVideo: (videoFile) => {
    const formData = new FormData();
    formData.append("video", videoFile);
    return api.post("/capture_video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getCSRFToken: () => api.get("/get-csrf-token"),
};

export const visitorsAPI = {
  suggest: (q) => api.get(`/api/visitors/suggest?q=${encodeURIComponent(q)}`),
  get: (aadhaar) => api.get(`/api/visitors/${aadhaar}`),             // returns {exists, visitor, images}
  uploadPhoto: (aadhaar, angle, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(`/api/visitors/${aadhaar}/photos/${angle}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  generateEmbeddings: (aadhaar, file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post(`/api/visitors/${aadhaar}/embeddings`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  upsert: (payload) => api.post(`/api/visitors`, payload),
  preview: (aadhaar) => api.get(`/api/visitors/${aadhaar}/preview`),
  floors: () => api.get(`/api/meta/floors`),
  towers: () => api.get(`/api/meta/towers`),
};

export default api;
