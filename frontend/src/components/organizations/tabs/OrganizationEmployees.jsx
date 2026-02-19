import React, { useState, useEffect } from 'react';
import { message, Modal, Form, Input, Select, DatePicker, Switch } from 'antd';
import { employeesService, EMPLOYMENT_TYPES, GENDER_OPTIONS, departmentsService, shiftsService, organizationsService } from '../../../services/organizationsService';
import api from '../../../services/api';
import moment from 'moment';
import WebcamCapture from '../../common/WebcamCapture.jsx';
import EmployeeAnalytics from './EmployeeAnalytics';
import EmployeeAttendanceLogs from './EmployeeAttendanceLogs';
import EmployeeAttendanceCalendar from './EmployeeAttendanceCalendar';
import OrganizationDepartments from './OrganizationDepartments';
import OrganizationShifts from './OrganizationShifts';
import { Users, BarChart3, ClipboardList, Calendar as CalendarIcon, Building2, Clock, FileText } from 'lucide-react';

const { Option } = Select;
const { TextArea } = Input;

const OrganizationEmployees = ({ organizationId, organization }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedCalendarEmployee, setSelectedCalendarEmployee] = useState(null);
  const calendarRef = React.useRef(null);

  useEffect(() => {
    fetchEmployees();
  }, [organizationId]);

  useEffect(() => {
    fetchDepartmentsAndShifts();
  }, [organizationId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesService.list({
        organization_id: organizationId,
        per_page: 100,
      });
      setEmployees(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error(error.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentsAndShifts = async () => {
    try {
      const [dResp, sResp] = await Promise.all([
        departmentsService.list({ organization_id: organizationId, per_page: 200, is_active: true }),
        shiftsService.list({ organization_id: organizationId, per_page: 200, is_active: true }),
      ]);
      setDepartments(dResp.data?.items || dResp.data || []);
      setShifts(sResp.data?.items || sResp.data || []);
    } catch (err) {
      console.error('Error fetching departments/shifts:', err);
      // non-blocking
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoadingAttendance(true);
      const response = await organizationsService.getEmployeeAttendanceSummary(organizationId, {
        per_page: 100,
      });
      setAttendanceRecords(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      message.error(error.response?.data?.message || 'Failed to load attendance records');
    } finally {
      setLoadingAttendance(false);
    }
  };


  const handleCreateEmployee = () => {
    setEditingEmployee(null);
    setEmployeePhoto(null);
    setShowWebcam(false);
    form.resetFields();
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setEmployeePhoto(employee.photo_base64 || null);
    setShowWebcam(false);
    form.setFieldsValue({
      ...employee,
      date_of_birth: employee.date_of_birth ? moment(employee.date_of_birth) : null,
      joining_date: employee.joining_date ? moment(employee.joining_date) : null,
    });
    setShowModal(true);
  };

  const handleDeleteEmployee = async (employeeId, employeeName) => {
    if (!window.confirm(`Are you sure you want to delete employee "${employeeName}"?`)) {
      return;
    }

    try {
      await employeesService.delete(employeeId, false);
      message.success('Employee deleted successfully!');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      message.error(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      await employeesService.update(employee.id, {
        is_active: !employee.is_active,
      });
      message.success(employee.is_active ? 'Successfully disabled' : 'Successfully enabled');
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee status:', error);
      message.error(error.response?.data?.message || 'Failed to update employee status');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingEmployee) {
        const payload = {
          full_name: values.full_name,
          phone_number: values.phone_number,
          gender: values.gender,
          date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
          designation: values.designation,
          employment_type: values.employment_type,
          joining_date: values.joining_date ? values.joining_date.format('YYYY-MM-DD') : null,
          department_id: values.department_id,
          shift_id: values.shift_id,
          address: values.address,
          is_active: values.is_active,
          photo_base64: employeePhoto || undefined,
        };
        await employeesService.update(editingEmployee.id, payload);
        message.success('Successfully updated');
      } else {
        const generateUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };
        const payload = {
          organization_id: organizationId,
          user_id: generateUUID(),
          full_name: values.full_name,
          employee_code: `EMP-${Date.now()}`,
          phone_number: values.phone_number,
          gender: values.gender,
          date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
          designation: values.designation,
          employment_type: values.employment_type,
          joining_date: values.joining_date ? values.joining_date.format('YYYY-MM-DD') : null,
          department_id: values.department_id,
          shift_id: values.shift_id,
          address: values.address,
          photo_base64: employeePhoto || undefined,
        };

        // Step 1: Create the employee
        const employeeResponse = await employeesService.create(payload);
        message.success('Successfully created');

        // Step 2: If employee was created successfully and has image, enroll face
        if (employeeResponse.success && employeeResponse.data) {
          const employeeId = employeeResponse.data.id;
          const imageBase64 = employeeResponse.data.photo_base64;

          // Only call face enroll if we have both employeeId and image data
          if (employeeId && imageBase64) {
            try {
              const faceEnrollPayload = {
                entity_id: employeeId,
                img_b64: imageBase64,
              };

              await api.post('/api/v1/face/enroll', faceEnrollPayload);
              console.log('Face enrollment successful for employee:', employeeId);
            } catch (faceError) {
              console.error('Face enrollment failed:', faceError);
              // Show warning but don't block the employee creation
              message.warning('Employee created successfully, but face enrollment failed. You can retry later.');
            }
          } else {
            console.warn('Missing employee_id or image data for face enrollment');
          }
        }
      }

      setShowModal(false);
      setEmployeePhoto(null);
      setShowWebcam(false);
      form.resetFields();
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      message.error(error.response?.data?.message || 'Failed to save employee');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && emp.is_active) ||
      (filterStatus === 'inactive' && !emp.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }




  return (
    <div className="w-full space-y-3">
      {/* Compact Single-Line Header */}
      <div className="bg-teal-50/95 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 flex justify-between items-center gap-4 bg-teal-50">
          {/* Left: Title with small subtitle */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" /> Employee Directory
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage workforce & attendance</p>
          </div>

          {/* Right: Add button + Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateEmployee}
              className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded hover:bg-teal-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Employee
            </button>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab('list')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'list' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><Users className="w-3.5 h-3.5" />List</button>
              <button onClick={() => setActiveTab('analytics')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'analytics' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><BarChart3 className="w-3.5 h-3.5" />Overview</button>
              <button onClick={() => setActiveTab('logs')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'logs' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><ClipboardList className="w-3.5 h-3.5" />Logs</button>
              <button onClick={() => { setActiveTab('records'); if (activeTab !== 'records') { fetchAttendanceRecords(); } }} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'records' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><FileText className="w-3.5 h-3.5" />Records</button>
              <button onClick={() => setActiveTab('calendar')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'calendar' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><CalendarIcon className="w-3.5 h-3.5" />calendar</button>
              <button onClick={() => setActiveTab('departments')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'departments' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><Building2 className="w-3.5 h-3.5" />Dept</button>
              <button onClick={() => setActiveTab('shifts')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'shifts' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><Clock className="w-3.5 h-3.5" />Shifts</button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <EmployeeAnalytics
          employees={employees}
          organizationId={organizationId}
        />
      )}

      {activeTab === 'logs' && (
        <div className="bg-teal-50/95 rounded-lg shadow-sm border border-gray-200 p-4">
          <EmployeeAttendanceLogs
            employees={employees}
            organizationId={organizationId}
            onEmployeeClick={(employeeId) => {
              setSelectedCalendarEmployee(employeeId);
              setActiveTab('calendar');
            }}
          />
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Monthly Attendance Records Table */}
          <div className="bg-teal-50/95 rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-teal-50">
              <h3 className="text-2xl font-bold text-gray-900">📊 Monthly Attendance Records</h3>
              <p className="text-gray-600 text-sm mt-1">View attendance statistics for all employees</p>
            </div>

            {loadingAttendance ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-12 bg-teal-50">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No attendance records found</h3>
                <p className="text-gray-600 mb-6">Attendance data will appear here once employees check in</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-teal-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Present Days
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Absent Days
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Leave Count
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Avg Hours/Day
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Attendance %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendanceRecords.map((record) => (
                      <tr
                        key={record.employee_id}
                        className="hover:bg-teal-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedCalendarEmployee(record.employee_id);
                          setActiveTab('calendar');
                        }}
                        title="Click to view attendance calendar"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                              {record.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{record.full_name}</div>
                              <div className="text-xs text-gray-500">{record.employee_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {record.department || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {record.present_days}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                            {record.absent_days}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                            {record.leave_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                          {record.avg_hours_per_day} hrs
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${record.attendance_percentage >= 90
                              ? 'bg-green-100 text-green-700'
                              : record.attendance_percentage >= 75
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                              }`}>
                              {record.attendance_percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>


        </div>
      )}

      {activeTab === 'list' && (
        <>
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="🔍 Search by name, code, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm w-full md:w-64"
            />
            <div className="flex gap-2 text-sm">
              <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 rounded-md ${filterStatus === 'all' ? 'bg-teal-100 text-teal-700 font-medium' : 'bg-teal-50/95 border hover:bg-teal-50'}`}>All ({employees.length})</button>
              <button onClick={() => setFilterStatus('active')} className={`px-3 py-1.5 rounded-md ${filterStatus === 'active' ? 'bg-green-100 text-green-700 font-medium' : 'bg-teal-50/95 border hover:bg-teal-50'}`}>Active ({employees.filter(e => e.is_active).length})</button>
              <button onClick={() => setFilterStatus('inactive')} className={`px-3 py-1.5 rounded-md ${filterStatus === 'inactive' ? 'bg-orange-100 text-orange-700 font-medium' : 'bg-teal-50/95 border hover:bg-teal-50'}`}>Inactive ({employees.filter(e => !e.is_active).length})</button>
            </div>
          </div>

          {/* Employees Table */}
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12 bg-teal-50 rounded-xl">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first employee'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={handleCreateEmployee}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  ➕ Add Employee
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto bg-teal-50/95 rounded-lg shadow-sm border border-gray-200">
              <table className="w-full">
                <thead className="bg-teal-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-teal-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                            {employee.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{employee.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-teal-600">
                          {employee.employee_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {employee.phone_number || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {employee.designation || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {employee.employment_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(employee)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${employee.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            }`}
                        >
                          {employee.is_active ? '✓ Active' : '⊘ Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="px-3 py-1 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-all text-sm font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id, employee.full_name)}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Create/Edit Modal */}
          <Modal
            title={
              <div className="text-xl font-bold text-gray-900">
                {editingEmployee ? 'Edit Employee' : 'Create New Employee'}
              </div>
            }
            open={showModal}
            onCancel={() => {
              setShowModal(false);
              setEmployeePhoto(null);
              setShowWebcam(false);
              form.resetFields();
            }}
            footer={null}
            width={800}
          >
            <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee code is auto-generated by backend; do not allow manual entry */}

                <Form.Item
                  name="full_name"
                  label="Full Name"
                  rules={[{ required: true, message: 'Please enter full name' }]}
                >
                  <Input placeholder="John Doe" />
                </Form.Item>

                <Form.Item name="phone_number" label="Phone Number">
                  <Input placeholder="+1234567890" />
                </Form.Item>

                <Form.Item name="gender" label="Gender">
                  <Select placeholder="Select gender">
                    <Option value={GENDER_OPTIONS.MALE}>Male</Option>
                    <Option value={GENDER_OPTIONS.FEMALE}>Female</Option>
                    <Option value={GENDER_OPTIONS.OTHER}>Other</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="date_of_birth" label="Date of Birth">
                  <DatePicker className="w-full" format="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item name="designation" label="Designation">
                  <Input placeholder="Software Engineer" />
                </Form.Item>

                <Form.Item name="employment_type" label="Employment Type">
                  <Select placeholder="Select employment type">
                    <Option value={EMPLOYMENT_TYPES.FULL_TIME}>Full Time</Option>
                    <Option value={EMPLOYMENT_TYPES.PART_TIME}>Part Time</Option>
                    <Option value={EMPLOYMENT_TYPES.CONTRACT}>Contract</Option>
                    <Option value={EMPLOYMENT_TYPES.INTERN}>Intern</Option>
                  </Select>
                </Form.Item>

                <Form.Item name="joining_date" label="Joining Date">
                  <DatePicker className="w-full" format="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item name="department_id" label="Department">
                  <Select placeholder="Select department" allowClear>
                    {departments.map((d) => (
                      <Option key={d.id} value={d.id}>{d.name || d.department_name}{d.code ? ` — ${d.code}` : ''}</Option>
                    ))}
                  </Select>
                </Form.Item>



                <Form.Item name="shift_id" label="Shift">
                  <Select placeholder="Select shift" allowClear>
                    {shifts.map((s) => (
                      <Option key={s.id} value={s.id}>{s.shift_name || s.name} {s.start_time ? `(${s.start_time} - ${s.end_time})` : ''}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="address" label="Address" className="md:col-span-2">
                  <TextArea rows={2} placeholder="Enter full address" />
                </Form.Item>

                {/* Employee Photo Capture */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Employee Photo
                  </label>

                  {!showWebcam && !employeePhoto && (
                    <button
                      type="button"
                      onClick={() => setShowWebcam(true)}
                      className="w-full px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 mb-6"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Capture Employee Photo
                    </button>
                  )}

                  {showWebcam && (
                    <div className="mb-6">
                      <WebcamCapture
                        key={`webcam-${Date.now()}`}
                        onImageCapture={(base64) => {
                          setEmployeePhoto(base64);
                          setShowWebcam(false);
                          message.success('Employee photo captured successfully!');
                        }}
                        onBack={() => setShowWebcam(false)}
                      />
                    </div>
                  )}

                  {employeePhoto && (
                    <div className="bg-teal-50 rounded-lg p-4 border border-green-200">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        <p className="text-green-700 font-semibold">Photo captured successfully</p>
                      </div>
                      <div className="relative">
                        <img
                          src={employeePhoto}
                          alt="Employee"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEmployeePhoto(null);
                            setShowWebcam(false);
                            // Delay to ensure camera cleanup before restarting
                            setTimeout(() => {
                              setShowWebcam(true);
                            }, 500);
                          }}
                          className="mt-3 w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          🔄 Retake Photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {editingEmployee && (
                  <Form.Item
                    name="is_active"
                    label="Active Status"
                    valuePropName="checked"
                    className="md:col-span-2"
                  >
                    <Switch />
                  </Form.Item>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEmployeePhoto(null);
                    setShowWebcam(false);
                    form.resetFields();
                  }}
                  className="px-6 py-2 bg-teal-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  {editingEmployee ? 'Update Employee' : 'Create Employee'}
                </button>
              </div>
            </Form>
          </Modal>
        </>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-teal-50/95 rounded-lg shadow-sm border border-gray-200 p-4">
          <EmployeeAttendanceCalendar
            employees={employees}
            selectedEmployeeId={selectedCalendarEmployee}
            organizationId={organizationId}
          />
        </div>
      )}

      {activeTab === 'departments' && (
        <OrganizationDepartments
          organizationId={organizationId}
          organization={organization}
        />
      )}

      {activeTab === 'shifts' && (
        <OrganizationShifts
          organizationId={organizationId}
          organization={organization}
        />
      )}
    </div>
  );
};

export default OrganizationEmployees;

