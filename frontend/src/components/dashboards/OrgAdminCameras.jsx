import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getThemeClasses } from '../../utils/roleBasedTheme';
import PageHeader from '../ui/PageHeader';

const OrgAdminCameras = () => {
  const { user } = useAuth();
  const themeClasses = getThemeClasses(user);

  return (
    <div className={`min-h-screen ${themeClasses.page}`}>
      <PageHeader
        icon="📹"
        title="Security Cameras"
        subtitle={<>Manage security cameras for <span className="font-bold text-white">{user?.organization?.name || 'your organization'}</span></>}
        themeClasses={themeClasses}
      />

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-yellow-900 mb-3">🚧 Under Development</h3>
          <p className="text-lg text-yellow-800">
            Camera management features are coming soon! This will include:
          </p>
          <ul className="list-disc list-inside mt-4 text-yellow-800 space-y-2">
            <li>Add and configure security cameras</li>
            <li>Live camera feed monitoring</li>
            <li>Camera health and status tracking</li>
            <li>Recording and playback management</li>
            <li>Motion detection and alerts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrgAdminCameras;
