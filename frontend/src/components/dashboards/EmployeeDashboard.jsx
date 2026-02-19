import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LeaveRequestForm from '../employee/LeaveRequestForm';
import CheckInCheckOut from '../employee/CheckInCheckOut';
import AttendanceChangeRequestForm from '../employee/AttendanceChangeRequestForm';
import { leaveRequestsAPI, attendanceAPI, attendanceChangeRequestAPI } from '../../services/employeeServices';
import { leaveRequestsAPI, attendanceAPI, attendanceChangeRequestAPI } from '../../services/employeeServices';
import Loader from '../common/Loader';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/Dashboard.css';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showCheckInOut, setShowCheckInOut] = useState(false);
  const [showChangeRequest, setShowChangeRequest] = useState(false);

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch today's attendance
      const attendanceRes = await attendanceAPI.getToday();
      if (attendanceRes.success && attendanceRes.data && attendanceRes.data.length > 0) {
        setTodayAttendance(attendanceRes.data[0]);
      }

      // Fetch recent leave requests
      const leaveRes = await leaveRequestsAPI.getMyRequests({ per_page: 5 });
      if (leaveRes.success && leaveRes.data) {
        setLeaveRequests(leaveRes.data);
      }

      // Fetch recent change requests
      const changeRes = await attendanceChangeRequestAPI.getMyRequests({ per_page: 5 });
      if (changeRes.success && changeRes.data) {
        setChangeRequests(changeRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-teal-600 via-purple-600 to-teal-700 shadow-xl border-b border-purple-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-lg">
              Dashboard
            </h1>
            <p className="text-lg text-white/90 font-medium">
              Welcome back, <span className="font-bold text-white">{user?.employee?.full_name || user?.username}</span>! 👋
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
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader />
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {/* Today's Status Card */}
              <div className="group bg-white backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 hover:border-teal-400/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:translate-y-[-8px] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-6xl">📅</div>
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                      {todayAttendance?.check_in_time ? '✓' : '○'}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Today's Status</h3>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-600 mb-3">
                    {todayAttendance?.check_in_time && !todayAttendance?.check_out_time ? 'In' :
                      todayAttendance?.check_out_time ? 'Out' : '--'}
                  </p>
                  <p className="text-sm text-slate-600 font-medium">
                    {todayAttendance?.check_in_time ? 'Checked in' : 'Not checked in yet'}
                  </p>
                </div>
              </div>

              {/* Leave Balance Card */}
              <div className="group bg-white backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 hover:border-green-400/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:translate-y-[-8px] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-6xl">🏖️</div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">✓</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Leave Requests</h3>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-3">
                    {leaveRequests.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-sm text-slate-600 font-medium">Pending approval</p>
                </div>
              </div>

              {/* Attendance Changes Card */}
              <div className="group bg-white backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 hover:border-purple-400/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:translate-y-[-8px] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-6xl">🔄</div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">📝</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Change Requests</h3>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-600 mb-3">
                    {changeRequests.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-sm text-slate-600 font-medium">Pending approval</p>
                </div>
              </div>

              {/* Work Hours Card */}
              <div className="group bg-white backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 hover:border-blue-400/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:translate-y-[-8px] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-6xl">⏱️</div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">⌚</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Work Hours</h3>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 mb-3">
                    {todayAttendance?.work_hours ? `${Math.floor(todayAttendance.work_hours)}h` : '0h'}
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
                  onClick={() => setShowCheckInOut(true)}
                  className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
                >
                  ⏰ Check In/Out
                </button>
                <button
                  onClick={() => setShowLeaveForm(true)}
                  className="px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
                >
                  📝 Apply for Leave
                </button>
                <button
                  onClick={() => setShowChangeRequest(true)}
                  className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
                >
                  🔄 Request Correction
                </button>
                <button
                  onClick={() => navigate('/attendance-history')}
                  className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
                >
                  📊 View History
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Leave Requests */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Recent Leave Requests</h3>
                {leaveRequests.length > 0 ? (
                  <div className="space-y-3">
                    {leaveRequests.map((request) => (
                      <div key={request.id} className="border border-slate-200 rounded-lg p-4 hover:border-teal-400 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-slate-900">{request.leave_type}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {formatDate(request.start_date)} - {formatDate(request.end_date)} ({request.total_days} days)
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No leave requests yet</p>
                )}
              </div>

              {/* Recent Change Requests */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Recent Change Requests</h3>
                {changeRequests.length > 0 ? (
                  <div className="space-y-3">
                    {changeRequests.map((request) => (
                      <div key={request.id} className="border border-slate-200 rounded-lg p-4 hover:border-purple-400 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-slate-900 capitalize">{request.request_type.replace('_', ' ')}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Date: {formatDate(request.request_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No change requests yet</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <LeaveRequestForm
        isOpen={showLeaveForm}
        onClose={() => setShowLeaveForm(false)}
        onSuccess={() => {
          fetchDashboardData();
          setShowLeaveForm(false);
        }}
      />

      <CheckInCheckOut
        isOpen={showCheckInOut}
        onClose={() => setShowCheckInOut(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />

      <AttendanceChangeRequestForm
        isOpen={showChangeRequest}
        onClose={() => setShowChangeRequest(false)}
        onSuccess={() => {
          fetchDashboardData();
          setShowChangeRequest(false);
        }}
      />
    </div >
  );
};

export default EmployeeDashboard;
