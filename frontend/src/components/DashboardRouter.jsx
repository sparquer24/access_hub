import { useAuth } from '../contexts/AuthContext';

/**
 * Dashboard Router Component
 * Automatically redirects users to their appropriate dashboard based on role
 */
function DashboardRouter() {
  const { user } = useAuth();

  const getDashboardUrl = (role) => {
    switch (role) {
      case 'super_admin':
        return '/super-admin/dashboard';
      case 'org_admin':
        return '/org-admin/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'employee':
        return '/employee/dashboard';
      default:
        return '/employee/dashboard'; // Default fallback
    }
  };

  // Redirect to appropriate dashboard
  if (user?.role?.name) {
    const dashboardUrl = getDashboardUrl(user.role.name);
    window.location.href = dashboardUrl;
    return null;
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default DashboardRouter;
