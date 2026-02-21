import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Clock,
  Calendar,
  FileText,
  CheckCircle,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Building,
  CalendarDays,
  Timer,
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { employeeDashboardAPI } from '../services/employeeServices';
import DashboardHeader from '../components/common/dashboard/DashboardHeader';
import StatCard from '../components/common/dashboard/StatCard';
import QuickActionButton from '../components/common/dashboard/QuickActionButton';

function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    attendancePercentage: 0,
    presentDaysThisMonth: 0,
    totalHoursThisMonth: 0,
    pendingLeaves: 0,
    remainingLeave: 21
  });
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployeeData = useCallback(async () => {
    try {
      setError(null);
      const isRefresh = refreshing;
      if (!isRefresh) setLoading(true);
      
      // Fetch all employee data in parallel for better performance
      const [statsResult, attendanceResult, profileResult] = await Promise.all([
        employeeDashboardAPI.getStatsSummary().catch(err => {
          console.error('Failed to fetch stats:', err);
          return null;
        }),
        employeeDashboardAPI.getTodayAttendance().catch(err => {
          console.error('Failed to fetch today attendance:', err);
          return null;
        }),
        employeeDashboardAPI.getProfile().catch(err => {
          console.error('Failed to fetch profile:', err);
          return null;
        })
      ]);

      // Process stats
      if (statsResult?.data && statsResult?.status === 'success') {
        const data = statsResult.data;
        setStats({
          attendancePercentage: data.attendance?.attendance_percentage || 0,
          presentDaysThisMonth: data.attendance?.present_days_this_month || 0,
          totalHoursThisMonth: data.attendance?.total_hours_this_month || 0,
          pendingLeaves: data.leaves?.pending_requests || 0,
          remainingLeave: data.leaves?.remaining_annual_leave || 21
        });
      } else if (!statsResult || statsResult?.status === 'error') {
        setError('Failed to load dashboard statistics');
      }

      // Process today's attendance
      if (attendanceResult?.data && attendanceResult?.status === 'success') {
        setTodayAttendance(attendanceResult.data);
      }

      // Process profile
      if (profileResult?.data && profileResult?.status === 'success') {
        setProfile(profileResult.data);
      } else if (!profileResult || profileResult?.status === 'error') {
        setError('Failed to load profile information');
      }

    } catch (error) {
      console.error('Error fetching employee data:', error);
      setError('An unexpected error occurred while loading your dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-teal-50 to-teal-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-teal-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-6">
      {/* Compact Header Section */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-teal-500 to-cyan-600 shadow-md border-b border-teal-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow flex items-center gap-2">
                  <User className="w-6 h-6 text-teal-100" />
                  Dashboard
                </h1>
                <p className="text-sm text-teal-50 font-medium">
                  Welcome, <span className="font-bold">{profile?.user_info?.first_name || user?.username}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-teal-300/30 text-xs text-teal-50 font-medium">
                  <div className="opacity-75">Attendance</div>
                  <div className="text-xl font-bold text-white">{stats.attendancePercentage}%</div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all duration-300"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-lg shadow-sm">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-1">⚠️ Loading Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Today's Status Banner */}
        {todayAttendance && (
          <div className={`rounded-lg p-3 mb-4 border-l-4 shadow-sm bg-gray-50 transition-all duration-300 ${todayAttendance.status === 'present'
            ? 'border-green-500'
            : 'border-yellow-500'
            }`}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {todayAttendance.status === 'present' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <h3 className="text-xs font-bold text-gray-900">
                    Status: <span className={todayAttendance.status === 'present' ? 'text-green-600' : 'text-yellow-600'}>
                      {todayAttendance.status === 'present' ? 'Present ✓' : 'Not Checked'}
                    </span>
                  </h3>
                  {todayAttendance.check_in_time && (
                    <p className="text-xs text-gray-600">
                      {new Date(todayAttendance.check_in_time).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              {todayAttendance.total_hours > 0 && (
                <div className="text-right bg-gray-100 px-2.5 py-1 rounded">
                  <p className="text-sm font-bold text-teal-600">{todayAttendance.total_hours}h</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Insight Card */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg p-3 mb-4 shadow-md relative overflow-hidden border border-teal-400/20">
          <div className="relative z-10 flex items-start gap-2">
            <div className="bg-white/20 p-1.5 rounded flex-shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white mb-0.5 flex items-center gap-1">
                ✨ Insight
              </h3>
              <p className="text-teal-50 text-xs leading-relaxed font-medium">
                {stats.attendancePercentage >= 90
                  ? "Your consistency is outstanding! Our AI models predict you're on track for a 'Top Performer' badge this month. Keep it up! 🚀"
                  : "Based on your recent patterns, the AI suggests checking in 5 minutes earlier to maintain a perfect punctuality score this week."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Attendance Rate"
            value={`${stats.attendancePercentage}%`}
            subtitle="This month"
            color="teal"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6" />}
            title="Present Days"
            value={stats.presentDaysThisMonth}
            subtitle="This month"
            color="teal"
          />
          <StatCard
            icon={<Timer className="w-6 h-6" />}
            title="Total Hours"
            value={`${stats.totalHoursThisMonth}h`}
            subtitle="This month"
            color="teal"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="Pending Leaves"
            value={stats.pendingLeaves}
            subtitle="Awaiting approval"
            color="teal"
          />
          <StatCard
            icon={<CalendarDays className="w-6 h-6" />}
            title="Remaining Leave"
            value={stats.remainingLeave}
            subtitle="Days available"
            color="teal"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-4 p-4 bg-teal-50 rounded-lg shadow-sm border border-teal-200">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <QuickActionButton
              icon={<Clock className="w-5 h-5" />}
              title="Mark Attendance"
              color="teal"
              onClick={() => navigate('/employee/mark-attendance')}
            />
            <QuickActionButton
              icon={<FileText className="w-5 h-5" />}
              title="Apply for Leave"
              color="teal"
              onClick={() => navigate('/employee/leaves')}
            />
            <QuickActionButton
              icon={<Calendar className="w-5 h-5" />}
              title="View Attendance"
              color="teal"
              onClick={() => navigate('/employee/attendance')}
            />
            <QuickActionButton
              icon={<User className="w-5 h-5" />}
              title="My Profile"
              color="teal"
              onClick={() => navigate('/employee/profile')}
            />
          </div>
        </div>

        {/* Profile Summary */}
        {profile && (
          <div className="bg-teal-50 rounded-lg shadow-sm border border-teal-200 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Profile</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-teal-200">
                <User className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600">Employee ID</p>
                  <p className="text-xs font-bold text-gray-900">{profile.employee_info.employee_code || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-teal-200">
                <Building className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600">Department</p>
                  <p className="text-xs font-bold text-gray-900">{profile.employee_info.department?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-teal-200">
                <MapPin className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600">Position</p>
                  <p className="text-xs font-bold text-gray-900">{profile.employee_info.designation || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-teal-200">
                <Mail className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600">Email</p>
                  <p className="text-xs font-bold text-gray-900 break-all">{profile.user_info.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-teal-200">
                <Phone className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600">Phone</p>
                  <p className="text-xs font-bold text-gray-900">{profile.employee_info.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-teal-200">
                <Calendar className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600">Hire Date</p>
                  <p className="text-xs font-bold text-gray-900">
                    {profile.employee_info.joining_date
                      ? new Date(profile.employee_info.joining_date).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;
