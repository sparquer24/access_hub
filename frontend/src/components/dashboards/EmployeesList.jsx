import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { employeesService } from '../../services/organizationsService';
import { Users, TrendingUp, CheckCircle, Clock, Briefcase } from 'lucide-react';

const EmployeesList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterEmploymentType, setFilterEmploymentType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Overview stats
  const [overviewStats, setOverviewStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    departments: [],
    employmentTypes: {},
    newThisMonth: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchOverviewStats();
  }, [currentPage, filterStatus, filterDepartment, filterEmploymentType]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchEmployees();
        fetchOverviewStats();
      } else {
        setCurrentPage(1);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchOverviewStats = async () => {
    try {
      setStatsLoading(true);
      
      // Fetch all employees to calculate stats
      const response = await employeesService.list({
        page: 1,
        per_page: 1000, // Get more employees for accurate stats
      });

      const allEmployees = response.data.items || [];
      
      // Calculate statistics
      const active = allEmployees.filter(e => e.is_active).length;
      const inactive = allEmployees.filter(e => !e.is_active).length;
      
      // Get unique departments
      const deptMap = {};
      allEmployees.forEach(emp => {
        if (emp.department?.name) {
          deptMap[emp.department.name] = (deptMap[emp.department.name] || 0) + 1;
        }
      });
      
      // Get employment type breakdown
      const empTypeMap = {};
      allEmployees.forEach(emp => {
        const type = emp.employment_type || 'Unspecified';
        empTypeMap[type] = (empTypeMap[type] || 0) + 1;
      });
      
      // Calculate new employees this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newThisMonth = allEmployees.filter(emp => {
        if (!emp.joining_date) return false;
        const joinDate = new Date(emp.joining_date);
        return joinDate >= firstDayOfMonth && joinDate <= now;
      }).length;
      
      setOverviewStats({
        totalEmployees: response.data.pagination?.total_items || allEmployees.length,
        activeEmployees: active,
        inactiveEmployees: inactive,
        departments: Object.entries(deptMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        employmentTypes: empTypeMap,
        newThisMonth,
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      // Non-blocking error
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        per_page: 20,
        is_active: filterStatus === 'all' ? undefined : filterStatus === 'active'
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const response = await employeesService.list(params);
      
      if (response.success) {
        // Client-side additional filtering for department and employment type
        let filtered = response.data.items || [];
        
        if (filterDepartment !== 'all') {
          filtered = filtered.filter(emp => emp.department?.name === filterDepartment);
        }
        
        if (filterEmploymentType !== 'all') {
          filtered = filtered.filter(emp => emp.employment_type === filterEmploymentType);
        }
        
        setEmployees(filtered);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalItems(response.data.pagination?.total_items || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees; // No need to filter here since API handles filtering

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24 pb-12">
      {/* Sticky Header */}
      <div className="sticky top-20 bg-gradient-to-r from-teal-600 to-teal-600 text-white shadow-xl z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">👥 Employees Management</h1>
              <p className="text-teal-100">Manage and view all employees ({totalItems} total)</p>
            </div>
            <button
              onClick={() => navigate('/super-admin/dashboard')}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-lg font-semibold transition-all duration-300"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Employees Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-lg text-white">
                <Users size={24} />
              </div>
              <span className="text-sm font-semibold text-blue-600">Total</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900 mb-1">{overviewStats.totalEmployees}</h3>
            <p className="text-sm text-slate-600">Total Employees</p>
          </div>

          {/* Active Employees Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-lg text-white">
                <CheckCircle size={24} />
              </div>
              <span className="text-sm font-semibold text-green-600">Active</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900 mb-1">{overviewStats.activeEmployees}</h3>
            <p className="text-sm text-slate-600">
              {overviewStats.totalEmployees > 0 
                ? `${Math.round((overviewStats.activeEmployees / overviewStats.totalEmployees) * 100)}% of total`
                : 'No employees'
              }
            </p>
          </div>

          {/* Inactive Employees Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg p-6 border border-orange-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500 rounded-lg text-white">
                <Clock size={24} />
              </div>
              <span className="text-sm font-semibold text-orange-600">Inactive</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900 mb-1">{overviewStats.inactiveEmployees}</h3>
            <p className="text-sm text-slate-600">Inactive Employees</p>
          </div>

          {/* New This Month Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-6 border border-purple-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-lg text-white">
                <TrendingUp size={24} />
              </div>
              <span className="text-sm font-semibold text-purple-600">New</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900 mb-1">{overviewStats.newThisMonth}</h3>
            <p className="text-sm text-slate-600">Joined This Month</p>
          </div>
        </div>

        {/* Department & Employment Type Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Top Departments */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center mb-6">
              <Briefcase size={24} className="text-teal-600 mr-3" />
              <h3 className="text-xl font-bold text-slate-900">Top Departments</h3>
            </div>
            {overviewStats.departments.length > 0 ? (
              <div className="space-y-3">
                {overviewStats.departments.slice(0, 5).map((dept, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all">
                    <span className="font-medium text-slate-700">{dept.name}</span>
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">
                      {dept.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No department data available</p>
            )}
          </div>

          {/* Employment Type Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center mb-6">
              <Briefcase size={24} className="text-purple-600 mr-3" />
              <h3 className="text-xl font-bold text-slate-900">Employment Types</h3>
            </div>
            {Object.keys(overviewStats.employmentTypes).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(overviewStats.employmentTypes).map(([type, count], idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all">
                    <span className="font-medium text-slate-700 capitalize">
                      {type.replace(/_/g, ' ')}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No employment type data available</p>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-teal-50/95 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">🔍 Search & Filter</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Name / Email</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              >
                <option value="all">All</option>
                {overviewStats.departments.map((dept, idx) => (
                  <option key={idx} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Employment Type</label>
              <select
                value={filterEmploymentType}
                onChange={(e) => setFilterEmploymentType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              >
                <option value="all">All</option>
                {Object.keys(overviewStats.employmentTypes).map((type, idx) => (
                  <option key={idx} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchEmployees}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Employees Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-slate-600 font-semibold">Loading employees...</p>
            </div>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map(emp => (
              <div
                key={emp.id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-2xl hover:border-teal-300 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">👤</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    emp.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {emp.is_active ? '✓ Active' : '⊘ Inactive'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{emp.full_name || emp.name}</h3>
                
                <div className="space-y-2 mb-4 text-sm text-slate-600">
                  <p className="flex items-center">
                    <span className="mr-2">📧</span>
                    <span className="truncate">{emp.user?.email || 'N/A'}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2">🏢</span>
                    <span>{emp.department?.name || 'N/A'}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2">🆔</span>
                    <span>{emp.employee_code || 'N/A'}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2">📅</span>
                    <span>{emp.joining_date || 'N/A'}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2">💼</span>
                    <span className="capitalize">{emp.employment_type?.replace(/_/g, ' ') || 'N/A'}</span>
                  </p>
                  {emp.shift?.name && (
                    <p className="flex items-center">
                      <span className="mr-2">⏰</span>
                      <span>{emp.shift.name}</span>
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => message.info('Employee detail view coming soon')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all group-hover:translate-y-[-2px]"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <p className="text-slate-600 text-lg">No employees found matching your filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-teal-600 hover:bg-teal-50 border border-teal-200'
              }`}
            >
              ← Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                      currentPage === pageNumber
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-teal-600 hover:bg-teal-50 border border-teal-200'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-teal-600 hover:bg-teal-50 border border-teal-200'
              }`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeesList;
