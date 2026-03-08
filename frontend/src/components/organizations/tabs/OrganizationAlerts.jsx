import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { auditAPI } from '../../../services/apiServices';
import { visitorService } from '../../../services/visitorService';
import { socketService } from '../../../services/socketService';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../common/Loader';
import { X } from 'lucide-react';

const TAB_HEADERS = {
  info: 'Organization Overview',
  employees: 'Employees Attendance',
  visitors: 'Visitor Management',
  lpr: 'License Plate Recognition',
  cameras: 'Cameras',
  locations: 'Locations',
  rules: 'Rules',
  statistics: 'Analytics'
};

const toAlertType = (rawType = '') => {
  const type = String(rawType).toLowerCase();
  if (type.includes('unauthorized') || type.includes('critical')) {
    return 'critical';
  }
  if (type.includes('overstay') || type.includes('warning') || type.includes('pending')) {
    return 'warning';
  }
  if (type.includes('success') || type.includes('resolved') || type.includes('complete')) {
    return 'success';
  }
  return 'info';
};

const toRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hrs ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
};

const extractAlertsFromResponse = (response) => {
  const body = response?.data ? response.data : response;

  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.alerts)) {
    return body.alerts;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  if (Array.isArray(body?.data?.alerts)) {
    return body.data.alerts;
  }

  return [];
};

const mapAlert = (alert) => {
  const alertType = toAlertType(alert?.alert_type || alert?.type);
  const rawType = alert?.alert_type || alert?.type || 'info';
  const normalizedTypeLabel = String(rawType)
    .replaceAll('_', ' ')
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');

  return {
    id: alert?.id || `${rawType}-${alert?.created_at || Date.now()}`,
    type: alertType,
    title:
      alert?.title ||
      alert?.name ||
      normalizedTypeLabel,
    message:
      alert?.message ||
      alert?.details ||
      alert?.description ||
      `Visitor alert: ${String(rawType).replaceAll('_', ' ')}`,
    relativeTime: toRelativeTime(alert?.alert_time || alert?.created_at || alert?.updated_at)
  };
};

const OrganizationAlerts = ({ organizationId, activeTab = 'info', showActivityLog = true, onCloseSidebar, onAlertCountChange }) => {
  const { success, error: showError } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const activeHeader = TAB_HEADERS[activeTab] || 'Organization Overview';
  const showScrollableAlerts = activeAlerts.length > 6;

  const fetchAlerts = useCallback(async () => {
    if (!organizationId) {
      setActiveAlerts([]);
      return;
    }

    try {
      const response = await visitorService.getVisitorAlertsNew(organizationId, {
        unacknowledged_only: true,
        limit: 100
      });

      const normalizedAlerts = extractAlertsFromResponse(response).map(mapAlert);
      setActiveAlerts(normalizedAlerts);
    } catch (error) {
      console.error('Error fetching visitor alerts:', error);
      setActiveAlerts([]);
    }
  }, [organizationId]);

  const prependRealtimeAlert = useCallback((newAlert) => {
    setActiveAlerts((prev) => {
      const deduped = prev.filter((alert) => String(alert.id) !== String(newAlert.id));
      return [newAlert, ...deduped];
    });
  }, []);

  const removeAlertById = useCallback((alertId) => {
    setActiveAlerts((prev) => prev.filter((alert) => String(alert.id) !== String(alertId)));
  }, []);

  // Connect to WebSocket and subscribe to alerts
  useEffect(() => {
    if (!organizationId) return;

    // Connect to WebSocket
    socketService.connect(organizationId);

    // Subscribe to real-time alerts
    const handleNewAlert = (data) => {
      console.log('Real-time alert received:', data);
      // Add new live alert to the list
      const newAlert = {
        id: data?.id || `rt-${Date.now()}`,
        type: toAlertType(data?.alert_type || data?.type),
        title: data?.title || data?.alert_type?.charAt(0).toUpperCase() + data?.alert_type?.slice(1) || 'New Alert',
        message: data?.details || data?.message || `Visitor alert: ${data?.alert_type || 'new event'}`,
        relativeTime: 'Just now'
      };

      prependRealtimeAlert(newAlert);

      success('New alert received!');
    };

    const handleAlertHandled = (data) => {
      console.log('Alert handled:', data);
      // Remove handled alert from list
      removeAlertById(data?.id);
    };

    const handleVisitorCheckin = (data) => {
      console.log('Visitor checked in:', data);
      success(`${data.name || 'A visitor'} checked in`);
    };

    const handleVisitorCheckout = (data) => {
      console.log('Visitor checked out:', data);
    };

    // Register event listeners
    socketService.on('new_alert', handleNewAlert);
    socketService.on('alert_handled', handleAlertHandled);
    socketService.on('visitor_checkin', handleVisitorCheckin);
    socketService.on('visitor_checkout', handleVisitorCheckout);

    // Cleanup on unmount
    return () => {
      socketService.off('new_alert', handleNewAlert);
      socketService.off('alert_handled', handleAlertHandled);
      socketService.off('visitor_checkin', handleVisitorCheckin);
      socketService.off('visitor_checkout', handleVisitorCheckout);
      socketService.disconnect();
    };
  }, [organizationId, success, prependRealtimeAlert, removeAlertById]);

  useEffect(() => {
    fetchAlerts();

    // Refresh alerts periodically to keep count and list current.
    const intervalId = setInterval(fetchAlerts, 30000);

    return () => clearInterval(intervalId);
  }, [fetchAlerts]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const response = await auditAPI.getByEntity('organizations', organizationId);
        setLogs(response.data || []);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        showError('Failed to fetch audit logs');
      } finally {
        setLoading(false);
      }
    };

    if (showActivityLog) {
      loadLogs();
      return;
    }

    setLoading(false);
  }, [organizationId, showActivityLog, showError]);

  useEffect(() => {
    if (typeof onAlertCountChange === 'function') {
      onAlertCountChange(activeAlerts.length);
    }
  }, [activeAlerts.length, onAlertCountChange]);

  const handleDismiss = async (id) => {
    try {
      await visitorService.acknowledgeAlert(organizationId, id);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }

    removeAlertById(id);
    success('Alert dismissed');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return '!';
      case 'warning':
        return '△';
      case 'success':
        return '✓';
      case 'info':
      default:
        return 'i';
    }
  };

  const getSidebarStyles = (type) => {
    switch (type) {
      case 'critical':
        return {
          border: 'border-l-red-400',
          iconWrap: 'bg-red-100 text-red-600'
        };
      case 'warning':
        return {
          border: 'border-l-amber-400',
          iconWrap: 'bg-amber-100 text-amber-700'
        };
      case 'success':
      case 'info':
      default:
        return {
          border: 'border-l-blue-400',
          iconWrap: 'bg-blue-100 text-blue-700'
        };
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'critical':
        return 'Critical';
      case 'warning':
        return 'Warning';
      case 'success':
        return 'Success';
      case 'info':
      default:
        return 'Info';
    }
  };

  const getAlertTypeBadgeStyles = (type) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const renderActivityLogContent = () => {
    if (loading) {
      return (
        <div className="p-8 flex justify-center">
          <Loader size="medium" />
        </div>
      );
    }

    if (logs.length > 0) {
      return (
        <div className="divide-y divide-gray-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-teal-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{log.action}</p>
                  <p className="text-sm text-gray-600 mt-1">{log.details || 'No details provided'}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">{formatDate(log.created_at)}</span>
                  {log.performed_by_username && (
                    <span className="text-xs font-medium text-teal-600 block mt-1">{log.performed_by_username}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="p-8 text-center text-gray-500">
        <p>No activity logs found for this organization.</p>
      </div>
    );
  };

  if (!showActivityLog) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
        <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-red-800 leading-tight">Alerts {activeAlerts.length}</p>
             <h3 className="text-sm font-medium text-slate-500 leading-tight mt-0.5">{activeHeader}</h3>
          </div>
          {onCloseSidebar && (
            <button
              onClick={onCloseSidebar}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close alerts sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className={`p-1.5 space-y-1.5 flex-1 ${showScrollableAlerts ? 'overflow-y-auto' : 'overflow-hidden'}`}>
          {activeAlerts.length > 0 ? (
            activeAlerts.map((alert) => {
              const styles = getSidebarStyles(alert.type);
              return (
                <div
                  key={alert.id}
                  className={`h-[80px] p-1.5 rounded-lg border border-gray-100 border-l-4 ${styles.border} bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
                >
                  <div className="flex items-start gap-2 h-full">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 ${styles.iconWrap}`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-slate-800 truncate">{alert.title}</p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-semibold leading-none ${getAlertTypeBadgeStyles(alert.type)}`}>
                          {getAlertTypeLabel(alert.type)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-0.5 truncate">{alert.message}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate">{alert.relativeTime}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-500">
              No active alerts
            </div>
          )}
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Active Alerts Section */}
      <div className="bg-teal-50/95 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-teal-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-xs font-medium text-gray-500">{activeHeader}</h3>
            <p className="text-base font-bold text-gray-900">Active Alerts</p>
          </div>
          <span className="text-xs font-medium text-gray-500">{activeAlerts.length} active</span>
        </div>

        {activeAlerts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activeAlerts.map((alert) => {
              const styles = getSidebarStyles(alert.type);
              return (
              <div key={alert.id} className={`p-3 border-l-4 ${styles.border} hover:bg-teal-50 transition-colors`}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900">{alert.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getAlertTypeBadgeStyles(alert.type)}`}>
                          {getAlertTypeLabel(alert.type)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.relativeTime}</p>
                    </div>
                  </div>
                  <button
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                    onClick={() => handleDismiss(alert.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );})}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <p>No active alerts at this time.</p>
          </div>
        )}
      </div>

      {/* Activity Log / Audit Trail */}
      {showActivityLog && (
        <div className="bg-teal-50/95 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-teal-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Activity Log
            </h3>
          </div>
          {renderActivityLogContent()}
        </div>
      )}
    </div>
  );
};

OrganizationAlerts.propTypes = {
  organizationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  activeTab: PropTypes.string,
  showActivityLog: PropTypes.bool,
  onCloseSidebar: PropTypes.func,
  onAlertCountChange: PropTypes.func
};

export default OrganizationAlerts;
