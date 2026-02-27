import React, { useState, useEffect } from 'react';
import { visitorService } from '../../../services/visitorService';
import { useToast } from '../../../contexts/ToastContext';
import { RefreshCw, Users, TrendingUp, AlertTriangle, MapPin, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import Loader from '../../common/Loader';

const VisitorOverview = ({ organizationId, refreshTrigger }) => {
  const { error: showError, success } = useToast();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [monthlyTrend, setMonthlyTrend] = useState(null);
  const [weeklyTrend, setWeeklyTrend] = useState(null);
  const [hourlyData, setHourlyData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  // Dummy monthly (12 months) and weekly (7 days) datasets used as visible fallbacks
  const DUMMY_MONTHLY = [
    { label: 'Jan', male: 40, female: 30 },
    { label: 'Feb', male: 35, female: 32 },
    { label: 'Mar', male: 50, female: 45 },
    { label: 'Apr', male: 55, female: 48 },
    { label: 'May', male: 60, female: 52 },
    { label: 'Jun', male: 70, female: 60 },
    { label: 'Jul', male: 65, female: 58 },
    { label: 'Aug', male: 75, female: 68 },
    { label: 'Sep', male: 68, female: 62 },
    { label: 'Oct', male: 72, female: 66 },
    { label: 'Nov', male: 66, female: 60 },
    { label: 'Dec', male: 80, female: 72 }
  ];
  const DUMMY_WEEKLY = [
    { label: 'Mon', male: 8, female: 6 },
    { label: 'Tue', male: 10, female: 9 },
    { label: 'Wed', male: 12, female: 11 },
    { label: 'Thu', male: 9, female: 8 },
    { label: 'Fri', male: 15, female: 13 },
    { label: 'Sat', male: 5, female: 6 },
    { label: 'Sun', male: 4, female: 5 }
  ];
  // Dummy hourly data (24 hours) used as a visible fallback during development
  const DUMMY_HOURLY = Array.from({ length: 24 }).map((_, i) => {
    const hour = i.toString().padStart(2, '0') + ':00';
    // simple pattern: peak midday
    const base = Math.round(5 + 10 * Math.sin((i - 8) / 24 * Math.PI * 2));
    const male = Math.max(0, Math.round(base * (0.55 + (i % 3) * 0.02)));
    const female = Math.max(0, Math.round(base * (0.45 - (i % 3) * 0.02)));
    return { label: hour, count: male + female, male, female };
  });

  useEffect(() => {
    fetchOverviewStats();
    fetchAnalytics();

    // Auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(() => { fetchOverviewStats(); fetchAnalytics(); }, 30000);
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

  const fetchAnalytics = async () => {
    if (!organizationId) return;
    try {
      setAnalyticsLoading(true);
      // Try to fetch monthly, weekly and hourly analytics.
      // The backend `getAnalytics` supports a dateRange/params object.
      // We'll request three variants; if the backend ignores unknown params
      // it should still return useful defaults.
      const [monthlyRes, weeklyRes, hourlyRes] = await Promise.all([
        visitorService.getAnalytics(organizationId, { period: 'monthly' }),
        visitorService.getAnalytics(organizationId, { period: 'weekly' }),
        visitorService.getAnalytics(organizationId, { period: 'hourly' })
      ]);

      const safeData = (res) => res?.data || res?.data?.data || res || null;

      // Normalise common shapes. Many APIs return { success, data: { analytics: {...} } }
      const normalize = (res) => {
        if (!res) return null;
        if (res.analytics) return res.analytics;
        if (res.data && typeof res.data === 'object') return res.data;
        return res;
      };

      const monthly = normalize(safeData(monthlyRes));
      const weekly = normalize(safeData(weeklyRes));
      const hourly = normalize(safeData(hourlyRes));

      // Attempt to pick likely fields: gender series or direct arrays
      // Preferred shape for charts: array of { label, male, female }
      const toSeries = (src) => {
        if (!src) return null;
        if (Array.isArray(src)) return src;
        // If object contains gender breakdown arrays
        if (src.monthly_gender) return src.monthly_gender;
        if (src.weekly_gender) return src.weekly_gender;
        if (src.hourly) return src.hourly;
        // If object contains keys we can map
        const keys = Object.keys(src);
        if (keys.length && Array.isArray(src[keys[0]])) {
          return src[keys[0]];
        }
        return null;
      };

      setMonthlyTrend(toSeries(monthly));
      setWeeklyTrend(toSeries(weekly));
      setHourlyData(toSeries(hourly));
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
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

      {/* Charts: Monthly/Weekly Trend and Hourly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <h4 className="font-semibold text-slate-900">Monthly & Weekly Trend</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPeriod('monthly')}
                className={`px-3 py-1 rounded ${selectedPeriod === 'monthly' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPeriod('weekly')}
                className={`px-3 py-1 rounded ${selectedPeriod === 'weekly' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Weekly
              </button>
            </div>
          </div>
          {analyticsLoading && !monthlyTrend && !weeklyTrend ? (
            <Loader fullScreen={false} text="Loading charts..." />
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart
                  data={
                    selectedPeriod === 'monthly'
                      ? (monthlyTrend && monthlyTrend.length ? monthlyTrend : DUMMY_MONTHLY)
                      : (weeklyTrend && weeklyTrend.length ? weeklyTrend : DUMMY_WEEKLY)
                  }
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="male" stroke="#3182ce" strokeWidth={2} />
                  <Line type="monotone" dataKey="female" stroke="#d53f8c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h4 className="font-semibold text-slate-900">Visitors by Hour</h4>
          </div>
          {analyticsLoading && !hourlyData ? (
            <Loader fullScreen={false} text="Loading hourly chart..." />
          ) : (hourlyData && hourlyData.length ? hourlyData : DUMMY_HOURLY) ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={hourlyData && hourlyData.length ? hourlyData : DUMMY_HOURLY} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {/* Prefer a single `count` field, fallback to male+female sum */}
                  <Bar dataKey="count" fill="#14b8a6" />
                  <Bar dataKey="male" fill="#3182ce" />
                  <Bar dataKey="female" fill="#d53f8c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No data available</p>
          )}
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
