import React, { useState } from 'react';
import PropTypes from 'prop-types';
import VisitorEntryForm from './VisitorEntryForm';
import VisitorLogsList from './VisitorLogsList';
import VisitorOverview from './VisitorOverview';
import { Users, BarChart3, UserCheck, RefreshCw } from 'lucide-react';

const OrganizationVisitors = ({
  organizationId,
  organization,
  activeSubTab = 'activeVisitors',
  onSubTabChange
}) => {
  const [internalActiveSubTab, setInternalActiveSubTab] = useState('activeVisitors');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const visitorTabs = ['activeVisitors', 'floorLogs', 'overview', 'checkin'];
  const selectedSubTab = visitorTabs.includes(activeSubTab) ? activeSubTab : internalActiveSubTab;

  const setActiveSubTab = (subTabId) => {
    if (typeof onSubTabChange === 'function') {
      onSubTabChange(subTabId);
      return;
    }

    setInternalActiveSubTab(subTabId);
  };

  const handleVisitorCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveSubTab('floorLogs');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-teal-100/70 bg-gradient-to-r from-white via-teal-50/60 to-cyan-50/60 shadow-sm overflow-visible relative">
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between relative z-30">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/10 ring-1 ring-teal-200">
                <Users className="w-4.5 h-4.5 text-teal-700" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Visitor Management System
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Streamline guest access, security, and tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 xl:justify-end w-full xl:w-auto">
            {/* Refresh button for overview */}
            {selectedSubTab === 'overview' && (
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="h-10 w-10 inline-flex items-center justify-center text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white/90 shadow-sm"
                title="Refresh Data"
                type="button"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Sub-tabs */}
            <div className="flex gap-1 rounded-xl border border-slate-200 bg-white/90 p-1.5 shadow-sm overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveSubTab('activeVisitors')}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${selectedSubTab === 'activeVisitors'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50'
                  }`}
                type="button"
              >
                👥 Active Visitors
              </button>
              <button
                onClick={() => setActiveSubTab('floorLogs')}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${selectedSubTab === 'floorLogs'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50'
                  }`}
                type="button"
              >
                📍 Floor Logs
              </button>
              <button
                onClick={() => setActiveSubTab('overview')}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${selectedSubTab === 'overview'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50'
                  }`}
                type="button"
              >
                <BarChart3 className="w-4 h-4" /> Overview
              </button>
              <button
                onClick={() => setActiveSubTab('checkin')}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${selectedSubTab === 'checkin'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50'
                  }`}
                type="button"
              >
                <UserCheck className="w-4 h-4" /> Check In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {(selectedSubTab === 'activeVisitors' || selectedSubTab === 'floorLogs') && (
          <VisitorLogsList
            organizationId={organizationId}
            refreshTrigger={refreshTrigger}
            selectedTabKey={selectedSubTab === 'activeVisitors' ? 'active' : 'logs'}
            showTabs={false}
          />
        )}

        {selectedSubTab === 'overview' && (
          <VisitorOverview
            organizationId={organizationId}
            refreshTrigger={refreshTrigger}
          />
        )}

        {selectedSubTab === 'checkin' && (
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

OrganizationVisitors.propTypes = {
  organizationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  organization: PropTypes.object,
  activeSubTab: PropTypes.string,
  onSubTabChange: PropTypes.func
};
