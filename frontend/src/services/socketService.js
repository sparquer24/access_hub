/**
 * WebSocket Service for Real-time Alerts
 * Handles connection to backend WebSocket server and event subscriptions
 */

import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.currentOrganizationId = null;
  }

  /**
   * Initialize and connect to WebSocket server
   * @param {string} organizationId - Organization ID to auto-join
   */
  connect(organizationId = null) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected:', this.socket.id);
        this.isConnected = true;
        this.emit('connection_change', { connected: true, socketId: this.socket.id });
        
        // Auto-join organization room if provided
        if (organizationId) {
          this.joinOrganization(organizationId);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnected = false;
        this.emit('connection_change', { connected: false, reason });
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.emit('connection_error', { error: error.message });
      });

      // Register event handlers
      this.socket.on('new_alert', (data) => {
        console.log('New alert received:', data);
        this.emit('new_alert', data);
      });

      this.socket.on('alert_handled', (data) => {
        console.log('Alert handled:', data);
        this.emit('alert_handled', data);
      });

      this.socket.on('visitor_checkin', (data) => {
        console.log('Visitor checked in:', data);
        this.emit('visitor_checkin', data);
      });

      this.socket.on('visitor_checkout', (data) => {
        console.log('Visitor checked out:', data);
        this.emit('visitor_checkout', data);
      });

      this.socket.on('error', (data) => {
        console.error('WebSocket error:', data);
        this.emit('socket_error', data);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentOrganizationId = null;
    }
  }

  /**
   * Join an organization room to receive alerts for that organization
   * @param {string} organizationId - Organization ID
   */
  joinOrganization(organizationId) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot join organization');
      return;
    }

    this.currentOrganizationId = organizationId;
    this.socket.emit('join_organization', { organization_id: organizationId });
    console.log('Joining organization:', organizationId);
  }

  /**
   * Leave an organization room
   * @param {string} organizationId - Organization ID
   */
  leaveOrganization(organizationId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leave_organization', { organization_id: organizationId });
    if (this.currentOrganizationId === organizationId) {
      this.currentOrganizationId = null;
    }
  }

  /**
   * Subscribe to real-time alerts for an organization
   * @param {string} organizationId - Organization ID
   */
  subscribeToAlerts(organizationId) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected, cannot subscribe to alerts');
      return;
    }

    this.socket.emit('subscribe_alerts', { organization_id: organizationId });
    console.log('Subscribed to alerts for organization:', organizationId);
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to internal listeners
   * @param {string} event - Event name
   * @param {any} data - Data to pass to callbacks
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isSocketConnected() {
    return this.isConnected;
  }

  /**
   * Get socket ID
   * @returns {string|null}
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Export class for testing or multiple instances
export default SocketService;
