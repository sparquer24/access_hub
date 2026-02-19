import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { statsAPI } from '../../services/api';
import Loader from '../common/Loader';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/Dashboard.css';

import OrganizationStatistics from '../organizations/tabs/OrganizationStatistics';
import DashboardHeader from '../common/dashboard/DashboardHeader';
import StatCard from '../common/dashboard/StatCard';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Error Loading Dashboard</h2>
          <p className="text-slate-600 mb-8 text-lg">{error}</p>
          <button
            onClick={() => fetchDashboardStats()}
            className="w-full px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 active:translate-y-0"
          >
            🔄 Retry
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
    <div className="bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50 min-h-full">
      <DashboardHeader
        title="Super Admin Dashboard"
        subtitle="System overview and management"
        onRefresh={() => fetchDashboardStats(true)}
        refreshing={refreshing}
        user={user}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Analytics Overview Section */}
        <div className="mt-3 mb-8">
          <OrganizationStatistics organization={{
            employees_count: employees.total,
            cameras_count: cameras.total,
          }} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Organizations"
            value={organizations.total}
            icon="🏢"
            secondaryIcon="→"
            color="indigo"
            subtitle={
              <>
                <span className="text-green-600 font-bold">{organizations.active}</span> active •
                <span className="text-orange-600 font-bold"> {organizations.total - organizations.active}</span> inactive
              </>
            }
            onClick={() => navigate('/super-admin/organizations')}
          />

          <StatCard
            title="Employees"
            value={employees.total}
            icon="👥"
            secondaryIcon="📊"
            color="purple"
            subtitle={
              <>
                <span className="text-green-600 font-bold">{employees.active}</span> active •
                <span className="text-orange-600 font-bold"> {employees.total - employees.active}</span> inactive
              </>
            }
            onClick={() => navigate('/super-admin/employees')}
          />

          <StatCard
            title="Cameras"
            value={cameras.total}
            icon="📹"
            secondaryIcon="🎥"
            color="blue"
            subtitle={
              <>
                <span className="text-green-600 font-bold">{cameras.online}</span> online •
                <span className="text-red-600 font-bold"> {cameras.total - cameras.online}</span> offline
              </>
            }
            onClick={() => navigate('/super-admin/cameras')}
          />

          <StatCard
            title="System Health"
            value={healthStatus}
            icon="⚙️"
            secondaryIcon="✓"
            color={systemHealth >= 80 ? 'green' : systemHealth >= 50 ? 'orange' : 'red'}
            subtitle={
              <span className="font-bold">{systemHealth}% operational</span>
            }
          />

          <StatCard
            title="Face Embeddings"
            value={faceEmbeddings.total}
            icon="🎯"
            secondaryIcon="✨"
            color="pink"
            subtitle={
              <>
                <span className="text-blue-600 font-bold">{faceEmbeddings.primary}</span> primary •
                <span className="text-teal-600 font-bold"> {(faceEmbeddings.avg_quality * 100).toFixed(1)}%</span> quality
              </>
            }
            onClick={() => navigate('/super-admin/face-embeddings')}
          />

          <StatCard
            title="Presence Events"
            value={presenceEvents.total}
            icon="📊"
            secondaryIcon="📈"
            color="orange"
            subtitle={
              <>
                <span className="text-red-600 font-bold">{presenceEvents.pending_reviews}</span> pending review
              </>
            }
            onClick={() => navigate('/super-admin/presence-events')}
          />

          <StatCard
            title="Anomalies"
            value={presenceEvents.anomalies}
            icon="🚨"
            secondaryIcon="⚠️"
            color="red"
            subtitle={
              <>
                <span className="text-red-600 font-bold">{presenceEvents.unknown_faces}</span> unknown faces
              </>
            }
            onClick={() => navigate('/super-admin/anomalies')}
          />

          <StatCard
            title="Visitors"
            value={visitors.total}
            icon="👤"
            secondaryIcon="👫"
            color="indigo"
            subtitle="Total registered visitors"
            onClick={() => navigate('/super-admin/visitors')}
          />
        </div>

        {/* LPR & Advanced Features Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🚗</span> License Plate Recognition
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="LPR Dashboard"
              value="Live"
              icon="📹"
              secondaryIcon="→"
              color="blue"
              subtitle="Monitor Vehicle Entry"
              onClick={() => navigate('/org-admin/lpr/dashboard')} // Super admin has access to these routes
            />

            <StatCard
              title="Smart Search"
              value="Find"
              icon="🔍"
              secondaryIcon="⚡"
              color="indigo"
              subtitle="Search by Plate/Time"
              onClick={() => navigate('/org-admin/lpr/search')}
            />

            <StatCard
              title="Security Alerts"
              value="Safe"
              icon="🛡️"
              secondaryIcon="⚠️"
              color="red"
              subtitle="Blacklist & Alerts"
              onClick={() => navigate('/org-admin/lpr/alerts')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
