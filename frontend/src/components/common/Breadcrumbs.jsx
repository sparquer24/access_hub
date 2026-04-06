import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const Breadcrumbs = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Map of path segments to breadcrumb labels
  const breadcrumbLabels = {
    'super-admin': 'Admin Panel',
    'dashboard': '🏠 Dashboard',
    'organizations': '🏢 Organizations',
    'organizations-detail': 'Organization Details',
    'create': '➕ Create',
    'edit': '✏️ Edit',
    'employees': '👥 Employees',
    'cameras': '📹 Cameras',
    'locations': '📍 Locations',
    'departments': '🏛️ Departments',
    'roles': '🔐 Roles',
    'shifts': '⏰ Shifts',
    'attendance': '📋 Attendance',
    'leaves': '🗓️ Leaves',
    'visitors': '👤 Visitors',
    'analytics': '📊 Analytics',
    'settings': '⚙️ Settings',
    'profile': '👤 Profile',
  };

  const buildBreadcrumbs = () => {
    const breadcrumbs = [];

    pathnames.forEach((pathname, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;

      // Get label from breadcrumbLabels or use pathname
      let label = breadcrumbLabels[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);

      // Skip numeric IDs, they are treated as details
      if (!isNaN(pathname)) {
        label = 'Details';
      }

      breadcrumbs.push(
        <div key={routeTo} className="flex items-center gap-2">
          {index > 0 && <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>/</span>}
          {isLast ? (
            <span className={isDarkMode ? 'text-slate-300 font-semibold' : 'text-gray-700 font-semibold'}>
              {label}
            </span>
          ) : (
            <Link
              to={routeTo}
              className={`font-medium transition-colors duration-200 ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
            >
              {label}
            </Link>
          )}
        </div>
      );
    });

    return breadcrumbs;
  };

  return (
    <div className={`border-b px-4 sm:px-6 lg:px-8 py-3 ${isDarkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-teal-50/95 border-gray-200'}`}>
      <nav className="flex items-center gap-1 text-sm">
        <Link
          to="/"
          className={`font-medium transition-colors duration-200 flex items-center gap-1 ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Home
        </Link>
        {buildBreadcrumbs().length > 0 && <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>/</span>}
        {buildBreadcrumbs()}
      </nav>
    </div>
  );
};

export default Breadcrumbs;
