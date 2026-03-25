import React, { useState, useEffect } from 'react';
import { visitorService } from '../../../services/visitorService';
import { useToast } from '../../../contexts/ToastContext';
import { Users, TrendingUp, MapPin, BarChart3 } from 'lucide-react';
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
  const [autoRefresh] = useState(true);
  const [monthlyTrend, setMonthlyTrend] = useState(null);
  const [weeklyTrend, setWeeklyTrend] = useState(null);
  const [hourlyData, setHourlyData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  useEffect(() => {
    fetchOverviewStats();
    fetchAnalytics(selectedPeriod);

    // Auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchOverviewStats();
        fetchAnalytics(selectedPeriod);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [organizationId, refreshTrigger, autoRefresh, selectedPeriod]);

  const fetchOverviewStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching overview statistics for org:', organizationId);

      const response = await visitorService.getOverviewStats(organizationId);

      if (response.success) {
        const overviewData = response.data?.overview || response.data || null;
        setOverview(overviewData);
        console.log('✅ Overview stats received:', overviewData);
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

  const fetchAnalytics = async (period = 'monthly') => {
    if (!organizationId) return;
    try {
      setAnalyticsLoading(true);
      // Fetch trend data for the active period and hourly data.
      const [trendRes, hourlyRes] = await Promise.all([
        visitorService.getAnalytics(organizationId, { period }),
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

      const trend = normalize(safeData(trendRes));
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

      const trendSeries = toSeries(trend);
      if (period === 'monthly') {
        setMonthlyTrend(trendSeries);
      } else {
        setWeeklyTrend(trendSeries);
      }
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

  const activeTrendData = selectedPeriod === 'monthly' ? monthlyTrend : weeklyTrend;
  const hasTrendData = Array.isArray(activeTrendData) && activeTrendData.length > 0;
  const hasHourlyData = Array.isArray(hourlyData) && hourlyData.length > 0;
  const chartTooltipStyle = {
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
  };

  // Stat cards
  const StatCard = ({ icon: Icon, label, value, color = 'blue', trend, uppercaseLabel = false, compactLabel = false }) => {
    const colorStyles = {
      blue: {
        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        border: 'border-blue-200/70',
        label: 'text-blue-700',
        value: 'text-blue-900',
        iconBg: 'bg-white/70',
        icon: 'text-indigo-500',
        trend: 'text-slate-500'
      },
      green: {
        bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
        border: 'border-emerald-200/70',
        label: 'text-emerald-700',
        value: 'text-emerald-900',
        iconBg: 'bg-white/70',
        icon: 'text-emerald-600',
        trend: 'text-slate-500'
      },
      purple: {
        bg: 'bg-gradient-to-br from-violet-50 to-indigo-50',
        border: 'border-violet-200/70',
        label: 'text-violet-700',
        value: 'text-violet-900',
        iconBg: 'bg-white/70',
        icon: 'text-violet-600',
        trend: 'text-slate-500'
      }
    };

    const styles = colorStyles[color] || colorStyles.blue;
    const labelClass = uppercaseLabel
      ? `text-sm font-bold tracking-wider uppercase ${styles.label}`
      : compactLabel
        ? `text-lg font-semibold ${styles.label}`
        : `text-2xl font-semibold ${styles.label}`;

    return (
      <div className={`relative overflow-hidden rounded-xl border ${styles.border} ${styles.bg} p-5 shadow-sm backdrop-blur-sm`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={labelClass}>{label}</p>
            <p className={`text-4xl font-bold mt-2 leading-none ${styles.value}`}>{value ?? 0}</p>
            {typeof trend === 'number' && trend !== 0 && (
              <p className={`text-xs font-medium mt-3 ${styles.trend}`}>
                ☑ {Math.abs(trend)} from yesterday
              </p>
            )}
          </div>
          <div className={`rounded-xl p-2.5 border border-white/70 ${styles.iconBg}`}>
            <Icon className={`w-6 h-6 ${styles.icon}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-slate-100/60 p-4 overflow-y-auto max-h-[calc(100vh-310px)] pb-16">
      {/* Top Summary Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            icon={Users}
            label="Active Visitors"
            value={overview.active_visitors}
            color="blue"
            trend={overview.active_visitors > 0 ? 2 : -1}
            uppercaseLabel
          />
          <StatCard
            icon={TrendingUp}
            label="Total Entries Today"
            value={overview.total_entries_today}
            color="green"
            trend={overview.total_entries_today > 10 ? 5 : 1}
            compactLabel
          />
          <div className="md:col-span-2">
            <StatCard
              icon={Users}
              label="Total Visitors"
              value={overview.total_visitors}
              color="purple"
              trend={overview.total_visitors > 40 ? 3 : 1}
              uppercaseLabel
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/90 to-teal-50/70 border border-slate-200/80 rounded-xl p-4 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-teal-600" />
            <h4 className="font-semibold text-slate-900 text-lg">Visitor Types</h4>
          </div>
          <div className="space-y-2.5">
            {Object.entries(overview.visitor_types_breakdown || {}).map(
              ([type, count]) => (
                <div
                  key={type}
                  className="flex justify-between items-center rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2.5 transition-all duration-200 hover:border-teal-200 hover:bg-teal-50/60"
                >
                  <span className="text-sm font-medium text-slate-700 capitalize">{type}</span>
                  <span className="inline-flex min-w-9 h-9 items-center justify-center bg-teal-100 text-teal-700 ring-1 ring-teal-200 rounded-full text-sm font-semibold px-2">
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
        <div className="bg-white/80 border border-slate-200/90 rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <h4 className="font-semibold text-slate-900">Monthly & Weekly Trend</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPeriod('monthly')}
                className={`px-3 py-1 rounded transition-all duration-200 ${selectedPeriod === 'monthly' ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPeriod('weekly')}
                className={`px-3 py-1 rounded transition-all duration-200 ${selectedPeriod === 'weekly' ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Weekly
              </button>
            </div>
          </div>
          {analyticsLoading && !hasTrendData ? (
            <Loader fullScreen={false} text="Loading charts..." />
          ) : hasTrendData ? (
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <LineChart
                  data={activeTrendData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    cursor={{ stroke: '#14b8a6', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 8 }} iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="male"
                    stroke="#3182ce"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 6, strokeWidth: 2, fill: '#ffffff' }}
                    isAnimationActive
                    animationDuration={650}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="female"
                    stroke="#d53f8c"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 6, strokeWidth: 2, fill: '#ffffff' }}
                    isAnimationActive
                    animationDuration={650}
                    animationEasing="ease-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No data available</p>
          )}
        </div>

        <div className="bg-white/80 border border-slate-200/90 rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-teal-600" />
            <h4 className="font-semibold text-slate-900">Visitors by Hour</h4>
          </div>
          {analyticsLoading && !hasHourlyData ? (
            <Loader fullScreen={false} text="Loading hourly chart..." />
          ) : hasHourlyData ? (
            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer>
                <BarChart data={hourlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    cursor={{ fill: 'rgba(20, 184, 166, 0.08)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 8 }} iconType="circle" />
                  {/* Prefer a single `count` field, fallback to male+female sum */}
                  <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out" />
                  <Bar dataKey="male" fill="#3182ce" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out" />
                  <Bar dataKey="female" fill="#d53f8c" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700} animationEasing="ease-out" />
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
