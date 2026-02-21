import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { ArrowLeft, Edit2, Ban, CheckCircle, Building2 } from 'lucide-react';

const OrganizationDetail = ({
  backPath = '/super-admin/organizations',
  dashboardPath = '/super-admin/dashboard'
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hasFeature } = useSubscription();
  const { user } = useAuth();

  // Verify user has access to this organization
  useEffect(() => {
    if (user && user.organization_id && user.organization_id !== id) {
      message.error('Access denied. You can only view your own organization.');
      navigate(dashboardPath);
    }
  }, [user, id, navigate, dashboardPath]);

  // Get active tab from URL or default to 'info'
  const activeTab = searchParams.get('tab') || 'info';

  // Function to update tab in URL
  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
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

  // Ensure active tab is available
  const ensureValidActiveTab = () => {
    if (!availableTabs.find(tab => tab.id === activeTab)) {
      setActiveTab('info');
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (organization) {
      ensureValidActiveTab();
    }
  }, [organization, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // Determine the edit path based on current path or user role
    // Assuming simple appending for now
    navigate(`${window.location.pathname}/edit`);
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
      <div className="bg-teal-50/90 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {/* Top Row - Back Button and Organization Name */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(backPath)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50/90 backdrop-blur-sm border border-slate-200/60 text-slate-700 hover:bg-white hover:border-slate-300/80 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gradient-teal">
                  {organization.name}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-slate-600 font-medium">Code: <span className="font-bold text-slate-900">{organization.code}</span></span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${organization.is_active
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {organization.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 bg-white text-teal-600 hover:bg-teal-50 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
                onClick={handleEdit}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 text-sm ${organization.is_active
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
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
        </div>
      </div>


      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-1 py-2">
        <div className="bg-teal-50/95 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex bg-teal-50 border-b border-gray-200 overflow-x-auto">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-3 py-2 font-medium text-xs whitespace-nowrap flex items-center gap-1 transition-all duration-300 relative border-b-2 ${activeTab === tab.id
                  ? 'text-teal-600 bg-teal-50/95 border-teal-600'
                  : 'text-gray-600 hover:text-teal-600 hover:bg-teal-100 border-transparent'
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
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
            {activeTab === 'alerts' && (
              <OrganizationAlerts
                organizationId={id}
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
              />
            )}
            {activeTab === 'lpr' && (
              <OrganizationLPR
                organization={organization}
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default OrganizationDetail;
