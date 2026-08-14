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
    <header className="sticky top-0 z-50 border-b border-white/20 dark:border-slate-700/60 shadow-sm"
      style={{
        background: 'rgba(240, 253, 250, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Dark mode override via a separate element so we don't fight Tailwind */}
      <style>{`
        .dark header.ah-header {
          background: rgba(15, 23, 42, 0.92) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
      `}</style>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-teal rounded-xl group-hover:scale-105 transition-transform duration-300 shadow-teal">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-teal dark:text-white">AccessHub</h1>
                <p className="text-xs -mt-1 text-slate-500 dark:text-slate-400">hub for access control</p>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {user && navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-teal-700 dark:text-teal-400 bg-teal-100/80 dark:bg-teal-900/40 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {isActive(item.href) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-teal-500 dark:bg-teal-400" />
                )}
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
                    aria-label="Download reports"
                    title="Download reports"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-0 hover:bg-teal-50/60 dark:hover:bg-slate-800 border border-transparent hover:border-teal-200/50 dark:hover:border-slate-700"
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
                      <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                      </p>
                      <p className="text-xs capitalize truncate text-slate-500 dark:text-slate-400">
                        {(typeof user.role === 'string'
                          ? user.role
                          : user.role?.name || user.role?.id || 'User').replace('_', ' ')}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-slate-400 dark:text-slate-500 ${isUserMenuOpen ? 'rotate-180 text-teal-500' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  <div className={`absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-64 rounded-xl shadow-xl border py-2 transition-all duration-200 z-50
                    bg-white/95 dark:bg-slate-800/95 border-slate-200/60 dark:border-slate-700
                    backdrop-blur-lg
                    ${isUserMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'}`}>
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                      </p>
                      <p className="text-xs truncate text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-slate-700 dark:text-slate-300 hover:bg-teal-50/70 dark:hover:bg-slate-700 hover:text-teal-700 dark:hover:text-teal-400">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-slate-700 dark:text-slate-300 hover:bg-teal-50/70 dark:hover:bg-slate-700 hover:text-teal-700 dark:hover:text-teal-400">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <hr className="my-2 border-slate-100 dark:border-slate-700" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-slate-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 text-sm font-medium transition-colors duration-200 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2 bg-gradient-teal text-white text-sm font-medium rounded-lg hover:shadow-teal-lg transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => {
                setIsMenuOpen((prev) => !prev);
                setIsUserMenuOpen(false);
              }}
              className="md:hidden p-2 rounded-lg transition-all duration-200 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-slate-800"
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4 border-slate-200/60 dark:border-slate-700">
            <div className="space-y-1">
              {user && navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-teal-100/80 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 border-l-2 border-teal-500'
                      : 'text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {user && (
                <>
                  <hr className="my-2 border-slate-200/60 dark:border-slate-700" />
                  <Link to="/profile" className="block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-slate-800">
                    Profile
                  </Link>
                  <Link to="/settings" className="block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/60 dark:hover:bg-slate-800">
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-slate-800"
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
