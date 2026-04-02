/**
 * Organizations API Service (v2)
 * Complete integration with /api/v2/organizations endpoints
 * 
 * All endpoints require proper authentication token and permissions:
 * - organizations:create
 * - organizations:read
 * - organizations:update
 * - organizations:delete
 */


import api from './api';
import logger from '../utils/logger';

/**
 * Organization Types
 * @enum {string}
 */
export const ORGANIZATION_TYPES = {
  SCHOOL: 'school',
  OFFICE: 'office',
  APARTMENT: 'apartment',
  HOME: 'home',
};

/**
 * Subscription Tiers
 * @enum {string}
 */
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
};

/**
 * Organizations API Service
 */
export const organizationsService = {
  /**
   * List all organizations with pagination and filters
   * 
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number (starts from 1)
   * @param {number} [params.per_page=20] - Items per page (max: 100)
   * @param {string} [params.search] - Search by name or code
   * @param {string} [params.organization_type] - Filter by type (school, office, apartment, home)
   * @param {boolean} [params.is_active] - Filter by active status
   * 
   * @returns {Promise} Response with { success, data: { items, pagination }, message }
   * 
   * Response structure:
   * {
   *   success: true,
   *   data: {
   *     items: [...organizations],
   *     pagination: { page, per_page, total_items, total_pages, has_next, has_prev }
   *   },
   *   message: "Success"
   * }
   * 
   * @example
   * // Get all organizations
   * const response = await organizationsService.list();
   * const organizations = response.data.items;
   * const { total_items, page } = response.data.pagination;
   * 
   * @example
   * // Get active offices, page 2
   * const response = await organizationsService.list({
   *   page: 2,
   *   per_page: 10,
   *   organization_type: 'office',
   *   is_active: true
   * });
   * 
   * @example
   * // Search organizations
   * const response = await organizationsService.list({ search: 'Acme' });
   */
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/v2/organizations', { params });
      return response.data;
    } catch (error) {
      logger.error('Error listing organizations:', error);
      throw error;
    }
  },

  /**
   * Get single organization by ID
   * 
   * @param {string} orgId - Organization UUID
   * @returns {Promise} Response with { success, data: { organization }, message }
   * 
   * @example
   * const response = await organizationsService.getById('uuid-here');
   * const organization = response.data; // The organization object itself
   */
  getById: async (orgId) => {
    try {
      const response = await api.get(`/api/v2/organizations/${orgId}`);
      // Backend may return stats envelope: { success, data: { organization: {...}, employees_count, ... }, message }
      // Normalize to keep backward compatibility: ensure `response.data.data` is the organization object
      const envelope = response.data;
      const payload = envelope.data || envelope;

      if (payload && payload.organization) {
        // Merge organization fields with top-level counts
        const org = payload.organization;
        const merged = {
          ...org,
          employees_count: payload.employees_count || 0,
          cameras_count: payload.cameras_count || 0,
          locations_count: payload.locations_count || 0,
          departments_count: payload.departments_count || 0,
        };
        envelope.data = merged;
      }

      return envelope;
    } catch (error) {
      logger.error(`Error getting organization ${orgId}:`, error);
      throw error;
    }
  },

  /**
   * Create new organization
   * 
   * @param {Object} payload - Organization data
   * @param {string} payload.name - Organization name (2-255 chars) - REQUIRED
   * @param {string} payload.code - Unique organization code (2-50 chars) - REQUIRED
   * @param {string} [payload.address] - Physical address
   * @param {string} [payload.contact_email] - Contact email
   * @param {string} [payload.contact_phone] - Contact phone number
   * @param {string} [payload.organization_type='office'] - Type: school|office|apartment|home
   * @param {string} [payload.timezone='Asia/Kolkata'] - Timezone
   * @param {Object} [payload.working_hours] - Working hours configuration
   * @param {string} [payload.working_hours.start='09:00'] - Start time
   * @param {string} [payload.working_hours.end='18:00'] - End time
   * @param {number[]} [payload.working_hours.days=[1,2,3,4,5]] - Working days (1=Mon, 7=Sun)
   * @param {Object} [payload.settings={}] - Custom settings JSON
   * 
   * Note: is_active and subscription_tier are not supported on create.
   * Organizations are created as active by default. Use update() to modify these fields.
   * 
   * @returns {Promise} Response with { success, data: {...organization object}, message }
   * 
   * @example
   * const response = await organizationsService.create({
   *   name: 'Acme Corp',
   *   code: 'ACME001',
   *   organization_type: 'office',
   *   contact_email: 'contact@acme.com',
   *   working_hours: {
   *     start: '09:00',
   *     end: '17:00',
   *     days: [1, 2, 3, 4, 5]
   *   }
   * });
   * const newOrg = response.data; // The created organization object
   */
  create: async (payload) => {
    try {
      // Remove fields not supported by the create endpoint
      const { is_active, subscription_tier, ...createPayload } = payload;
      const response = await api.post('/api/v2/organizations', createPayload);
      return response.data;
    } catch (error) {
      logger.error('Error creating organization:', error);
      throw error;
    }
  },

  /**
   * Update organization
   * 
   * @param {string} orgId - Organization UUID
   * @param {Object} payload - Fields to update (all optional)
   * @param {string} [payload.name] - Organization name
   * @param {string} [payload.code] - Organization code
   * @param {string} [payload.address] - Address
   * @param {string} [payload.contact_email] - Contact email
   * @param {string} [payload.contact_phone] - Contact phone
   * @param {string} [payload.organization_type] - Type
   * @param {string} [payload.timezone] - Timezone
   * @param {Object} [payload.working_hours] - Working hours
   * @param {string} [payload.subscription_tier] - Subscription tier
   * @param {Object} [payload.settings] - Settings
   * @param {boolean} [payload.is_active] - Active status
   * 
   * @returns {Promise} Response with { success, data: {...organization object}, message }
   * 
   * @example
   * const response = await organizationsService.update('uuid-here', {
   *   name: 'Updated Name',
   *   contact_email: 'new@email.com'
   * });
   * const updated = response.data; // The updated organization object
   */
  update: async (orgId, payload) => {
    try {
      const response = await api.put(`/api/v2/organizations/${orgId}`, payload);
      return response.data;
    } catch (error) {
      logger.error(`Error updating organization ${orgId}:`, error);
      throw error;
    }
  },

  /**
   * Delete organization
   * 
   * @param {string} orgId - Organization UUID
   * @param {boolean} [hardDelete=false] - If true, permanently delete; otherwise soft delete
   * 
   * @returns {Promise} Response with { success, message }
   * 
   * @example
   * // Soft delete (default)
   * await organizationsService.delete('uuid-here');
   * 
   * @example
   * // Hard delete (permanent)
   * await organizationsService.delete('uuid-here', true);
   */
  delete: async (orgId, hardDelete = false) => {
    try {
      const response = await api.delete(`/api/v2/organizations/${orgId}`, {
        params: { hard_delete: hardDelete }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error deleting organization ${orgId}:`, error);
      throw error;
    }
  },

  /**
   * Get organization statistics
   * 
   * @param {string} orgId - Organization UUID
   * @returns {Promise} Response with { success, data: {...stats object}, message }
   * 
   * @example
   * const response = await organizationsService.getStats('uuid-here');
   * const stats = response.data; // { employee_count, camera_count, etc. }
   */
  getStats: async (orgId) => {
    try {
      const response = await api.get(`/api/v2/organizations/${orgId}/stats`);
      return response.data;
    } catch (error) {
      logger.error(`Error getting organization stats ${orgId}:`, error);
      throw error;
    }
  },

  /**
   * Get employee attendance summary for an organization
   * 
   * @param {string} orgId - Organization UUID
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.per_page=20] - Items per page
   * @param {string} [params.month] - Month in YYYY-MM format (defaults to current month)
   * @returns {Promise} Response with { success, data: { items, pagination, month }, message }
   * 
   * @example
   * const response = await organizationsService.getEmployeeAttendanceSummary('uuid-here', {
   *   month: '2026-01',
   *   per_page: 50
   * });
   * const attendanceData = response.data.items;
   */
  getEmployeeAttendanceSummary: async (orgId, params = {}) => {
    try {
      const response = await api.get(`/api/v2/organizations/${orgId}/employees/attendance-summary`, { params });
      return response.data;
    } catch (error) {
      logger.error(`Error getting employee attendance summary ${orgId}:`, error);
      throw error;
    }
  },

  /**
   * Get top performers - employees with perfect attendance and minimal leaves
   * 
   * @param {string} orgId - Organization UUID
   * @param {Object} params - Query parameters
   * @param {string} [params.month] - Month in YYYY-MM format (defaults to current month)
   * @param {number} [params.limit] - Maximum number of performers to return (default: 10)
   * @returns {Promise} Response with top performers data
   * 
   * @example
   * const response = await organizationsService.getTopPerformers('uuid-here', {
   *   month: '2026-01',
   *   limit: 10
   * });
   */
  /**
   * Get top performers - employees with perfect attendance and minimal leaves
   * 
   * @param {string} orgId - Organization UUID
   * @param {Object} params - Query parameters
   * @param {string} [params.month] - Month in YYYY-MM format (defaults to current month)
   * @param {number} [params.limit] - Maximum number of performers to return (default: 10)
   * @returns {Promise} Response with top performers data
   * 
   * @example
   * const response = await organizationsService.getTopPerformers('uuid-here', {
   *   month: '2026-01',
   *   limit: 10
   * });
   */
  getTopPerformers: async (orgId, params = {}) => {
    try {
      const response = await api.get(`/api/v2/organizations/${orgId}/employees/top-performers`, { params });
      return response.data;
    } catch (error) {
      logger.error(`Error getting top performers ${orgId}:`, error);
      throw error;
    }
  },

  /**
   * Get organization attendance statistics
   * 
   * @param {string} orgId - Organization UUID
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with attendance stats
   */
  getAttendanceStats: async (orgId, params = {}) => {
    try {
      const response = await api.get(`/api/v2/organizations/${orgId}/attendance/stats`, { params });
      return response.data;
    } catch (error) {
      logger.error(`Error getting attendance stats ${orgId}:`, error);
      throw error;
    }
  },

  /**
   * Get organization visitor statistics
   * 
   * @param {string} orgId - Organization UUID
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with visitor stats
   */
  getVisitorStats: async (orgId, params = {}) => {
    try {
      const response = await api.get(`/api/v2/organizations/${orgId}/visitors/stats`, { params });
      return response.data;
    } catch (error) {
      logger.error(`Error getting visitor stats ${orgId}:`, error);
      throw error;
    }
  },

  /**
   * Get department attendance breakdown
   * 
   * @param {string} orgId - Organization UUID
   * @returns {Promise} Response with department attendance data
   */
  getDepartmentAttendance: async (orgId) => {
    try {
      const response = await api.get(`/api/v2/organizations/${orgId}/departments/attendance`);
      return response.data;
    } catch (error) {
      logger.error(`Error getting department attendance ${orgId}:`, error);
      throw error;
    }
  },
};

/**
 * Helper functions
 */
export const organizationsHelpers = {
  /**
   * Format organization type for display
   */
  formatOrganizationType: (type) => {
    const types = {
      school: 'School',
      office: 'Office',
      apartment: 'Apartment',
      home: 'Home',
    };
    return types[type] || type;
  },

  /**
   * Format subscription tier for display
   */
  formatSubscriptionTier: (tier) => {
    const tiers = {
      free: 'Free',
      basic: 'Basic',
      premium: 'Premium',
      enterprise: 'Enterprise',
    };
    return tiers[tier] || tier;
  },

  /**
   * Validate organization code format
   */
  validateCode: (code) => {
    return code && code.length >= 2 && code.length <= 50;
  },

  /**
   * Validate organization name
   */
  validateName: (name) => {
    return name && name.length >= 2 && name.length <= 255;
  },

  /**
   * Get organization icon by type
   */
  getOrganizationIcon: (type) => {
    const icons = {
      school: '🏫',
      office: '🏢',
      apartment: '🏘️',
      home: '🏠',
    };
    return icons[type] || '🏢';
  },
};

/**
 * Employees API Service
 */
export const employeesService = {
  /**
   * List all employees with pagination and filters
   * 
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.per_page=20] - Items per page
   * @param {string} [params.search] - Search by name, employee code, or phone
   * @param {string} [params.organization_id] - Filter by organization ID
   * @param {string} [params.department_id] - Filter by department ID
   * @param {string} [params.employment_type] - Filter by type (full_time, part_time, contract, intern)
   * @param {boolean} [params.is_active] - Filter by active status
   * 
   * @returns {Promise} Response with { success, data: { items, pagination }, message }
   */
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/v2/employees', { params });
      return response.data;
    } catch (error) {
      logger.error('Error listing employees:', error);
      throw error;
    }
  },

  /**
   * Get single employee by ID
   * 
   * @param {string} employeeId - Employee UUID
   * @returns {Promise} Response with { success, data: {...employee object}, message }
   */
  getById: async (employeeId) => {
    try {
      const response = await api.get(`/api/v2/employees/${employeeId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error getting employee ${employeeId}:`, error);
      throw error;
    }
  },

  /**
   * Create new employee
   * 
   * @param {Object} payload - Employee data
   * @param {string} payload.user_id - User UUID - REQUIRED
   * @param {string} payload.organization_id - Organization UUID - REQUIRED
   * @param {string} payload.department_id - Department UUID - REQUIRED
   * @param {string} payload.employee_code - Unique employee code - REQUIRED
   * @param {string} payload.full_name - Full name - REQUIRED
   * @param {string} [payload.gender] - Gender (male, female, other)
   * @param {string} [payload.date_of_birth] - Date of birth (YYYY-MM-DD)
   * @param {string} [payload.phone_number] - Phone number
   * @param {Object} [payload.emergency_contact] - Emergency contact object
   * @param {string} [payload.address] - Address
   * @param {string} [payload.joining_date] - Joining date (YYYY-MM-DD)
   * @param {string} [payload.designation] - Designation
   * @param {string} [payload.employment_type] - Type (full_time, part_time, contract, intern)
   * @param {string} [payload.shift_id] - Shift UUID
   * 
   * @returns {Promise} Response with { success, data: {...employee object}, message }
   */
  create: async (payload) => {
    try {
      const response = await api.post('/api/v2/employees', payload);
      return response.data;
    } catch (error) {
      logger.error('Error creating employee:', error);
      throw error;
    }
  },

  /**
   * Update employee
   * 
   * @param {string} employeeId - Employee UUID
   * @param {Object} payload - Fields to update (all optional)
   * @returns {Promise} Response with { success, data: {...employee object}, message }
   */
  update: async (employeeId, payload) => {
    try {
      const response = await api.put(`/api/v2/employees/${employeeId}`, payload);
      return response.data;
    } catch (error) {
      logger.error(`Error updating employee ${employeeId}:`, error);
      throw error;
    }
  },

  /**
   * Delete employee
   * 
   * @param {string} employeeId - Employee UUID
   * @param {boolean} [hardDelete=false] - If true, permanently delete; otherwise soft delete
   * @returns {Promise} Response with { success, message }
   */
  delete: async (employeeId, hardDelete = false) => {
    try {
      const response = await api.delete(`/api/v2/employees/${employeeId}`, {
        params: { hard_delete: hardDelete }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error deleting employee ${employeeId}:`, error);
      throw error;
    }
  },

  /**
   * Get employee attendance records
   * 
   * @param {string} employeeId - Employee UUID
   * @param {Object} params - Filter parameters
   * @returns {Promise} Response with { success, data: { items, pagination }, message }
   */
  getAttendance: async (employeeId, params = {}) => {
    try {
      const response = await api.get(`/api/v2/employees/${employeeId}/attendance`, { params });
      return response.data;
    } catch (error) {
      logger.error(`Error getting employee attendance ${employeeId}:`, error);
      throw error;
    }
  },

  /**
   * Download employee directory as PDF or Excel
   * 
   * @param {string} organizationId - Organization UUID
   * @param {Object} options - Download options
   * @param {string} [options.format='pdf'] - File format (pdf or excel)
   * @param {string} [options.status_filter='all'] - Filter by status (all, active, inactive)
   * @param {string} [options.department_id] - Optional department filter
   * @returns {Promise<Blob>} File blob for download
   */
  downloadDirectory: async (organizationId, options = {}) => {
    try {
      const { format = 'pdf', status_filter = 'all', department_id = null } = options;
      
      const params = {
        format,
        status_filter
      };
      
      if (department_id) {
        params.department_id = department_id;
      }
      
      const response = await api.get(`/api/v2/organizations/${organizationId}/employees/download`, {
        params,
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Error downloading employee directory:`, error);
      throw error;
    }
  },
};

/**
 * Cameras API Service
 */
export const camerasService = {
  /**
   * List all cameras with pagination and filters
   * 
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.per_page=20] - Items per page
   * @param {string} [params.search] - Search by name
   * @param {string} [params.organization_id] - Filter by organization ID
   * @param {string} [params.location_id] - Filter by location ID
   * @param {string} [params.camera_type] - Filter by type (CHECK_IN, CHECK_OUT, CCTV)
   * @param {string} [params.status] - Filter by status (online, offline, error)
   * @param {boolean} [params.is_active] - Filter by active status
   * 
   * @returns {Promise} Response with { success, data: { items, pagination }, message }
   */
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/v2/cameras', { params });
      return response.data;
    } catch (error) {
      logger.error('Error listing cameras:', error);
      throw error;
    }
  },

  /**
   * Get single camera by ID
   * 
   * @param {string} cameraId - Camera UUID
   * @returns {Promise} Response with { success, data: {...camera object}, message }
   */
  getById: async (cameraId) => {
    try {
      const response = await api.get(`/api/v2/cameras/${cameraId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error getting camera ${cameraId}:`, error);
      throw error;
    }
  },

  /**
   * Create new camera
   * 
   * @param {Object} payload - Camera data
   * @param {string} payload.organization_id - Organization UUID - REQUIRED
   * @param {string} payload.location_id - Location UUID - REQUIRED
   * @param {string} payload.name - Camera name - REQUIRED
   * @param {string} payload.camera_type - Type: CHECK_IN|CHECK_OUT|CCTV - REQUIRED
   * @param {string} payload.source_type - Source: IP_CAMERA|USB_CAMERA|RTSP_STREAM - REQUIRED
   * @param {string} [payload.source_url] - RTSP or camera URL
   * @param {Object} [payload.source_config] - Additional source configuration
   * @param {number} [payload.fps=10] - Frames per second
   * @param {string} [payload.resolution='640x480'] - Resolution
   * @param {number} [payload.confidence_threshold=0.6] - Confidence threshold (0-1)
   * @param {boolean} [payload.liveness_check_enabled=true] - Enable liveness check
   * 
   * @returns {Promise} Response with { success, data: {...camera object}, message }
   */
  create: async (payload) => {
    try {
      const response = await api.post('/api/v2/cameras', payload);
      return response.data;
    } catch (error) {
      logger.error('Error creating camera:', error);
      throw error;
    }
  },

  /**
   * Update camera
   * 
   * @param {string} cameraId - Camera UUID
   * @param {Object} payload - Fields to update (all optional)
   * @returns {Promise} Response with { success, data: {...camera object}, message }
   */
  update: async (cameraId, payload) => {
    try {
      const response = await api.put(`/api/v2/cameras/${cameraId}`, payload);
      return response.data;
    } catch (error) {
      logger.error(`Error updating camera ${cameraId}:`, error);
      throw error;
    }
  },

  /**
   * Delete camera
   * 
   * @param {string} cameraId - Camera UUID
   * @param {boolean} [hardDelete=false] - If true, permanently delete; otherwise soft delete
   * @returns {Promise} Response with { success, message }
   */
  delete: async (cameraId, hardDelete = false) => {
    try {
      const response = await api.delete(`/api/v2/cameras/${cameraId}`, {
        params: { hard_delete: hardDelete }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting camera ${cameraId}:`, error);
      throw error;
    }
  },

  /**
   * Update camera heartbeat status
   * 
   * @param {string} cameraId - Camera UUID
   * @param {Object} payload - Heartbeat data
   * @param {string} payload.status - Status: online|offline|error
   * @param {string} [payload.error_message] - Error message if status is error
   * @returns {Promise} Response with { success, data: {...camera object}, message }
   */
  updateHeartbeat: async (cameraId, payload) => {
    try {
      const response = await api.post(`/api/v2/cameras/${cameraId}/heartbeat`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating camera heartbeat ${cameraId}:`, error);
      throw error;
    }
  },
};

/**
 * Constants for Employees
 */
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERN: 'intern',
};

export const GENDER_OPTIONS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

/**
 * Constants for Cameras
 */
export const CAMERA_TYPES = {
  CHECK_IN: 'CHECK_IN',
  CHECK_OUT: 'CHECK_OUT',
  CCTV: 'CCTV',
};

export const CAMERA_SOURCE_TYPES = {
  IP_CAMERA: 'IP_CAMERA',
  USB_CAMERA: 'USB_CAMERA',
  RTSP_STREAM: 'RTSP_STREAM',
};

export const CAMERA_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  ERROR: 'error',
};

/**
 * Locations API Service
 */
export const locationsService = {
  /**
   * List all locations with pagination and filters
   * 
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.per_page=20] - Items per page
   * @param {string} [params.search] - Search by name
   * @param {string} [params.organization_id] - Filter by organization ID
   * @param {string} [params.location_type] - Filter by type (ENTRY, EXIT, BOTH)
   * @param {boolean} [params.is_active] - Filter by active status
   * 
   * @returns {Promise} Response with { success, data: { items, pagination }, message }
   */
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/v2/locations', { params });
      return response.data;
    } catch (error) {
      console.error('Error listing locations:', error);
      throw error;
    }
  },

  /**
   * Get single location by ID
   * 
   * @param {string} locationId - Location UUID
   * @returns {Promise} Response with { success, data: {...location object}, message }
   */
  getById: async (locationId) => {
    try {
      const response = await api.get(`/api/v2/locations/${locationId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting location ${locationId}:`, error);
      throw error;
    }
  },

  /**
   * Create new location
   * 
   * @param {Object} payload - Location data
   * @param {string} payload.organization_id - Organization UUID - REQUIRED
   * @param {string} payload.name - Location name - REQUIRED
   * @param {string} [payload.location_type='BOTH'] - Type: ENTRY|EXIT|BOTH
   * @param {string} [payload.description] - Description
   * @param {string} [payload.building] - Building name
   * @param {string} [payload.floor] - Floor
   * @param {string} [payload.area] - Area/Zone
   * @param {number} [payload.latitude] - GPS latitude
   * @param {number} [payload.longitude] - GPS longitude
   * 
   * @returns {Promise} Response with { success, data: {...location object}, message }
   */
  create: async (payload) => {
    try {
      const response = await api.post('/api/v2/locations', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  },

  /**
   * Update location
   * 
   * @param {string} locationId - Location UUID
   * @param {Object} payload - Fields to update (all optional)
   * @returns {Promise} Response with { success, data: {...location object}, message }
   */
  update: async (locationId, payload) => {
      try {
        // Remove organization_id if present (not allowed in update)
        const { organization_id, ...updatePayload } = payload || {};
        const response = await api.put(`/api/v2/locations/${locationId}`, updatePayload);
        return response.data;
      } catch (error) {
        console.error(`Error updating location ${locationId}:`, error);
        throw error;
      }
  },

  /**
   * Delete location
   * 
   * @param {string} locationId - Location UUID
   * @param {boolean} [hardDelete=false] - If true, permanently delete; otherwise soft delete
   * @returns {Promise} Response with { success, message }
   */
  delete: async (locationId, hardDelete = false) => {
    try {
      const response = await api.delete(`/api/v2/locations/${locationId}`, {
        params: { hard_delete: hardDelete }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting location ${locationId}:`, error);
      throw error;
    }
  },
};

/**
 * Constants for Locations
 */
export const LOCATION_TYPES = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
  BOTH: 'BOTH',
};

export default organizationsService;

/**
 * Attendance API Serviceyes
 */
export const attendanceService = {
  /**
   * List all attendance records with pagination and filters
   * 
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.per_page=20] - Items per page
   * @param {string} [params.search] - Search by employee name or code
   * @param {string} [params.organization_id] - Filter by organization ID
   * @param {string} [params.employee_id] - Filter by employee ID
   * @param {string} [params.department_id] - Filter by department ID
   * @param {string} [params.start_date] - Filter by start date (YYYY-MM-DD)
   * @param {string} [params.end_date] - Filter by end date (YYYY-MM-DD)
   * @param {string} [params.status] - Filter by status
   * 
   * @returns {Promise} Response with { success, data: { items, pagination }, message }
   */
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/v2/attendance', { params });
      return response.data;
    } catch (error) {
      console.error('Error listing attendance:', error);
      throw error;
    }
  },

  /**
   * Check in an employee
   */
  checkIn: async (payload) => {
    try {
      const response = await api.post('/api/v2/attendance/check-in', payload);
      return response.data;
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  },

  /**
   * Check out an employee
   */
  checkOut: async (payload) => {
    try {
      const response = await api.post('/api/v2/attendance/check-out', payload);
      return response.data;
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  },

  /**
   * Update an attendance record
   */
  update: async (attendanceId, payload) => {
    try {
      const response = await api.put(`/api/v2/attendance/${attendanceId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating attendance ${attendanceId}:`, error);
      throw error;
    }
  },
};

/**
 * Departments API Service
 */
export const departmentsService = {
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/v2/departments', { params });
      return response.data;
    } catch (error) {
      console.error('Error listing departments:', error);
      throw error;
    }
  },

  getById: async (departmentId) => {
    try {
      const response = await api.get(`/api/v2/departments/${departmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting department ${departmentId}:`, error);
      throw error;
    }
  },

  listByOrganization: async (organizationId, params = {}) => {
    try {
      const response = await api.get(`/api/v2/departments/by-organization/${organizationId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error listing departments for organization ${organizationId}:`, error);
      throw error;
    }
  },

  create: async (payload) => {
    try {
      const response = await api.post('/api/v2/departments', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },

  update: async (departmentId, payload) => {
    try {
      const response = await api.put(`/api/v2/departments/${departmentId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating department ${departmentId}:`, error);
      throw error;
    }
  },

  delete: async (departmentId, hardDelete = false) => {
    try {
      const response = await api.delete(`/api/v2/departments/${departmentId}`, {
        params: { hard_delete: hardDelete }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting department ${departmentId}:`, error);
      throw error;
    }
  },
};

/**
 * Shifts API Service
 */
export const shiftsService = {
  list: async (params = {}) => {
    try {
      const response = await api.get('/api/v2/shifts', { params });
      return response.data;
    } catch (error) {
      console.error('Error listing shifts:', error);
      throw error;
    }
  },

  getById: async (shiftId) => {
    try {
      const response = await api.get(`/api/v2/shifts/${shiftId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting shift ${shiftId}:`, error);
      throw error;
    }
  },

  create: async (payload) => {
    try {
      const response = await api.post('/api/v2/shifts', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating shift:', error);
      throw error;
    }
  },

  update: async (shiftId, payload) => {
    try {
      const response = await api.put(`/api/v2/shifts/${shiftId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating shift ${shiftId}:`, error);
      throw error;
    }
  },

  delete: async (shiftId, hardDelete = false) => {
    try {
      const response = await api.delete(`/api/v2/shifts/${shiftId}`, {
        params: { hard_delete: hardDelete }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting shift ${shiftId}:`, error);
      throw error;
    }
  },
};
