import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { visitorService } from '../../../services/visitorService';
import Loader from '../../common/Loader';
import { useToast } from '../../../contexts/ToastContext';
import moment from 'moment';

const VisitorLogsList = ({ organizationId, refreshTrigger }) => {
  const { success, error: showError } = useToast();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [selectedTab, setSelectedTab] = useState('visitors');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [fromDate, setFromDate] = useState(moment().format('YYYY-MM-DD')); // Default to today
  const [toDate, setToDate] = useState(moment().format('YYYY-MM-DD')); // Default to today
  const [showAllData, setShowAllData] = useState(false); // Track if showing all data

  useEffect(() => {
    fetchVisitors();
  }, [organizationId, refreshTrigger, page, pageSize, fromDate, toDate, showAllData]);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize
      };

      // Only add date filters if not showing all data
      if (!showAllData) {
        params.from_date = fromDate;
        params.to_date = toDate;
      }

      console.log('📋 Fetching visitors for organization:', {
        organizationId,
        ...params
      });

      const response = await visitorService.getVisitorsByOrganization(organizationId, params);

      console.log('📊 Visitors response received:', {
        success: response?.success,
        visitorsLength: response?.data?.visitors?.length,
        totalCount: response?.data?.pagination?.total
      });

      if (response.success) {
        setVisitors(response.data?.visitors || []);
        console.log('✅ Visitors loaded:', response.data?.visitors?.length || 0);
      } else {
        console.warn('⚠️ Visitors response not successful:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching visitors:', error);
      console.error('Fetch error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      showError('Failed to load visitor logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await visitorService.getVisitorAlerts(organizationId);
      if (response.success) {
        setAlerts(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      showError('Failed to load visitor alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    if (tab === 'alerts') {
      fetchAlerts();
    }
  };

  const handlePresetDate = (type) => {
    const today = moment();
    let from, to;

    switch (type) {
      case 'today':
        from = today.format('YYYY-MM-DD');
        to = today.format('YYYY-MM-DD');
        setShowAllData(false);
        break;
      case 'thisWeek':
        from = today.clone().startOf('week').format('YYYY-MM-DD');
        to = today.format('YYYY-MM-DD');
        setShowAllData(false);
        break;
      case 'thisMonth':
        from = today.clone().startOf('month').format('YYYY-MM-DD');
        to = today.format('YYYY-MM-DD');
        setShowAllData(false);
        break;
      case 'all':
        setShowAllData(true);
        break;
      default:
        return;
    }

    if (type !== 'all') {
      setFromDate(from);
      setToDate(to);
    }
    setPage(1); // Reset to first page
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCheckout = async (visitorId) => {
    try {
      const response = await visitorService.checkOutVisitor(organizationId, visitorId, {});
      success('Visitor checked out successfully');
      fetchVisitors();
    } catch (error) {
      console.error('Error checking out visitor:', error);
      const errorMessage = error.response?.data?.message || 'Failed to check out visitor';
      showError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs and Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Tabs - Left Side */}
        <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => handleTabChange('visitors')}
            className={`px-6 py-2.5 font-semibold rounded-md transition-all duration-300 flex items-center gap-2 ${selectedTab === 'visitors'
              ? 'bg-white text-indigo-600 shadow-md'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            👥 Active Visitors
          </button>
          <button
            onClick={() => handleTabChange('alerts')}
            className={`px-6 py-2.5 font-semibold rounded-md transition-all duration-300 flex items-center gap-2 ${selectedTab === 'alerts'
              ? 'bg-white text-indigo-600 shadow-md'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            ⚠️ Alerts
          </button>
        </div>

        {/* Filters - Right Side */}
        {selectedTab === 'visitors' && (
          <div className="flex items-center gap-3 flex-wrap bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Date Range:
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setShowAllData(false);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-sm hover:border-indigo-400 transition-colors"
            />
            <span className="text-gray-400 font-semibold">→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setShowAllData(false);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-sm hover:border-indigo-400 transition-colors"
            />
            <button
              onClick={() => handlePresetDate('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 border whitespace-nowrap ${showAllData
                ? 'bg-orange-600 text-white border-orange-600 shadow-lg'
                : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300 hover:bg-orange-50'
                }`}
            >
              All Data
            </button>
          </div>
        )}
      </div>

      {/* Visitors Tab Content */}
      {selectedTab === 'visitors' && (
        <div className="space-y-4">
          {/* Visitors Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader size="large" />
              </div>
            ) : visitors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-600 font-semibold text-lg">No visitors found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your date range filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-indigo-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Mobile
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Allowed Floor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Check-in Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Check-out Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Photo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {visitors.map((visitor) => (
                      <tr key={visitor.id} className="hover:bg-indigo-50 transition-colors duration-150">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {visitor.visitor_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {visitor.mobile_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                            {visitor.purpose_of_visit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                            {visitor.allowed_floor}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDateTime(visitor.check_in_time)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {visitor.check_out_time ? (
                            formatDateTime(visitor.check_out_time)
                          ) : (
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                              ✅ Checked In
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {visitor.image_base64 ? (
                            <button
                              onClick={() => {
                                const img = new Image();
                                img.src = visitor.image_base64;
                                const w = window.open('');
                                w.document.write(img.outerHTML);
                              }}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors duration-200 text-xs font-semibold"
                            >
                              📷 View
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">No photo</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {!visitor.check_out_time && (
                            <button
                              onClick={() => handleCheckout(visitor.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 text-xs font-semibold"
                            >
                              🚪 Check Out
                            </button>
                          )}
                          {visitor.check_out_time && (
                            <span className="text-green-700 text-xs font-bold">
                              ✓ Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {visitors.length > 0 && (
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-xl">
                <div className="text-sm text-gray-600 font-semibold">
                  <span className="text-indigo-600">{page}</span><span className="text-gray-400">/10</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-8 py-2 bg-white border border-gray-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all font-semibold text-lg"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    className="px-8 py-2 bg-white border border-gray-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all font-semibold text-lg"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <div className="bg-teal-50/95 rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size="large" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-gray-600 font-semibold">No alerts recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-50 border-b border-red-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                      Visitor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                      Alert Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                      Unauthorized Floor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                      Allowed Floor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-red-700 uppercase tracking-wider">
                      Alert Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-200">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-red-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {alert.visitor_name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                          ⚠️ Floor Violation
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-red-600">
                        {alert.current_floor}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {alert.allowed_floor}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateTime(alert.alert_time)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitorLogsList;
