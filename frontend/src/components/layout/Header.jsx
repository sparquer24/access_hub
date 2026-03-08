import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, ChevronDown, User, Settings, LogOut, Menu, X, Download } from 'lucide-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserRole = () => {
    if (!user) return '';
    if (typeof user.role === 'string') return user.role;
    if (user.role?.name) return user.role.name;
    if (user.role?.id) return user.role.id;
    return '';
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const getNavigationItems = () => {
    const normalizedRole = getUserRole().toLowerCase().replaceAll(' ', '_');

    switch (normalizedRole) {
      case 'super_admin':
        return [
          { name: 'Dashboard', href: '/super-admin/dashboard' },
          { name: 'Organizations', href: '/super-admin/organizations' }
        ];
      case 'manager':
        return [
          { name: 'Dashboard', href: '/manager/dashboard' },
          { name: 'My Team', href: '/manager/team' },
          { name: 'Leaves', href: '/manager/leaves' },
          { name: 'Reports', href: '/manager/reports' }
        ];
      case 'employee':
        return [
          { name: 'Dashboard', href: '/employee/dashboard' },
          { name: 'Attendance', href: '/employee/attendance' },
          { name: 'Leaves', href: '/employee/leaves' },
          { name: 'Profile', href: '/employee/profile' }
        ];
      default:
        return [];
    }
  };

  const navigation = getNavigationItems();

  if (location.pathname === '/login' || location.pathname === '/login-old') {
    return null;
  }

  return (
    <header className="bg-teal-50/95 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-teal rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-teal">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-teal">AccessHub</h1>
                <p className="text-xs text-slate-500 -mt-1">hub for access control</p>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {user && navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(item.href)
                  ? 'bg-teal-100 text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-300" aria-label="Downloads">
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-teal-50 transition-all duration-300 min-w-0"
                    onClick={() => {
                      setIsUserMenuOpen((prev) => !prev);
                      setIsMenuOpen(false);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                    aria-label="Open user menu"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-teal rounded-full text-white text-sm font-semibold shadow-teal">
                      {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden lg:block text-left min-w-0 max-w-[12rem]">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                      </p>
                      <p className="text-xs text-slate-500 capitalize truncate">
                        {(typeof user.role === 'string'
                          ? user.role
                          : user.role?.name || user.role?.id || 'User').replace('_', ' ')}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-teal-600' : ''}`} />
                  </button>

                  <div className={`absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-64 bg-teal-50/95 rounded-xl shadow-lg border border-slate-200 py-2 transition-all duration-200 z-50 ${isUserMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1 pointer-events-none'}`}>
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700">
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
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-300">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-gradient-teal text-white text-sm font-medium rounded-lg hover:shadow-teal-lg transition-all duration-300"
                >
                  Get Started
                </Link>
              </div>
            )}

            <button
              onClick={() => {
                setIsMenuOpen((prev) => !prev);
                setIsUserMenuOpen(false);
              }}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all duration-300"
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4">
            <div className="space-y-2">
              {user && navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive(item.href)
                    ? 'bg-teal-100 text-teal-700'
                    : 'text-slate-600 hover:text-teal-600 hover:bg-teal-50'}`}
                >
                  {item.name}
                </Link>
              ))}

              {user && (
                <>
                  <hr className="my-2 border-slate-200" />
                  <Link to="/profile" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50">
                    Profile
                  </Link>
                  <Link to="/settings" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50">
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
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
