import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Unauthorized.css';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // Get role name from different possible structures - prioritize ID
    let roleName = '';
   if (user?.role?.name) {
      roleName = user.role.name;
    }
    
    switch (roleName) {
      case 'super_admin':
        navigate('/super-admin/dashboard');
        break;
      case 'org_admin':
        // Redirect org_admin to their organization detail page
        if (user && user.organization_id) {
          navigate(`/admin-panel/organizations/${user.organization_id}`);
        } else {
          navigate('/org-admin/dashboard'); // fallback if no organization_id
        }
        break;
      case 'manager':
        navigate('/manager/dashboard');
        break;
      case 'employee':
        navigate('/employee/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGoHome();
    }, 5000);

    // Countdown timer for display
    const countdownTimer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-purple-600 to-teal-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-teal-50/95 rounded-2xl shadow-2xl p-8 sm:p-12 text-center animate-fadeInUp">
        <div className="text-8xl mb-6">🚫</div>
        <h1 className="text-4xl font-black text-slate-900 mb-4">Access Denied</h1>
        <p className="text-xl text-slate-600 mb-4 font-medium">
          You don't have permission to access this page.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-slate-700 mb-2">
            Your current role: <strong className="text-teal-600 text-base">
              {typeof user?.role === 'string' 
                ? user.role 
                : user?.role?.id || user?.role?.name || 'Unknown'
              }
            </strong>
          </p>
          <p className="text-xs text-slate-500">
            Role type: {typeof user?.role} | 
            Org ID: {user?.organization_id || 'None'}
          </p>
        </div>

        {/* Auto-redirect countdown */}
        <div className="bg-teal-50 border-2 border-teal-400 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-pulse h-3 w-3 bg-teal-600 rounded-full"></div>
            <p className="text-sm font-semibold text-teal-700">
              Redirecting to dashboard in <span className="text-lg font-bold text-teal-600">{redirectCountdown}s</span>...
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleGoBack} 
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-lg transition-all duration-300 hover:translate-y-[-2px]"
          >
            ← Go Back
          </button>
          <button 
            onClick={handleGoHome} 
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-bold rounded-lg hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={handleLogout} 
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all duration-300 hover:translate-y-[-2px]"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
