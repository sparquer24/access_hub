import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import VisitorsList from './VisitorsList';
import { getThemeClasses, getRoleBasedTheme } from '../../utils/roleBasedTheme';

const OrgAdminVisitors = () => {
  const { user } = useAuth();
  const themeClasses = getThemeClasses(user);

  return (
    <div className={`min-h-screen ${themeClasses.page}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 ${themeClasses.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-lg">
              👤 Visitors
            </h1>
            <p className="text-lg text-white/90 font-medium">
              Manage visitors for <span className="font-bold text-white">{user?.organization?.name || 'your organization'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <VisitorsList />
      </div>
    </div>
  );
};

export default OrgAdminVisitors;
