import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';
import '../../styles/Dashboard.css';
import DashboardHeader from '../common/dashboard/DashboardHeader';
import StatCard from '../common/dashboard/StatCard';
import QuickActionButton from '../common/dashboard/QuickActionButton';
import Loader from '../common/Loader';
import { useToast } from '../../contexts/ToastContext';
import { API_BASE } from '../../config';
import { getThemeClasses } from '../../utils/roleBasedTheme';

const API_BASE_URL = API_BASE;

const OrgAdminDashboard = () => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  
  // Role-based theming
  const themeClasses = getThemeClasses(user, isDarkMode);
  
  const [stats, setStats] = useState({
    departments: 0,
    employees: 0,
    presentToday: 0,
    leaveRequests: 0,
    cameras: 0,
    locations: 0,
    organization: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.organization_id) {
      fetchOrganizationStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchOrganizationStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = authService.getAccessToken();

      if (!token || !user?.organization_id) {
        throw new Error('No authentication token or organization ID');
      }

      const response = await fetch(`${API_BASE_URL}/api/v2/organizations/${user.organization_id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setStats({
          departments: result.data.departments_count || 0,
          employees: result.data.employees_count || 0,
          presentToday: result.data.present_today || 0,
          leaveRequests: result.data.pending_leaves || 0,
          cameras: result.data.cameras_count || 0,
          locations: result.data.locations_count || 0,
          organization: result.data.organization || null
        });
      } else {
        throw new Error(result.message || 'Failed to fetch organization stats');
      }
    } catch (error) {
      console.error('Error fetching organization stats:', error);
      const msg = error.message || 'Failed to load organization statistics';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen ${themeClasses.page}`}>
      <DashboardHeader
        title="Dashboard"
        user={user}
        onLogout={handleLogout}
        onRefresh={fetchOrganizationStats}
        refreshing={loading}
      />

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="text-red-500 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchOrganizationStats}
                  className="mt-2 text-red-700 underline hover:text-red-900"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 bg-white/40 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl mx-auto max-w-lg">
            <Loader size="large" text="Syncing dashboard data..." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Departments"
                value={stats.departments}
                icon="🏢"
                secondaryIcon="→"
                color="indigo"
                subtitle="Active departments"
                onClick={() => navigate('/org-admin/departments')}
              />

              <StatCard
                title="Employees"
                value={stats.employees}
                icon="👥"
                secondaryIcon="👫"
                color="purple"
                subtitle="Total employees"
                onClick={() => navigate('/org-admin/employees')}
              />

              <StatCard
                title="Present Today"
                value={stats.presentToday}
                icon="✅"
                secondaryIcon="✓"
                color="green"
                subtitle="Marked attendance"
                onClick={() => navigate('/org-admin/attendance')}
              />

              <StatCard
                title="Leave Requests"
                value={stats.leaveRequests}
                icon="📋"
                secondaryIcon="📄"
                color="orange"
                subtitle="Pending approval"
                onClick={() => navigate('/org-admin/leaves')}
              />
            </div>

            {/* Second Row - Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <StatCard
                title="Security Cameras"
                value={stats.cameras}
                icon="📹"
                secondaryIcon="🎥"
                color="blue"
                subtitle="Active cameras"
                onClick={() => navigate('/org-admin/cameras')}
              />

              <StatCard
                title="Locations"
                value={stats.locations}
                icon="📍"
                secondaryIcon="🗺️"
                color="teal"
                subtitle="Monitored locations"
                onClick={() => navigate('/org-admin/locations')}
              />

              <StatCard
                title="Visitors"
                value={'N/A'}
                icon="👨‍💼"
                secondaryIcon="👋"
                color="pink"
                subtitle="Visitor management"
                onClick={() => navigate('/org-admin/visitors')}
              />
            </div>

            {/* LPR & Advanced Features Section */}
            {stats.organization?.enabled_features?.lpr_integration && (
              <div className="mt-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🚗</span> License Plate Recognition
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="LPR Dashboard"
                    value="Live"
                    icon="📹"
                    secondaryIcon="→"
                    color="blue"
                    subtitle="Monitor Vehicle Entry"
                    onClick={() => navigate('/org-admin/lpr/dashboard')}
                  />

                  {stats.organization?.enabled_features?.video_search && (
                    <StatCard
                      title="Smart Search"
                      value="Find"
                      icon="🔍"
                      secondaryIcon="⚡"
                      color="indigo"
                      subtitle="Search by Plate/Time"
                      onClick={() => navigate('/org-admin/lpr/search')}
                    />
                  )}

                  {stats.organization?.enabled_features?.security_alerts && (
                    <StatCard
                      title="Security Alerts"
                      value="Safe"
                      icon="🛡️"
                      secondaryIcon="⚠️"
                      color="red"
                      subtitle="Blacklist & Alerts"
                      onClick={() => navigate('/org-admin/lpr/alerts')}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions Section */}
            <div className="mt-12">
              <h2 className="text-3xl font-black text-slate-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickActionButton
                  title="Add Employee"
                  icon="➕"
                  color="indigo"
                  onClick={() => navigate('/org-admin/employees/create')}
                />
                <QuickActionButton
                  title="Manage Departments"
                  icon="🏢"
                  color="purple"
                  onClick={() => navigate('/org-admin/departments')}
                />
                <QuickActionButton
                  title="View Reports"
                  icon="📊"
                  color="blue"
                  onClick={() => navigate('/org-admin/analytics')}
                />
                <QuickActionButton
                  title="Attendance Overview"
                  icon="👥"
                  color="green"
                  onClick={() => navigate('/org-admin/attendance')}
                />
              </div>
            </div>

            {/* Under Development Info */}
            <div className="mt-12 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-yellow-900 mb-3">🚧 Under Development</h3>
              <p className="text-lg text-yellow-800 mb-6">
                Department and Employee management features coming in Phase 3!
              </p>
              <div className="bg-teal-50/95 rounded-xl p-6 border border-yellow-300">
                <h4 className="text-xl font-bold text-slate-900 mb-4">Your Profile</h4>
                <div className="space-y-2 text-slate-700">
                  <p><strong className="text-teal-600">Email:</strong> {user?.email}</p>
                  <p><strong className="text-teal-600">Username:</strong> {user?.username}</p>
                  <p><strong className="text-teal-600">Role:</strong> {user?.role?.name}</p>
                  <p><strong className="text-teal-600">Organization:</strong> {user?.organization_id || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrgAdminDashboard;
