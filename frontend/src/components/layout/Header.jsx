import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, ChevronDown, User, Settings, LogOut, Menu, X, Bell, Download } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserRole = () => {
    if (!user) return '';
    if (typeof user.role === 'string') {
      return user.role;
    } else if (user.role?.name) {
      return user.role.name;  // Prioritize name over ID for consistent matching
    } else if (user.role?.id) {
      return user.role.id;
    }
    return '';
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getNavigationItems = () => {
    const role = getUserRole();
    // Normalize role name for consistent matching
    const normalizedRole = (role || '').toLowerCase().replace(/\s+/g, '_');

    switch (normalizedRole) {
      case 'super_admin':
        return [
          { name: 'Dashboard', href: '/super-admin/dashboard' },
          { name: 'Organizations', href: '/super-admin/organizations' }
        ];

      case 'org_admin':
        return [
        ];

      case 'manager':
        return [
          { name: 'Dashboard', href: '/manager/dashboard' },
          { name: 'My Team', href: '/manager/team' },
          { name: 'Leaves', href: '/manager/leaves' },
          { name: 'Reports', href: '/manager/reports' },
        ];

      case 'employee':
        return [
          { name: 'Dashboard', href: '/employee/dashboard' },
          { name: 'Attendance', href: '/employee/attendance' },
          { name: 'Leaves', href: '/employee/leaves' },
          { name: 'Profile', href: '/employee/profile' },
        ];

      default:
        return [];
    }
  };

  const navigation = getNavigationItems();

  // Don't show header on login page
  if (location.pathname === '/login' || location.pathname === '/login-old') {
    return null;
  }

  return (
    <header className="bg-teal-50/95 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-teal rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-teal">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-teal">
                  AccessHub
                </h1>
                <p className="text-xs text-slate-500 -mt-1">hub for access control</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {user && navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(item.href)
                    ? 'bg-teal-100 text-teal-700 shadow-sm'
                    : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu and Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Quick Actions */}
                <div className="hidden sm:flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-300">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-300 relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                </div>

                {/* User Profile */}
                <div className="relative group">
                  <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-teal-50 transition-all duration-300">
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-teal rounded-full text-white text-sm font-semibold shadow-teal">
                      {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-slate-900">
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {typeof user.role === 'string' 
                          ? user.role.replace('_', ' ') 
                          : user.role?.name?.replace('_', ' ') || user.role?.id?.replace('_', ' ') || 'User'
                        }
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-teal-50/95 rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <hr className="my-2 border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-teal text-white text-sm font-medium rounded-lg hover:shadow-teal-lg transition-all duration-300"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all duration-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4">
            <div className="space-y-2">
              {user && (
                <>
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(item.href)
                          ? 'bg-teal-100 text-teal-700'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-teal-50'
                        }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <hr className="my-2 border-slate-200" />
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
