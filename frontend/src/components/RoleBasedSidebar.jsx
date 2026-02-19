import { useState } from 'react';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Clock,
  Calendar,
  User,
  Settings,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Role-based Navigation Sidebar
 */
function RoleBasedSidebar({ isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('');

  const getNavigationItems = (role) => {
    // Normalize role name to lowercase and remove underscores for consistent matching
    const normalizedRole = (role || '').toLowerCase().replace(/\s+/g, '_');
    
    const commonItems = [
      {
        id: 'profile',
        name: 'My Profile',
        href: `/${normalizedRole}/profile`,
        icon: User,
        description: 'Manage your profile'
      }
    ];

    switch (normalizedRole) {
      case 'super_admin':
        return [
          {
            id: 'dashboard',
            name: 'Dashboard',
            href: '/super-admin/dashboard',
            icon: BarChart3,
            description: 'System overview'
          },
          {
            id: 'organizations',
            name: 'Organizations',
            href: '/super-admin/organizations',
            icon: Users,
            description: 'Manage organizations'
          },
          {
            id: 'employees',
            name: 'All Employees',
            href: '/super-admin/employees',
            icon: Users,
            description: 'System-wide employee management'
          },
          ...commonItems
        ];

      case 'org_admin':
        return [
          {
            id: 'dashboard',
            name: 'Dashboard',
            href: '/org-admin/dashboard',
            icon: BarChart3,
            description: 'Organization overview'
          },
          {
            id: 'visitors',
            name: 'Visitors',
            href: '/org-admin/visitors',
            icon: User,
            description: 'Manage visitors'
          },
          {
            id: 'employees',
            name: 'Employees',
            href: '/org-admin/employees',
            icon: Users,
            description: 'Manage employees'
          },
          {
            id: 'analytics',
            name: 'Analytics',
            href: '/org-admin/analytics',
            icon: BarChart3,
            description: 'View analytics and reports'
          },
          ...commonItems
        ];

      case 'manager':
        return [
          {
            id: 'dashboard',
            name: 'Dashboard',
            href: '/manager/dashboard',
            icon: BarChart3,
            description: 'Team overview'
          },
          {
            id: 'team',
            name: 'My Team',
            href: '/manager/team',
            icon: Users,
            description: 'Manage team members'
          },
          {
            id: 'leaves',
            name: 'Leave Requests',
            href: '/manager/leaves',
            icon: Calendar,
            description: 'Approve team leaves'
          },
          {
            id: 'reports',
            name: 'Team Reports',
            href: '/manager/reports',
            icon: FileText,
            description: 'View team analytics'
          },
          ...commonItems
        ];

      case 'employee':
        return [
          {
            id: 'dashboard',
            name: 'Dashboard',
            href: '/employee/dashboard',
            icon: BarChart3,
            description: 'Personal overview'
          },
          {
            id: 'attendance',
            name: 'My Attendance',
            href: '/employee/attendance',
            icon: Clock,
            description: 'View attendance history'
          },
          {
            id: 'leaves',
            name: 'My Leaves',
            href: '/employee/leaves',
            icon: Calendar,
            description: 'Manage leave requests'
          },
          {
            id: 'profile',
            name: 'My Profile',
            href: '/employee/profile',
            icon: User,
            description: 'Update personal information'
          }
        ];

      default:
        return commonItems;
    }
  };

  const navigationItems = user?.role?.name ? getNavigationItems(user.role.name) : [];
  const currentPath = window.location.pathname;

  const NavItem = ({ item }) => {
    const isActive = currentPath === item.href || currentPath.startsWith(item.href);
    const Icon = item.icon;

    return (
      <a
        href={item.href}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
        }`}
        onClick={() => setActiveSection(item.id)}
      >
        <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span>{item.name}</span>
            {isActive && <ChevronRight className="h-4 w-4" />}
          </div>
          {isOpen && (
            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
          )}
        </div>
      </a>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-teal-50/95 shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-blue-600">VMS</span>
            </div>
            {isOpen && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.name?.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-teal-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
          >
            <Settings className="mr-3 h-5 w-5" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

export default RoleBasedSidebar;
