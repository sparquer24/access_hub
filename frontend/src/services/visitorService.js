import api from './api';

const VISITOR_API_BASE = '/api/v2/visitors';
const ORG_VISITOR_API_BASE = '/api/v2/organizations';

export const visitorService = {
  /**
   * Get visitor stats
   * @param {string} organizationId - Organization ID
   * @returns {Promise}
   */
  getStats: (organizationId) =>
    api.get(`${ORG_VISITOR_API_BASE}/${organizationId}/visitors/stats`),

  /**
   * Create a new visitor for an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} visitorData - Visitor information
   * @returns {Promise}
   */
  createVisitor: async (organizationId, visitorData) => {
    try {
      const endpoint = `${ORG_VISITOR_API_BASE}/${organizationId}/visitors`;

      console.log('🌐 Making API call to create visitor:', {
        endpoint,
        fullUrl: `${api.defaults.baseURL}${endpoint}`,
        organizationId,
        visitorDataKeys: Object.keys(visitorData),
        hasImage: !!visitorData.image_base64,
        imageLength: visitorData.image_base64 ? visitorData.image_base64.length : 0,
        apiBaseURL: api.defaults.baseURL,
        headers: api.defaults.headers
      });

      const response = await api.post(endpoint, visitorData);

      console.log('📡 API Response received:', {
        status: response.status,
        success: response.data?.success,
        dataKeys: Object.keys(response.data || {}),
        responseData: response.data
      });

      return response.data;
    } catch (error) {
      console.error('🚨 API Error in createVisitor:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        endpoint: `${ORG_VISITOR_API_BASE}/${organizationId}/visitors`,
        fullUrl: `${api.defaults.baseURL}${ORG_VISITOR_API_BASE}/${organizationId}/visitors`,
        requestHeaders: error.config?.headers,
        requestData: error.config?.data
      });
      throw error;
    }
  },

  /**
   * Get all visitors for an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise}
   */
  getVisitorsByOrganization: async (organizationId, params = {}) => {
    try {
      console.log('📋 Fetching visitors by organization:', {
        organizationId,
        params,
        endpoint: `${ORG_VISITOR_API_BASE}/${organizationId}/visitors`
      });

      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors`,
        { params }
      );

      console.log('📊 Visitors list API response:', {
        status: response.status,
        success: response.data?.success,
        visitorsLength: response.data?.data?.visitors?.length,
        pagination: response.data?.data?.pagination
      });

      return response.data;
    } catch (error) {
      console.error('🚨 API Error in getVisitorsByOrganization:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        endpoint: `${ORG_VISITOR_API_BASE}/${organizationId}/visitors`
      });
      throw error;
    }
  },

  /**
   * Get a single visitor by ID
   * @param {string} organizationId - Organization ID
   * @param {string} visitorId - Visitor ID
   * @returns {Promise}
   */
  getVisitorById: async (organizationId, visitorId) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check in a visitor
   * @param {string} organizationId - Organization ID
   * @param {string} visitorId - Visitor ID
   * @param {Object} checkInData - Check-in information
   * @returns {Promise}
   */
  checkInVisitor: async (organizationId, visitorId, checkInData) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/check-in`,
        checkInData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check out a visitor
   * @param {string} organizationId - Organization ID
   * @param {string} visitorId - Visitor ID
   * @param {Object} checkOutData - Check-out information
   * @returns {Promise}
   */
  checkOutVisitor: async (organizationId, visitorId, checkOutData) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/check-out`,
        checkOutData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get visitor movement/logs
   * @param {string} organizationId - Organization ID
   * @param {string} visitorId - Visitor ID
   * @returns {Promise}
   */
  getVisitorMovements: async (organizationId, visitorId) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/movements`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search visitors by query
   * @param {string} organizationId - Organization ID
   * @param {Object} searchParams - Search parameters
   * @returns {Promise}
   */
  searchVisitors: async (organizationId, searchParams) => {
    try {
      console.log('🔍 Searching visitors:', {
        organizationId,
        searchParams,
        endpoint: `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/search`
      });

      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/search`,
        { params: searchParams }
      );

      console.log('🔍 Search response:', {
        success: response.data?.success,
        resultCount: response.data?.data?.length
      });

      return response.data;
    } catch (error) {
      console.error('🚨 Search error:', error);
      throw error;
    }
  },

  /**
   * Record physical movement (entry/exit)
   * @param {string} organizationId - Organization ID
   * @param {string} visitorId - Visitor ID
   * @param {Object} movementData - Movement information
   * @returns {Promise}
   */
  recordPhysicalMovement: async (organizationId, visitorId, movementData) => {
    try {
      console.log('🚪 Recording physical movement:', {
        organizationId,
        visitorId,
        action: movementData.action,
        endpoint: `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/movement`
      });

      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/movement`,
        movementData
      );

      console.log('🚪 Movement recorded:', {
        success: response.data?.success,
        action: movementData.action
      });

      return response.data;
    } catch (error) {
      console.error('🚨 Movement recording error:', error);
      throw error;
    }
  },

  /**
   * Get visitor movement/logs
   * @param {string} organizationId - Organization ID
   * @param {string} visitorId - Visitor ID
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getVisitorMovement: async (organizationId, visitorId, params = {}) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/movement`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all visitor alerts for an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getVisitorAlerts: async (organizationId, params = {}) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/alerts`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a visitor record
   * @param {string} organizationId - Organization ID
   * @param {string} visitorId - Visitor ID
   * @param {Object} updateData - Updated visitor information
   * @returns {Promise}
   */
  updateVisitor: async (organizationId, visitorId, updateData) => {
    try {
      const response = await api.put(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a visitor
   * @param {string} organizationId - Organization ID
   * @param {string} visitorId - Visitor ID
   * @returns {Promise}
   */
  deleteVisitor: async (organizationId, visitorId) => {
    try {
      const response = await api.delete(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== BLACKLIST MANAGEMENT ====================

  checkBlacklist: async (organizationId, phone, email, idProof) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/blacklist/check`,
        { params: { phone, email, id_proof: idProof } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addToBlacklist: async (organizationId, data) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/blacklist`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getBlacklist: async (organizationId) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/blacklist`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  removeFromBlacklist: async (organizationId, blacklistId) => {
    try {
      const response = await api.delete(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/blacklist/${blacklistId}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== PRE-REGISTRATION ====================

  createPreRegistration: async (organizationId, data) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/pre-register`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPreRegistrations: async (organizationId, status = null) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/pre-registrations`,
        { params: { status } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  approvePreRegistration: async (organizationId, preRegId) => {
    try {
      const response = await api.put(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/pre-registrations/${preRegId}/approve`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  rejectPreRegistration: async (organizationId, preRegId, reason) => {
    try {
      const response = await api.put(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/pre-registrations/${preRegId}/reject`,
        { reason }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== VIP MANAGEMENT ====================

  createVIPProfile: async (organizationId, visitorId, data) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/vip/${visitorId}/profile`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getVIPPreferences: async (organizationId, visitorId) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/vip/${visitorId}/preferences`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== CONTRACTOR TRACKING ====================

  contractorClockIn: async (organizationId, visitorId, workDetails) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/contractors/${visitorId}/clock-in`,
        workDetails
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  contractorClockOut: async (organizationId, visitorId) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/contractors/${visitorId}/clock-out`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getContractorTimesheet: async (organizationId, visitorId, dateRange) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/contractors/${visitorId}/timesheet`,
        { params: dateRange }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== DELIVERY MANAGEMENT ====================

  logDelivery: async (organizationId, data) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/deliveries`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  completeDelivery: async (organizationId, deliveryId, signatureData) => {
    try {
      const response = await api.put(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/deliveries/${deliveryId}/complete`,
        { signature_data: signatureData }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDeliveryLogs: async (organizationId, status = null) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/deliveries`,
        { params: { status } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== HEALTH SCREENING ====================

  performHealthScreening: async (organizationId, visitorId, data) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/health-screening`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== DOCUMENT SIGNING ====================

  signDocument: async (organizationId, visitorId, data) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/documents/sign`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSignedDocuments: async (organizationId, visitorId) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/documents`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== BADGE MANAGEMENT ====================

  generateBadge: async (organizationId, visitorId, badgeType = 'standard') => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/badge`,
        { badge_type: badgeType }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  returnBadge: async (organizationId, visitorId) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/badge/return`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== RECURRING VISITORS ====================

  getRecurringVisitors: async (organizationId) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/recurring`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  quickCheckin: async (organizationId, phoneNumber) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/quick-checkin`,
        { phone_number: phoneNumber }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== ANALYTICS ====================

  getAnalytics: async (organizationId, dateRange) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/analytics`,
        { params: dateRange }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ==================== ASSET TRACKING ====================

  registerAssets: async (organizationId, visitorId, assets) => {
    try {
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/assets`,
        { assets }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  verifyAssetsOnExit: async (organizationId, visitorId) => {
    try {
      const response = await api.put(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/assets/verify`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
