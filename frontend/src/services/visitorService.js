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
   * Check in a visitor (New API v2)
   * Creates or updates visitor record and records entry time
   * @param {string} organizationId - Organization ID
   * @param {Object} visitorData - Check-in information {name, phone, email, gender, visitor_type, host_name, host_phone, purpose_of_visit, allowed_floor, allowed_tower, from_date, to_date}
   * @returns {Promise}
   */
  checkInNewVisitor: async (organizationId, visitorData) => {
    try {
      console.log('📋 Checking in visitor:', { organizationId, visitorData });
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/check-in`,
        visitorData
      );
      console.log('✅ Check-in successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Check-in failed:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Check out a visitor (New API v2)
   * Records visitor's departure and check-out time
   * @param {string} organizationId - Organization ID
   * @param {string} historyId - Visit history ID (returned from check-in)
   * @returns {Promise}
   */
  checkOutVisitorNew: async (organizationId, historyId) => {
    try {
      console.log('🚪 Checking out visitor:', { organizationId, historyId });
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${historyId}/check-out`
      );
      console.log('✅ Check-out successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Check-out failed:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Check in a visitor (Legacy API)
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
   * Check out a visitor (Legacy API)
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
   * Get existing visitor by mobile number
   * @param {string} organizationId - Organization ID
   * @param {string} mobileNumber - Visitor mobile number
   * @returns {Promise<Object|null>}
   */
  getExistingVisitorByMobile: async (organizationId, mobileNumber) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/search`,
        { params: { query: mobileNumber, limit: 1 } }
      );
      
      // Return first match if exists
      if (response.data?.success && response.data?.data?.length > 0) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching visitor by mobile:', error);
      return null;
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
   * Get active (checked-in) visitors for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise}
   */
  getActiveVisitors: async (organizationId) => {
    try {
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/active`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all visitor alerts (New API v2)
   * @param {string} organizationId - Organization ID
   * @param {Object} params - Query parameters {unacknowledged_only, alert_type, date_from, date_to, limit, offset}
   * @returns {Promise}
   */
  getVisitorAlertsNew: async (organizationId, params = {}) => {
    try {
      console.log('🚨 Fetching visitor alerts:', { organizationId, params });
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/alerts`,
        { params }
      );
      console.log('✅ Alerts fetched:', { count: response.data?.data?.alerts?.length });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch alerts:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get visitor movement logs / logs (New API v2)
   * @param {string} organizationId - Organization ID
   * @param {Object} params - Query parameters {visitor_id, floor, date_from, date_to, limit, offset}
   * @returns {Promise}
   */
  getVisitorLogsNew: async (organizationId, params = {}) => {
    try {
      console.log('📊 Fetching visitor logs:', { organizationId, params });
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/logs`,
        { params }
      );
      console.log('✅ Logs fetched:', { count: response.data?.data?.logs?.length });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch logs:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get overview statistics (New API v2)
   * Dashboard stats including active visitors, entries, alerts, etc.
   * @param {string} organizationId - Organization ID
   * @returns {Promise}
   */
  getOverviewStats: async (organizationId) => {
    try {
      console.log('📈 Fetching overview statistics:', { organizationId });
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/overview`
      );
      const overview = response.data?.data?.overview || response.data?.data;
      console.log('✅ Overview stats fetched:', overview);
      return {
        ...response.data,
        data: {
          ...response.data?.data,
          overview
        }
      };
    } catch (error) {
      console.error('❌ Failed to fetch overview:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get complete visitor history (New API v2)
   * @param {string} organizationId - Organization ID
   * @param {string} visitorId - Visitor ID
   * @returns {Promise}
   */
  getVisitorHistoryNew: async (organizationId, visitorId) => {
    try {
      console.log('📋 Fetching visitor history:', { organizationId, visitorId });
      const response = await api.get(
        `${ORG_VISITOR_API_BASE}/${organizationId}/visitors/${visitorId}/history`
      );
      console.log('✅ History fetched:', { visits: response.data?.data?.history?.length });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch history:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Acknowledge / mark alert as read (New API v2)
   * @param {string} organizationId - Organization ID
   * @param {string} alertId - Alert ID
   * @returns {Promise}
   */
  acknowledgeAlert: async (organizationId, alertId) => {
    try {
      console.log('✅ Acknowledging alert:', { organizationId, alertId });
      const response = await api.post(
        `${ORG_VISITOR_API_BASE}/${organizationId}/alerts/${alertId}/acknowledge`
      );
      console.log('✅ Alert acknowledged');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to acknowledge alert:', error.response?.data || error.message);
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
