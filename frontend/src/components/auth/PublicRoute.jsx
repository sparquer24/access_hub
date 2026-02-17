import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../common/Loader';

/**
 * PublicRoute - For routes that should only be accessible when NOT authenticated
 * (like login, register pages)
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader size="large" text="Authenticating..." />
      </div>
    );
  }

  // If user is authenticated and we have complete user data, redirect to appropriate dashboard
  if (isAuthenticated && user?.role) {
    // Get role using priority: role.id > role.name > role
    const roleName = user.role?.id || user.role?.name || user.role || '';
    let redirectPath = '/';

    console.log('PublicRoute: Redirecting authenticated user with role:', roleName);

    switch (roleName) {
      case 'super_admin':
        redirectPath = '/super-admin/dashboard';
        break;
      case 'org_admin':
        // Redirect org_admin to their organization detail page
        if (user && user.organization_id) {
          redirectPath = `/admin-panel/organizations/${user.organization_id}`;
        } else {
          redirectPath = '/org-admin/dashboard'; // fallback if no organization_id
        }
        break;
      case 'manager':
        redirectPath = '/manager/dashboard';
        break;
      case 'employee':
        redirectPath = '/employee/dashboard';
        break;
      default:
        redirectPath = '/';
    }

    return <Navigate to={redirectPath} replace />;
  }

  // For public routes, render children when user is not authenticated
  // or when authentication data is incomplete
  return children;
};

export default PublicRoute;
