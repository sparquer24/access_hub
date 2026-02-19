import React, { useState, useEffect } from 'react';
import { auditAPI } from '../../../services/apiServices';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../common/Loader';

const OrganizationAlerts = ({ organizationId }) => {
  const { success, error: showError } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [filter, setFilter] = useState('all'); // all, critical, warning, info

  useEffect(() => {
    fetchLogs();
    // Simulate fetching active alerts
    fetchActiveAlerts();
  }, [organizationId]);

  const fetchActiveAlerts = () => {
    // Mock data - in a real app, this would come from an API
    const mockAlerts = [
      { id: 1, type: 'critical', message: 'Camera "Main Entrance" is offline', timestamp: new Date().toISOString() },
      { id: 2, type: 'warning', message: 'License expiring in 15 days', timestamp: new Date().toISOString() },
      { id: 3, type: 'info', message: 'System maintenance scheduled for Sunday', timestamp: new Date().toISOString() },
    ];
    setActiveAlerts(mockAlerts);
  };

  const handleDismiss = (id) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== id));
    success('Alert dismissed');
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Assuming 'organizations' is the entity type
      const response = await auditAPI.getByEntity('organizations', organizationId);
      setLogs(response.data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      showError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-teal-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const filteredAlerts = activeAlerts.filter(alert => filter === 'all' || alert.type === filter);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Active Alerts Section */}
      <div className="bg-teal-50/95 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-teal-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            🔔 Active Alerts
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === 'critical' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === 'warning' ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
            >
              Warning
            </button>
          </div>
        </div>

        {filteredAlerts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 border-l-4 ${alert.type === 'critical' ? 'border-l-red-500' :
                  alert.type === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
                } hover:bg-teal-50 transition-colors`}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <span className="text-xl">{getAlertIcon(alert.type)}</span>
                    <div>
                      <p className="font-bold text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(alert.timestamp)}</p>
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
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <p>No active alerts at this time.</p>
          </div>
        )}
      </div>

      {/* Activity Log / Audit Trail */}
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
                    <span className="text-xs font-medium text-teal-600 block mt-1">{log.performed_by_username}</span>
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
    </div>
  );
};

export default OrganizationAlerts;
