import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Switch, Pagination } from 'antd';
import { employeesService, EMPLOYMENT_TYPES, GENDER_OPTIONS, departmentsService, shiftsService, organizationsService } from '../../../services/organizationsService';
import { faceService } from '../../../services/faceService';
import api from '../../../services/api';
import moment from 'moment';
import WebcamCapture from '../../common/WebcamCapture.jsx';
import Loader from '../../common/Loader';
import { useToast } from '../../../contexts/ToastContext';
import EmployeeAnalytics from './EmployeeAnalytics';
import EmployeeAttendanceLogs from './EmployeeAttendanceLogs';
import EmployeeAttendanceCalendar from './EmployeeAttendanceCalendar';
import OrganizationDepartments from './OrganizationDepartments';
import OrganizationShifts from './OrganizationShifts';
import { authService } from '../../../services/authService';
import { Users, BarChart3, ClipboardList, Calendar as CalendarIcon, Building2, Clock, FileText, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedCalendarEmployee, setSelectedCalendarEmployee] = useState(null);
  const [recordsSearchText, setRecordsSearchText] = useState('');
  const [recordsDepartmentFilter, setRecordsDepartmentFilter] = useState('all');
  const [recordsDateRange, setRecordsDateRange] = useState([moment(), moment()]);
  const [recordsCurrentPage, setRecordsCurrentPage] = useState(1);
  const [recordsItemsPerPage, setRecordsItemsPerPage] = useState(10);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
  const calendarRef = React.useRef(null);
  const analyticsRef = React.useRef(null);
  const { success, error: showError } = useToast();

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
      showError(error.response?.data?.message || 'Failed to load employees');
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
      console.log('Fetching attendance records with filters...');
      
      const params = {
        per_page: 500,
      };
      
      // Add search parameter
      if (recordsSearchText && recordsSearchText.trim()) {
        params.search = recordsSearchText.trim();
      }
      
      // Add department filter parameter
      if (recordsDepartmentFilter && recordsDepartmentFilter !== 'all') {
        params.department_id = recordsDepartmentFilter;
      }
      
      // Add date range parameters
      if (recordsDateRange && recordsDateRange[0] && recordsDateRange[1]) {
        params.start_date = recordsDateRange[0].format('YYYY-MM-DD');
        params.end_date = recordsDateRange[1].format('YYYY-MM-DD');
      }
      
      console.log('Filter params:', params);
      
      const response = await organizationsService.getEmployeeAttendanceSummary(organizationId, params);
      const allRecords = response.data?.items || [];
      console.log('Fetched records:', allRecords);
      setAllAttendanceRecords(allRecords);
      setAttendanceRecords(allRecords);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      showError(error.response?.data?.message || 'Failed to load attendance records');
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Apply filters when filter values change
  useEffect(() => {
    if (activeTab === 'records') {
      fetchAttendanceRecords();
    }
  }, [recordsSearchText, recordsDepartmentFilter, recordsDateRange, activeTab]);

  // Fetch logs when logs tab is active
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchAttendanceLogs();
    }
  }, [activeTab]);

  const fetchAttendanceLogs = async () => {
    try {
      setLoadingAttendance(true);
      const response = await api.get('/api/v2/attendance', {
        params: {
          organization_id: organizationId,
          per_page: 500,
          page: 1,
        }
      });
      const logs = response.data?.data?.items || response.data?.items || [];
      setAttendanceLogs(logs);
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
      // Try alternative endpoint
      try {
        const response2 = await organizationsService.getEmployeeAttendanceSummary(organizationId, {
          per_page: 500,
        });
        setAttendanceLogs(response2.data?.items || []);
      } catch (err) {
        console.error('Error fetching alternative logs:', err);
      }
    } finally {
      setLoadingAttendance(false);
    }
  };

  const generatePDFContent = (title, data) => {
    // Get user info from localStorage
    let userName = 'Unknown User';
    try {
      const userDataStr = localStorage.getItem('accesshub_use_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userName = userData.full_name || userData.name || userData.username || 'Unknown User';
      }
    } catch (err) {
      console.warn('Could not retrieve user data from localStorage');
    }

    const now = new Date();

    let html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            h1 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px; }
            h3 { color: #0d9488; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #0d9488; color: white; padding: 10px; text-align: left; font-weight: bold; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background-color: #f3f4f6; }
            .meta { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px; }
            .download-info { 
              display: flex;
              justify-content: space-between;
              align-items: center;
              background-color: #f0fdf4; 
              border-left: 4px solid #0d9488; 
              padding: 12px; 
              margin: 15px 0; 
              font-size: 13px; 
              color: #374151;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          
          ${data}
          <div class="meta">
            <p>This is an automatically generated report from Access Hub</p>
          </div>
        </body>
      </html>
    `;
    return html;
  };

  const getUserInfo = () => {
    let userName = 'Unknown User';
    try {
      const userDataStr = localStorage.getItem('accesshub_use_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userName = userData.full_name || userData.name || 'Unknown User';
      }
    } catch (err) {
      console.warn('Could not retrieve user data from localStorage');
    }
    return userName;
  };

  const downloadPDF = (htmlContent, filename) => {
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const options = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(options).from(element).save();
  };

  const downloadEmployees = async (format = 'pdf') => {
    try {
      if (!organizationId) {
        showError('Organization ID is missing');
        return;
      }

      const fileBlob = await employeesService.downloadDirectory(organizationId, {
        format,
        status_filter: filterStatus
      });

      // Create and trigger download
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      link.setAttribute('download', `employees_directory_${timestamp}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      success(`Employee directory downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error downloading employees:', error);
      showError(`Failed to download employees: ${error.message}`);
    }
  };

  const downloadAnalytics = () => {
    try {
      if (!employees || employees.length === 0) {
        showError('No employee data available');
        return;
      }

      // Check if the analytics container has content
      if (!analyticsRef.current) {
        showError('Analytics content not loaded yet. Please wait a moment and try again.');
        return;
      }

      // Get user info
      const userName = getUserInfo();
      const now = new Date();

      // Create an HTML string with proper structure for PDF
      const headerHTML = `
        <h1 style="
          color: #0d9488;
          border-bottom: 2px solid #0d9488;
          padding-bottom: 10px;
          margin: 0 0 20px 0;
          font-family: Arial, sans-serif;
        ">Employee Analytics Overview</h1>
      `;

      // Get the analytics element HTML
      let analyticsHTML = analyticsRef.current.innerHTML;

      // Remove buttons and interactive elements from the HTML string
      let cleanedHTML = analyticsHTML.replace(/<button[^>]*>.*?<\/button>/g, '');
      cleanedHTML = cleanedHTML.replace(/<select[^>]*>.*?<\/select>/g, '');
      cleanedHTML = cleanedHTML.replace(/<input[^>]*>/g, '');
      
      // Force single column layout by replacing grid-cols-2, md:grid-cols-2, lg:grid-cols-2, lg:grid-cols-3, etc with grid-cols-1
      cleanedHTML = cleanedHTML.replace(/grid-cols-[0-9]|md:grid-cols-[0-9]|lg:grid-cols-[0-9]/g, 'grid-cols-1');

      // Combine header + cleaned analytics + footer
      const footerHTML = `
        <div style="
          color: #666;
          font-size: 12px;
          margin-top: 30px;
          border-top: 1px solid #ddd;
          padding-top: 15px;
          font-family: Arial, sans-serif;
        ">
          <p>This is an automatically generated report from Access Hub</p>
        </div>
      `;

      const completeHTML = `
        <div style="
          font-family: Arial, sans-serif;
          color: #333;
          padding: 20px;
        ">
          ${headerHTML}
          ${cleanedHTML}
          ${footerHTML}
        </div>
      `;

      // Create element for HTML2PDF
      const element = document.createElement('div');
      element.innerHTML = completeHTML;

      const options = {
        margin: 10,
        filename: `analytics_report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        pagebreak: { mode: ['css', 'avoid-all'] }
      };
      
      html2pdf().set(options).from(element).save().then(() => {
        success('Full analytics report downloaded as PDF');
      }).catch(err => {
        console.error('PDF generation error:', err);
        showError('Failed to generate PDF. The report may be too large.');
      });
    } catch (error) {
      console.error('Error downloading analytics report:', error);
      showError('Failed to download analytics report');
    }
  };

  const downloadAttendanceLogs = () => {
    try {
      let logsToDownload = attendanceLogs;
      
      if (logsToDownload.length === 0) {
        showError('Loading attendance logs... Please try again in a moment');
        fetchAttendanceLogs();
        return;
      }
      
      const tableHtml = `
        <table>
          <tr>
            <th>Employee Name</th>
            <th>Employee Code</th>
            <th>Date</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Status</th>
          </tr>
          ${logsToDownload.map(log => `
            <tr>
              <td>${log.employee?.full_name || log.full_name || 'N/A'}</td>
              <td>${log.employee?.employee_code || log.employee_code || 'N/A'}</td>
              <td>${log.date ? new Date(log.date).toLocaleDateString() : 'N/A'}</td>
              <td>${log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString() : '-'}</td>
              <td>${log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString() : 'Active'}</td>
              <td>${log.status ? log.status.toUpperCase() : 'PRESENT'}</td>
            </tr>
          `).join('')}
        </table>
      `;

      const html = generatePDFContent('Attendance Logs Report', tableHtml);
      downloadPDF(html, `attendance_logs_${new Date().toISOString().split('T')[0]}.pdf`);
      success('Attendance logs downloaded as PDF');
    } catch (error) {
      console.error('Error downloading attendance logs:', error);
      showError('Failed to download attendance logs');
    }
  };

  const downloadAttendanceRecords = () => {
    try {
      if (attendanceRecords.length === 0) {
        showError('Loading attendance data... Please try again in a moment');
        fetchAttendanceRecords();
        return;
      }
      
      const tableHtml = `
        <table>
          <tr>
            <th>Employee</th>
            <th>Code</th>
            <th>Department</th>
            <th>Present</th>
            <th>Absent</th>
            <th>Leave</th>
            <th>Avg Hours</th>
            <th>Attendance %</th>
          </tr>
          ${attendanceRecords.map(record => `
            <tr>
              <td>${record.employee?.full_name || 'N/A'}</td>
              <td>${record.employee?.employee_code || 'N/A'}</td>
              <td>${record.employee?.department?.name || 'N/A'}</td>
              <td>${record.present_days}</td>
              <td>${record.absent_days}</td>
              <td>${record.leave_count}</td>
              <td>${record.avg_hours_per_day}</td>
              <td>${record.attendance_percentage}%</td>
            </tr>
          `).join('')}
        </table>
      `;

      const html = generatePDFContent('Attendance Records', tableHtml);
      downloadPDF(html, `attendance_records_${new Date().toISOString().split('T')[0]}.pdf`);
      success('Attendance records downloaded as PDF');
    } catch (error) {
      console.error('Error downloading attendance records:', error);
      showError('Failed to download attendance records');
    }
  };

  const downloadDepartments = () => {
    try {
      if (departments.length === 0) {
        showError('Loading departments... Please try again in a moment');
        return;
      }
      
      const tableHtml = `
        <table>
          <tr>
            <th>Department</th>
            <th>Code</th>
            <th>Employee Count</th>
          </tr>
          ${departments.map(dept => {
            const count = employees.filter(e => e.department_id === dept.id).length;
            return `
            <tr>
              <td>${dept.name || dept.department_name}</td>
              <td>${dept.code || 'N/A'}</td>
              <td>${count}</td>
            </tr>
          `}).join('')}
        </table>
      `;

      const html = generatePDFContent('Departments List', tableHtml);
      downloadPDF(html, `departments_${new Date().toISOString().split('T')[0]}.pdf`);
      success('Departments downloaded as PDF');
    } catch (error) {
      console.error('Error downloading departments:', error);
      showError('Failed to download departments');
    }
  };

  const downloadShifts = () => {
    try {
      if (shifts.length === 0) {
        showError('Loading shifts... Please try again in a moment');
        return;
      }
      
      const tableHtml = `
        <table>
          <tr>
            <th>Shift Name</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Employee Count</th>
          </tr>
          ${shifts.map(shift => {
            const count = employees.filter(e => e.shift_id === shift.id).length;
            return `
            <tr>
              <td>${shift.shift_name || shift.name}</td>
              <td>${shift.start_time || 'N/A'}</td>
              <td>${shift.end_time || 'N/A'}</td>
              <td>${count}</td>
            </tr>
          `}).join('')}
        </table>
      `;

      const html = generatePDFContent('Shifts List', tableHtml);
      downloadPDF(html, `shifts_${new Date().toISOString().split('T')[0]}.pdf`);
      success('Shifts downloaded as PDF');
    } catch (error) {
      console.error('Error downloading shifts:', error);
      showError('Failed to download shifts');
    }
  };

  const downloadCalendar = () => {
    try {
      if (!calendarRef.current) {
        showError('Calendar content not loaded yet. Please wait a moment and try again.');
        return;
      }

      // Get user info
      const userName = getUserInfo();
      const now = new Date();

      // Create a clone of the calendar element
      const element = calendarRef.current.cloneNode(true);
      
      // Create a header with user info and timestamp
      
      // Remove any interactive elements
      const buttons = element.querySelectorAll('button, input, select');
      buttons.forEach(btn => btn.remove());

      const options = {
        margin: 10,
        filename: `attendance_calendar_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      html2pdf().set(options).from(element).save().then(() => {
        success('Attendance calendar downloaded as PDF');
      }).catch(err => {
        console.error('PDF generation error:', err);
        showError('Failed to generate PDF');
      });
    } catch (error) {
      console.error('Error downloading calendar:', error);
      showError('Failed to download calendar');
    }
  };

  const handleDownloadClick = () => {
    switch(activeTab) {
      case 'list':
        downloadEmployees('pdf');
        break;
      case 'analytics':
        downloadAnalytics();
        break;
      case 'logs':
        downloadAttendanceLogs();
        break;
      case 'records':
        downloadAttendanceRecords();
        break;
      case 'calendar':
        downloadCalendar();
        break;
      case 'departments':
        downloadDepartments();
        break;
      case 'shifts':
        downloadShifts();
        break;
      default:
        downloadEmployees('pdf');
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
      success('Employee deleted successfully!');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      showError(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      await employeesService.update(employee.id, {
        is_active: !employee.is_active,
      });
      success(employee.is_active ? 'Successfully disabled' : 'Successfully enabled');
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee status:', error);
      showError(error.response?.data?.message || 'Failed to update employee status');
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
        const updateResponse = await employeesService.update(editingEmployee.id, payload);
        success('Successfully updated');

        // Enroll employee face if photo was updated
        if (employeePhoto) {
          try {
            await faceService.enrollFace(editingEmployee.id, employeePhoto);
          } catch (enrollmentError) {
            // Non-blocking error - employee update still successful
            console.warn('⚠️ Face enrollment failed for update:', enrollmentError);
          }
        }
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
        const createResponse = await employeesService.create(payload);
        success('Successfully created');

        // Enroll employee face using unified /api/v1/face/enroll endpoint
        if (employeePhoto && createResponse.data?.id) {
          try {
            await faceService.enrollFace(createResponse.data.id, employeePhoto);
          } catch (enrollmentError) {
            // Non-blocking error - employee creation still successful
            console.warn('⚠️ Face enrollment failed for new employee:', enrollmentError);
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
      showError(error.response?.data?.message || 'Failed to save employee');
    }
  };

  const handleFileUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEmployeePhoto(reader.result);
      success('Employee photo uploaded successfully!');
    };
    reader.readAsDataURL(file);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedAttendanceRecords = attendanceRecords.slice(
    (recordsCurrentPage - 1) * recordsItemsPerPage,
    recordsCurrentPage * recordsItemsPerPage
  );

  const getAttendanceRecordEmployeePhoto = (record) => {
    const directPhoto = record.employee?.photo_base64 || record.employee?.photo || record.employee?.photo_url;
    if (directPhoto) return directPhoto;

    const matchedEmployee = employees.find((emp) =>
      emp.id === record.employee_id ||
      emp.employee_id === record.employee_id ||
      (record.employee?.employee_code && emp.employee_code === record.employee.employee_code)
    );

    return matchedEmployee?.photo_base64 || matchedEmployee?.photo || matchedEmployee?.photo_url || null;
  };

  useEffect(() => {
    setRecordsCurrentPage(1);
  }, [recordsSearchText, recordsDepartmentFilter, recordsDateRange, activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 shadow-inner">
        <Loader size="large" text="Fetching employee records..." />
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

          {/* Right: Action buttons + Tabs */}
          <div className="flex items-center gap-3">
            {/* Action Buttons Group */}
            <div className="flex gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                onClick={handleCreateEmployee}
                className="px-4 py-1.5 bg-teal-600 text-white text-sm font-medium rounded hover:bg-teal-700 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Employee
              </button>
              
              {(
                (activeTab === 'list' && employees.length > 0) ||
                (activeTab === 'analytics' && employees.length > 0) ||
                (activeTab === 'logs') ||
                (activeTab === 'records') ||
                (activeTab === 'calendar' && employees.length > 0) ||
                (activeTab === 'departments') ||
                (activeTab === 'shifts')
              ) && (
                <button
                  onClick={handleDownloadClick}
                  className="px-4 py-1.5 bg-teal-500 text-white text-sm font-medium rounded hover:bg-teal-600 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab('list')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'list' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><Users className="w-3.5 h-3.5" />List</button>
              <button onClick={() => setActiveTab('analytics')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'analytics' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><BarChart3 className="w-3.5 h-3.5" />Overview</button>
              <button onClick={() => setActiveTab('logs')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'logs' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><ClipboardList className="w-3.5 h-3.5" />Logs</button>
              <button onClick={() => setActiveTab('records')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'records' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><FileText className="w-3.5 h-3.5" />Records</button>
              <button onClick={() => setActiveTab('calendar')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'calendar' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><CalendarIcon className="w-3.5 h-3.5" />calendar</button>
              <button onClick={() => setActiveTab('departments')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'departments' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><Building2 className="w-3.5 h-3.5" />Dept</button>
              <button onClick={() => setActiveTab('shifts')} className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${activeTab === 'shifts' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-200'}`}><Clock className="w-3.5 h-3.5" />Shifts</button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <div ref={analyticsRef}>
          <EmployeeAnalytics
            employees={employees}
            organizationId={organizationId}
          />
        </div>
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

            {/* Filters */}
            <div className="bg-teal-50/95 p-3 border-b border-gray-200 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-3 flex-1 min-w-[300px]">
                <Input
                  prefix={<span>🔍</span>}
                  placeholder="Search by name or code..."
                  value={recordsSearchText}
                  onChange={e => setRecordsSearchText(e.target.value)}
                  className="max-w-xs text-sm"
                  size="small"
                />
                <DatePicker.RangePicker
                  value={recordsDateRange}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      // Validate that start date is before or equal to end date
                      if (dates[0].isAfter(dates[1])) {
                        showError('Start date must be before or equal to end date');
                        return;
                      }
                      setRecordsDateRange(dates);
                    }
                  }}
                  size="small"
                  className="w-64"
                />
                <Select
                  placeholder="Select Department"
                  value={recordsDepartmentFilter}
                  onSelect={setRecordsDepartmentFilter}
                  className="min-w-[150px]"
                  size="small"
                >
                  <Select.Option value="all">All Departments</Select.Option>
                  {departments.map(dept => (
                    <Select.Option key={dept.id} value={dept.id}>{dept.name}</Select.Option>
                  ))}
                </Select>
              </div>
              <button
                onClick={fetchAttendanceRecords}
                className="text-teal-600 hover:text-teal-800 font-medium text-xs flex items-center gap-1"
              >
                🔄 Refresh
              </button>
            </div>

            {loadingAttendance ? (
              <div className="flex items-center justify-center py-12">
                <Loader />
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
                        S.No
                      </th>
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
                    {paginatedAttendanceRecords.map((record, index) => (
                      <tr
                        key={record.entity_id }
                        className="hover:bg-teal-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedCalendarEmployee(record.entity_id );
                          setActiveTab('calendar');
                        }}
                        title="Click to view attendance calendar"
                      >
                        {(() => {
                          const recordPhoto = getAttendanceRecordEmployeePhoto(record);
                          const recordName = record.employee?.full_name || 'Employee';
                          return (
                            <>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">
                          {(recordsCurrentPage - 1) * recordsItemsPerPage + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                              {recordPhoto ? (
                                <img
                                  src={recordPhoto}
                                  alt={recordName}
                                  className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {(recordName || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                            <div>
                              <div className="font-semibold text-gray-900">{record.employee?.full_name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{record.employee?.employee_code || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {record.employee?.department?.name || 'N/A'}
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
                            </>
                          );
                        })()}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {attendanceRecords.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-white">
                    <div className="text-sm text-gray-600">
                      Showing {attendanceRecords.length === 0 ? 0 : (recordsCurrentPage - 1) * recordsItemsPerPage + 1} to {Math.min(recordsCurrentPage * recordsItemsPerPage, attendanceRecords.length)} of {attendanceRecords.length} records
                    </div>
                    <Pagination
                      current={recordsCurrentPage}
                      pageSize={recordsItemsPerPage}
                      total={attendanceRecords.length}
                      showSizeChanger
                      pageSizeOptions={[10, 20, 50, 100]}
                      onChange={(page) => setRecordsCurrentPage(page)}
                      onShowSizeChange={(_, size) => {
                        setRecordsCurrentPage(1);
                        setRecordsItemsPerPage(size);
                      }}
                      showLessItems
                    />
                  </div>
                )}
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
                      S.No
                    </th>
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
                  {paginatedEmployees.map((employee, index) => (
                    <tr key={employee.id} className="hover:bg-teal-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {employee.photo_base64 || employee.photo || employee.photo_url ? (
                            <img
                              src={employee.photo_base64 || employee.photo || employee.photo_url}
                              alt={employee.full_name}
                              className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                              {employee.full_name?.charAt(0).toUpperCase()}
                            </div>
                          )}
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

              {filteredEmployees.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-white">
                  <div className="text-sm text-gray-600">
                    Showing {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
                  </div>
                  <Pagination
                    current={currentPage}
                    pageSize={itemsPerPage}
                    total={filteredEmployees.length}
                    showSizeChanger
                    pageSizeOptions={[10, 20, 50, 100]}
                    onChange={(page) => setCurrentPage(page)}
                    onShowSizeChange={(_, size) => {
                      setCurrentPage(1);
                      setItemsPerPage(size);
                    }}
                    showLessItems
                  />
                </div>
              )}
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

                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    {!showWebcam && !employeePhoto && (
                      <button
                        type="button"
                        onClick={() => setShowWebcam(true)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Capture Photo
                      </button>
                    )}

                    {/* File upload button */}
                    <div className="flex-1">
                      <label className="w-full cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        <div className="w-full px-6 py-3 bg-white border border-gray-200 rounded-xl text-center text-sm text-gray-700 hover:shadow-sm">
                          📁 Upload Photo
                        </div>
                      </label>
                    </div>
                  </div>

                  {showWebcam && (
                    <div className="mb-6">
                      <WebcamCapture
                        key={`webcam-${Date.now()}`}
                        onImageCapture={(base64) => {
                          setEmployeePhoto(base64);
                          setShowWebcam(false);
                          success('Employee photo captured successfully!');
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
        <div ref={calendarRef} className="bg-teal-50/95 rounded-lg shadow-sm border border-gray-200 p-4">
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

