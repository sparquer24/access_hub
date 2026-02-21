/**
 * Feature Configuration Component
 * Allows enabling/disabling specific features based on subscription plan
 */
import React from 'react';

const FeatureConfiguration = ({
  subscriptionPlan,
  enabledFeatures,
  onPlanChange,
  onFeatureToggle
}) => {
  // Locked features that are always enabled by default and cannot be unchecked
  const LOCKED_FEATURES = ['advanced_analytics', 'camera_integration', 'multi_location', 'security_alerts', 'video_search'];

  // Key features that are selectable (subject to plan limits)
  // Free: Select 1
  // Starter: Select 2
  // Pro/Ent: All 3
  const KEY_FEATURES = ['employee_attendance', 'visitor_management', 'lpr_integration'];

  // Feature configuration based on subscription plans
  const SUBSCRIPTION_FEATURES = {
    free: {
      name: 'Free Plan',
      description: 'Basic features for small teams',
      max_employees: 5,
      max_cameras: 2,
      max_locations: 1,
      // free plan allows selecting from key features (logic enforced in parent) + defaults
      available_features: [...KEY_FEATURES, ...LOCKED_FEATURES]
    },
    starter: {
      name: 'Starter Plan',
      description: 'Growing businesses with visitor management',
      max_employees: 50,
      max_cameras: 10,
      max_locations: 3,
      available_features: [...KEY_FEATURES, ...LOCKED_FEATURES]
    },
    professional: {
      name: 'Professional Plan',
      description: 'Full featured for established organizations',
      max_employees: 200,
      max_cameras: 50,
      max_locations: 10,
      available_features: [...KEY_FEATURES, ...LOCKED_FEATURES]
    },
    enterprise: {
      name: 'Enterprise Plan',
      description: 'Unlimited everything with custom features',
      max_employees: -1,
      max_cameras: -1,
      max_locations: -1,
      available_features: [...KEY_FEATURES, ...LOCKED_FEATURES]
    }
  };

  const FEATURE_DESCRIPTIONS = {
    employee_attendance: {
      name: 'Employee Attendance',
      description: 'Track employee check-ins, attendance, and shift management',
      icon: '👥',
      useCase: 'Essential for organizations tracking staff attendance'
    },
    visitor_management: {
      name: 'Visitor Management',
      description: 'Register visitors, print badges, and track entry/exit',
      icon: '👤',
      useCase: 'Perfect for offices with regular visitors and guests'
    },
    lpr_integration: {
      name: 'License Plate Recognition',
      description: 'AI-powered vehicle tracking with Superior Night Vision & Anti-Glare',
      icon: '🚗',
      useCase: 'Automated vehicle entry/exit for high-traffic facilities'
    },
    advanced_analytics: {
      name: 'Advanced Analytics',
      description: 'Detailed reports, dashboards, and insights',
      icon: '📊',
      useCase: 'For data-driven decisions on facility usage'
    },
    camera_integration: {
      name: 'Camera Integration',
      description: 'CCTV integration, facial recognition, and monitoring',
      icon: '📹',
      useCase: 'High-security facilities requiring video monitoring'
    },
    multi_location: {
      name: 'Multi-Location Support',
      description: 'Manage multiple offices and locations',
      icon: '🏢',
      useCase: 'Organizations with multiple branches or buildings'
    },
    security_alerts: {
      name: 'Security & Blacklisting',
      description: 'Automated Blacklisting & Instant Red-Flag Alerts',
      icon: '🛡️',
      useCase: 'Restricted access control and security monitoring'
    },
    video_search: {
      name: 'Smart Video Search',
      description: 'Historical AI Tracking & 3-second Context Retrieval',
      icon: '🔍',
      useCase: 'Rapid incident investigation and vehicle auditing'
    }
  };

  return (
    <div className="feature-configuration">
      {/* Subscription Plan Selection */}
      <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
          <span className="mr-2">📋</span>
          Choose Subscription Plan
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Select a plan that scales with your organization's size.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(SUBSCRIPTION_FEATURES).map(([planId, plan]) => (
            <div
              key={planId}
              className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${subscriptionPlan === planId
                ? 'border-teal-600 bg-white ring-2 ring-teal-100'
                : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              onClick={() => onPlanChange(planId)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-bold ${subscriptionPlan === planId ? 'text-teal-700' : 'text-slate-800'}`}>{plan.name}</h4>
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${subscriptionPlan === planId ? 'border-teal-600' : 'border-slate-300'}`}>
                    {subscriptionPlan === planId && <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-3">{plan.description}</p>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-500 bg-slate-50 p-2 rounded-lg">
                <span>👥 {plan.max_employees === -1 ? 'Unlimited' : plan.max_employees} Staff</span>
                <span>📹 {plan.max_cameras === -1 ? 'Unlimited' : plan.max_cameras} Cams</span>
                <span>📍 {plan.max_locations === -1 ? 'Unlimited' : plan.max_locations} Loc</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Selection */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
          <span className="mr-2">⚙️</span>
          Enable Features
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          <strong>Free Plan:</strong> Select 1 Key Feature. <strong>Starter:</strong> Select 2. <strong>Pro/Ent:</strong> All 3.
          <br />
          (Analytics, Security, Video Search are included by default)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(FEATURE_DESCRIPTIONS).map(([featureKey, feature]) => {
            const currentPlan = SUBSCRIPTION_FEATURES[subscriptionPlan];
            const isAvailable = currentPlan?.available_features.includes(featureKey);

            // Locked features are always enabled if available in the plan
            const isLocked = LOCKED_FEATURES.includes(featureKey);
            const isEnabled = isLocked ? isAvailable : enabledFeatures[featureKey];

            return (
              <div
                key={featureKey}
                className={`relative p-4 border-2 rounded-xl transition-all ${!isAvailable
                  ? 'border-slate-100 bg-slate-50 opacity-50 grayscale'
                  : isEnabled
                    ? isLocked
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 cursor-pointer bg-white'
                  }`}
                onClick={() => isAvailable && !isLocked && onFeatureToggle(featureKey)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-1">{feature.icon}</span>
                    <div>
                      <h4 className={`font-bold text-sm ${!isAvailable ? 'text-slate-400' : 'text-slate-800'}`}>
                        {feature.name}
                      </h4>
                      {isLocked && isAvailable && (
                        <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded ml-2">Included</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {isAvailable && (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isEnabled
                          ? isLocked ? 'bg-blue-600 border-blue-600' : 'bg-green-500 border-green-500'
                          : 'border-slate-300 bg-white'
                        }`}>
                        {isEnabled && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className={`text-xs mb-3 leading-relaxed ${!isAvailable ? 'text-slate-400' : 'text-slate-600'}`}>
                  {feature.description}
                </p>

                {!isAvailable && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-500">
                      Upgrade
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature Summary */}
        <div className="mt-8 p-4 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl">
          <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Configuration Summary</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(enabledFeatures)
              .filter(([key, enabled]) => enabled && FEATURE_DESCRIPTIONS[key])
              .map(([key, enabled]) => (
                <span
                  key={key}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${LOCKED_FEATURES.includes(key)
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-green-50 text-green-700 border-green-100'
                    }`}
                >
                  <span className="mr-1.5">{FEATURE_DESCRIPTIONS[key].icon}</span>
                  {FEATURE_DESCRIPTIONS[key].name}
                </span>
              ))
            }
            {LOCKED_FEATURES.map(key => {
              // Ensure locked features are shown in summary even if state sync lags slightly, as they are visually "enabled"
              if (!enabledFeatures[key] && SUBSCRIPTION_FEATURES[subscriptionPlan].available_features.includes(key)) {
                return (
                  <span key={key} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border bg-blue-50 text-blue-700 border-blue-100">
                    <span className="mr-1.5">{FEATURE_DESCRIPTIONS[key].icon}</span>
                    {FEATURE_DESCRIPTIONS[key].name}
                  </span>
                )
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureConfiguration;
