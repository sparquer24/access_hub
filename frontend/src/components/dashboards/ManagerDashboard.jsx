import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { managerAPI, managerLeaveAPI, managerAttendanceChangeAPI } from '../../services/managerServices';
import { managerAPI, managerLeaveAPI, managerAttendanceChangeAPI } from '../../services/managerServices';
import Loader from '../common/Loader';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/Dashboard.css';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  // State for stats and data
  const [stats, setStats] = useState({
    total_members: 0,
    present_today: 0,
    pending_leaves: 0,
    pending_change_requests: 0,
    attendance_percentage: 0
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingChangeRequests, setPendingChangeRequests] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchManagerData();
    }
  }, [user]);

  const fetchManagerData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const [
        teamStatsRes,
        teamMembersRes,
        orgRes,
        pendingLeavesRes,
        pendingChangesRes,
        todayAttendanceRes
      ] = await Promise.allSettled([
        managerAPI.getTeamStats(),
        managerAPI.getTeamMembers(),
        managerAPI.getOrganizationInfo(),
        managerLeaveAPI.getPendingLeaves({ per_page: 5 }),
        managerAttendanceChangeAPI.getPendingRequests({ per_page: 5 }),
        managerAPI.getTodayAttendance()
      ]);

      // Process team stats
      if (teamStatsRes.status === 'fulfilled' && teamStatsRes.value?.success) {
        setStats(prev => ({ ...prev, ...teamStatsRes.value.data }));
      }

      // Process team members
      if (teamMembersRes.status === 'fulfilled' && teamMembersRes.value?.success) {
        setTeamMembers(teamMembersRes.value.data?.team_members || []);
        if (!stats.total_members) {
          setStats(prev => ({ ...prev, total_members: teamMembersRes.value.data?.team_members?.length || 0 }));
        }
      }

      // Process organization info
      if (orgRes.status === 'fulfilled' && orgRes.value?.success) {
        setOrganization(orgRes.value.data);
      }

      // Process pending leaves
      if (pendingLeavesRes.status === 'fulfilled' && pendingLeavesRes.value?.success) {
        const leaves = pendingLeavesRes.value.data || [];
        setPendingLeaves(leaves);
        setStats(prev => ({ ...prev, pending_leaves: leaves.length }));
      }

      // Process pending change requests
      if (pendingChangesRes.status === 'fulfilled' && pendingChangesRes.value?.success) {
        const changes = pendingChangesRes.value.data || [];
        setPendingChangeRequests(changes);
        setStats(prev => ({ ...prev, pending_change_requests: changes.length }));
      }

      // Process today's attendance
      if (todayAttendanceRes.status === 'fulfilled' && todayAttendanceRes.value?.success) {
        const attendance = todayAttendanceRes.value.data || [];
        setTodayAttendance(attendance);

        // Calculate present count
        const presentCount = attendance.filter(a => a.status === 'present' || a.check_in_time).length;
        setStats(prev => ({
          ...prev,
          present_today: presentCount,
          attendance_percentage: prev.total_members > 0
            ? Math.round((presentCount / prev.total_members) * 100)
            : 0
        }));
      }

    } catch (error) {
      console.error('Error fetching manager data:', error);
      setError('Failed to load dashboard data');
      console.error('Error fetching manager data:', error);
      setError('Failed to load dashboard data');
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      const response = await managerLeaveAPI.approve(leaveId, 'Approved from dashboard');

      if (response.success) {
        success('Leave request approved successfully');
        // Refresh data
        fetchManagerData();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to approve leave request';
      showError(errorMsg);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      const notes = prompt('Please provide a reason for rejection:');
      if (!notes) return;

      const response = await managerLeaveAPI.reject(leaveId, notes);

      if (response.success) {
        success('Leave request rejected');
        // Refresh data
        fetchManagerData();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to reject leave request';
      showError(errorMsg);
    }
  };

  const handleApproveChangeRequest = async (requestId) => {
    try {
      const response = await managerAttendanceChangeAPI.approve(requestId, 'Approved from dashboard');

      if (response.success) {
        success('Attendance change request approved successfully');
        // Refresh data
        fetchManagerData();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to approve change request';
      showError(errorMsg);
    }
  };

  const handleRejectChangeRequest = async (requestId) => {
    try {
      const notes = prompt('Please provide a reason for rejection:');
      if (!notes) return;

      const response = await managerAttendanceChangeAPI.reject(requestId, notes);

      if (response.success) {
        success('Attendance change request rejected');
        // Refresh data
        fetchManagerData();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to reject change request';
      showError(errorMsg);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Show loading screen
  if (loading && !stats.total_members && teamMembers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50 flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-teal-600 via-purple-600 to-teal-700 shadow-xl border-b border-purple-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-lg">
              Manager Dashboard
            </h1>
            <p className="text-lg text-white/90 font-medium">
              Welcome back, <span className="font-bold text-white">{user?.employee?.full_name || user?.username}</span>! 👋
              <br />
              <span className="text-sm text-white/80">
                {user?.employee?.department?.name} • {user?.employee?.designation}
                {organization && ` • ${organization.name}`}
              </span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500/80 hover:bg-red-600 backdrop-blur-md border border-red-400/30 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] active:translate-y-0"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Team Members Card */}
          <div className="group bg-white backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 hover:border-teal-400/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:translate-y-[-8px] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="text-6xl group-hover:scale-125 transition-transform duration-300">👥</div>
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <span className="text-lg">→</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Team Members</h3>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-600 mb-3">
                {loading ? '...' : stats.total_members || teamMembers.length}
              </p>
              <p className="text-sm text-slate-600 font-medium">Under your management</p>
            </div>
          </div>

          {/* Present Today Card */}
          <div className="group bg-white backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 hover:border-green-400/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:translate-y-[-8px] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="text-6xl group-hover:scale-125 transition-transform duration-300">✅</div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <span className="text-lg">✓</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Present Today</h3>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-3">
                {loading ? '...' : stats.present_today || 0}
              </p>
              <p className="text-sm text-slate-600 font-medium">Team attendance</p>
            </div>
          </div>

          {/* Pending Approvals Card */}
          <div className="group bg-white backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 hover:border-orange-400/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:translate-y-[-8px] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="text-6xl group-hover:scale-125 transition-transform duration-300">📋</div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <span className="text-lg">⚠️</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Pending Approvals</h3>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 mb-3">
                {loading ? '...' : (stats.pending_leaves + stats.pending_change_requests) || 0}
              </p>
              <p className="text-sm text-slate-600 font-medium">
                {stats.pending_leaves} leaves, {stats.pending_change_requests} changes
              </p>
            </div>
          </div>

          {/* Team Performance Card */}
          <div className="group bg-white backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 hover:border-blue-400/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:translate-y-[-8px] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="text-6xl group-hover:scale-125 transition-transform duration-300">📊</div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-lg">📈</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Attendance Rate</h3>
              <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 mb-3">
                {loading ? '...' : `${stats.attendance_percentage}%`}
              </p>
              <p className="text-sm text-slate-600 font-medium">Today</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/manager/attendance')}
              className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
            >
              ✅ Review Attendance
            </button>
            <button
              onClick={() => navigate('/manager/leaves')}
              className="px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
            >
              📋 Approve Leaves
            </button>
            <button
              onClick={() => navigate('/manager/team')}
              className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
            >
              👥 View Team
            </button>
            <button
              onClick={() => navigate('/manager/reports')}
              className="px-6 py-4 bg-gradient-to-r from-cyan-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
            >
              📊 Team Reports
            </button>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Pending Leave Requests */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-slate-900">Pending Leave Requests</h3>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                {stats.pending_leaves}
              </span>
            </div>
            {pendingLeaves.length > 0 ? (
              <div className="space-y-3">
                {pendingLeaves.map((leave) => (
                  <div key={leave.id} className="border border-slate-200 rounded-lg p-4 hover:border-orange-400 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-slate-900">{leave.employee?.full_name || 'Unknown'}</span>
                        <p className="text-sm text-slate-600 capitalize">{leave.leave_type} Leave</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {formatDate(leave.start_date)} - {formatDate(leave.end_date)} ({leave.total_days} days)
                    </p>
                    <p className="text-sm text-slate-500 mb-3">{leave.reason}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveLeave(leave.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(leave.id)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-slate-600">No pending leave requests</p>
              </div>
            )}
          </div>

          {/* Pending Attendance Change Requests */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-slate-900">Pending Change Requests</h3>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                {stats.pending_change_requests}
              </span>
            </div>
            {pendingChangeRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingChangeRequests.map((request) => (
                  <div key={request.id} className="border border-slate-200 rounded-lg p-4 hover:border-purple-400 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-slate-900">{request.employee?.full_name || 'Unknown'}</span>
                        <p className="text-sm text-slate-600 capitalize">{request.request_type?.replace('_', ' ')}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Date: {formatDate(request.request_date)}
                    </p>
                    <p className="text-sm text-slate-500 mb-3">{request.reason}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveChangeRequest(request.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleRejectChangeRequest(request.id)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-slate-600">No pending change requests</p>
              </div>
            )}
          </div>
        </div>

        {/* Organization & Team Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Organization Info */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-50 border-2 border-teal-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-teal-900 mb-6">
              {organization?.name || 'Organization'} Info
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-slate-700">Department:</span>
                <span className="text-lg font-bold text-teal-600">
                  {user?.employee?.department?.name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-slate-700">Your Position:</span>
                <span className="text-lg font-bold text-teal-600">
                  {user?.employee?.designation || 'Manager'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-slate-700">Employee Code:</span>
                <span className="text-lg font-bold text-teal-600">
                  {user?.employee?.employee_code || 'N/A'}
                </span>
              </div>
              {organization && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-slate-700">Subscription:</span>
                    <span className="text-lg font-bold text-teal-600 capitalize">
                      {organization.subscription_plan || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-slate-700">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${organization.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {organization.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Team Overview */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-green-900 mb-6">Team Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-green-300">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  👥 {stats.total_members}
                </div>
                <div className="text-sm font-medium text-green-700">Total Members</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-300">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ✅ {stats.present_today}
                </div>
                <div className="text-sm font-medium text-green-700">Present Today</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-300">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  📋 {stats.pending_leaves}
                </div>
                <div className="text-sm font-medium text-green-700">Leave Requests</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-300">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  🔄 {stats.pending_change_requests}
                </div>
                <div className="text-sm font-medium text-green-700">Change Requests</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Team Members */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-black text-slate-900 mb-6">Your Team</h2>
          {teamMembers.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.slice(0, 6).map((member, index) => (
                  <div key={member.id || index} className="border border-slate-200 rounded-lg p-4 hover:border-teal-400 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-teal-600">
                          {member.name?.charAt(0) || member.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{member.name || member.full_name}</h4>
                        <p className="text-sm text-slate-600">{member.position || member.designation || 'Employee'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {teamMembers.length > 6 && (
                <div className="text-center pt-6">
                  <button
                    onClick={() => navigate('/manager/team')}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    View all {teamMembers.length} team members →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-7xl mb-4">👥</div>
              <p className="text-lg text-slate-600">No team data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
