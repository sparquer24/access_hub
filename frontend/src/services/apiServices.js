/**
 * AccessHub API Services
 * Comprehensive API service layer for all AccessHub backend endpoints
 * 
 * This file contains ALL API endpoints organized by feature area.
 * Each service uses the centralized axios instance with automatic
 * token refresh and error handling.
 */

import api from './api';
import { organizationsService } from './organizationsService';

// =======================
// 🔹 Authentication APIs
// =======================
export const authAPI = {
  login: (payload) => api.post('/api/v2/auth/login', payload),
  logout: () => api.post('/api/v2/auth/logout'),
  register: (payload) => api.post('/api/v2/auth/register', payload),
  refresh: () => api.post('/api/v2/auth/refresh'),
  getCurrentUser: () => api.get('/api/v2/auth/me'),
  changePassword: (payload) => api.post('/api/v2/auth/change-password', payload),
  forgotPassword: (payload) => api.post('/api/v2/auth/forgot-password', payload),
};

// =======================
// 🔹 Users APIs
// =======================
export const usersAPI = {
  // List all users (with optional filters)
  list: (params) => api.get('/api/users', { params }),

  // Get single user by ID
  getById: (userId) => api.get(`/api/users/${userId}`),

  // Create new user
  create: (payload) => api.post('/api/users', payload),

  // Update user details
  update: (userId, payload) => api.put(`/api/users/${userId}`, payload),

  // Partially update user
  patch: (userId, payload) => api.patch(`/api/users/${userId}`, payload),

  // Delete user
  delete: (userId) => api.delete(`/api/users/${userId}`),

  // Change user password (admin)
  changePassword: (userId, payload) => api.patch(`/api/users/${userId}/password`, payload),

  // Activate/deactivate user
  toggleStatus: (userId) => api.patch(`/api/users/${userId}/status`),

  // Get user permissions
  getPermissions: (userId) => api.get(`/api/users/${userId}/permissions`),
};

// =======================
// 🔹 Roles & Permissions APIs
// =======================
export const rolesAPI = {
  // List all roles
  list: () => api.get('/api/roles'),

  // Get single role by ID
  getById: (roleId) => api.get(`/api/roles/${roleId}`),

  // Create new role
  create: (payload) => api.post('/api/roles', payload),

  // Update role
  update: (roleId, payload) => api.put(`/api/roles/${roleId}`, payload),

  // Delete role
  delete: (roleId) => api.delete(`/api/roles/${roleId}`),

  // Get role permissions
  getPermissions: (roleId) => api.get(`/api/roles/${roleId}/permissions`),

  // Update role permissions
  updatePermissions: (roleId, payload) => api.put(`/api/roles/${roleId}/permissions`, payload),
};

export const permissionsAPI = {
  // List all permissions
  list: () => api.get('/api/permissions'),

  // Get permissions by module
  getByModule: (module) => api.get(`/api/permissions/module/${module}`),
};

// =======================
// 🔹 Applications APIs (Visitor Applications)
// =======================
export const applicationsAPI = {
  // List applications with filters
  list: (params) => api.get('/api/applications', { params }),

  // Get single application by ID
  getById: (applicationId) => api.get(`/api/applications/${applicationId}`),

  // Create new application
  create: (payload) => api.post('/api/applications', payload),

  // Update application
  update: (applicationId, payload) => api.put(`/api/applications/${applicationId}`, payload),

  // Delete application
  delete: (applicationId) => api.delete(`/api/applications/${applicationId}`),

  // Application workflow actions
  submit: (applicationId) => api.post(`/api/applications/${applicationId}/submit`),
  approve: (applicationId, payload) => api.post(`/api/applications/${applicationId}/approve`, payload),
  reject: (applicationId, payload) => api.post(`/api/applications/${applicationId}/reject`, payload),
  forward: (applicationId, payload) => api.post(`/api/applications/${applicationId}/forward`, payload),

  // Get application history/audit trail
  getHistory: (applicationId) => api.get(`/api/applications/${applicationId}/history`),

  // Get applications by status
  getByStatus: (status, params) => api.get(`/api/applications/status/${status}`, { params }),

  // Bulk operations
  bulkApprove: (payload) => api.post('/api/applications/bulk/approve', payload),
  bulkReject: (payload) => api.post('/api/applications/bulk/reject', payload),
};

// =======================
// 🔹 QR Code APIs
// =======================
export const qrAPI = {
  // Generate QR code for application
  generate: (applicationId) => api.post(`/api/qr/generate/${applicationId}`),

  // Get QR code details
  getByCode: (qrCode) => api.get(`/api/qr/${qrCode}`),

  // Verify QR code (public endpoint - no auth required)
  verify: (qrCode) => api.get(`/api/qr/verify/${qrCode}`),

  // Invalidate QR code
  invalidate: (qrCode) => api.post(`/api/qr/${qrCode}/invalidate`),

  // Get QR codes for application
  getByApplication: (applicationId) => api.get(`/api/applications/${applicationId}/qr`),

  // Regenerate QR code
  regenerate: (applicationId) => api.post(`/api/qr/regenerate/${applicationId}`),
};

// =======================
// 🔹 Biometrics APIs
// =======================
export const biometricsAPI = {
  // Upload biometric data (fingerprint, face, etc.)
  upload: (applicationId, formData) =>
    api.post(`/api/biometrics/${applicationId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Get biometric data for visitor
  get: (visitorId) => api.get(`/api/biometrics/${visitorId}`),

  // Verify biometric data
  verify: (formData) =>
    api.post('/api/biometrics/verify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Delete biometric data
  delete: (biometricId) => api.delete(`/api/biometrics/${biometricId}`),

  // Generate face embeddings
  generateEmbeddings: (formData) =>
    api.post('/api/biometrics/embeddings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// =======================
// 🔹 CCTV & Camera APIs
// =======================
export const cctvAPI = {
  // List all cameras
  listCameras: () => api.get('/api/cctv/cameras'),

  // Get camera by ID
  getCamera: (cameraId) => api.get(`/api/cctv/cameras/${cameraId}`),

  // Add new camera
  addCamera: (payload) => api.post('/api/cctv/cameras', payload),

  // Update camera
  updateCamera: (cameraId, payload) => api.put(`/api/cctv/cameras/${cameraId}`, payload),

  // Delete camera
  deleteCamera: (cameraId) => api.delete(`/api/cctv/cameras/${cameraId}`),

  // Get camera stream URL
  getStream: (cameraId) => api.get(`/api/cctv/cameras/${cameraId}/stream`),

  // Get camera snapshot
  getSnapshot: (cameraId) => api.get(`/api/cctv/cameras/${cameraId}/snapshot`),

  // Get recordings
  getRecordings: (cameraId, params) => api.get(`/api/cctv/cameras/${cameraId}/recordings`, { params }),
};

// =======================
// 🔹 Check-In/Check-Out APIs
// =======================
export const checkInOutAPI = {
  // Visitor check-in
  checkIn: (payload) => api.post('/api/checkin', payload),

  // Visitor check-out
  checkOut: (visitorId) => api.post(`/api/checkout/${visitorId}`),

  // Get current visitors (checked in)
  getCurrentVisitors: (params) => api.get('/api/visitors/current', { params }),

  // Get visitor check-in/out history
  getHistory: (visitorId, params) => api.get(`/api/visitors/${visitorId}/history`, { params }),

  // Bulk check-in
  bulkCheckIn: (payload) => api.post('/api/checkin/bulk', payload),

  // Bulk check-out
  bulkCheckOut: (payload) => api.post('/api/checkout/bulk', payload),

  // Get check-in/out logs
  getLogs: (params) => api.get('/api/checkin/logs', { params }),
};

// =======================
// 🔹 Organizations APIs (v2)
// =======================
// Use the dedicated organizationsService for v2 endpoints
export const organizationsAPI = organizationsService;

// =======================
// 🔹 Departments APIs
// =======================
export const departmentsAPI = {
  // List all departments
  list: (params) => api.get('/api/departments', { params }),

  // Get department by ID
  getById: (deptId) => api.get(`/api/departments/${deptId}`),

  // Create department
  create: (payload) => api.post('/api/departments', payload),

  // Update department
  update: (deptId, payload) => api.put(`/api/departments/${deptId}`, payload),

  // Delete department
  delete: (deptId) => api.delete(`/api/departments/${deptId}`),

  // Get department users
  getUsers: (deptId) => api.get(`/api/departments/${deptId}/users`),
};

// =======================
// 🔹 Visitors APIs (Legacy & New)
// =======================
export const visitorsAPI = {
  // Search/suggest visitors by query
  suggest: (q) => api.get(`/api/visitors/suggest?q=${encodeURIComponent(q)}`),

  // Get visitor by Aadhaar (legacy)
  get: (aadhaar) => api.get(`/api/visitors/${aadhaar}`),

  // List all visitors
  list: (params) => api.get('/api/visitors', { params }),

  // Get visitor by ID
  getById: (visitorId) => api.get(`/api/visitors/${visitorId}`),

  // Create/update visitor
  upsert: (payload) => api.post('/api/visitors', payload),

  // Upload visitor photo
  uploadPhoto: (aadhaar, angle, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/api/visitors/${aadhaar}/photos/${angle}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Generate face embeddings
  generateEmbeddings: (aadhaar, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/api/visitors/${aadhaar}/embeddings`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Get visitor preview
  preview: (aadhaar) => api.get(`/api/visitors/${aadhaar}/preview`),

  // Get visitor applications
  getApplications: (visitorId) => api.get(`/api/visitors/${visitorId}/applications`),
};

// =======================
// 🔹 Analytics & Statistics APIs
// =======================
export const analyticsAPI = {
  // Dashboard overview stats
  overview: () => api.get('/api/stats/overview'),

  // Visitor count
  visitorCount: () => api.get('/api/stats/visitors/count'),

  // Visitor trends
  visitorTrends: (params) => api.get('/api/stats/visitors/trends', { params }),

  // Application stats
  applicationStats: () => api.get('/api/stats/applications'),

  // Check-in/out stats
  checkInStats: (params) => api.get('/api/stats/checkin', { params }),

  // Peak hours analysis
  peakHours: (params) => api.get('/api/stats/peak-hours', { params }),

  // Department-wise stats
  departmentStats: () => api.get('/api/stats/departments'),

  // Organization-wise stats
  organizationStats: () => api.get('/api/stats/organizations'),

  // Custom reports
  customReport: (payload) => api.post('/api/stats/custom-report', payload),
};

// =======================
// 🔹 Audit Logs APIs
// =======================
export const auditAPI = {
  // List audit logs with filters
  list: (params) => api.get('/api/audit/logs', { params }),

  // Get audit log by ID
  getById: (logId) => api.get(`/api/audit/logs/${logId}`),

  // Get audit logs for entity
  getByEntity: (entityType, entityId, params) =>
    api.get(`/api/audit/${entityType}/${entityId}`, { params }),

  // Get user activity logs
  getUserActivity: (userId, params) =>
    api.get(`/api/audit/users/${userId}/activity`, { params }),

  // Export audit logs
  export: (params) => api.get('/api/audit/export', { params, responseType: 'blob' }),
};

// =======================
// 🔹 Notifications APIs
// =======================
export const notificationsAPI = {
  // List user notifications
  list: (params) => api.get('/api/notifications', { params }),

  // Get unread count
  getUnreadCount: () => api.get('/api/notifications/unread/count'),

  // Mark as read
  markAsRead: (notificationId) => api.patch(`/api/notifications/${notificationId}/read`),

  // Mark all as read
  markAllAsRead: () => api.patch('/api/notifications/read-all'),

  // Delete notification
  delete: (notificationId) => api.delete(`/api/notifications/${notificationId}`),

  // Get notification preferences
  getPreferences: () => api.get('/api/notifications/preferences'),

  // Update notification preferences
  updatePreferences: (payload) => api.put('/api/notifications/preferences', payload),
};

// =======================
// 🔹 Settings APIs
// =======================
export const settingsAPI = {
  // Get system settings
  getSystem: () => api.get('/api/settings/system'),

  // Update system settings
  updateSystem: (payload) => api.put('/api/settings/system', payload),

  // Get application settings
  getApplication: () => api.get('/api/settings/application'),

  // Update application settings
  updateApplication: (payload) => api.put('/api/settings/application', payload),

  // Get user preferences
  getUserPreferences: () => api.get('/api/settings/preferences'),

  // Update user preferences
  updateUserPreferences: (payload) => api.put('/api/settings/preferences', payload),
};

// =======================
// 🔹 File Upload APIs
// =======================
export const uploadAPI = {
  // Upload single file
  uploadFile: (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
    return api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Upload multiple files
  uploadFiles: (files, metadata = {}) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
    return api.post('/api/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Delete file
  deleteFile: (fileId) => api.delete(`/api/upload/${fileId}`),

  // Get file URL
  getFileUrl: (fileId) => `${api.defaults.baseURL}/uploads/${fileId}`,
};

// =======================
// 🔹 Meta/Reference Data APIs
// =======================
export const metaAPI = {
  // Get floors
  floors: () => api.get('/api/meta/floors'),

  // Get towers
  towers: () => api.get('/api/meta/towers'),

  // Get visit purposes
  visitPurposes: () => api.get('/api/meta/visit-purposes'),

  // Get visitor types
  visitorTypes: () => api.get('/api/meta/visitor-types'),

  // Get countries
  countries: () => api.get('/api/meta/countries'),

  // Get states
  states: (countryId) => api.get(`/api/meta/countries/${countryId}/states`),

  // Get cities
  cities: (stateId) => api.get(`/api/meta/states/${stateId}/cities`),
};

// =======================
// 🔹 Reports APIs
// =======================
export const reportsAPI = {
  // Generate visitor report
  visitorReport: (params) => api.post('/api/reports/visitors', params, { responseType: 'blob' }),

  // Generate application report
  applicationReport: (params) => api.post('/api/reports/applications', params, { responseType: 'blob' }),

  // Generate check-in/out report
  checkInOutReport: (params) => api.post('/api/reports/checkin-checkout', params, { responseType: 'blob' }),

  // Generate audit report
  auditReport: (params) => api.post('/api/reports/audit', params, { responseType: 'blob' }),

  // Generate custom report
  customReport: (params) => api.post('/api/reports/custom', params, { responseType: 'blob' }),

  // List available reports
  listReports: () => api.get('/api/reports'),

  // Schedule report
  scheduleReport: (payload) => api.post('/api/reports/schedule', payload),

  // Get scheduled reports
  getScheduledReports: () => api.get('/api/reports/scheduled'),
};

// =======================
// 🔹 Health Check API
// =======================
export const healthAPI = {
  check: () => api.get('/api/health'),
};

// =======================
// 🔹 Attendance APIs (v2)
// =======================
export const attendanceAPI = {
  // Check-in
  checkIn: (payload) => api.post('/api/v2/attendance/check-in', payload),

  // Check-out
  checkOut: (payload) => api.post('/api/v2/attendance/check-out', payload),

  // List attendance records
  list: (params) => api.get('/api/v2/attendance', { params }),

  // Get attendance by ID
  getById: (id) => api.get(`/api/v2/attendance/${id}`),

  // Update attendance
  update: (id, payload) => api.put(`/api/v2/attendance/${id}`, payload),

  // Delete attendance
  delete: (id) => api.delete(`/api/v2/attendance/${id}`),

  // Approve attendance
  approve: (id, payload) => api.post(`/api/v2/attendance/${id}/approve`, payload),
};


// Export all services as default
const apiServices = {
  auth: authAPI,
  users: usersAPI,
  roles: rolesAPI,
  permissions: permissionsAPI,
  applications: applicationsAPI,
  qr: qrAPI,
  biometrics: biometricsAPI,
  cctv: cctvAPI,
  checkInOut: checkInOutAPI,
  organizations: organizationsService, // v2 Organizations API
  departments: departmentsAPI,
  visitors: visitorsAPI,
  analytics: analyticsAPI,
  audit: auditAPI,
  notifications: notificationsAPI,
  settings: settingsAPI,
  upload: uploadAPI,
  meta: metaAPI,
  reports: reportsAPI,
  health: healthAPI,
  attendance: attendanceAPI,
};

export default apiServices;
