import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Home, Building2, Plus, Pencil, Users, Camera, MapPin,
  Landmark, ShieldCheck, Clock, ClipboardList, CalendarDays,
  User, BarChart3, Settings,
} from 'lucide-react';

// Map of path segments to breadcrumb label + icon (SVG, matching the rest
// of the app's icon system instead of hardcoded emoji).
const BREADCRUMB_META = {
  'super-admin': { label: 'Admin Panel' },
  'dashboard': { label: 'Dashboard', icon: Home },
  'organizations': { label: 'Organizations', icon: Building2 },
  'organizations-detail': { label: 'Organization Details' },
  'create': { label: 'Create', icon: Plus },
  'edit': { label: 'Edit', icon: Pencil },
  'employees': { label: 'Employees', icon: Users },
  'cameras': { label: 'Cameras', icon: Camera },
  'locations': { label: 'Locations', icon: MapPin },
  'departments': { label: 'Departments', icon: Landmark },
  'roles': { label: 'Roles', icon: ShieldCheck },
  'shifts': { label: 'Shifts', icon: Clock },
  'attendance': { label: 'Attendance', icon: ClipboardList },
  'leaves': { label: 'Leaves', icon: CalendarDays },
  'visitors': { label: 'Visitors', icon: User },
  'analytics': { label: 'Analytics', icon: BarChart3 },
  'settings': { label: 'Settings', icon: Settings },
  'profile': { label: 'Profile', icon: User },
};

const Breadcrumbs = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const buildBreadcrumbs = () => {
    const breadcrumbs = [];

    pathnames.forEach((pathname, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;

      const meta = BREADCRUMB_META[pathname];
      let label = meta?.label || pathname.charAt(0).toUpperCase() + pathname.slice(1);
      const Icon = meta?.icon;

      // Skip numeric IDs, they are treated as details
      if (!isNaN(pathname)) {
        label = 'Details';
      }

      breadcrumbs.push(
        <div key={routeTo} className="flex items-center gap-2">
          {index > 0 && <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>/</span>}
          {isLast ? (
            <span className={`flex items-center gap-1.5 font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </span>
          ) : (
            <Link
              to={routeTo}
              className={`flex items-center gap-1.5 font-medium transition-colors duration-200 ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
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
          <Home className="w-4 h-4" />
          Home
        </Link>
        {buildBreadcrumbs().length > 0 && <span className={isDarkMode ? 'text-slate-600' : 'text-gray-400'}>/</span>}
        {buildBreadcrumbs()}
      </nav>
    </div>
  );
};

export default Breadcrumbs;
