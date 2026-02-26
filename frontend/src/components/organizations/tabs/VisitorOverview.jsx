import React, { useState, useEffect } from 'react';
import { visitorService } from '../../../services/visitorService';
import { useToast } from '../../../contexts/ToastContext';
import { RefreshCw, Users, TrendingUp, AlertTriangle, MapPin, BarChart3 } from 'lucide-react';
import Loader from '../../common/Loader';

const VisitorOverview = ({ organizationId, refreshTrigger }) => {
  const { error: showError, success } = useToast();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchOverviewStats();

    // Auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(fetchOverviewStats, 30000);
      return () => clearInterval(interval);
    }
  }, [organizationId, refreshTrigger, autoRefresh]);

  const fetchOverviewStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching overview statistics for org:', organizationId);

      const response = await visitorService.getOverviewStats(organizationId);

      if (response.success) {
        setOverview(response.data.overview);
        console.log('✅ Overview stats received:', response.data.overview);
      } else {
        showError(response.message || 'Failed to fetch overview statistics');
      }
    } catch (error) {
      console.error('❌ Failed to fetch overview stats:', error);
      showError(
        error.response?.data?.message || 'Failed to load visitor overview'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !overview) {
    return <Loader fullScreen={false} text="Loading overview..." />;
  }

  if (!overview) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-600 font-medium">Unable to load visitor statistics</p>
        <button
          onClick={fetchOverviewStats}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Stat cards
  const StatCard = ({ icon: Icon, label, value, color = 'blue', trend }) => (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-${color}-600 text-sm font-medium`}>{label}</p>
          <p className={`text-${color}-900 text-3xl font-bold mt-2`}>{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">
              {trend > 0 ? '📈' : '📉'} {Math.abs(trend)} from yesterday
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 text-${color}-500 opacity-20`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Visitor Overview Dashboard
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Real-time visitor management statistics
          </p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-600">Auto-refresh</span>
          </label>
          <button
            onClick={fetchOverviewStats}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
            title="Refresh Statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Active Visitors"
          value={overview.active_visitors}
          color="blue"
          trend={overview.active_visitors > 0 ? 2 : -1}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Entries Today"
          value={overview.total_entries_today}
          color="green"
          trend={overview.total_entries_today > 10 ? 5 : 0}
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={overview.active_alerts}
          color="red"
          trend={overview.active_alerts > 0 ? 1 : -2}
        />
        <StatCard
          icon={Users}
          label="Total Visitors"
          value={overview.total_visitors}
          color="purple"
          trend={overview.total_visitors > 40 ? 3 : 1}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Movement Logs */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h4 className="font-semibold text-slate-900">Floor Movements</h4>
          </div>
          <p className="text-3xl font-bold text-teal-600">
            {overview.logged_movements}
          </p>
          <p className="text-sm text-slate-500 mt-1">movements logged today</p>
        </div>

        {/* Visitor Types */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3">Visitor Types</h4>
          <div className="space-y-2">
            {Object.entries(overview.visitor_types_breakdown || {}).map(
              ([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 capitalize">
                    {type}
                  </span>
                  <span className="inline-block bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                    {count}
                  </span>
                </div>
              )
            )}
            {!overview.visitor_types_breakdown ||
            Object.keys(overview.visitor_types_breakdown).length === 0 ? (
              <p className="text-sm text-slate-400 italic">No data available</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-right text-xs text-slate-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default VisitorOverview;
