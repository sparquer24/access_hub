import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { message } from 'antd';
import Breadcrumbs from './Breadcrumbs';

const GlobalHeader = ({ title = "Dashboard", showBack = false, onBack = null, dynamicTitle = null }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Use dynamic title if provided, otherwise use the prop
  const displayTitle = dynamicTitle || title;

  const handleLogout = async () => {
    try {
      await logout();
      message.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      message.error('Failed to logout');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="w-full">
      <div className="sticky top-0 z-50 bg-gradient-to-r from-teal-600 via-purple-600 to-teal-700 shadow-xl border-b border-purple-400/30">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section - Back Button & Title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {showBack && (
                <button
                  onClick={handleBack}
                  className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-all duration-200 text-white hover:shadow-md"
                  title="Go back"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg truncate">
                  {displayTitle}
                </h1>
                {showWelcome && user?.username && (
                  <p className="text-sm text-white/80 font-medium mt-1">
                    Welcome back, <span className="font-bold">{user.username}</span>! 👋
                  </p>
                )}
              </div>
            </div>

            {/* Right Section - Profile Icon & Menu */}
            <div className="flex-shrink-0 relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white transition-all duration-300 hover:shadow-lg"
                title="User profile"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Profile Menu Popup */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-72 bg-teal-50/95 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in duration-200">
                  {/* Profile Info Section */}
                  <div className="bg-gradient-to-r from-teal-500 to-teal-500 p-6 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold truncate">
                          {user?.first_name && user?.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user?.username || 'User'}
                        </p>
                        <p className="text-sm text-white/80 truncate">
                          {user?.email || 'no-email@example.com'}
                        </p>
                        <div className="mt-2">
                          <span className="inline-block px-3 py-1 bg-white/30 rounded-full text-xs font-semibold">
                            {user?.role && typeof user.role === 'string' 
                              ? user.role.replace(/_/g, ' ').toUpperCase()
                              : user?.role?.name 
                                ? user.role.name.replace(/_/g, ' ').toUpperCase() 
                                : user?.role?.id
                                  ? user.role.id.replace(/_/g, ' ').toUpperCase()
                                  : 'USER'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Info Details */}
                  <div className="p-4 border-b border-gray-200 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-teal-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 font-semibold">Username</p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user?.username || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-teal-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 font-semibold">Status</p>
                        <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          Active
                        </p>
                      </div>
                    </div>
                    <div className="bg-teal-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-semibold">Email</p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user?.email || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 space-y-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-teal-100 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-teal-100 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>

                    <hr className="my-2" />

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      {!showWelcome && <Breadcrumbs />}

      {/* Close menu when clicking outside */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  );
};

export default GlobalHeader;
