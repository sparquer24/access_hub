import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { message } from 'antd';

const AdminPanelDashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Check if user has role 'admin' and has an organization_id
      if (user?.role?.name === 'admin' && user?.organization_id) {
        // Redirect to the organization detail page
        navigate(`/admin-panel/organizations/${user.organization_id}`, { replace: true });
      } else if (user?.role?.name === 'admin' && !user?.organization_id) {
        message.warning('You are not assigned to any organization yet.');
      } else {
        message.error('Access denied. Only admin users can access this page.');
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin"></div>
      <p className="text-gray-600">Loading your organization...</p>
    </div>
  );
};

export default AdminPanelDashboard;
