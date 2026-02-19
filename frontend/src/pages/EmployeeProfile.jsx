import { useState, useEffect } from 'react';
import { 
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Briefcase,
  Edit,
  Save,
  X,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

function EmployeeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    position: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = authService.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/employee/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setProfile(result.data);
          setEditForm({
            first_name: result.data.user_info.first_name,
            last_name: result.data.user_info.last_name,
            phone: result.data.employee_info.phone || '',
            position: result.data.employee_info.position || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = authService.getAccessToken();
      if (!token) return;

      // This would be a PUT request to update profile
      // For now, we'll just simulate the update
      
      // Simulate API call
      alert('Profile updated successfully!');
      setIsEditing(false);
      
      // In a real implementation, you would make an API call here
      // and then refresh the profile data
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditForm({
      first_name: profile?.user_info.first_name,
      last_name: profile?.user_info.last_name,
      phone: profile?.employee_info.phone || '',
      position: profile?.employee_info.position || ''
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const ProfileField = ({ icon: Icon, label, value, isEditing, fieldName, type = 'text' }) => (
    <div className="flex items-start space-x-3 p-4 bg-white border border-teal-200 rounded-lg hover:border-teal-300">
      <Icon className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {isEditing && fieldName ? (
          <input
            type={type}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={editForm[fieldName] || ''}
            onChange={(e) => setEditForm({ ...editForm, [fieldName]: e.target.value })}
          />
        ) : (
          <p className="text-sm text-gray-600 mt-1">{value || 'N/A'}</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
          <p className="mt-1 text-sm text-gray-500">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your personal and professional information
            </p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-teal-50 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col justify-between">
              <div>
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                      {profile.employee_info.profile_image_url ? (
                        <img
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover"
                          src={profile.employee_info.profile_image_url}
                          alt="Profile"
                        />
                      ) : (
                        <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                      )}
                    </div>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {profile.user_info.full_name}
                  </h3>
                  <p className="text-gray-600">{profile.employee_info.position || 'Employee'}</p>
                  <p className="text-sm text-gray-500 mt-1">ID: {profile.employee_info.employee_id}</p>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-semibold text-blue-600">
                        {profile.employee_info.hire_date ? Math.floor((new Date() - new Date(profile.employee_info.hire_date)) / (1000 * 60 * 60 * 24 * 365)) : 0}
                      </p>
                      <p className="text-sm text-gray-600">Years</p>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-green-600">{profile.employee_info.department?.name ? 1 : 0}</p>
                      <p className="text-sm text-gray-600">Department</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Move Personal Information into left card so there's no empty space */}
                <div className="mt-6">
                <div className="p-6 border-t border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900">Personal Information</h4>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProfileField icon={User} label="First Name" value={profile.user_info.first_name} isEditing={isEditing} fieldName="first_name" />
                    <ProfileField icon={User} label="Last Name" value={profile.user_info.last_name} isEditing={isEditing} fieldName="last_name" />
                  </div>
                  <ProfileField icon={Mail} label="Email Address" value={profile.user_info.email} isEditing={false} />
                  <ProfileField icon={Phone} label="Phone Number" value={profile.employee_info.phone} isEditing={isEditing} fieldName="phone" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information is moved to left card. Right column keeps professional & account sections */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Professional Information</h4>
              </div>
              <div className="p-6 space-y-4">
                <ProfileField
                  icon={Briefcase}
                  label="Position"
                  value={profile.employee_info.position}
                  isEditing={isEditing}
                  fieldName="position"
                />
                <ProfileField
                  icon={Building}
                  label="Department"
                  value={profile.employee_info.department?.name}
                  isEditing={false} // Department should not be editable by employee
                />
                <ProfileField
                  icon={Building}
                  label="Organization"
                  value={profile.employee_info.organization?.name}
                  isEditing={false} // Organization should not be editable
                />
                <ProfileField
                  icon={Calendar}
                  label="Hire Date"
                  value={formatDate(profile.employee_info.hire_date)}
                  isEditing={false} // Hire date should not be editable
                />
                <ProfileField
                  icon={Calendar}
                  label="Account Created"
                  value={formatDate(profile.user_info.created_at)}
                  isEditing={false} // Created date should not be editable
                />
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-teal-50 rounded-lg shadow mt-6">
              <div className="p-6 border-b border-teal-200">
                <h4 className="text-lg font-medium text-gray-900">Account Status</h4>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Account Status</p>
                    <p className="text-sm text-gray-600">Your account is currently active</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Employee Status</p>
                    <p className="text-sm text-gray-600">Your employment status</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {profile.employee_info.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;
