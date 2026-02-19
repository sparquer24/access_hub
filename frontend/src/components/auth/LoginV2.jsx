import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  User,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import {
  Lock,
  Users,
  Zap,
  Sparkles,
  AIIcon
} from '../icons/Icons';
import Loader from '../common/Loader';
import logoImage from '../../images/Group.png';
import '../../styles/LoginV2.css';

const LoginV2 = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const { success, error: showError } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleIdentifier = user.role?.id || user.role?.name || user.role;
      console.log('User already authenticated, redirecting...', { roleIdentifier });
      const from = location.state?.from?.pathname || getDefaultRoute(roleIdentifier);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const getDefaultRoute = (roleNameOrId) => {
    // Support both role.id and role.name for backward compatibility
    const roleToCheck = roleNameOrId || (user?.role?.id || user?.role?.name || '');
    switch (roleToCheck) {
      case 'super_admin':
        return '/super-admin/dashboard';
      case 'org_admin':
        // Redirect org_admin to their organization detail page
        if (user && user.organization_id) {
          return `/admin-panel/organizations/${user.organization_id}`;
        }
        return '/org-admin/dashboard'; // fallback if no organization_id
      case 'manager':
        return '/manager/dashboard';
      case 'employee':
        return '/employee/dashboard';
      default:
        return '/';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      showError('Please enter both username and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await login(formData.username, formData.password);

      success('Login successful! Redirecting...');

      // Navigate based on role (use role.id or role.name)
      const roleIdentifier = response.user?.role?.id || response.user?.role?.name;
      console.log('Login successful, redirecting...', { roleIdentifier });
      const from = location.state?.from?.pathname || getDefaultRoute(roleIdentifier);

      // Small delay to let the toast be seen and smooth transition
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);

    } catch (err) {
      showError(err.message || 'Login failed. Please check your credentials.');
      // Keep error state for inline display if preferred, or remove it if toast is enough
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-float"></div>

      {/* Left Section - Brand & Features */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center px-8 py-8 text-white relative z-10">
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="relative inline-block mb-4">
            <img src={logoImage} alt="AccessHub Logo" className="w-24 h-24 mx-auto drop-shadow-2xl hover:scale-110 transition-transform duration-300" />
            <div className="absolute -right-2 -top-2 bg-white/20 backdrop-blur-md p-1.5 rounded-lg border border-white/30 shadow-xl animate-float">
              <AIIcon className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-3 drop-shadow-lg bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            AccessHub
          </h1>
          <p className="text-lg font-bold text-white mb-1 flex items-center justify-center gap-2">
            AI-Powered Security <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">v2.0</span>
          </p>
          <p className="text-sm opacity-90 max-w-md mx-auto leading-relaxed text-gray-100">
            Secure & Scalable Multi-Tenant Solution
          </p>
        </div>

        <div className="space-y-3 max-w-lg w-full">
          {/* Feature 1 */}
          <div className="bg-white/15 backdrop-blur-xl p-4 rounded-xl border border-white/30 hover:bg-white/25 hover:border-white/50 hover:translate-y-[-2px] hover:shadow-xl transition-all duration-300 group cursor-pointer shadow-lg">
            <div className="flex items-center gap-3">
              <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                  Enterprise AI Security <span className="text-[10px] bg-teal-400/30 px-1.5 py-0.5 rounded uppercase">Smart</span>
                </h3>
                <p className="text-gray-100 text-xs leading-relaxed">AI-enhanced JWT authentication for secure access</p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/15 backdrop-blur-xl p-4 rounded-xl border border-white/30 hover:bg-white/25 hover:border-white/50 hover:translate-y-[-2px] hover:shadow-xl transition-all duration-300 group cursor-pointer shadow-lg">
            <div className="flex items-center gap-3">
              <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold mb-1">Multi-Tenant Ready</h3>
                <p className="text-gray-100 text-xs leading-relaxed">Unlimited organizations with isolated data</p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/15 backdrop-blur-xl p-4 rounded-xl border border-white/30 hover:bg-white/25 hover:border-white/50 hover:translate-y-[-2px] hover:shadow-xl transition-all duration-300 group cursor-pointer shadow-lg">
            <div className="flex items-center gap-3">
              <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold mb-1">Lightning Performance</h3>
                <p className="text-gray-100 text-xs leading-relaxed">Real-time updates with fast response</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-teal-50/30 backdrop-blur-sm relative z-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 animate-fadeInUp">
            <h2 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
              Welcome <Sparkles className="w-8 h-8 animate-pulse" />
            </h2>
            <p className="text-base text-gray-600">Sign in to your AI-protected workspace</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6 flex items-center gap-2 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col group">
              <label htmlFor="username" className="text-sm font-bold text-gray-800 mb-2 group-focus-within:text-teal-600 transition-colors">
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base bg-teal-50 transition-all duration-300 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 hover:border-gray-300 disabled:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm hover:shadow-md"
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex flex-col group">
              <label htmlFor="password" className="text-sm font-bold text-gray-800 mb-2 group-focus-within:text-teal-600 transition-colors">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-14 border-2 border-gray-200 rounded-xl text-base bg-teal-50 transition-all duration-300 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 hover:border-gray-300 disabled:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm hover:shadow-md"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg opacity-70 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer hover:text-teal-600 transition-colors group">
                <input type="checkbox" className="w-4 h-4 rounded border-2 border-gray-300 accent-teal-600 cursor-pointer" />
                <span className="text-gray-700 group-hover:text-teal-600 font-medium">Remember me</span>
              </label>
              <button
                type="button"
                className="bg-none border-none text-teal-600 font-semibold cursor-pointer hover:text-teal-700 hover:underline underline-offset-2 transition-colors"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-none rounded-xl text-base font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 mt-3 hover:enabled:shadow-xl hover:enabled:shadow-teal-500/50 hover:enabled:translate-y-[-2px] active:enabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:enabled:shadow-2xl"
              disabled={isLoading || !formData.username || !formData.password}
            >
              {isLoading ? (
                <>
                  <Loader size="small" color="white" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>

        {/* AccessHub AI Signature */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-30 hover:opacity-60 transition-opacity cursor-default pointer-events-none select-none">
          <AIIcon className="w-5 h-5" />
          <span className="text-xs font-black tracking-[0.2em] uppercase text-teal-900">AccessHub AI</span>
        </div>
      </div>
    </div>
  );
};

export default LoginV2;
