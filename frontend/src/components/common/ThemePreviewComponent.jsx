import React from 'react';
import { 
  getRoleBasedTheme, 
  getSuperAdminTheme, 
  getOrgAdminTheme, 
  getManagerTheme, 
  getEmployeeTheme 
} from '../../utils/roleBasedTheme';

/**
 * Theme Preview Component
 * Displays all available role-based themes for testing and demonstration
 */
const ThemePreviewComponent = () => {
  const themes = [
    { name: 'Super Admin', role: 'super_admin', theme: getSuperAdminTheme(), icon: '👑' },
    { name: 'Organization Admin', role: 'org_admin', theme: getOrgAdminTheme(), icon: '🏢' },
    { name: 'Manager', role: 'manager', theme: getManagerTheme(), icon: '👨‍💼' },
    { name: 'Employee', role: 'employee', theme: getEmployeeTheme(), icon: '👤' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          AccessHub Role-Based Theming System
        </h1>
        <p className="text-lg text-gray-600 mb-12 text-center">
          Different color schemes for different user roles and organizational contexts
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {themes.map((themeData, index) => (
            <div key={themeData.role} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Theme Header */}
              <div className={themeData.theme.header + ' p-6'}>
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <span className="text-3xl">{themeData.icon}</span>
                  {themeData.name}
                </h2>
                <p className="text-white/90">{themeData.theme.description}</p>
              </div>

              {/* Theme Preview */}
              <div className={themeData.theme.background + ' p-6'}>
                <div className="space-y-4">
                  {/* Sample Dashboard Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={themeData.theme.cards + ' p-4 rounded-xl shadow-sm'}>
                      <h3 className="font-semibold text-gray-700 mb-2">Statistics</h3>
                      <p className="text-3xl font-bold text-gray-800">125</p>
                    </div>
                    <div className={themeData.theme.cards + ' p-4 rounded-xl shadow-sm'}>
                      <h3 className="font-semibold text-gray-700 mb-2">Active</h3>
                      <p className="text-3xl font-bold text-gray-800">89</p>
                    </div>
                  </div>

                  {/* Sample Content */}
                  <div className={themeData.theme.cards + ' p-4 rounded-xl shadow-sm'}>
                    <h3 className="font-semibold text-gray-700 mb-2">Sample Content</h3>
                    <p className="text-gray-600 text-sm">
                      This demonstrates how content appears with the {themeData.name.toLowerCase()} theme.
                      The colors provide visual hierarchy and role recognition.
                    </p>
                  </div>

                  {/* Color Palette */}
                  <div className={themeData.theme.cards + ' p-4 rounded-xl shadow-sm'}>
                    <h3 className="font-semibold text-gray-700 mb-3">Color Palette</h3>
                    <div className="flex gap-2">
                      <div className={`w-8 h-8 rounded bg-${themeData.theme.accent.primary}-500`} title={`${themeData.theme.accent.primary}-500`}></div>
                      <div className={`w-8 h-8 rounded bg-${themeData.theme.accent.primary}-600`} title={`${themeData.theme.accent.primary}-600`}></div>
                      <div className={`w-8 h-8 rounded bg-${themeData.theme.accent.primary}-700`} title={`${themeData.theme.accent.primary}-700`}></div>
                      <div className={`w-8 h-8 rounded bg-${themeData.theme.accent.secondary}-500`} title={`${themeData.theme.accent.secondary}-500`}></div>
                    </div>
                  </div>

                  {/* Theme Details */}
                  <div className="text-xs text-gray-500 mt-4 space-y-1">
                    <p><strong>Primary:</strong> {themeData.theme.accent.primary}</p>
                    <p><strong>Secondary:</strong> {themeData.theme.accent.secondary}</p>
                    <p><strong>Role:</strong> {themeData.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Implementation Example */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Implementation Example</h2>
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-700">
{`import { getThemeClasses, getRoleBasedTheme } from '../utils/roleBasedTheme';

const MyDashboard = () => {
  const { user } = useAuth();
  const themeClasses = getThemeClasses(user);
  const theme = getRoleBasedTheme(user);

  return (
    <div className={\`min-h-screen \${themeClasses.page}\`}>
      <div className={\`\${themeClasses.header}\`}>
        <h1>{theme.description}</h1>
      </div>
    </div>
  );
};`}
            </pre>
          </div>
        </div>

        {/* Migration Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Migration Notes</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Replace hardcoded `bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50` with `themeClasses.page`</li>
            <li>• Replace hardcoded header colors with `themeClasses.header`</li>
            <li>• Add theme imports: `import { getThemeClasses } from '../utils/roleBasedTheme'`</li>
            <li>• Initialize theme in component: `const themeClasses = getThemeClasses(user)`</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ThemePreviewComponent;