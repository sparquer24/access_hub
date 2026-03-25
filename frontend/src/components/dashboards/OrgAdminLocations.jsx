import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getThemeClasses, getRoleBasedTheme } from '../../utils/roleBasedTheme';

const OrgAdminLocations = () => {
  const { user } = useAuth();
  const themeClasses = getThemeClasses(user);

  return (
    <div className={`min-h-screen ${themeClasses.page}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${themeClasses.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-lg">
              📍 Locations
            </h1>
            <p className="text-lg text-white/90 font-medium">
              Manage locations for <span className="font-bold text-white">{user?.organization?.name || 'your organization'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-yellow-900 mb-3">🚧 Under Development</h3>
          <p className="text-lg text-yellow-800">
            Location management features are coming soon! This will include:
          </p>
          <ul className="list-disc list-inside mt-4 text-yellow-800 space-y-2">
            <li>Add and configure monitored locations</li>
            <li>Location-based access control</li>
            <li>Floor plans and mapping</li>
            <li>Location-specific settings</li>
            <li>Integration with cameras and sensors</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrgAdminLocations;
