import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { employeesService } from '../../services/organizationsService';
import EmployeeAttendanceCalendar from '../organizations/tabs/EmployeeAttendanceCalendar';
import { Spin } from 'antd';

const OrgAdminAttendance = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await employeesService.list({
        organization_id: user?.organization?.id,
        per_page: 1000,
        is_active: true
      });
      setEmployees(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <div className="min-h-screen bg-teal-50">
      {/* Header */}
      <div className="bg-teal-50/95 shadow">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Attendance Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage attendance for {user?.organization?.name || 'your organization'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <EmployeeAttendanceCalendar
            employees={employees}
            viewMode="admin"
          />
        )}
      </div>
    </div>
  );
};

export default OrgAdminAttendance;
