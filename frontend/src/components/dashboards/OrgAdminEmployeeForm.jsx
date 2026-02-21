import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const OrgAdminEmployeeForm = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-teal-600 via-purple-600 to-teal-700 shadow-xl border-b border-purple-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-lg">
              ➕ Add Employee
            </h1>
            <p className="text-lg text-white/90 font-medium">
              Add new employee to <span className="font-bold text-white">{user?.organization?.name || 'your organization'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-yellow-900 mb-3">🚧 Under Development</h3>
          <p className="text-lg text-yellow-800">
            Employee creation form is coming soon! This will include:
          </p>
          <ul className="list-disc list-inside mt-4 text-yellow-800 space-y-2">
            <li>Employee personal information form</li>
            <li>Role and department assignment</li>
            <li>Access permissions setup</li>
            <li>Profile photo upload</li>
            <li>Onboarding workflow</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrgAdminEmployeeForm;
