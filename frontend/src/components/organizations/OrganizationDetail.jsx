import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { organizationsService } from '../../services/organizationsService';
import OrganizationInfo from './tabs/OrganizationInfo';
import Loader from '../common/Loader';
import OrganizationEmployees from './tabs/OrganizationEmployees';
import OrganizationCameras from './tabs/OrganizationCameras';
import OrganizationLocations from './tabs/OrganizationLocations';
import OrganizationRules from './tabs/OrganizationRules';

import OrganizationAlerts from './tabs/OrganizationAlerts';
import OrganizationStatistics from './tabs/OrganizationStatistics';

import OrganizationVisitors from './tabs/OrganizationVisitors';
import OrganizationLPR from './tabs/OrganizationLPR';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { visitorService } from '../../services/visitorService';
import { ArrowLeft, Edit2, Ban, CheckCircle, Building2, Bell, LayoutGrid, Users, UserRoundCheck, CarFront, Camera, MapPin } from 'lucide-react';

const OrganizationDetail = ({
  backPath = '/super-admin/organizations',
  dashboardPath = '/super-admin/dashboard'
}) => {
  const { id, '*': tabPath = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAlertSidebarOpen, setIsAlertSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const { hasFeature } = useSubscription();
  const { user, hasRole } = useAuth();

  const extractAlertCount = (response) => {
    const body = response?.data ? response.data : response;

    if (Array.isArray(body)) {
      return body.length;
    }
    if (Array.isArray(body?.alerts)) {
      return body.alerts.length;
    }
    if (Array.isArray(body?.data)) {
      return body.data.length;
    }
    if (Array.isArray(body?.data?.alerts)) {
      return body.data.alerts.length;
    }
    return 0;
  };

  const refreshAlertCount = useCallback(async () => {
    if (!id) return;

    try {
      const response = await visitorService.getVisitorAlertsNew(id, {
        unacknowledged_only: true,
        limit: 100
      });
      const count = extractAlertCount(response);
      setAlertCount(count);
      if (count > 0) {
        setIsAlertSidebarOpen(true);
      }
    } catch (error) {
      console.error('Error loading alert count:', error);
      setAlertCount(0);
    }
  }, [id]);

  useEffect(() => {
    refreshAlertCount();
    const intervalId = setInterval(refreshAlertCount, 30000);
    return () => clearInterval(intervalId);
  }, [refreshAlertCount]);

  const handleAlertCountChange = useCallback((count) => {
    setAlertCount(count);
    if (count > 0) {
      setIsAlertSidebarOpen(true);
    }
  }, []);

  // Verify user has access to this organization
  useEffect(() => {
    const isSuperAdmin = hasRole('super_admin');
    const isOrgAdmin = hasRole('org_admin');
    const userOrgId = user?.organization_id;

    if (!isSuperAdmin && isOrgAdmin && userOrgId && String(userOrgId) !== String(id)) {
      message.error('Access denied. You can only view your own organization.');
      navigate(dashboardPath);
    }
  }, [user, id, navigate, dashboardPath, hasRole]);

  const tabPathSegments = tabPath.split('/').filter(Boolean);
  const legacyTabParam = new URLSearchParams(location.search).get('tab');
  const requestedTab = tabPathSegments[0] || legacyTabParam || 'info';
  const requestedSubTab = tabPathSegments[1] || '';

  const getCleanTabLabel = (label) => label.replace(/^[^A-Za-z0-9]+\s*/, '');

  const getTabIcon = (tabId) => {
    switch (tabId) {
      case 'info':
        return <LayoutGrid className="w-4 h-4" />;
      case 'employees':
        return <Users className="w-4 h-4" />;
      case 'visitors':
        return <UserRoundCheck className="w-4 h-4" />;
      case 'lpr':
        return <CarFront className="w-4 h-4" />;
      case 'cameras':
        return <Camera className="w-4 h-4" />;
      case 'locations':
        return <MapPin className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getOrganizationBasePath = useCallback(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const orgIdIndex = pathSegments.findIndex((segment) => segment === String(id));

    if (orgIdIndex === -1) {
      return location.pathname;
    }

    return `/${pathSegments.slice(0, orgIdIndex + 1).join('/')}`;
  }, [location.pathname, id]);

  const tabSubTabConfig = {
    employees: {
      valid: ['list', 'analytics', 'logs', 'records', 'calendar', 'departments', 'shifts'],
      default: 'list'
    },
    visitors: {
      valid: ['activeVisitors', 'floorLogs', 'overview', 'checkin'],
      default: 'activeVisitors'
    },
    lpr: {
      valid: ['overview', 'logs', 'manualEntry'],
      default: 'overview'
    }
  };

  const navigateToTab = useCallback((tabId, subTabId, options = {}) => {
    const basePath = getOrganizationBasePath();
    const tabConfig = tabSubTabConfig[tabId];

    if (tabConfig) {
      const nextSubTab = tabConfig.valid.includes(subTabId) ? subTabId : tabConfig.default;
      navigate(`${basePath}/${tabId}/${nextSubTab}`, options);
      return;
    }

    navigate(`${basePath}/${tabId}`, options);
  }, [getOrganizationBasePath, navigate]);

  // Function to update tab in URL
  const setActiveTab = (tabId, subTabId) => {
    navigateToTab(tabId, subTabId);
  };

  // Get enabled features for this organization
  const getEnabledFeatures = () => {
    const defaults = {
      visitor_management: hasFeature('visitor_management'),
      employee_attendance: true,
      advanced_analytics: hasFeature('advanced_analytics'),
      camera_integration: hasFeature('camera_integration'),
      multi_location: hasFeature('multi_location'),
      api_access: hasFeature('api_access'),
      mobile_app: hasFeature('mobile_app'),
      custom_branding: hasFeature('custom_branding'),
      lpr_integration: true // Default to true for dev/testing if not explicitly disabled
    };

    if (organization?.enabled_features) {
      // Merge defaults with organization specific overrides
      // This ensures new features (like lpr) appear even if not yet in DB record
      return {
        ...defaults,
        ...organization.enabled_features,
        // Ensure LPR is visible if the key is missing in DB but intended for this update
        lpr_integration: organization.enabled_features.lpr_integration ?? true
      };
    }

    return defaults;
  };

  const enabledFeatures = getEnabledFeatures();

  // Define available tabs based on enabled features
  const getAvailableTabs = () => {
    const tabs = [
      { id: 'info', name: '◐ Organization Overview', component: 'info', alwaysShow: true }
    ];

    if (enabledFeatures.employee_attendance) {
      tabs.push(
        { id: 'employees', name: '▣ Employees Attendance', component: 'employees' }
      );
    }


    if (enabledFeatures.visitor_management) {
      tabs.push({ id: 'visitors', name: '◉ Visitor Management', component: 'visitors' });
    }

    if (enabledFeatures.lpr_integration) {
      tabs.push({ id: 'lpr', name: '~ License Plate Recognition', component: 'lpr' });
    }

    if (enabledFeatures.camera_integration) {
      tabs.push({ id: 'cameras', name: '⬢ Cameras', component: 'cameras' });
    }

    if (enabledFeatures.multi_location) {
      tabs.push({ id: 'locations', name: '◈ Locations', component: 'locations' });
    }

    // if (enabledFeatures.advanced_analytics) {
    //   tabs.push({ id: 'statistics', name: '◐ Analytics', component: 'statistics' });
    // }



    // // Always show alerts and rules
    // tabs.push(
    //   { id: 'alerts', name: '⚠ Alerts', component: 'alerts', alwaysShow: true },
    //   { id: 'rules', name: '≡ Rules', component: 'rules', alwaysShow: true }
    // );

    return tabs;
  };

  const availableTabs = getAvailableTabs();

  const activeTabExists = availableTabs.some((tab) => tab.id === requestedTab);
  const activeTab = activeTabExists ? requestedTab : 'info';

  const tabConfig = tabSubTabConfig[activeTab];
  const activeSubTab = tabConfig
    ? (tabConfig.valid.includes(requestedSubTab) ? requestedSubTab : tabConfig.default)
    : '';

  useEffect(() => {
    fetchOrganization();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!organization) return;

    if (!tabPathSegments[0] && legacyTabParam) {
      navigateToTab(legacyTabParam, requestedSubTab || undefined, { replace: true });
      return;
    }

    if (!activeTabExists) {
      navigateToTab('info', undefined, { replace: true });
      return;
    }

    if (tabConfig) {
      if (!requestedSubTab || !tabConfig.valid.includes(requestedSubTab)) {
        navigateToTab(activeTab, tabConfig.default, { replace: true });
      }
    }
  }, [organization, tabPathSegments, legacyTabParam, activeTabExists, tabConfig, requestedSubTab, activeTab, navigateToTab]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      // v2 API returns: { success: true, data: {...organization object...}, message: "Success" }
      const response = await organizationsService.getById(id);
      setOrganization(response.data);
    } catch (error) {
      console.error('Error fetching organization:', error);
      message.error(error.response?.data?.message || 'Failed to load organization details');
      navigate(backPath);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`${getOrganizationBasePath()}/edit`);
  };

  const handleDisable = async () => {
    if (!window.confirm(`Are you sure you want to ${organization.is_active ? 'disable' : 'enable'} this organization?`)) {
      return;
    }

    try {
      await organizationsService.update(id, { is_active: !organization.is_active });
      message.success(organization.is_active ? 'Organization disabled successfully' : 'Organization enabled successfully');
      fetchOrganization();
    } catch (error) {
      console.error('Error updating organization:', error);
      message.error(error.response?.data?.message || 'Failed to update organization status');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
        <Loader size="large" text="Loading organization details..." />
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 min-h-full">
      {/* Enhanced Page Header */}
      <div className="sticky top-0 z-30 bg-teal-50/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-2 sm:px-3 lg:px-4 py-1.5">
          {/* Top Row - Back Button and Organization Name */}
          <div className="flex items-center justify-between gap-2 flex-nowrap overflow-x-auto">
            <div className="flex items-center gap-2.5 min-w-0 flex-nowrap">
              <button
                onClick={() => navigate(backPath)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white/80 text-slate-700 hover:bg-white transition-all duration-200 shadow-sm hover:shadow shrink-0"
                aria-label="Go back"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex items-center gap-2.5 whitespace-nowrap">
                <h1 className="text-xl sm:text-2xl leading-tight font-extrabold text-teal-800 truncate max-w-[32vw] border-b-2 border-teal-200 pb-0.5">
                  {organization.name}
                </h1>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-sm text-slate-700 font-medium">Code: <span className="font-bold text-slate-900">{organization.code}</span></span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${organization.is_active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {organization.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <button
                className="px-3.5 py-1.5 bg-white text-teal-700 hover:bg-teal-50 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow flex items-center gap-1.5 text-sm"
                onClick={handleEdit}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow flex items-center gap-1.5 text-sm ${organization.is_active
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                onClick={handleDisable}
              >
                {organization.is_active ? (
                  <Ban className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {organization.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>

          {/* Unified Second Row - Tabs + Alerts */}
          <div className="mt-2 pt-2">
            <div className="flex items-center gap-3 bg-white/60 rounded-xl px-3 py-2">
              <div className="flex-1 overflow-x-auto">
                <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl w-max min-w-full">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-1 transition-all duration-200 ${activeTab === tab.id
                        ? 'text-teal-700 bg-white shadow-sm font-semibold underline underline-offset-8 decoration-2 decoration-teal-500'
                        : 'text-slate-700 bg-transparent hover:text-slate-900 hover:bg-white/80'
                        }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {getTabIcon(tab.id)}
                      <span>{getCleanTabLabel(tab.name)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAlertSidebarOpen(true);
                }}
                className={`relative inline-flex items-center justify-center p-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${isAlertSidebarOpen && alertCount > 0
                  ? 'bg-teal-50 text-teal-700 shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-teal-700'
                  }`}
                aria-label="Toggle alerts sidebar"
              >
                {alertCount > 0 && (
                  <>
                    <span className="absolute inline-flex h-8 w-8 rounded-full border-2 border-red-400/70 animate-ping" />
                    <span className="absolute inline-flex h-10 w-10 rounded-full border border-red-300/60 animate-pulse" />
                  </>
                )}
                <Bell className={`w-4 h-4 relative z-10 ${alertCount > 0 ? 'text-red-600 bell-alert-shake' : ''}`} />
                {alertCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center leading-none shadow-sm">
                    {alertCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Tabs + Right Sidebar Alerts */}
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-3 lg:px-4 py-2">
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3 ${isAlertSidebarOpen ? 'h-[calc(100vh-90px)]' : ''}`}>
          <div className={`${isAlertSidebarOpen ? 'lg:col-span-10 h-full overflow-hidden' : 'lg:col-span-12'} min-w-0 transition-all duration-300`}>
            <div className={`bg-teal-50/95 rounded-lg shadow-sm overflow-hidden ${isAlertSidebarOpen ? 'h-full flex flex-col' : ''}`}>
              {/* Tab Content */}
              <div className={`p-4 ${isAlertSidebarOpen ? 'flex-1 overflow-y-auto' : ''}`}>
                {activeTab === 'info' && (
                  <OrganizationInfo
                    organization={organization}
                    onUpdate={fetchOrganization}
                  />
                )}
                {activeTab === 'employees' && (
                  <OrganizationEmployees
                    organizationId={id}
                    organization={organization}
                    isAlertSidebarOpen={isAlertSidebarOpen}
                    activeSubTab={activeSubTab}
                    onSubTabChange={(subTabId) => setActiveTab('employees', subTabId)}
                  />
                )}
                {activeTab === 'cameras' && (
                  <OrganizationCameras
                    organizationId={id}
                    organization={organization}
                  />
                )}
                {activeTab === 'locations' && (
                  <OrganizationLocations
                    organizationId={id}
                    organization={organization}
                  />
                )}

                {activeTab === 'rules' && (
                  <OrganizationRules
                    organizationId={id}
                    organization={organization}
                    onUpdate={fetchOrganization}
                  />
                )}
                {activeTab === 'statistics' && (
                  <OrganizationStatistics
                    organization={organization}
                  />
                )}
                {activeTab === 'visitors' && (
                  <OrganizationVisitors
                    organizationId={id}
                    organization={organization}
                    activeSubTab={activeSubTab}
                    onSubTabChange={(subTabId) => setActiveTab('visitors', subTabId)}
                  />
                )}
                {activeTab === 'lpr' && (
                  <OrganizationLPR
                    organization={organization}
                    activeSubTab={activeSubTab}
                    onSubTabChange={(subTabId) => setActiveTab('lpr', subTabId)}
                  />
                )}
              </div>
            </div>
          </div>

          {isAlertSidebarOpen && (
            <aside className="lg:col-span-2 h-full transition-all duration-300 overflow-hidden">
              <div className="h-full">
                <OrganizationAlerts
                  organizationId={id}
                  activeTab={activeTab}
                  showActivityLog={false}
                  onCloseSidebar={() => setIsAlertSidebarOpen(false)}
                  onAlertCountChange={handleAlertCountChange}
                />
              </div>
            </aside>
          )}
        </div>
      </div>

    </div>
  );
};

export default OrganizationDetail;
