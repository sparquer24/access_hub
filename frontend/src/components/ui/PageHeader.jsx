import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getThemeClasses } from '../../utils/roleBasedTheme';

/**
 * Sticky gradient page header, extracted from the pattern duplicated
 * across the OrgAdmin and LPR pages (sticky top bar using themeClasses.header)
 * with a large emoji/icon title). Pages keep using getThemeClasses(user)
 * for their min-h-screen background; PageHeader only owns the banner.
 *
 * Usage:
 *   <PageHeader icon="👥" title="Employees" subtitle="Manage employees for Acme Inc." />
 *   <PageHeader icon="👥" title="Employees" actions={<Button>New employee</Button>} />
 */
const PageHeader = ({ icon, title, subtitle, actions, themeClasses: themeClassesProp }) => {
  const { user } = useAuth();
  const themeClasses = themeClassesProp || getThemeClasses(user);

  return (
    <div className={`sticky top-0 z-40 ${themeClasses.header}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-lg flex items-center gap-3">
            {icon && <span aria-hidden="true">{icon}</span>}
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-white/90 font-medium">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
