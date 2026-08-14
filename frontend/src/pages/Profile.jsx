import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  UserCheck,
  Users,
  BarChart3,
  DoorOpen,
  Activity,
  RotateCw,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { profileAPI } from '../services/api';

function Profile() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phone: '',
    position: ''
  });
  // Permission icons mapping
  const getPermissionIcon = (module) => {
    const iconMap = {
      analytics: BarChart3,
      attendance: Clock,
      departments: Building,
      employees: UserCheck,
      leaves: Calendar,
      organizations: Building,
      roles: Shield,
      settings: Settings,
      shifts: Activity,
      users: Users,
      visitors: DoorOpen
    };
    return iconMap[module] || Eye;
  };

  // Permission color mapping
  const getPermissionColor = (module) => {
    const colorMap = {
      analytics: 'text-purple-600 bg-purple-100',
      attendance: 'text-blue-600 bg-blue-100',
      departments: 'text-green-600 bg-green-100',
      employees: 'text-teal-600 bg-teal-100',
      leaves: 'text-orange-600 bg-orange-100',
      organizations: 'text-indigo-600 bg-indigo-100',
      roles: 'text-red-600 bg-red-100',
      settings: 'text-gray-600 bg-gray-100',
      shifts: 'text-cyan-600 bg-cyan-100',
      users: 'text-pink-600 bg-pink-100',
      visitors: 'text-yellow-600 bg-yellow-100'
    };
    return colorMap[module] || 'text-gray-600 bg-gray-100';
  };

  const tryFallbackData = useCallback(async () => {
    if (user) {
      console.log('Using fallback data from AuthContext:', user);
      setProfile(user);
      setFallbackActive(true);
      setEditForm({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        position: user.position || ''
      });
      return true;
    }
    return false;
  }, [user]);

  const fetchProfile = useCallback(async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay for retry
      }
      
      console.log('Fetching profile data...');
      setError(null);
      
      // Use the properly configured profileAPI
      const response = await profileAPI.me();
      console.log('Profile API response:', response);
      
      if (response && response.data && response.data.data && response.data.data.user) {
        const userData = response.data.data.user;
        console.log('User data:', userData);
        setProfile(userData);
        setFallbackActive(false);
        setEditForm({
          username: userData.username || '',
          email: userData.email || '',
          phone: userData.phone || '',
          position: userData.position || ''
        });
      } else {
        console.warn('Invalid response structure:', response);
        setError('Invalid response structure from server');
        await tryFallbackData();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('Error details:', error.response || error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch profile data';
      setError(errorMessage);
      
      // Try fallback data on API failure
      await tryFallbackData();
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [tryFallbackData]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchProfile(true);
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Auto-retry with exponential backoff on failures
  useEffect(() => {
    if (error && !profile && retryCount < 3 && !isRetrying) {
      const retryDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
      const timer = setTimeout(() => {
        console.log(`Auto-retry attempt ${retryCount + 1}/3`);
        handleRetry();
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [error, profile, retryCount, isRetrying, handleRetry]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset form when starting to edit
      setEditForm({
        username: profile.username || '',
        email: profile.email || '',
        phone: profile.phone || '',
        position: profile.position || ''
      });
    }
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      // For now, just update local state - API endpoint for profile update may need to be implemented
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
      alert('Profile updated successfully!');
      
      // TODO: Implement actual API call when backend endpoint is ready
      // const response = await profileAPI.updateProfile(editForm);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric', 
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen h-[60vh] animate-gradient-x overflow-y-auto scrollbar-thin scrollbar-thumb-teal-400 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20'}`}>
        <div className="flex justify-center items-center min-h-screen">
          <div className={`${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/80 border-slate-200/50'} backdrop-blur-xl rounded-2xl border shadow-xl p-12 transform transition-all duration-1000 animate-fade-in`}>
            <div className="flex flex-col items-center space-y-6">
              {/* Branded Loading Animation */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                  <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
                {/* Glowing effect */}
                <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-600 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
                {/* Floating particles */}
                <div className="absolute -top-2 -left-2 w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="absolute -bottom-2 -right-1 w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
              
              <div className="text-center space-y-2 animate-fade-in-delay">
                <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {isRetrying ? 'Retrying Connection...' : 'Loading Profile'}
                </h3>
                <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  {isRetrying ? `Attempt ${retryCount + 1}/3` : 'Fetching your account information...'}
                </p>
                
                {/* Progress bar */}
                <div className={`w-48 h-1 rounded-full overflow-hidden mt-4 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full animate-pulse-slow"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className={`min-h-screen h-screen animate-gradient-x overflow-y-auto scrollbar-thin scrollbar-thumb-teal-400 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20'}`}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className={`backdrop-blur-xl rounded-2xl border shadow-xl overflow-hidden transform transition-all duration-500 animate-slide-up ${isDarkMode ? 'bg-slate-800/90 border-red-900/50' : 'bg-white/80 border-red-200/50'}`}>
            {/* Enhanced Error Header */}
            <div className={`p-8 border-b ${isDarkMode ? 'bg-gradient-to-r from-red-900/20 via-orange-900/10 to-red-900/20 border-red-900/50' : 'bg-gradient-to-r from-red-500/15 via-orange-500/10 to-red-500/15 border-red-200/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transform transition-transform hover:scale-110 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
                      <XCircle className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    </div>
                    <div className={`absolute inset-0 w-16 h-16 rounded-2xl blur-lg animate-pulse ${isDarkMode ? 'bg-red-600/20' : 'bg-red-400/20'}`}></div>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>Profile Unavailable</h3>
                    <p className={isDarkMode ? 'text-red-400/70' : 'text-red-700'}>Unable to load profile information</p>
                    {retryCount > 0 && (
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-red-500' : 'text-red-600'}`}>
                        Failed after {retryCount} attempt{retryCount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Connection Status */}
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>Connection Error</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Error Details */}
              {error && (
                <div className={`border rounded-xl p-6 transform transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-800' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
                      <XCircle className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>Error Details</h4>
                      <p className={isDarkMode ? 'text-red-400/70' : 'text-red-700'}>{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Fallback Data Notice */}
              {user && (
                <div className={`border rounded-xl p-6 transform transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-800' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                        <CheckCircle className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}>Fallback Data Available</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-blue-400/70' : 'text-blue-700'}`}>Using cached authentication data as backup</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => tryFallbackData()}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900/70' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                    >
                      Use Fallback
                    </button>
                  </div>
                </div>
              )}
              
              {/* Recovery Actions */}
              <div className="text-center space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="group bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform active:scale-95"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <RotateCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : 'group-hover:animate-spin'}`} />
                      <span>{isRetrying ? 'Retrying...' : 'Retry Connection'}</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="group bg-gradient-to-r from-slate-500 to-slate-600 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 font-medium transform transition-transform active:scale-95"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <RotateCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                      <span>Refresh Page</span>
                    </div>
                  </button>
                </div>
                
                {/* Troubleshooting */}
                <div className={`border rounded-xl p-6 text-left ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className={`font-semibold mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Settings className="w-4 h-4 mr-2" />
                    Troubleshooting Steps
                  </h4>
                  <ul className={`text-sm space-y-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>Check your internet connection</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>Verify you're logged in with valid credentials</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>Check browser console for technical details</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>Ensure the API server is running and accessible</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-y-auto animate-fade-in scrollbar-thin scrollbar-thumb-teal-400 scrollbar-track-slate-100 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20'}`}>
      {/* Fallback Data Warning */}
      {fallbackActive && (
        <div className={`p-3 border-b ${isDarkMode ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-700/50' : 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border-yellow-300/50'}`}>
          <div className="w-full px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
                  <AlertTriangle className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                </div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  Using cached data - Some information may be outdated
                </p>
              </div>
              <button
                onClick={() => {
                  setFallbackActive(false);
                  handleRetry();
                }}
                className={`text-sm font-medium transition-colors ${isDarkMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-700 hover:text-yellow-900'}`}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className={`border-b mb-8 animate-slide-up ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-teal-50/90 border-slate-200/60'}`}>
        <div className="w-full px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className={`w-20 h-20 flex items-center justify-center text-white text-3xl font-bold shadow-lg animate-glow animate-float ${isDarkMode ? 'bg-gradient-to-br from-slate-700 to-slate-600' : 'bg-gradient-to-br from-teal-500 to-cyan-600'}`}>
                  {profile.username?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
                </div>
                {/* Hover effect ring */}
                <div className="absolute inset-0 w-20 h-20 ring-4 ring-teal-400/0 rounded-2xl transition-all duration-300 group-hover:ring-teal-400/30 group-hover:scale-110"></div>
              </div>
              <div className="space-y-1">
                <h1 className={`text-3xl font-bold animate-fade-in ${isDarkMode ? 'text-white' : 'text-gradient'}`}>
                  {profile.username || 'User Profile'}
                </h1>
                <p className={`text-lg animate-fade-in-delay ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{profile.role?.description || 'N/A'}</p>
                <div className="flex items-center mt-2 space-x-4 animate-fade-in-delay">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium status-indicator transform transition-all duration-300 hover:scale-105 ${
                    profile.is_active 
                      ? `${isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'} animate-heartbeat`
                      : `${isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-800'}`
                  }`}>
                    {profile.is_active ? '● Active' : '● Inactive'}
                  </span>
                  <span className={`text-sm capitalize px-3 py-1 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {profile.role?.name?.replace('_', ' ') || 'User'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleEditToggle}
              className={`group glassmorphism px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 button-bounce ${isDarkMode ? 'border-slate-600 hover:border-teal-500' : 'border-slate-200 hover:border-teal-300'}`}
            >
              {isEditing ? (
                <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  <X className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                  <span className="font-medium">Cancel</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-teal-600 group-hover:text-teal-700">
                  <Edit className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="font-medium">Edit Profile</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 space-y-8 mb-40">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Personal Information Card */}
          <div className="lg:col-span-1">
            <div className={`profile-card glassmorphism rounded-2xl border shadow-lg overflow-hidden animate-slide-up ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'border-slate-200/50'}`} style={{animationDelay: '0.1s'}}>
              <div className={`p-6 border-b ${isDarkMode ? 'bg-gradient-to-r from-teal-900/20 to-cyan-900/20 border-slate-700' : 'bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-slate-200/50'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center scale-on-hover ${isDarkMode ? 'bg-teal-900/50' : 'bg-teal-100'}`}>
                    <User className={`w-5 h-5 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  </div>
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Personal Information</h3>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="group">
                  <label className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-slate-400 group-hover:text-teal-400' : 'text-slate-700 group-hover:text-teal-600'}`}>Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 form-input ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'}`}
                    />
                  ) : (
                    <p className={`font-medium px-4 py-3 rounded-xl transition-all duration-300 ${isDarkMode ? 'text-white bg-slate-700/50 hover:bg-slate-700' : 'text-slate-900 bg-slate-50 hover:bg-slate-100'}`}>{profile.username || 'N/A'}</p>
                  )}
                </div>
                <div className="group">
                  <label className={`block text-sm font-medium mb-2 flex items-center transition-colors ${isDarkMode ? 'text-slate-400 group-hover:text-teal-400' : 'text-slate-700 group-hover:text-teal-600'}`}>
                    <Mail className="w-4 h-4 mr-2 icon-spin-hover" />
                    Email Address
                  </label>
                  <p className={`font-medium px-4 py-3 rounded-xl transition-all duration-300 ${isDarkMode ? 'text-white bg-slate-700/50 hover:bg-slate-700' : 'text-slate-900 bg-slate-50 hover:bg-slate-100'}`}>{profile.email || 'N/A'}</p>
                </div>
                <div className="group">
                  <label className={`block text-sm font-medium mb-2 flex items-center transition-colors ${isDarkMode ? 'text-slate-400 group-hover:text-teal-400' : 'text-slate-700 group-hover:text-teal-600'}`}>
                    <Phone className="w-4 h-4 mr-2 icon-spin-hover" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 form-input ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-300'}`}
                    />
                  ) : (
                    <p className={`font-medium px-4 py-3 rounded-xl transition-all duration-300 ${isDarkMode ? 'text-white bg-slate-700/50 hover:bg-slate-700' : 'text-slate-900 bg-slate-50 hover:bg-slate-100'}`}>{profile.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="lg:col-span-2">
            <div className={`profile-card glassmorphism rounded-2xl border shadow-lg overflow-hidden animate-slide-up ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'border-slate-200/50'}`} style={{animationDelay: '0.2s'}}>
              <div className={`p-6 border-b ${isDarkMode ? 'bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-slate-700' : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-slate-200/50'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center scale-on-hover ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                    <Shield className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Account Details</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className={`block text-sm font-medium mb-2 transition-colors ${isDarkMode ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-700 group-hover:text-blue-600'}`}>User ID</label>
                    <p className={`font-mono text-sm px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'text-white bg-slate-700/50 hover:bg-slate-700' : 'text-slate-900 bg-slate-50 hover:bg-slate-100'}`}>{profile.id}</p>
                  </div>
                  <div className="group">
                    <label className={`block text-sm font-medium mb-2 flex items-center transition-colors ${isDarkMode ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-700 group-hover:text-blue-600'}`}>
                      <Building className="w-4 h-4 mr-2 icon-spin-hover" />
                      Organization ID
                    </label>
                    <p className={`font-mono text-sm px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'text-white bg-slate-700/50 hover:bg-slate-700' : 'text-slate-900 bg-slate-50 hover:bg-slate-100'}`}>{profile.organization_id}</p>
                  </div>
                  <div className="group">
                    <label className={`block text-sm font-medium mb-2 flex items-center transition-colors ${isDarkMode ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-700 group-hover:text-blue-600'}`}>
                      <Calendar className="w-4 h-4 mr-2 icon-spin-hover" />
                      Account Created
                    </label>
                    <p className={`font-medium px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'text-white bg-slate-700/50 hover:bg-slate-700' : 'text-slate-900 bg-slate-50 hover:bg-slate-100'}`}>{formatDate(profile.created_at)}</p>
                  </div>
                  <div className="group">
                    <label className={`block text-sm font-medium mb-2 flex items-center transition-colors ${isDarkMode ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-700 group-hover:text-blue-600'}`}>
                      <Clock className="w-4 h-4 mr-2 icon-spin-hover" />
                      Last Login
                    </label>
                    <p className={`font-medium px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'text-white bg-slate-700/50 hover:bg-slate-700' : 'text-slate-900 bg-slate-50 hover:bg-slate-100'}`}>{formatDate(profile.last_login)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role & Permissions Section */}
        <div className={`profile-card glassmorphism rounded-2xl border shadow-lg overflow-hidden animate-slide-up ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'border-slate-200/50'}`} style={{animationDelay: '0.3s'}}>
          <div className={`p-6 border-b ${isDarkMode ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-slate-700' : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-slate-200/50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center scale-on-hover ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                  <ShieldCheck className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Role & Permissions</h3>
                  <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Access control and permission details</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Role</p>
                <p className={`font-bold text-lg capitalize animate-pulse ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{profile.role?.name?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h4 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Role Description</h4>
              <p className={`p-4 rounded-xl ${isDarkMode ? 'text-slate-300 bg-slate-700/50' : 'text-slate-600 bg-slate-50'}`}>{profile.role?.description}</p>
            </div>

            <div>
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>System Permissions</h4>
              {profile.role?.permissions && Object.keys(profile.role.permissions).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(profile.role.permissions).map(([module, actions], index) => {
                    if (module === '*') {
                      return (
                        <div key={module} className="col-span-full">
                          <div className={`border rounded-xl p-4 shadow-sm ${isDarkMode ? 'bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-800' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'}`}>
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
                                <ShieldCheck className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                              </div>
                              <div>
                                <h5 className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>Super Administrator</h5>
                                <p className={`text-sm ${isDarkMode ? 'text-red-400/70' : 'text-red-600'}`}>Full system access - All modules and operations</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const IconComponent = getPermissionIcon(module);
                    const colorClass = getPermissionColor(module);
                    
                    return (
                      <div key={module} className="group permission-card cursor-pointer" style={{animationDelay: `${index * 0.1}s`}}>
                        <div className={`border rounded-xl p-4 shadow-sm transform transition-all duration-300 hover:shadow-lg ${isDarkMode ? 'bg-slate-700/50 border-slate-600 hover:border-teal-500/50' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${colorClass} group-hover:scale-110`}>
                              <IconComponent className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                            </div>
                            <h5 className={`font-semibold capitalize text-sm transition-colors duration-300 ${isDarkMode ? 'text-slate-300 group-hover:text-teal-400' : 'text-slate-800 group-hover:text-teal-600'}`}>
                              {module.replace('_', ' ')}
                            </h5>
                          </div>
                          <div className="space-y-1">
                            {Array.isArray(actions) ? actions.map((action, actionIndex) => (
                              <span 
                                key={action} 
                                className={`inline-block px-2 py-1 text-xs rounded-md mr-1 mb-1 font-medium transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-teal-900/50 hover:text-teal-400' : 'bg-slate-100 text-slate-700 hover:bg-teal-100 hover:text-teal-700'}`}
                                style={{animationDelay: `${(index * 0.1) + (actionIndex * 0.05)}s`}}
                              >
                                {action}
                              </span>
                            )) : (
                              <span className={`inline-block px-2 py-1 text-xs rounded-md font-medium transition-all duration-300 ${isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-teal-900/50 hover:text-teal-400' : 'bg-slate-100 text-slate-700 hover:bg-teal-100 hover:text-teal-700'}`}>
                                {actions}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`border rounded-xl p-6 text-center ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                  <XCircle className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>No specific permissions configured</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        {isEditing && (
          <div className="flex justify-center animate-fade-in">
            <button
              onClick={handleSave}
              className="group bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 font-medium button-bounce animate-glow"
            >
              <div className="flex items-center space-x-2">
                <Save className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                <span>Save Changes</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;