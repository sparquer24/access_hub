import { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/apiServices';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  List,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import EmployeeAttendanceCalendar from '../components/organizations/tabs/EmployeeAttendanceCalendar';

function EmployeeAttendance() {
  const { user } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState(30); // Default to last 30 days
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    totalHours: 0,
    averageHours: 0,
    attendanceRate: 0
  });
  const [viewType, setViewType] = useState('list'); // 'list' | 'calendar'

  useEffect(() => {
    fetchAttendanceHistory();
  }, [currentPage, dateFilter]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateFilter);

      const params = {
        page: currentPage,
        per_page: 10,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        // If user object has employee_id, use it, otherwise fallback to id
        // Using 'employee_id' filter might be redundant if backend filters by current user automatically
        // but explicit is better if supported.
      };

      const response = await attendanceAPI.list(params);

      if (response.data?.success) {
        const { items, pagination } = response.data.data;
        setAttendanceHistory(items || []);
        setTotalPages(pagination?.pages || 1);

        // Calculate stats (Note: This only calculates based on fetched page if items are paginated. 
        // Ideally backend should provide stats or we need to fetch all for stats.
        // For now, keeping existing logic but aware it might be partial data)
        const currentItems = items || [];
        const totalDays = currentItems.length;
        const presentDays = currentItems.filter(record => record.status === 'present').length;
        const absentDays = totalDays - presentDays;
        const totalHours = currentItems.reduce((sum, record) => sum + (record.work_hours || record.duration_hours || 0), 0);
        const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        setStats({
          totalDays,
          presentDays,
          absentDays,
          totalHours,
          averageHours,
          attendanceRate
        });
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status, isLate = false) => {
    if (status === 'present') {
      return (
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isLate ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            {isLate ? 'Present (Late)' : 'Present'}
          </span>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Absent
      </span>
    );
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-teal-50 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 bg-${color}-100 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600 mt-2">
            Track your attendance history and statistics
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end mb-6">
          <div className="bg-teal-50 rounded-lg shadow p-1 flex items-center space-x-1">
            <button
              onClick={() => setViewType('list')}
              className={`px-4 py-2 rounded-md flex items-center text-sm font-medium transition-colors ${viewType === 'list'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-teal-50'
                }`}
            >
              <List className="w-4 h-4 mr-2" />
              List View
            </button>
            <button
              onClick={() => setViewType('calendar')}
              className={`px-4 py-2 rounded-md flex items-center text-sm font-medium transition-colors ${viewType === 'calendar'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-teal-50'
                }`}
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendar View
            </button>
          </div>
        </div>

        {viewType === 'calendar' ? (
          <div className="bg-teal-50 rounded-lg shadow p-6">
            <EmployeeAttendanceCalendar
              viewMode="employee"
              selectedEmployeeId={user?.employee?.id || user?.id} // Use nested employee.id
              currentEmployee={user?.employee || user} // Pass employee object if available
              organizationId={user?.organization_id}
            />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-teal-50 rounded-lg shadow mb-8">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <select
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(parseInt(e.target.value))}
                      >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={60}>Last 60 days</option>
                        <option value={90}>Last 90 days</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <StatCard
                icon={Calendar}
                title="Total Days"
                value={stats.totalDays}
                color="blue"
              />
              <StatCard
                icon={CheckCircle}
                title="Present Days"
                value={stats.presentDays}
                color="green"
              />
              <StatCard
                icon={XCircle}
                title="Absent Days"
                value={stats.absentDays}
                color="red"
              />
              <StatCard
                icon={TrendingUp}
                title="Attendance Rate"
                value={`${Math.round(stats.attendanceRate)}%`}
                color="purple"
              />
              <StatCard
                icon={Clock}
                title="Total Hours"
                value={`${Math.round(stats.totalHours)}h`}
                color="indigo"
              />
              <StatCard
                icon={BarChart3}
                title="Avg Hours/Day"
                value={`${Math.round(stats.averageHours * 10) / 10}h`}
                color="yellow"
              />
            </div>

            {/* Attendance History Table */}
            <div className="bg-teal-50 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-teal-200">
                <h3 className="text-lg font-medium text-gray-900">Attendance History</h3>
              </div>

              {attendanceHistory.length === 0 ? (
                <div className="p-6 text-center">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                  <p className="mt-1 text-sm text-gray-500">No attendance data found for the selected period.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-teal-200">
                      <thead className="bg-teal-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check In
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Check Out
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Break Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceHistory.map((record, index) => (
                          <tr key={record.id || index} className="hover:bg-teal-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(record.date)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(record.status, record.is_late)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatTime(record.check_in_time)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatTime(record.check_out_time)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {record.duration_hours ? `${record.duration_hours}h` : 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {record.break_duration ? `${record.break_duration}min` : '0min'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-teal-300 text-sm font-medium rounded-md text-teal-700 bg-white hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-teal-300 text-sm font-medium rounded-md text-teal-700 bg-white hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing page <span className="font-medium">{currentPage}</span> of{' '}
                            <span className="font-medium">{totalPages}</span>
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-teal-300 bg-white text-sm font-medium text-teal-600 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-teal-300 bg-white text-sm font-medium text-teal-600 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EmployeeAttendance;
