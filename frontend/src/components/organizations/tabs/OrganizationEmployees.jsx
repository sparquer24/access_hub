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
import OrganizationSettings from './OrganizationSettings';
import { authService } from '../../../services/authService';
import { Users, UserPlus, BarChart3, ClipboardList, Calendar as CalendarIcon, Building2, Clock, FileText, Download, MoreHorizontal, ChevronDown, CheckCircle2, XCircle, Search, ListFilter, Trash2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const { Option } = Select;
const { TextArea } = Input;

const OrganizationEmployees = ({
  organizationId,
  organization,
  isAlertSidebarOpen = false,
  activeSubTab = 'list',
  onSubTabChange
}) => {
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
  const [isCreateFormComplete, setIsCreateFormComplete] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState('list');
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
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const tabDropdownRef = React.useRef(null);
  const calendarRef = React.useRef(null);
  const analyticsRef = React.useRef(null);
  const { success, error: showError } = useToast();

  const employeeTabs = [
      { id: 'list', label: 'List', icon: Users },
      { id: 'analytics', label: 'Overview', icon: BarChart3 },
      { id: 'logs', label: 'Logs', icon: ClipboardList },
      { id: 'records', label: 'Records', icon: FileText },
      { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
      { id: 'departments', label: 'Dept', icon: Building2 },
      { id: 'shifts', label: 'Shifts', icon: Clock },
      { id: 'settings', label: 'Settings', icon: MoreHorizontal }
    ];

  const validEmployeeTabIds = employeeTabs.map((tab) => tab.id);
  const activeTab = validEmployeeTabIds.includes(activeSubTab) ? activeSubTab : internalActiveTab;

  const setActiveTab = (tabId) => {
    if (typeof onSubTabChange === 'function') {
      onSubTabChange(tabId);
      return;
    }

    setInternalActiveTab(tabId);
  };

  const activeTabMeta = employeeTabs.find((tab) => tab.id === activeTab) || employeeTabs[0];

  const requiredCreateFields = [
    'full_name',
    'phone_number',
    'gender',
    'date_of_birth',
    'designation',
    'employment_type',
    'joining_date',
    'department_id',
    'shift_id',
    'address',
  ];

  const isValueFilled = (value) => {
    if (moment.isMoment(value)) return true;
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== undefined && value !== null && value !== '';
  };

  const updateCreateFormCompleteness = (allValues = form.getFieldsValue(true), photoValue = employeePhoto) => {
    if (editingEmployee) {
      setIsCreateFormComplete(true);
      return;
    }

    const hasAllRequiredFields = requiredCreateFields.every((field) => isValueFilled(allValues?.[field]));
    const hasPhoto = Boolean(photoValue);
    setIsCreateFormComplete(hasAllRequiredFields && hasPhoto);
  };

  useEffect(() => {
    fetchEmployees();
  }, [organizationId]);

  useEffect(() => {
    fetchDepartmentsAndShifts();
  }, [organizationId]);

  useEffect(() => {
    if (showModal) {
      updateCreateFormCompleteness(form.getFieldsValue(true), employeePhoto);
    }
  }, [employeePhoto, showModal, editingEmployee]);

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
    // The create/edit modal is rendered in the list tab section.
    // Route to list first so the modal is mounted before opening it.
    if (activeTab !== 'list') {
      setActiveTab('list');
    }
    setEditingEmployee(null);
    setEmployeePhoto(null);
    setShowWebcam(false);
    setIsCreateFormComplete(false);
    form.resetFields();
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    if (activeTab !== 'list') {
      setActiveTab('list');
    }
    setEditingEmployee(employee);
    setEmployeePhoto(employee.photo_base64 || null);
    setShowWebcam(false);
    form.setFieldsValue({
      ...employee,
      date_of_birth: employee.date_of_birth ? moment(employee.date_of_birth) : null,
      joining_date: employee.joining_date ? moment(employee.joining_date) : null,
    });
    setIsCreateFormComplete(true);
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

  // Track if submit was triggered by button
  const submitTriggeredByButton = React.useRef(false);

  const handleSubmit = async (values) => {
    console.log('[FORM SUBMIT] values:', values, 'submitTriggeredByButton:', submitTriggeredByButton.current);
    if (!submitTriggeredByButton.current) {
      console.warn('Form submit blocked: not triggered by button');
      return;
    }
    submitTriggeredByButton.current = false;
    try {
      // ...existing code...
      let photoBase64Clean = undefined;
      if (employeePhoto) {
        const match = employeePhoto.match(/^data:(image\/\w+);base64,(.+)$/);
        photoBase64Clean = match ? match[2] : employeePhoto;
      }
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
          photo_base64: photoBase64Clean,
        };
        console.log('[EMPLOYEE UPDATE] payload:', payload, 'employeePhoto:', employeePhoto);
        const updateResponse = await employeesService.update(editingEmployee.id, payload);
        success('Successfully updated');
        if (employeePhoto) {
          try {
            await faceService.enrollFace(editingEmployee.id, employeePhoto);
          } catch (enrollmentError) {
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
          photo_base64: photoBase64Clean,
        };
        console.log('[EMPLOYEE CREATE] payload:', payload, 'employeePhoto:', employeePhoto);
        const createResponse = await employeesService.create(payload);
        success('Successfully created');
        if (employeePhoto && createResponse.data?.id) {
          try {
            await faceService.enrollFace(createResponse.data.id, employeePhoto);
          } catch (enrollmentError) {
            console.warn('⚠️ Face enrollment failed for new employee:', enrollmentError);
          }
        }
      }
      setShowModal(false);
      setEmployeePhoto(null);
      setShowWebcam(false);
      setIsCreateFormComplete(false);
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

  let activeEmployeesCount = 0, inactiveEmployeesCount = 0;
  employees.forEach(employee => {
    if (employee.is_active) activeEmployeesCount++;
    else inactiveEmployeesCount++;
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
    // First try direct photo from record
    const directPhoto = record.employee?.photo_base64 || record.employee?.photo || record.employee?.photo_url;
    if (directPhoto) return directPhoto;

    // Find matched employee using multiple ID fields
    const matchedEmployee = employees.find((emp) =>
      emp.id === record.employee_id ||
      emp.employee_id === record.employee_id ||
      emp.id === record.entity_id ||
      emp.employee_id === record.entity_id ||
      (record.employee?.employee_code && emp.employee_code === record.employee.employee_code) ||
      (record.employee?.full_name && emp.full_name === record.employee.full_name)
    );

    const employeePhoto = matchedEmployee?.photo_base64 || matchedEmployee?.photo || matchedEmployee?.photo_url;
    
    // Return photo if found, otherwise return null for fallback
    return employeePhoto || null;
  };

  useEffect(() => {
    setRecordsCurrentPage(1);
  }, [recordsSearchText, recordsDepartmentFilter, recordsDateRange, activeTab]);

  useEffect(() => {
    if (!isAlertSidebarOpen) {
      setIsTabDropdownOpen(false);
    }
  }, [isAlertSidebarOpen]);

  useEffect(() => {
    if (!isTabDropdownOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (tabDropdownRef.current && !tabDropdownRef.current.contains(event.target)) {
        setIsTabDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsTabDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isTabDropdownOpen]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 shadow-inner">
        <Loader size="large" text="Fetching employee records..." />
      </div>
    );
  }

  const canDownload =
    (activeTab === 'list' && employees.length > 0) ||
    (activeTab === 'analytics' && employees.length > 0) ||
    activeTab === 'logs' ||
    activeTab === 'records' ||
    (activeTab === 'calendar' && employees.length > 0) ||
    activeTab === 'departments' ||
    activeTab === 'shifts';




  return (
    <div className="w-full space-y-3 pb-16">
      {/* Employee Directory Header */}
      <div className="rounded-xl border border-teal-100/70 bg-gradient-to-r from-white via-teal-50/60 to-cyan-50/60 shadow-sm overflow-visible relative">
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between relative z-30">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/10 ring-1 ring-teal-200">
                <Users className="w-4.5 h-4.5 text-teal-700" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Employee Directory
              </h2>
              <span className="hidden sm:inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                {employees.length} total
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Manage workforce, attendance, and department-level operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 xl:gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 p-1.5 shadow-sm">
              <button
                onClick={handleCreateEmployee}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                title="Add Employee"
                aria-label="Add Employee"
              >
                <UserPlus className="w-4 h-4" />
              </button>

              {canDownload && (
                <button
                  onClick={handleDownloadClick}
                  className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-teal-700"
                  title="Download"
                  aria-label="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>

            {isAlertSidebarOpen ? (
              <div className="flex items-center gap-2">
                <div ref={tabDropdownRef} className="relative">
                <button
                  onClick={() => setIsTabDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span>{activeTabMeta.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isTabDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg z-50">
                    {employeeTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsTabDropdownOpen(false);
                          }}
                          className={`w-full rounded-md px-3 py-2 text-left text-xs font-semibold transition-all flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-600 hover:text-teal-600 hover:bg-gray-100'
                            }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1.5 shadow-sm overflow-x-auto flex-1 xl:flex-none">
                {employeeTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${activeTab === tab.id
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
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
          <div className="bg-teal-50/95 rounded-xl shadow-md overflow-hidden px-2 max-h-[calc(100vh-310px)] pb-16">
            {/* Title and Filters in one line */}
            <div className="bg-teal-50/95 p-3 border-b border-gray-200 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">Monthly Attendance Records</h3>
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
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-370px)]">
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
                          const employeeId = record.employee_id || record.entity_id || record.employee?.id;
                          console.log('Record clicked, employee ID:', employeeId, 'Record:', record);
                          setSelectedCalendarEmployee(employeeId);
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
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {recordName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{recordName}</div>
                              <div className="text-xs text-gray-500">{record.employee?.employee_code || 'No Code'}</div>
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
            <div className="relative w-full md:max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, code, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center justify-start md:justify-end">
              <div className="min-w-[240px]">
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  suffixIcon={<ChevronDown className="w-4 h-4 text-gray-500" />}
                  className="w-full"
                  size="middle"
                >
                  <Option value="all">
                    <span className="inline-flex items-center gap-2">
                      <ListFilter className="w-4 h-4 text-slate-500" />
                      All ({employees.length})
                    </span>
                  </Option>
                  <Option value="active">
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Active ({activeEmployeesCount})
                    </span>
                  </Option>
                  <Option value="inactive">
                    <span className="inline-flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-orange-600" />
                      Inactive ({inactiveEmployeesCount})
                    </span>
                  </Option>
                </Select>
              </div>
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
            <div className="overflow-x-auto bg-teal-50/95 rounded-lg shadow-sm border border-gray-200 max-h-[calc(100vh-310px)] overflow-y-auto pb-16">
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
                      <td className="px-4 py-4 text-sm font-medium text-gray-700">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {employee.photo_base64 || employee.photo || employee.photo_url ? (
                            <img
                              src={
                                employee.photo_base64
                                  ? (employee.photo_base64.startsWith('data:')
                                      ? employee.photo_base64
                                      : `data:image/jpeg;base64,${employee.photo_base64}`)
                                  : (employee.photo || employee.photo_url)
                              }
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
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm font-semibold text-teal-600">
                          {employee.employee_code}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {employee.phone_number || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {employee.designation || 'N/A'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {employee.employment_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleStatus(employee)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1.5 ${employee.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            }`}
                        >
                          {employee.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            title="Edit employee"
                            aria-label="Edit employee"
                            className="w-9 h-9 inline-flex items-center justify-center bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id, employee.full_name)}
                            title="Delete employee"
                            aria-label="Delete employee"
                            className="w-9 h-9 inline-flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
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
              <div className="py-1">
                <div className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
                  {editingEmployee ? 'Edit Employee' : 'Create New Employee'}
                </div>
                {!editingEmployee && (
                  <p className="text-sm text-gray-500 mt-2">
                    Fill in the employee details below. All fields marked <span className="text-red-500 font-semibold">*</span> are required.
                  </p>
                )}
              </div>
            }
            open={showModal}
            onCancel={() => {
              setShowModal(false);
              setEmployeePhoto(null);
              setShowWebcam(false);
              setIsCreateFormComplete(false);
              form.resetFields();
            }}
            footer={null}
            width={980}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="mt-4"
              onValuesChange={(_, allValues) => updateCreateFormCompleteness(allValues, employeePhoto)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6">
                <div className="rounded-xl border border-gray-200 p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Employee Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item
                      name="full_name"
                      label="Full Name"
                      rules={[{ required: !editingEmployee, message: 'Please enter full name' }]}
                    >
                      <Input placeholder="John Doe" />
                    </Form.Item>

                    <Form.Item
                      name="phone_number"
                      label="Phone Number"
                      rules={[{ required: !editingEmployee, message: 'Please enter phone number' }]}
                    >
                      <Input placeholder="+1234567890" />
                    </Form.Item>

                    <Form.Item
                      name="gender"
                      label="Gender"
                      rules={[{ required: !editingEmployee, message: 'Please select gender' }]}
                    >
                      <Select placeholder="Select gender">
                        <Option value={GENDER_OPTIONS.MALE}>Male</Option>
                        <Option value={GENDER_OPTIONS.FEMALE}>Female</Option>
                        <Option value={GENDER_OPTIONS.OTHER}>Other</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="date_of_birth"
                      label="Date of Birth"
                      rules={[{ required: !editingEmployee, message: 'Please select date of birth' }]}
                    >
                      <DatePicker className="w-full" format="YYYY-MM-DD" />
                    </Form.Item>

                    <Form.Item
                      name="designation"
                      label="Designation"
                      rules={[{ required: !editingEmployee, message: 'Please enter designation' }]}
                    >
                      <Input placeholder="Software Engineer" />
                    </Form.Item>

                    <Form.Item
                      name="employment_type"
                      label="Employment Type"
                      rules={[{ required: !editingEmployee, message: 'Please select employment type' }]}
                    >
                      <Select placeholder="Select employment type">
                        <Option value={EMPLOYMENT_TYPES.FULL_TIME}>Full Time</Option>
                        <Option value={EMPLOYMENT_TYPES.PART_TIME}>Part Time</Option>
                        <Option value={EMPLOYMENT_TYPES.CONTRACT}>Contract</Option>
                        <Option value={EMPLOYMENT_TYPES.INTERN}>Intern</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="department_id"
                      label="Department"
                      rules={[{ required: !editingEmployee, message: 'Please select department' }]}
                    >
                      <Select placeholder="Select department" allowClear>
                        {departments.map((d) => (
                          <Option key={d.id} value={d.id}>{d.name || d.department_name}{d.code ? ` — ${d.code}` : ''}</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="joining_date"
                      label="Joining Date"
                      rules={[{ required: !editingEmployee, message: 'Please select joining date' }]}
                    >
                      <DatePicker className="w-full" format="YYYY-MM-DD" />
                    </Form.Item>

                    <Form.Item
                      name="shift_id"
                      label="Shift"
                      className="md:col-span-2"
                      rules={[{ required: !editingEmployee, message: 'Please select shift' }]}
                    >
                      <Select placeholder="Select shift" allowClear>
                        {shifts.map((s) => (
                          <Option key={s.id} value={s.id}>{s.shift_name || s.name} {s.start_time ? `(${s.start_time} - ${s.end_time})` : ''}</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="address"
                      label="Address"
                      className="md:col-span-2"
                      rules={[{ required: !editingEmployee, message: 'Please enter address' }]}
                    >
                      <TextArea rows={4} placeholder="Enter full address" />
                    </Form.Item>

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
                </div>

                <div className="rounded-xl border border-gray-200 p-5 h-fit">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Employee Photo</h3>

                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:text-gray-800"
                    />

                    <div className="w-full block mt-1">
                      <div className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-center text-sm text-gray-700 hover:shadow-sm">
                        📁 Upload Photo
                      </div>
                    </div>

                    {!showWebcam && (
                      <button
                        type="button"
                        onClick={() => setShowWebcam(true)}
                        className="w-full px-5 py-3 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300"
                      >
                        Capture Photo
                      </button>
                    )}

                    {showWebcam && (
                      <div className="pt-1 flex justify-start">
                        <button
                          type="button"
                          onClick={() => setShowWebcam(false)}
                          className="flex items-center gap-2 px-5 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5 3 12l7.5-7.5" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
                          </svg>
                          Back
                        </button>
                      </div>
                    )}
                  </div>

                  {showWebcam && (
                    <div className="mt-4">
                      <WebcamCapture
                        key={`webcam-${Date.now()}`}
                        onImageCapture={(base64) => {
                          setEmployeePhoto(base64);
                          setShowWebcam(false);
                          success('Employee photo captured successfully!');
                        }}
                      />
                    </div>
                  )}

                  {employeePhoto && (
                    <div className="mt-4 bg-teal-50 rounded-lg p-4 border border-green-200">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        <p className="text-green-700 font-semibold">Photo captured successfully</p>
                      </div>
                      <img
                        src={employeePhoto}
                        alt="Employee"
                        className="w-full h-44 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEmployeePhoto(null);
                    setShowWebcam(false);
                    setIsCreateFormComplete(false);
                    form.resetFields();
                  }}
                  className="px-6 py-2 bg-teal-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={(!editingEmployee && !isCreateFormComplete) || !employeePhoto}
                  className={`px-6 py-2 rounded-lg transition-all font-semibold ${
                    (!editingEmployee && !isCreateFormComplete) || !employeePhoto
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-600 to-teal-600 text-white hover:shadow-lg'
                  }`}
                  onClick={() => {
                    submitTriggeredByButton.current = true;
                    form.submit();
                  }}
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

      {activeTab === 'settings' && (
        <OrganizationSettings
          organizationId={organizationId}
          organization={organization}
        />
      )}
    </div>
  );
};

export default OrganizationEmployees;

