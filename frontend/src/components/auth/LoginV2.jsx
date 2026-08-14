import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Building2,
  TrendingUp
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

  const getDefaultRoute = useCallback((roleNameOrId) => {
    const roleToCheck = roleNameOrId || (user?.role?.id || user?.role?.name || '');
    switch (roleToCheck) {
      case 'super_admin':
        return '/super-admin/dashboard';
      case 'org_admin':
        if (user && user.organization_id) {
          return `/admin-panel/organizations/${user.organization_id}`;
        }
        return '/org-admin/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'employee':
        return '/employee/dashboard';
      default:
        return '/';
    }
  }, [user]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleIdentifier = user.role?.id || user.role?.name || user.role;
      console.log('User already authenticated, redirecting...', { roleIdentifier });
      const from = location.state?.from?.pathname || getDefaultRoute(roleIdentifier);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location, getDefaultRoute]);

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
      
      console.log('--- Dev Login Attempt ---');
      console.log('Login Response:', response);
      
      if (!response || !response.success) {
        throw new Error(response?.message || 'Login failed');
      }

      success('Login successful! Redirecting...');

      const userRole = response.user?.role;
      const roleIdentifier = typeof userRole === 'string' ? userRole : (userRole?.id || userRole?.name);
      console.log('Login successful, redirecting...', { roleIdentifier, userRole });
      const from = location.state?.from?.pathname || getDefaultRoute(roleIdentifier);
      console.log('Target Route:', from);
      console.log('--------------------------');

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);

    } catch (err) {
      showError(err.message || 'Login failed. Please check your credentials.');
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const features = [
    {
      icon: <Lock className="w-5 h-5 text-teal-300" />,
      title: 'Enterprise AI Security',
      subtitle: 'SMART',
      description: 'AI-enhanced JWT authentication for secure access',
      accent: 'from-teal-500/20 to-cyan-500/20',
      border: 'border-teal-400/20',
    },
    {
      icon: <Users className="w-5 h-5 text-cyan-300" />,
      title: 'Multi-Tenant Ready',
      subtitle: 'SCALE',
      description: 'Unlimited organizations with fully isolated data',
      accent: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-400/20',
    },
    {
      icon: <Zap className="w-5 h-5 text-emerald-300" />,
      title: 'Lightning Performance',
      subtitle: 'FAST',
      description: 'Real-time updates with sub-100ms response',
      accent: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-400/20',
    },
  ];

  const quickStats = [
    { icon: <Building2 className="w-4 h-4" />, value: 'Multi-org', label: 'Platform' },
    { icon: <Shield className="w-4 h-4" />, value: 'AI-grade', label: 'Security' },
    { icon: <TrendingUp className="w-4 h-4" />, value: '99.9%', label: 'Uptime' },
  ];

  return (
    <div className="flex min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #0e7490 100%)' }}>
      {/* Animated background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-float" />

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between px-10 py-10 text-white relative z-10">
        {/* Brand mark */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logoImage} alt="AccessHub Logo" className="w-10 h-10 drop-shadow-xl" />
            <div className="absolute -right-1 -top-1 bg-white/20 backdrop-blur-md p-1 rounded-md border border-white/30 shadow-lg">
              <AIIcon className="w-3 h-3" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">AccessHub</div>
            <div className="text-[10px] font-semibold text-teal-200 uppercase tracking-widest">AI-Powered Security</div>
          </div>
        </div>

        {/* Central headline */}
        <div className="space-y-6 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-semibold text-teal-200 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Platform v2.0
          </div>

          <h2 className="text-4xl font-black leading-tight" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.3)' }}>
            Secure Every<br />
            <span className="text-teal-200">Entry Point</span><br />
            with AI
          </h2>

          <p className="text-sm text-teal-100/80 leading-relaxed max-w-xs">
            Next-generation access control that learns, adapts, and protects your organization in real time.
          </p>

          {/* Feature cards — differentiated sizes/colours */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3.5 rounded-xl border ${f.border} bg-gradient-to-r ${f.accent} backdrop-blur-lg hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-250 cursor-default group`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold">{f.title}</span>
                    <span className="text-[9px] bg-white/15 px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">{f.subtitle}</span>
                  </div>
                  <p className="text-xs text-teal-100/70 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quick-stats row */}
        <div className="flex items-center gap-6">
          {quickStats.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-white/60">
              {s.icon}
              <div>
                <div className="text-xs font-bold text-white/90">{s.value}</div>
                <div className="text-[10px] text-white/50">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ── */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10 relative z-10"
        style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(240,253,250,0.98) 100%)' }}>
        <div className="w-full max-w-sm">
          {/* Mobile brand header */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <img src={logoImage} alt="AccessHub Logo" className="w-8 h-8" />
            <span className="text-lg font-black text-slate-800">AccessHub</span>
          </div>

          <div className="mb-7 animate-fadeInUp">
            <h2 className="text-3xl font-black text-gray-900 mb-1.5 flex items-center gap-3">
              Welcome <Sparkles className="w-7 h-7 text-teal-500 animate-pulse" />
            </h2>
            <p className="text-sm text-gray-500">Sign in to your AI-protected workspace</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex items-center gap-2.5 text-red-700 text-sm shadow-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col group">
              <label htmlFor="username" className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-teal-600 transition-colors">
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl text-sm bg-teal-50/50 transition-all duration-250 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-3 focus:ring-teal-100 hover:border-gray-300 disabled:opacity-60 shadow-sm"
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col group">
              <label htmlFor="password" className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider group-focus-within:text-teal-600 transition-colors">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl text-sm bg-teal-50/50 transition-all duration-250 focus:outline-none focus:border-teal-500 focus:bg-white focus:ring-3 focus:ring-teal-100 hover:border-gray-300 disabled:opacity-60 shadow-sm"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex justify-between items-center text-sm pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border-2 border-gray-300 accent-teal-600 cursor-pointer" />
                <span className="text-xs text-gray-600 group-hover:text-teal-600 transition-colors">Remember me</span>
              </label>
              <button
                type="button"
                className="text-xs text-teal-600 font-semibold hover:text-teal-700 hover:underline underline-offset-2 transition-colors"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="mt-1 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl text-sm font-bold cursor-pointer transition-all duration-250 flex items-center justify-center gap-3 hover:enabled:shadow-xl hover:enabled:shadow-teal-500/40 hover:enabled:-translate-y-0.5 active:enabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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

          <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
            Don't have an account?{' '}
            <span className="font-semibold text-gray-600">Contact your administrator</span> for access.
          </p>
        </div>

        {/* AccessHub AI Signature */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-25 hover:opacity-50 transition-opacity cursor-default pointer-events-none select-none">
          <AIIcon className="w-4 h-4" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-teal-900">AccessHub AI</span>
        </div>
      </div>
    </div>
  );
};

export default LoginV2;
