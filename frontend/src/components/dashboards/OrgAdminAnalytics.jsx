import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import OrganizationStatistics from '../organizations/tabs/OrganizationStatistics';

const OrgAdminAnalytics = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-teal-600 via-purple-600 to-teal-700 shadow-xl border-b border-purple-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-lg">
              📊 Analytics
            </h1>
            <p className="text-lg text-white/90 font-medium">
              Organization analytics and insights for <span className="font-bold text-white">{user?.organization?.name || 'your organization'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <OrganizationStatistics organizationId={user?.organization?.id} />
      </div>
    </div>
  );
};

export default OrgAdminAnalytics;
