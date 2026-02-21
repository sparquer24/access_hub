import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const OrgAdminDepartments = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-teal-600 via-purple-600 to-teal-700 shadow-xl border-b border-purple-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-lg">
              🏢 Departments
            </h1>
            <p className="text-lg text-white/90 font-medium">
              Manage departments for <span className="font-bold text-white">{user?.organization?.name || 'your organization'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-yellow-900 mb-3">🚧 Under Development</h3>
          <p className="text-lg text-yellow-800">
            Department management features are coming soon! This will include:
          </p>
          <ul className="list-disc list-inside mt-4 text-yellow-800 space-y-2">
            <li>Create and manage departments</li>
            <li>Assign employees to departments</li>
            <li>Set department heads and managers</li>
            <li>Department-specific settings and permissions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrgAdminDepartments;
