import React, { useState, useEffect } from 'react';
import { auditAPI } from '../../../services/apiServices';
import { visitorService } from '../../../services/visitorService';
import { socketService } from '../../../services/socketService';
import { tokenUtils } from '../../../utils/tokenUtils';
import { useAuth } from '../../../contexts/AuthContext';
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

const OrganizationAlerts = ({ organizationId, activeTab = 'info', showActivityLog = true, onCloseSidebar, onAlertCountChange }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const activeHeader = TAB_HEADERS[activeTab] || 'Organization Overview';
  const showScrollableAlerts = activeAlerts.length > 6;

  useEffect(() => {
    if (typeof onAlertCountChange === 'function') {
      onAlertCountChange(activeAlerts.length);
    }
  }, [activeAlerts, onAlertCountChange]);

  const transformAlert = (alert) => ({
    id: alert.id,
    type: alert.alert_type === 'unauthorized' ? 'critical' :
          alert.alert_type === 'overstay' ? 'warning' : 'info',
    title: alert.title || (alert.alert_type?.charAt(0).toUpperCase() + alert.alert_type?.slice(1)) || 'New Alert',
    message: alert.details || alert.message || `Visitor alert: ${alert.alert_type || 'unknown'}`,
    relativeTime: alert.alert_time ? new Date(alert.alert_time).toLocaleTimeString() : 'Just now'
  });

  const getUserRoleName = () => {
    const authUser = user || tokenUtils.getUser();
    if (!authUser || !authUser.role) return '';
    const roleName = typeof authUser.role === 'string' ? authUser.role : authUser.role.name;
    const normalized = String(roleName || '').toLowerCase().replace(/[-\s]+/g, '_');
    const compact = normalized.replace(/_/g, '');
    if (compact === 'orgadmin' || compact === 'organizationadmin') return 'org_admin';
    return normalized;
  };

  const roleName = getUserRoleName();
  const isOrgAdmin = roleName === 'org_admin';

  // Connect to WebSocket and subscribe to alerts
  useEffect(() => {
    if (!organizationId || !isOrgAdmin) return;

    // Connect to WebSocket
    socketService.connect(organizationId);

    // Subscribe to real-time alerts
    const handleNewAlert = (data) => {
      console.log('Real-time alert received:', data);
      // Add new alert to the list
      const newAlert = transformAlert(data);
      setActiveAlerts(prev => [newAlert, ...prev].slice(0, 6));
      success('New alert received!');
    };

    const handleAlertHandled = (data) => {
      console.log('Alert handled:', data);
      // Remove handled alert from list
      setActiveAlerts(prev => prev.filter(alert => alert.id !== data.id));
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
  }, [organizationId, isOrgAdmin, success]);

  useEffect(() => {
    if (!organizationId) {
      setActiveAlerts([]);
      return;
    }

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

    // Load organization alerts for sidebar/live view
    const loadVisitorAlerts = async () => {
      try {
        const response = await visitorService.getAlerts(organizationId);
        const rawAlerts = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.alerts)
            ? response.data.alerts
            : [];

        if (response?.success && rawAlerts.length > 0) {
          const transformedAlerts = rawAlerts.map(transformAlert).slice(0, 6);
          setActiveAlerts(transformedAlerts);
          return;
        }
        setActiveAlerts([]);
      } catch (error) {
        console.error('Error fetching visitor alerts:', error);
        setActiveAlerts([]);
      }
    };

    if (showActivityLog) {
      loadLogs();
    }
    
    loadVisitorAlerts();
  }, [organizationId, activeTab, showActivityLog, showError]);

  useEffect(() => {
    if (!organizationId || isOrgAdmin) return;
    socketService.disconnect();
  }, [organizationId, isOrgAdmin]);

  const handleDismiss = (id) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== id));
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

          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader size="medium" />
            </div>
          ) : logs.length > 0 ? (
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
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No activity logs found for this organization.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationAlerts;
