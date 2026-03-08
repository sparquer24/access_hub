import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { auditAPI } from '../../../services/apiServices';
import { visitorService } from '../../../services/visitorService';
import { socketService } from '../../../services/socketService';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../common/Loader';

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

const normalizeType = (alertType) => {
  const value = (alertType || '').toLowerCase();
  if (['unauthorized', 'blacklist_hit', 'critical'].includes(value)) return 'critical';
  if (['overstay', 'warning'].includes(value)) return 'warning';
  if (['authorized', 'success'].includes(value)) return 'success';
  return 'info';
};

const toImageSrc = (annotatedImageBase64) => {
  if (!annotatedImageBase64) return null;
  if (annotatedImageBase64.startsWith('data:image')) return annotatedImageBase64;
  return `data:image/jpeg;base64,${annotatedImageBase64}`;
};

const toUiAlert = (alert) => {
  const alertType = alert?.alert_type || 'unknown';
  const alertTime = alert?.alert_time ? new Date(alert.alert_time) : null;
  return {
    id: alert?.id,
    visitorId: alert?.visitor_id || 'N/A',
    visitorName: alert?.visitor_name || null,
    cameraId: alert?.camera_id || null,
    alertType,
    severity: normalizeType(alertType),
    alertTimeLabel: alertTime ? alertTime.toLocaleString('en-IN') : 'Unknown time',
    status: alert?.alert_status || 'yet_to_handle',
    annotatedImageBase64: alert?.annotated_image_base64 || null
  };
};

const extractAlerts = (responsePayload) => {
  if (Array.isArray(responsePayload?.data?.alerts)) return responsePayload.data.alerts;
  if (Array.isArray(responsePayload?.data)) return responsePayload.data;
  return [];
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-IN');
};

const OrganizationAlerts = ({ organizationId, activeTab = 'info', showActivityLog = true, onCloseSidebar }) => {
  const { success, error: showError } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [imagePreview, setImagePreview] = useState({ open: false, src: null });
  const [handlingAlertIds, setHandlingAlertIds] = useState({});
  const activeHeader = TAB_HEADERS[activeTab] || 'Organization Overview';

  const getAlertIcon = (severity) => {
    if (severity === 'critical') return '!';
    if (severity === 'warning') return '△';
    if (severity === 'success') return '✓';
    return 'i';
  };

  const getSeverityStyles = (severity) => {
    if (severity === 'critical') {
      return { border: 'border-l-red-400', iconWrap: 'bg-red-100 text-red-600', badge: 'bg-red-50 text-red-700 border-red-200' };
    }
    if (severity === 'warning') {
      return { border: 'border-l-amber-400', iconWrap: 'bg-amber-100 text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (severity === 'success') {
      return { border: 'border-l-emerald-400', iconWrap: 'bg-emerald-100 text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { border: 'border-l-blue-400', iconWrap: 'bg-blue-100 text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
  };

  const loadAlerts = useCallback(async ({ silent = false } = {}) => {
    if (!organizationId) return;
    try {
      if (!silent) setLoadingAlerts(true);
      const response = await visitorService.getAlerts(organizationId, {
        unacknowledged_only: true,
        limit: 100
      });
      const rawAlerts = extractAlerts(response);
      setAlerts(rawAlerts.map(toUiAlert));
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      showError('Failed to fetch alerts');
      setAlerts([]);
    } finally {
      if (!silent) setLoadingAlerts(false);
    }
  }, [organizationId, showError]);

  const loadLogs = useCallback(async () => {
    if (!showActivityLog || !organizationId) return;
    try {
      setLoadingLogs(true);
      const response = await auditAPI.getByEntity('organizations', organizationId);
      setLogs(response.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      showError('Failed to fetch audit logs');
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [organizationId, showActivityLog, showError]);

  useEffect(() => {
    loadAlerts();
    loadLogs();
  }, [loadAlerts, loadLogs]);

  useEffect(() => {
    if (!organizationId) return;

    socketService.connect(organizationId);
    setTimeout(() => {
      socketService.subscribeToAlerts(organizationId);
    }, 300);

    const handleNewAlert = (payload) => {
      // Socket payload is intentionally lightweight; fetch full row (with image) from API.
      if (!payload?.id) return;
      loadAlerts({ silent: true });
    };

    const handleAlertHandled = (payload) => {
      if (!payload?.id) return;
      setAlerts((prev) => prev.filter((item) => item.id !== payload.id));
    };

    socketService.on('new_alert', handleNewAlert);
    socketService.on('alert_handled', handleAlertHandled);

    return () => {
      socketService.off('new_alert', handleNewAlert);
      socketService.off('alert_handled', handleAlertHandled);
    };
  }, [organizationId, loadAlerts]);

  const handleViewImage = (alert) => {
    const src = toImageSrc(alert.annotatedImageBase64);
    if (!src) return;
    setImagePreview({ open: true, src });
  };

  const handleMarkHandled = async (alertId) => {
    if (!organizationId || !alertId) return;

    setHandlingAlertIds((prev) => ({ ...prev, [alertId]: true }));
    try {
      await visitorService.acknowledgeAlert(organizationId, alertId);
      setAlerts((prev) => prev.filter((item) => item.id !== alertId));
      success('Alert marked as handled');
    } catch (err) {
      console.error('Failed to mark alert handled:', err);
      showError('Failed to mark alert handled');
    } finally {
      setHandlingAlertIds((prev) => {
        const next = { ...prev };
        delete next[alertId];
        return next;
      });
    }
  };

  const renderAlertCard = (alert) => {
    const styles = getSeverityStyles(alert.severity);
    const hasImage = Boolean(alert.annotatedImageBase64);

    return (
      <div
        key={alert.id}
        className={`p-2 rounded-lg border border-gray-100 border-l-4 ${styles.border} bg-white shadow-sm`}
      >
        <div className="flex items-start gap-2">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 ${styles.iconWrap}`}>
            {getAlertIcon(alert.severity)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-slate-800 truncate">{alert.alertType}</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${styles.badge}`}>
                {alert.severity}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 truncate mt-1">
              {alert.visitorName ? `${alert.visitorName} (${alert.visitorId})` : alert.visitorId}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{alert.alertTimeLabel}</p>
            <div className="mt-2 flex items-center gap-2">
              {hasImage && (
                <button
                  type="button"
                  onClick={() => handleViewImage(alert)}
                  className="text-[10px] px-2 py-1 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  View Image
                </button>
              )}
              <button
                type="button"
                onClick={() => handleMarkHandled(alert.id)}
                disabled={Boolean(handlingAlertIds[alert.id])}
                className="text-[10px] px-2 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
              >
                {handlingAlertIds[alert.id] ? 'Handling...' : 'Mark Handled'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActivityLogContent = () => {
    if (loadingLogs) {
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
      <>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
          <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-red-800 leading-tight">Alerts {alerts.length}</p>
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

          <div className="p-2 space-y-2 flex-1 overflow-y-auto">
            {loadingAlerts ? (
              <div className="py-8 flex justify-center">
                <Loader size="small" />
              </div>
            ) : alerts.length > 0 ? (
              alerts.map(renderAlertCard)
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">No active alerts</div>
            )}
          </div>
        </div>

        {imagePreview.open && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setImagePreview({ open: false, src: null })}
          >
            <div className="bg-white rounded-lg p-2 max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setImagePreview({ open: false, src: null })}
                  className="p-1 rounded text-slate-600 hover:bg-slate-100"
                  aria-label="Close image preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <img src={imagePreview.src} alt="Annotated alert" className="max-w-full h-auto rounded" />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-teal-50/95 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-teal-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-medium text-gray-500">{activeHeader}</h3>
            <p className="text-base font-bold text-gray-900">Active Alerts</p>
          </div>
          <span className="text-xs font-medium text-gray-500">{alerts.length} active</span>
        </div>
        <div className="p-3 space-y-2">
          {loadingAlerts ? (
            <div className="py-8 flex justify-center"><Loader size="small" /></div>
          ) : alerts.length > 0 ? (
            alerts.map(renderAlertCard)
          ) : (
            <div className="py-8 text-center text-gray-500">No active alerts at this time.</div>
          )}
        </div>
      </div>

      {showActivityLog && (
        <div className="bg-teal-50/95 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-teal-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Activity Log</h3>
          </div>
          {loadingLogs ? (
            <div className="p-8 flex justify-center"><Loader size="medium" /></div>
          ) : logs.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-teal-50 transition-colors">
                  <p className="font-medium text-gray-900">{log.action}</p>
                  <p className="text-sm text-gray-600 mt-1">{log.details || 'No details provided'}</p>
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

OrganizationAlerts.propTypes = {
  organizationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  activeTab: PropTypes.string,
  showActivityLog: PropTypes.bool,
  onCloseSidebar: PropTypes.func,
  onAlertCountChange: PropTypes.func
};

export default OrganizationAlerts;
