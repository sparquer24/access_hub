import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Moon,
  Sun,
  Save,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../services/api';

function Settings() {
  const { settings, updateSetting, isDarkMode } = useTheme();
  
  // Ensure we have default values to prevent undefined errors
  const currentTheme = settings?.appearance?.theme || 'light';
  const currentLanguage = settings?.appearance?.language || 'en';
  const currentNotifications = settings?.notifications || { email: true, push: true, attendance: true, leaves: true };
  const currentPrivacy = settings?.privacy || { showProfile: true, showAttendance: false };
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    // Settings are loaded from localStorage via ThemeContext
  }, []);

  const saveSettings = async () => {
    setLoading(true);
    try {
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, setting, value) => {
    if (category === 'appearance' || category === 'notifications' || category === 'privacy') {
      updateSetting(category, setting, value);
    } else {
      updateSetting(null, setting, value);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const response = await authAPI.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });

      if (response.data.success) {
        alert('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.message || error.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isDarkMode ? 'bg-slate-900' : ''}`}>
      {/* Header */}
      <div className={`rounded-lg shadow-sm border mb-6 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <SettingsIcon className={`w-8 h-8 ${isDarkMode ? 'text-teal-400' : 'text-gray-700'}`} />
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
              <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Manage your account settings and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className={`rounded-lg shadow-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className={`border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'general', label: 'General', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'privacy', label: 'Privacy', icon: Shield },
              { id: 'security', label: 'Security', icon: Lock }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

          <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Appearance</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Theme</label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleSettingChange('appearance', 'theme', 'light')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                        currentTheme === 'light'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : `${isDarkMode ? 'border-slate-600 text-slate-300' : 'border-gray-300 text-gray-700'}`
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => handleSettingChange('appearance', 'theme', 'dark')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                        currentTheme === 'dark'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : `${isDarkMode ? 'border-slate-600 text-slate-300' : 'border-gray-300 text-gray-700'}`
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Language</label>
                  <select
                    value={currentLanguage}
                    onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notification Preferences</h3>
              
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
                  { key: 'push', label: 'Push Notifications', description: 'Receive browser push notifications' },
                  { key: 'attendance', label: 'Attendance Alerts', description: 'Get notified about attendance events' },
                  { key: 'leaves', label: 'Leave Updates', description: 'Get notified about leave approvals and updates' }
                ].map(notification => (
                  <div key={notification.key} className="flex items-center justify-between py-3">
                    <div>
                      <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{notification.label}</label>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{notification.description}</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('notifications', notification.key, !currentNotifications[notification.key])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        currentNotifications[notification.key] ? 'bg-blue-600' : isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          currentNotifications[notification.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Privacy Controls</h3>
              
              <div className="space-y-4">
                {[
                  { key: 'showProfile', label: 'Public Profile', description: 'Allow others to view your profile information' },
                  { key: 'showAttendance', label: 'Attendance Visibility', description: 'Allow managers to view your attendance data' }
                ].map(privacy => (
                  <div key={privacy.key} className="flex items-center justify-between py-3">
                    <div>
                      <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{privacy.label}</label>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{privacy.description}</p>
                    </div>
                    <button
                      onClick={() => handleSettingChange('privacy', privacy.key, !currentPrivacy[privacy.key])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        currentPrivacy[privacy.key] ? 'bg-blue-600' : isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          currentPrivacy[privacy.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Change Password</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className={`absolute inset-y-0 right-0 px-3 flex items-center ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}
                    >
                      {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className={`absolute inset-y-0 right-0 px-3 flex items-center ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}
                    >
                      {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className={`absolute inset-y-0 right-0 px-3 flex items-center ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}
                    >
                      {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Save Button */}
          {activeTab !== 'security' && (
            <div className={`flex justify-end pt-6 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={saveSettings}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;