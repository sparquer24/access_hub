import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { organizationsService, ORGANIZATION_TYPES } from '../../services/organizationsService';
import FeatureConfiguration from './FeatureConfiguration';
import '../../styles/OrganizationForm.css';

const OrganizationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: orgId } = useParams();
  const isEditMode = Boolean(orgId);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Helper function to determine navigation context
  const getNavigationPaths = () => {
    const isAdminPanel = location.pathname.includes('/admin-panel/');

    if (isAdminPanel) {
      return {
        listPath: '/admin-panel/dashboard', // admin-panel goes back to dashboard
        detailPath: (id) => `/admin-panel/organizations/${id}`
      };
    } else {
      return {
        listPath: '/super-admin/organizations',
        detailPath: (id) => `/super-admin/organizations/${id}`
      };
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    organization_type: ORGANIZATION_TYPES.OFFICE,
    timezone: 'Asia/Kolkata',
    working_hours: {
      start: '09:00',
      end: '18:00',
      days: [1, 2, 3, 4, 5] // Monday to Friday
    },
    settings: {},
    enabled_features: {
      visitor_management: false,
      employee_attendance: true,
      advanced_analytics: true,
      camera_integration: true,
      multi_location: true,
      security_alerts: true,
      lpr_integration: false,
      video_search: false
    },
    subscription_plan: 'free'
    // Note: is_active and subscription_tier are not supported on create
    // Organizations are created as active by default
  });

  const [errors, setErrors] = useState({});

  // Auto-detect subscription plan based on enabled features
  const detectPlanFromFeatures = (enabledFeatures) => {
    if (!enabledFeatures || typeof enabledFeatures !== 'object') {
      return 'free';
    }

    // Key features: Attendance, Visitor, LPR
    const keyFeatures = ['employee_attendance', 'visitor_management', 'lpr_integration'];
    const selectedKeyCount = keyFeatures.filter(k => enabledFeatures[k]).length;

    // Enterprise features
    const hasEnterprise = enabledFeatures.video_search;

    if (hasEnterprise) return 'enterprise';
    if (selectedKeyCount > 2) return 'professional'; // All 3 key features = Professional
    if (selectedKeyCount === 2) return 'starter';     // 2 key features = Starter
    return 'free';                                    // 1 (or 0) key feature = Free
  };

  // Load existing organization data for edit mode
  useEffect(() => {
    if (isEditMode && orgId) {
      const fetchOrganization = async () => {
        try {
          setInitialLoading(true);
          const response = await organizationsService.getById(orgId);
          if (response.success) {
            const org = response.data;
            // Auto-detect plan if not set
            const detectedPlan = org.subscription_plan || detectPlanFromFeatures(org.enabled_features || {});

            setFormData({
              name: org.name || '',
              code: org.code || '',
              address: org.address || '',
              contact_email: org.contact_email || '',
              contact_phone: org.contact_phone || '',
              organization_type: org.organization_type || ORGANIZATION_TYPES.OFFICE,
              timezone: org.timezone || 'Asia/Kolkata',
              working_hours: {
                start: '09:00',
                end: '18:00',
                days: [1, 2, 3, 4, 5],
                ...(org.working_hours || {})
              },
              settings: org.settings || {},
              enabled_features: {
                visitor_management: false,
                employee_attendance: true,
                advanced_analytics: true,
                camera_integration: true,
                multi_location: true,
                security_alerts: true,
                lpr_integration: false,
                video_search: false,
                ...(org.enabled_features || {})
              },
              subscription_plan: detectedPlan
            });
          }
        } catch (error) {
          console.error('Error fetching organization:', error);
          message.error('Failed to load organization data');
          const { listPath } = getNavigationPaths();
          navigate(listPath);
        } finally {
          setInitialLoading(false);
        }
      };

      fetchOrganization();
    }
  }, [isEditMode, orgId, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleWorkingHoursChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [field]: value
      }
    }));
  };

  const handleSubscriptionPlanChange = (planId) => {
    // Define available features per plan
    const PLAN_FEATURES = {
      free: ['employee_attendance', 'advanced_analytics', 'camera_integration', 'multi_location', 'security_alerts'],
      starter: ['employee_attendance', 'visitor_management', 'advanced_analytics', 'camera_integration', 'multi_location', 'security_alerts'],
      professional: ['employee_attendance', 'visitor_management', 'lpr_integration', 'advanced_analytics', 'camera_integration', 'multi_location', 'security_alerts'],
      enterprise: ['employee_attendance', 'visitor_management', 'lpr_integration', 'advanced_analytics', 'camera_integration', 'multi_location', 'security_alerts', 'video_search']
    };

    const availableFeatures = PLAN_FEATURES[planId] || [];
    const LOCKED_FEATURES = ['advanced_analytics', 'camera_integration', 'multi_location', 'security_alerts', 'video_search'];

    // Update enabled features based on plan availability
    const newEnabledFeatures = Object.keys(formData.enabled_features || {}).reduce((acc, key) => {
      // If feature is available in the new plan
      if (availableFeatures.includes(key)) {
        // If it's a locked feature, force it to true
        if (LOCKED_FEATURES.includes(key)) {
          acc[key] = true;
        } else {
          // Otherwise keep current state or default to true if it wasn't there before
          acc[key] = formData.enabled_features[key] !== undefined ? formData.enabled_features[key] : false;
        }
      } else {
        acc[key] = false; // Disable unavailable features
      }
      return acc;
    }, {});

    // Special Logic: If downgrading to Starter/Free, we might need to trim key features
    // Key features: Attendance, Visitor, LPR
    const KEY_FEATURES = ['employee_attendance', 'visitor_management', 'lpr_integration'];

    // Get currently enabled key features from the NEW set (which has already filtered by availability)
    const activeKeyFeatures = KEY_FEATURES.filter(k => newEnabledFeatures[k]);

    let limit = 1;
    if (planId === 'starter') limit = 2;
    if (planId === 'professional' || planId === 'enterprise') limit = 3;

    // If we have more than limit, disable the extras (keep the first N found)
    if (activeKeyFeatures.length > limit) {
      const featuresToKeep = activeKeyFeatures.slice(0, limit);
      KEY_FEATURES.forEach(k => {
        newEnabledFeatures[k] = featuresToKeep.includes(k);
      });
    }

    setFormData(prev => ({
      ...prev,
      subscription_plan: planId,
      enabled_features: newEnabledFeatures
    }));
  };

  const handleFeatureToggle = (featureName) => {
    const currentFeatures = formData.enabled_features || {};
    const newEnabledFeatures = {
      ...currentFeatures,
      [featureName]: !currentFeatures[featureName]
    };

    // Auto-detect the appropriate plan based on enabled features
    const detectedPlan = detectPlanFromFeatures(newEnabledFeatures);

    setFormData(prev => ({
      ...prev,
      enabled_features: newEnabledFeatures,
      subscription_plan: detectedPlan
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (formData.name.length < 2 || formData.name.length > 255) {
      newErrors.name = 'Organization name must be between 2-255 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Organization code is required';
    } else if (formData.code.length < 2 || formData.code.length > 50) {
      newErrors.code = 'Organization code must be between 2-50 characters';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      message.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      let response;

      if (isEditMode) {
        response = await organizationsService.update(orgId, formData);
        if (response.success) {
          message.success('Organization updated successfully');
          const { detailPath } = getNavigationPaths();
          navigate(detailPath(orgId));
        }
      } else {
        response = await organizationsService.create(formData);
        if (response.success) {
          message.success('Organization created successfully');
          const { listPath, detailPath } = getNavigationPaths();
          const newOrgId = response.data?.id;
          if (newOrgId) {
            navigate(detailPath(newOrgId));
          } else {
            navigate(listPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} organization:`, error);
      message.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} organization`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const { listPath } = getNavigationPaths();
    navigate(listPath);
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            {isEditMode ? 'Edit Organization' : 'Create New Organization'}
          </h1>
          <p className="text-lg text-slate-600">
            {isEditMode ? 'Update organization details and feature configuration' : 'Fill in the details to create a new organization with custom features'}
          </p>
        </div>
      </div>

      {initialLoading ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-teal-50/95 rounded-2xl shadow-lg p-12 border border-slate-200 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Organization</h3>
            <p className="text-slate-600">Please wait while we fetch the organization details...</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Basic Information */}
          <div className="bg-teal-50/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-slate-200/50">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-teal-100">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:outline-none ${errors.name
                    ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                    }`}
                  placeholder="Enter organization name"
                  maxLength={255}
                />
                {errors.name && <span className="text-red-600 text-sm mt-1 block">{errors.name}</span>}
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-slate-700 mb-2">
                  Organization Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:outline-none ${errors.code
                    ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                    }`}
                  placeholder="e.g., ORG001"
                  maxLength={50}
                />
                {errors.code && <span className="text-red-600 text-sm mt-1 block">{errors.code}</span>}
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="organization_type" className="block text-sm font-semibold text-slate-700 mb-2">Organization Type</label>
              <select
                id="organization_type"
                name="organization_type"
                value={formData.organization_type}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-300 focus:outline-none"
              >
                <option value={ORGANIZATION_TYPES.SCHOOL}>🏫 School</option>
                <option value={ORGANIZATION_TYPES.OFFICE}>🏢 Office</option>
                <option value={ORGANIZATION_TYPES.APARTMENT}>🏘️ Apartment</option>
                <option value={ORGANIZATION_TYPES.HOME}>🏠 Home</option>
              </select>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-teal-50/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-slate-200/50">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-100">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-cyan-500 to-pink-600 rounded-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Address Information</h2>
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                placeholder="Enter complete address"
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-teal-50/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-slate-200/50">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-semibold text-slate-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="contact_email" className="block text-sm font-semibold text-slate-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:outline-none ${errors.contact_email
                    ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                />
                {errors.contact_email && <span className="text-red-600 text-sm mt-1 block">{errors.contact_email}</span>}
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-teal-50/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-slate-200/50">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-green-100">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Working Hours</h2>
            </div>

            <div className="mb-6">
              <label htmlFor="timezone" className="block text-sm font-semibold text-slate-700 mb-2">Timezone</label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 focus:outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="start_time" className="block text-sm font-semibold text-slate-700 mb-2">Start Time</label>
                <input
                  type="time"
                  id="start_time"
                  value={formData.working_hours.start}
                  onChange={(e) => handleWorkingHoursChange('start', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="end_time" className="block text-sm font-semibold text-slate-700 mb-2">End Time</label>
                <input
                  type="time"
                  id="end_time"
                  value={formData.working_hours.end}
                  onChange={(e) => handleWorkingHoursChange('end', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Working Days</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 1, label: 'Monday' },
                  { value: 2, label: 'Tuesday' },
                  { value: 3, label: 'Wednesday' },
                  { value: 4, label: 'Thursday' },
                  { value: 5, label: 'Friday' },
                  { value: 6, label: 'Saturday' },
                  { value: 7, label: 'Sunday' },
                ].map(day => (
                  <label key={day.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.working_hours?.days ? formData.working_hours.days.includes(day.value) : false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          working_hours: {
                            ...prev.working_hours,
                            days: checked
                              ? [...(prev.working_hours?.days || []), day.value].sort()
                              : (prev.working_hours?.days || []).filter(d => d !== day.value)
                          }
                        }));
                      }}
                      className="w-5 h-5 rounded border-2 border-slate-300 accent-green-500 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Configuration */}
          <div className="bg-teal-50/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-slate-200/50">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-teal-100">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Feature Configuration</h2>
                <p className="text-sm text-slate-600 mt-1">Select features and subscription plan that best fits your needs</p>
              </div>
            </div>
            <FeatureConfiguration
              subscriptionPlan={formData.subscription_plan}
              enabledFeatures={formData.enabled_features}
              onPlanChange={handleSubscriptionPlanChange}
              onFeatureToggle={handleFeatureToggle}
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 mb-8">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-600 text-white font-semibold hover:shadow-lg hover:shadow-teal-400/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditMode ? 'Update Organization' : 'Create Organization'}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default OrganizationForm;
