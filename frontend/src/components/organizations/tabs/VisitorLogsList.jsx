import React, { useState, useEffect, useCallback } from 'react';
import { visitorService } from '../../../services/visitorService';
import Loader from '../../common/Loader';
import { useToast } from '../../../contexts/ToastContext';
import moment from 'moment';

const VisitorLogsList = ({ organizationId, refreshTrigger }) => {
  const { success, error: showError } = useToast();
  const [visitors, setVisitors] = useState([]);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('logs');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [fromDate, setFromDate] = useState(moment().format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(moment().format('YYYY-MM-DD'));
  const [showAllData, setShowAllData] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [checkingOutId, setCheckingOutId] = useState(null);

  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: pageSize };
      if (!showAllData) {
        params.from_date = fromDate;
        params.to_date = toDate;
      }
      const response = await visitorService.getVisitorsByOrganization(organizationId, params);
      if (response.success) {
        setVisitors(response.data?.visitors || []);
        setTotalCount(response.data?.pagination?.total || 0);
      }
    } catch (error) {
      showError('Failed to load visitor logs');
    } finally {
      setLoading(false);
    }
  }, [organizationId, page, pageSize, fromDate, toDate, showAllData]);

  const fetchActiveVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await visitorService.getActiveVisitors(organizationId);
      if (response.success) {
        setActiveVisitors(response.data || []);
      }
    } catch (error) {
      showError('Failed to load active visitors');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
      if (!showAllData) {
        params.date_from = fromDate;
        params.date_to = toDate;
      }
      const response = await visitorService.getVisitorLogsNew(organizationId, params);
      if (response.success) {
        setLogs(response.data?.logs || []);
        setTotalCount(response.data?.total || 0);
      }
    } catch (error) {
      showError('Failed to load floor logs');
    } finally {
      setLoading(false);
    }
  }, [organizationId, page, pageSize, fromDate, toDate, showAllData]);

  useEffect(() => {
    if (selectedTab === 'active') fetchActiveVisitors();
    else if (selectedTab === 'logs') fetchLogs();
    else fetchVisitors();
  }, [organizationId, refreshTrigger, selectedTab, page, fromDate, toDate, showAllData]);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setPage(1);
    setTotalCount(0);
  };

  const handlePresetDate = (type) => {
    const today = moment();
    if (type === 'all') {
      setShowAllData(true);
    } else {
      let from, to;
      if (type === 'today') {
        from = to = today.format('YYYY-MM-DD');
      } else if (type === 'thisWeek') {
        from = today.clone().startOf('week').format('YYYY-MM-DD');
        to = today.format('YYYY-MM-DD');
      } else if (type === 'thisMonth') {
        from = today.clone().startOf('month').format('YYYY-MM-DD');
        to = today.format('YYYY-MM-DD');
      }
      setFromDate(from);
      setToDate(to);
      setShowAllData(false);
    }
    setPage(1);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // --- Check-out using new API (history_id) ---
  const handleCheckout = async (visitor) => {
    const historyId = visitor.history_id || visitor.id;
    setCheckingOutId(historyId);
    try {
      const response = await visitorService.checkOutVisitorNew(organizationId, historyId);
      if (response.success) {
        success('Visitor checked out successfully');
        fetchActiveVisitors();
      } else {
        showError(response.message || 'Failed to check out visitor');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to check out visitor');
    } finally {
      setCheckingOutId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // --- Date Filter Bar (shared) ---
  const DateFilterBar = () => (
    <div className="flex items-center gap-3 flex-wrap bg-white rounded-lg p-3 shadow-sm border border-gray-200">
      <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Date Range:</label>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => { setFromDate(e.target.value); setShowAllData(false); setPage(1); }}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
      />
      <span className="text-gray-400 font-semibold">→</span>
      <input
        type="date"
        value={toDate}
        onChange={(e) => { setToDate(e.target.value); setShowAllData(false); setPage(1); }}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
      />
      {['today', 'thisWeek', 'thisMonth', 'all'].map((preset) => (
        <button
          key={preset}
          onClick={() => handlePresetDate(preset)}
          className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all border whitespace-nowrap ${(preset === 'all' && showAllData)
              ? 'bg-orange-600 text-white border-orange-600 shadow-lg'
              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
            }`}
        >
          {{ today: 'Today', thisWeek: 'This Week', thisMonth: 'This Month', all: 'All Data' }[preset]}
        </button>
      ))}
    </div>
  );

  // --- Pagination ---
  const Pagination = () => (
    <div className="bg-gradient-to-r from-gray-50 to-indigo-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-xl">
      <span className="text-sm text-gray-600 font-semibold">
        Page <span className="text-indigo-600">{page}</span> of {totalPages}
        {totalCount > 0 && <span className="text-gray-400 ml-2">({totalCount} total)</span>}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-8 py-2 bg-white border border-gray-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg"
        >←</button>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-8 py-2 bg-white border border-gray-300 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg"
        >→</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Header + Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'active', label: '👥 Active Visitors' },
              { key: 'logs', label: '📍 Floor Logs' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`px-5 py-2.5 font-semibold rounded-md transition-all duration-300 text-sm ${selectedTab === key
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date filter for tabs that support it */}
        {selectedTab === 'logs' && <DateFilterBar />}
      </div>

      {/* ===== ACTIVE VISITORS TAB ===== */}
      {selectedTab === 'active' && (
        <div className="bg-green-50 rounded-xl shadow-md overflow-hidden border border-green-200">
          {loading ? (
            <div className="flex justify-center items-center py-12"><Loader size="large" /></div>
          ) : activeVisitors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">🚪</p>
              <p className="text-gray-600 font-semibold text-lg">No active visitors</p>
              <p className="text-gray-500 text-sm mt-1">All visitors have checked out</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-100 border-b-2 border-green-300">
                  <tr>
                    {['#', 'Name', 'Phone', 'Type', 'Purpose', 'Floor', 'Check-in Time', 'Host', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold text-green-800 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-200">
                  {activeVisitors.map((visitor, index) => (
                    <tr key={visitor.history_id || visitor.id} className="hover:bg-green-100/50 transition-colors duration-150">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{index + 1}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{visitor.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{visitor.phone}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                          {visitor.visitor_type || 'Guest'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{visitor.purpose_of_visit || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                          {visitor.allowed_floor || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(visitor.check_in_time)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{visitor.host_name || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleCheckout(visitor)}
                          disabled={checkingOutId === (visitor.history_id || visitor.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-semibold disabled:opacity-50"
                        >
                          {checkingOutId === (visitor.history_id || visitor.id) ? '...' : '🚪 Check Out'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== FLOOR LOGS TAB ===== */}
      {selectedTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          {loading ? (
            <div className="flex justify-center items-center py-12"><Loader size="large" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📍</p>
              <p className="text-gray-600 font-semibold text-lg">No floor movement logs</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your date range</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-indigo-200">
                    <tr>
                      {['#', 'Visitor Name', 'Phone', 'Floor', 'Entry Time', 'Exit Time', 'Logged At'].map((h) => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-bold text-indigo-900 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log, index) => (
                      <tr key={log.id} className="hover:bg-indigo-50 transition-colors duration-150">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{log.visitor_name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.visitor_phone || '—'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                            {log.floor || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(log.entry_time)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {log.exit_time ? formatDateTime(log.exit_time) : (
                            <span className="text-green-600 text-xs font-semibold">Still on floor</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(log.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitorLogsList;
