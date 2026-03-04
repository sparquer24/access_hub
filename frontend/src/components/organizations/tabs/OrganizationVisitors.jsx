import React, { useState, useEffect } from 'react';
import VisitorEntryForm from './VisitorEntryForm';
import VisitorLogsList from './VisitorLogsList';
import VisitorOverview from './VisitorOverview';
import { Users, BarChart3, UserCheck, FileText, RefreshCw } from 'lucide-react';

const OrganizationVisitors = ({ organizationId, organization }) => {
  const [activeSubTab, setActiveSubTab] = useState('logs');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleVisitorCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveSubTab('logs');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" /> Visitor Management System
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Streamline guest access, security, and tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button for overview */}
          {activeSubTab === 'overview' && (
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${activeSubTab === 'logs'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-teal-600 hover:bg-slate-200'
                }`}
            >
              <FileText className="w-4 h-4" /> Logs
            </button>
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${activeSubTab === 'overview'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-teal-600 hover:bg-slate-200'
                }`}
            >
              <BarChart3 className="w-4 h-4" /> Overview
            </button>
            <button
              onClick={() => setActiveSubTab('checkin')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${activeSubTab === 'checkin'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-teal-600 hover:bg-slate-200'
                }`}
            >
              <UserCheck className="w-4 h-4" /> Check In
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeSubTab === 'logs' && (
          <VisitorLogsList
            organizationId={organizationId}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeSubTab === 'overview' && (
          <VisitorOverview
            organizationId={organizationId}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeSubTab === 'checkin' && (
          <VisitorEntryForm
            organizationId={organizationId}
            organization={organization}
            onSubmitSuccess={handleVisitorCreated}
          />
        )}
      </div>
    </div>
  );
};

export default OrganizationVisitors;
