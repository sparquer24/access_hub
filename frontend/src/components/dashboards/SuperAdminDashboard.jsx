import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { statsAPI } from '../../services/api';
import Loader from '../common/Loader';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/Dashboard.css';
import { getThemeClasses, getRoleBasedTheme } from '../../utils/roleBasedTheme';

import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  AlertCircle,
  CheckSquare,
  Users2,
  TrendingUp,
  Smartphone,
  Lock,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import DashboardHeader from '../common/dashboard/DashboardHeader';
import StatCard from '../common/dashboard/StatCard';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  
  // Role-based theming
  const theme = getRoleBasedTheme(user);
  const themeClasses = getThemeClasses(user);

  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsMetrics, setAnalyticsMetrics] = useState(null);

  // Calculate organization health score
  const calculateOrganizationHealth = (data) => {
    let healthScore = 100;
    
    if (data.organizations?.total > 0) {
      const activeRate = data.organizations.active / data.organizations.total;
      if (activeRate < 0.8) healthScore -= 10;
    }
    
    if (data.cameras?.total > 0) {
      const onlineRate = data.cameras.online / data.cameras.total;
      if (onlineRate < 0.9) healthScore -= 15;
    }
    
    if (data.presence_events?.anomalies > 0) {
      healthScore -= Math.min(10, Math.floor(data.presence_events.anomalies / 10));
    }
    
    return Math.max(0, Math.min(100, healthScore));
  };

  // Calculate derived metrics
  useEffect(() => {
    if (!statsData) return;

    const metrics = {
      organizationHealth: calculateOrganizationHealth(statsData),
      cameraUtilization: statsData.cameras?.total > 0 
        ? Math.round((statsData.cameras.online / statsData.cameras.total) * 100)
        : 0,
      employeeEngagement: statsData.employees?.total > 0
        ? Math.round((statsData.employees.active / statsData.employees.total) * 100)
        : 0,
      faceQuality: statsData.face_embeddings?.avg_quality 
        ? Math.round(statsData.face_embeddings.avg_quality * 100)
        : 0,
      anomalyRate: statsData.presence_events?.total > 0
        ? Math.round((statsData.presence_events.anomalies / statsData.presence_events.total) * 100)
        : 0,
      unknownFaceRate: statsData.presence_events?.total > 0
        ? Math.round((statsData.presence_events.unknown_faces / statsData.presence_events.total) * 100)
        : 0,
    };

    setAnalyticsMetrics(metrics);
  }, [statsData]);

  // Generate trend data for charts
  const getTrendData = () => {
    if (!statsData) return [];
    
    return [
      {
        name: 'Org',
        value: statsData.organizations?.total || 0,
        active: statsData.organizations?.active || 0,
      },
      {
        name: 'Emp',
        value: statsData.employees?.total || 0,
        active: statsData.employees?.active || 0,
      },
      {
        name: 'Cam',
        value: statsData.cameras?.total || 0,
        active: statsData.cameras?.online || 0,
      },
      {
        name: 'Face',
        value: statsData.face_embeddings?.total || 0,
        primary: statsData.face_embeddings?.primary || 0,
      },
      {
        name: 'Events',
        value: statsData.presence_events?.total || 0,
        normal: (statsData.presence_events?.total || 0) - (statsData.presence_events?.anomalies || 0),
      }
    ];
  };

  // Get system health distribution
  const getHealthMetrics = () => {
    if (!statsData) return [];
    
    const healthyCount = Math.max(0, 
      (statsData.cameras?.online || 0) + 
      (statsData.employees?.active || 0) + 
      (statsData.organizations?.active || 0)
    );
    
    return [
      {
        name: 'Healthy',
        value: healthyCount,
        color: '#22c55e',
      },
      {
        name: 'Warning',
        value: statsData.cameras?.total - statsData.cameras?.online || 0,
        color: '#f59e0b',
      },
      {
        name: 'Critical',
        value: statsData.presence_events?.anomalies || 0,
        color: '#ef4444',
      }
    ];
  };

  const getStatusColor = (value, threshold = 70) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusBg = (value, threshold = 70) => {
    if (value >= threshold) return 'bg-green-50 border-green-200';
    if (value >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async (showRefreshMessage = false) => {
    try {
      if (showRefreshMessage) {
        setRefreshing(true);
      }

      const response = await statsAPI.overview();
      setStatsData(response.data);
      setError(null);

      if (showRefreshMessage) {
        success('Dashboard data refreshed successfully');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard statistics');
      showError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDashboardStats();

    // Optional: Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchDashboardStats(false);
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    fetchDashboardStats(true);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50 flex items-center justify-center">
        <Loader size="large" text="Initializing Super Admin Panel..." />
      </div>
    );
  }

  // Render error state
  if (error && !statsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-teal-50/95 rounded-2xl border-2 border-red-200 shadow-2xl p-8 text-center">
          <div className="text-5xl mb-4">
            <AlertCircle className="inline-block text-red-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Error Loading Dashboard</h2>
          <p className="text-slate-600 mb-8 text-lg">{error}</p>
          <button
            onClick={() => fetchDashboardStats()}
            className="w-full px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <TrendingUp size={18} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract data with fallbacks
  const organizations = statsData?.organizations || { total: 0, active: 0 };
  const employees = statsData?.employees || { total: 0, active: 0 };
  const cameras = statsData?.cameras || { total: 0, online: 0 };
  const presenceEvents = statsData?.presence_events || { total: 0, unknown_faces: 0, anomalies: 0, pending_reviews: 0 };
  const faceEmbeddings = statsData?.face_embeddings || { total: 0, primary: 0, avg_quality: 0 };
  const visitors = statsData?.visitors || { total: 0 };

  // Calculate system health
  const systemHealth = cameras.total > 0
    ? Math.round((cameras.online / cameras.total) * 100)
    : 100;
  const healthStatus = systemHealth >= 80 ? 'Good' : systemHealth >= 50 ? 'Fair' : 'Poor';

  // Imports for common components (Add to top of file if not present, but for now assuming we handle import in a separate block or here if possible. 
  // Since I can't easily inject imports at the top without replacing the whole file, I will rewrite the return statement and rely on a separate edit for imports.)

  return (
    <div className={`${themeClasses.page} min-h-full h-screen overflow-y-auto`}>
      <DashboardHeader
        title="Super Admin Dashboard"
        subtitle={`Platform overview and management | ${theme.description}`}
        onRefresh={() => fetchDashboardStats(true)}
        refreshing={refreshing}
        user={user}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Overview - Inline */}
        <div className="space-y-6 mb-12">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Overall Health */}
            {analyticsMetrics && (
              <>
                <div className={`p-4 rounded-xl border-2 transition-all ${getStatusBg(analyticsMetrics.organizationHealth)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase">Platform Health</span>
                    {analyticsMetrics.organizationHealth >= 80 ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-600" />
                    )}
                  </div>
                  <p className={`text-3xl font-bold ${getStatusColor(analyticsMetrics.organizationHealth)}`}>
                    {analyticsMetrics.organizationHealth}%
                  </p>
                  <p className="text-xs text-slate-500 mt-2">System operational</p>
                </div>

                <div className={`p-4 rounded-xl border-2 transition-all ${getStatusBg(analyticsMetrics.cameraUtilization)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase">Cameras</span>
                    <TrendingUp size={16} className={getStatusColor(analyticsMetrics.cameraUtilization, 80) === 'text-green-600' ? 'text-green-600' : 'text-amber-600'} />
                  </div>
                  <p className={`text-3xl font-bold ${getStatusColor(analyticsMetrics.cameraUtilization, 80)}`}>
                    {analyticsMetrics.cameraUtilization}%
                  </p>
                  <p className="text-xs text-slate-500 mt-2">{statsData.cameras?.online || 0}/{statsData.cameras?.total || 0} online</p>
                </div>

                <div className={`p-4 rounded-xl border-2 transition-all ${getStatusBg(analyticsMetrics.employeeEngagement, 85)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase">Engagement</span>
                    <TrendingUp size={16} className={getStatusColor(analyticsMetrics.employeeEngagement, 85) === 'text-green-600' ? 'text-green-600' : 'text-amber-600'} />
                  </div>
                  <p className={`text-3xl font-bold ${getStatusColor(analyticsMetrics.employeeEngagement, 85)}`}>
                    {analyticsMetrics.employeeEngagement}%
                  </p>
                  <p className="text-xs text-slate-500 mt-2">{statsData.employees?.active || 0} active</p>
                </div>

                <div className={`p-4 rounded-xl border-2 transition-all ${getStatusBg(analyticsMetrics.faceQuality, 75)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase">Face Quality</span>
                    <CheckCircle size={16} className={getStatusColor(analyticsMetrics.faceQuality, 75) === 'text-green-600' ? 'text-green-600' : 'text-amber-600'} />
                  </div>
                  <p className={`text-3xl font-bold ${getStatusColor(analyticsMetrics.faceQuality, 75)}`}>
                    {analyticsMetrics.faceQuality}%
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Recognition accuracy</p>
                </div>

                <div className={`p-4 rounded-xl border-2 transition-all ${analyticsMetrics.anomalyRate < 5 ? 'bg-green-50 border-green-200' : analyticsMetrics.anomalyRate < 15 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 uppercase">Anomalies</span>
                    {analyticsMetrics.anomalyRate < 5 ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <AlertTriangle size={16} className={analyticsMetrics.anomalyRate < 15 ? 'text-amber-600' : 'text-red-600'} />
                    )}
                  </div>
                  <p className={`text-3xl font-bold ${analyticsMetrics.anomalyRate < 5 ? 'text-green-600' : analyticsMetrics.anomalyRate < 15 ? 'text-amber-600' : 'text-red-600'}`}>
                    {analyticsMetrics.anomalyRate}%
                  </p>
                  <p className="text-xs text-slate-500 mt-2">{statsData.presence_events?.anomalies || 0} detected</p>
                </div>
              </>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Resource Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getTrendData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        background: '#fff'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#6366f1" name="Total" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="active" fill="#10b981" name="Active" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">System Health Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getHealthMetrics()}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {getHealthMetrics().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }} 
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Metrics Table */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Platform Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Organizations', value: statsData.organizations?.total || 0, subtext: `${statsData.organizations?.active || 0} active` },
                { label: 'Total Employees', value: statsData.employees?.total || 0, subtext: `${statsData.employees?.active || 0} active` },
                { label: 'Face Embeddings', value: statsData.face_embeddings?.total || 0, subtext: `${statsData.face_embeddings?.primary || 0} primary` },
                { label: 'Presence Events', value: statsData.presence_events?.total || 0, subtext: `${statsData.presence_events?.pending_reviews || 0} pending` },
                { label: 'Total Cameras', value: statsData.cameras?.total || 0, subtext: `${statsData.cameras?.online || 0} online` },
                { label: 'Total Visitors', value: statsData.visitors?.total || 0, subtext: 'Registered' },
                { label: 'Unknown Faces', value: statsData.presence_events?.unknown_faces || 0, subtext: `${analyticsMetrics?.unknownFaceRate}% of events` },
                { label: 'Critical Anomalies', value: statsData.presence_events?.anomalies || 0, subtext: `${analyticsMetrics?.anomalyRate}% rate` },
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-slate-50 to-teal-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{item.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.subtext}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Features - Currently Available */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <CheckSquare className="text-teal-600" size={28} />
            Core Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="text-teal-600">
                  <CheckSquare size={48} strokeWidth={1.5} />
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-semibold">Employees</p>
                  <p className="text-3xl font-bold text-slate-800">{statsData?.employees?.total || 0}</p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Attendance Management</h3>
              <p className="text-sm text-slate-600">
                Track employee attendance globally across all organizations
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  <span className="text-green-600 font-bold">{statsData?.employees?.active || 0}</span> active employees
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="text-indigo-600">
                  <Users2 size={48} strokeWidth={1.5} />
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 font-semibold">Visitors</p>
                  <p className="text-3xl font-bold text-slate-800">{statsData?.visitors?.total || 0}</p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Visitor Management</h3>
              <p className="text-sm text-slate-600">
                Manage and track visitor entries and logs across all organizations
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Total registered visitors in the system
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <Lock className="text-slate-400" size={28} />
            Coming Soon
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-white backdrop-blur-xl p-8 rounded-2xl border-2 border-dashed border-slate-300 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-bl-lg">
                  Coming Soon
                </div>
                <div className="text-slate-400 mt-2">
                  <Smartphone size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mt-4">License Plate Recognition</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Advanced vehicle tracking and security alerts
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-white backdrop-blur-xl p-8 rounded-2xl border-2 border-dashed border-slate-300 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-bl-lg">
                  Coming Soon
                </div>
                <div className="text-slate-400 mt-2">
                  <CheckSquare size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mt-4">Leave Management</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Centralized leave request processing
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-white backdrop-blur-xl p-8 rounded-2xl border-2 border-dashed border-slate-300 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-bl-lg">
                  Coming Soon
                </div>
                <div className="text-slate-400 mt-2">
                  <TrendingUp size={48} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mt-4">Advanced Analytics</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Detailed insights and reporting dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
