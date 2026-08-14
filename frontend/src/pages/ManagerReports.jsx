import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Download,
  FileText
} from 'lucide-react';
import { authService } from '../services/authService';

function ManagerReports() {
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState('this_month');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const getMockData = useCallback((type) => {
    // Return empty data structure instead of mock data
    const emptyData = {
      attendance: {
        summary: {
          totalEmployees: 0,
          averageAttendance: 0,
          totalWorkingDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateArrivals: 0
        },
        employeeStats: []
      },
      leaves: {
        summary: {
          totalRequests: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          totalDaysOff: 0
        },
        leaveBreakdown: [],
        monthlyTrend: []
      }
    };

    return emptyData[type];
  }, []);

  const getMockPerformanceData = useCallback(() => {
    return {
      summary: {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        averageRating: 0,
        topPerformer: 'N/A'
      },
      employeePerformance: []
    };
  }, []);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const token = authService.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      let apiEndpoint = '';
      let dateParams = '';
      
      // Convert dateRange to actual dates
      const today = new Date();
      let startDate, endDate;
      
      switch (dateRange) {
        case 'this_week':
          startDate = new Date(today.setDate(today.getDate() - today.getDay()));
          endDate = new Date();
          break;
        case 'this_month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date();
          break;
        case 'last_month':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case 'last_3_months':
          startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
          endDate = new Date();
          break;
        case 'this_year':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date();
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date();
      }

      dateParams = `start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;

      if (reportType === 'attendance') {
        apiEndpoint = `/api/v2/manager/reports/attendance?${dateParams}`;
      } else if (reportType === 'leaves') {
        apiEndpoint = `/api/manager/reports/leaves?${dateParams}`;
      } else {
        // For performance report, use mock data for now as we need more complex API
        setReportData(getMockPerformanceData());
        setLoading(false);
        return;
      }

      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          if (reportType === 'attendance') {
            setReportData({
              summary: {
                totalEmployees: result.data.summary.total_employees,
                averageAttendance: result.data.summary.average_attendance,
                totalWorkingDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1,
                presentDays: result.data.summary.total_attendance_records,
                absentDays: 0, // Calculate from working days - present days
                lateArrivals: 0 // This would need additional API endpoint
              },
              employeeStats: result.data.employee_stats.map(emp => ({
                name: emp.name,
                present: emp.present_days,
                absent: emp.total_working_days - emp.present_days,
                late: 0, // This would need additional API endpoint
                percentage: emp.attendance_percentage
              }))
            });
          } else if (reportType === 'leaves') {
            setReportData({
              summary: result.data.summary,
              leaveBreakdown: Object.entries(result.data.leave_types).map(([type, data]) => ({
                type,
                count: data.count,
                days: data.days
              })),
              monthlyTrend: [] // This would need additional processing
            });
          }
        } else {
          // Fallback to mock data
          setReportData(getMockData(reportType));
        }
      } else {
        // Fallback to mock data
        setReportData(getMockData(reportType));
      }
    } catch (error) {
      console.error('Error generating report:', error);
      // Fallback to mock data
      setReportData(getMockData(reportType));
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange, getMockData, getMockPerformanceData]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const downloadReport = async (format) => {
    try {
      const token = authService.getAccessToken();
      if (!token) {
        console.error('No authentication token');
        return;
      }

      // Calculate date range based on current selection
      const today = new Date();
      let startDate, endDate;
      
      switch (dateRange) {
        case 'this_week':
          startDate = new Date(today.setDate(today.getDate() - today.getDay()));
          endDate = new Date();
          break;
        case 'this_month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date();
          break;
        case 'last_month':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case 'last_3_months':
          startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
          endDate = new Date();
          break;
        case 'this_year':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date();
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date();
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Build the API endpoint based on report type
      let endpoint = '';
      let filename = '';

      if (reportType === 'attendance') {
        endpoint = `/api/v2/manager/reports/attendance/download?start_date=${startDateStr}&end_date=${endDateStr}&format=${format}`;
        filename = `attendance_report_${startDateStr}_to_${endDateStr}.${format === 'excel' ? 'xlsx' : format}`;
      } else if (reportType === 'leaves') {
        endpoint = `/api/manager/reports/leaves/download?start_date=${startDateStr}&end_date=${endDateStr}&format=${format}`;
        filename = `leaves_report_${startDateStr}_to_${endDateStr}.${format === 'excel' ? 'xlsx' : format}`;
      } else {
        console.log(`Download for ${reportType} not yet implemented`);
        return;
      }

      // Fetch the report file
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`Downloaded ${reportType} report in ${format} format`);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert(`Failed to download report: ${error.message}`);
    }
  };

  const ReportCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-teal-50/95 rounded-lg shadow p-6">
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

  return (
    <div className="min-h-screen bg-teal-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Reports</h1>
          <p className="text-gray-600 mt-2">
            Generate and analyze team performance reports
          </p>
        </div>

        {/* Report Controls */}
        <div className="bg-teal-50/95 rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Report Type */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <div className="relative">
                  <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="attendance">Attendance Report</option>
                    <option value="performance">Performance Report</option>
                    <option value="leaves">Leave Report</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_3_months">Last 3 Months</option>
                    <option value="this_year">This Year</option>
                  </select>
                </div>
              </div>

              {/* Download Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => downloadReport('pdf')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </button>
                <button
                  onClick={() => downloadReport('excel')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Attendance Report */}
            {reportType === 'attendance' && reportData && (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  <ReportCard
                    icon={Users}
                    title="Total Employees"
                    value={reportData.summary.totalEmployees}
                    color="blue"
                  />
                  <ReportCard
                    icon={TrendingUp}
                    title="Avg Attendance"
                    value={`${reportData.summary.averageAttendance}%`}
                    color="green"
                  />
                  <ReportCard
                    icon={Calendar}
                    title="Working Days"
                    value={reportData.summary.totalWorkingDays}
                    color="purple"
                  />
                  <ReportCard
                    icon={Users}
                    title="Present Days"
                    value={reportData.summary.presentDays}
                    color="green"
                  />
                  <ReportCard
                    icon={Users}
                    title="Absent Days"
                    value={reportData.summary.absentDays}
                    color="red"
                  />
                  <ReportCard
                    icon={Clock}
                    title="Late Arrivals"
                    value={reportData.summary.lateArrivals}
                    color="yellow"
                  />
                </div>

                {/* Employee Attendance Table */}
                <div className="bg-teal-50/95 rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Employee Attendance Details</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-teal-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Present Days
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Absent Days
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Late Arrivals
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attendance %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.employeeStats.map((employee, index) => (
                          <tr key={index} className="hover:bg-teal-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{employee.present}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{employee.absent}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{employee.late}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                employee.percentage >= 90 ? 'text-green-600' :
                                employee.percentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {employee.percentage}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Report */}
            {reportType === 'performance' && reportData && (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <ReportCard
                    icon={FileText}
                    title="Total Tasks"
                    value={reportData.summary.totalTasks}
                    color="blue"
                  />
                  <ReportCard
                    icon={Users}
                    title="Completed"
                    value={reportData.summary.completedTasks}
                    color="green"
                  />
                  <ReportCard
                    icon={Clock}
                    title="Overdue"
                    value={reportData.summary.overdueTasks}
                    color="red"
                  />
                  <ReportCard
                    icon={TrendingUp}
                    title="Avg Rating"
                    value={reportData.summary.averageRating}
                    subtitle="out of 5"
                    color="purple"
                  />
                  <ReportCard
                    icon={Users}
                    title="Top Performer"
                    value={reportData.summary.topPerformer}
                    color="yellow"
                  />
                </div>

                {/* Performance Table */}
                <div className="bg-teal-50/95 rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Employee Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-teal-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tasks Completed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rating
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Efficiency %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.employeePerformance.map((employee, index) => (
                          <tr key={index} className="hover:bg-teal-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{employee.tasksCompleted}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm text-gray-900 mr-2">{employee.rating}</span>
                                <div className="flex space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <span
                                      key={i}
                                      className={`text-sm ${
                                        i < Math.floor(employee.rating) ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                employee.efficiency >= 95 ? 'text-green-600' :
                                employee.efficiency >= 90 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {employee.efficiency}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Leaves Report */}
            {reportType === 'leaves' && reportData && (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <ReportCard
                    icon={FileText}
                    title="Total Requests"
                    value={reportData.summary.totalRequests}
                    color="blue"
                  />
                  <ReportCard
                    icon={Users}
                    title="Approved"
                    value={reportData.summary.approved}
                    color="green"
                  />
                  <ReportCard
                    icon={Clock}
                    title="Pending"
                    value={reportData.summary.pending}
                    color="yellow"
                  />
                  <ReportCard
                    icon={Users}
                    title="Rejected"
                    value={reportData.summary.rejected}
                    color="red"
                  />
                  <ReportCard
                    icon={Calendar}
                    title="Total Days Off"
                    value={reportData.summary.totalDaysOff}
                    color="purple"
                  />
                </div>

                {/* Leave Breakdown Table */}
                <div className="bg-teal-50/95 rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Leave Type Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-teal-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Leave Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Requests Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Days
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.leaveBreakdown.map((leave, index) => (
                          <tr key={index} className="hover:bg-teal-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{leave.type}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{leave.count}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{leave.days}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ManagerReports;
