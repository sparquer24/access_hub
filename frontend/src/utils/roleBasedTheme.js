/**
 * Role-Based Theme Utility for AccessHub
 * Provides different color schemes for different user roles and organizational contexts
 */

/**
 * Get theme configuration based on user role and organization
 * @param {Object} user - User object containing role and organization info
 * @returns {Object} Theme configuration with background, header, and accent colors
 */
export const getRoleBasedTheme = (user, isDarkMode = false) => {
  if (!user || !user.role) {
    return isDarkMode ? getDefaultDarkTheme() : getDefaultTheme();
  }

  const roleName = user.role?.name || user.role;
  
  switch (roleName.toLowerCase()) {
    case 'super_admin':
      return isDarkMode ? getSuperAdminDarkTheme() : getSuperAdminTheme();
    
    case 'org_admin':
      return isDarkMode ? getOrgAdminDarkTheme(user.organization) : getOrgAdminTheme(user.organization);
    
    case 'manager':
      return isDarkMode ? getManagerDarkTheme(user.organization) : getManagerTheme(user.organization);
    
    case 'employee':
      return isDarkMode ? getEmployeeDarkTheme() : getEmployeeTheme();
    
    default:
      return isDarkMode ? getDefaultDarkTheme() : getDefaultTheme();
  }
};

/**
 * Super Admin Theme - Purple/Indigo scheme for system-wide authority
 */
const getSuperAdminTheme = () => ({
  background: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50',
  header: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700',
  headerBorder: 'border-purple-400/30',
  accent: {
    primary: 'indigo',
    secondary: 'purple',
    colors: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca'
    }
  },
  cards: 'bg-white/80 backdrop-blur-sm border-indigo-100',
  description: 'System Administrator Theme'
});

/**
 * Super Admin Dark Theme
 */
const getSuperAdminDarkTheme = () => ({
  background: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
  header: 'bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800',
  headerBorder: 'border-indigo-600/30',
  accent: {
    primary: 'indigo',
    secondary: 'purple',
    colors: {
      50: '#1e1b4b',
      100: '#312e81',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca'
    }
  },
  cards: 'bg-slate-800/80 backdrop-blur-sm border-slate-700',
  description: 'System Administrator Dark Theme'
});

/**
 * Organization Admin Theme - Organization-specific or default teal scheme
 */
const getOrgAdminTheme = (organization) => {
  // If organization has custom theme colors, use them
  if (organization?.theme_colors) {
    return getCustomOrganizationTheme(organization.theme_colors);
  }
  
  // Default org admin theme - Teal/Green scheme for organizational management
  return {
    background: 'bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50',
    header: 'bg-gradient-to-r from-teal-600 via-green-600 to-teal-700',
    headerBorder: 'border-teal-400/30',
    accent: {
      primary: 'teal',
      secondary: 'emerald',
      colors: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e'
      }
    },
    cards: 'bg-white/80 backdrop-blur-sm border-teal-100',
    description: 'Organization Administrator Theme'
  };
};

/**
 * Organization Admin Dark Theme
 */
const getOrgAdminDarkTheme = (organization) => {
  if (organization?.theme_colors) {
    return getCustomOrganizationDarkTheme(organization.theme_colors);
  }
  
  return {
    background: 'bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900',
    header: 'bg-gradient-to-r from-teal-700 via-green-700 to-teal-800',
    headerBorder: 'border-teal-600/30',
    accent: {
      primary: 'teal',
      secondary: 'emerald',
      colors: {
        50: '#042f2e',
        100: '#134e4a',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e'
      }
    },
    cards: 'bg-slate-800/80 backdrop-blur-sm border-slate-700',
    description: 'Organization Administrator Dark Theme'
  };
};

/**
 * Manager Theme - Blue/Cyan scheme for team management
 */
const getManagerTheme = (organization) => ({
  background: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50',
  header: 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700',
  headerBorder: 'border-cyan-400/30',
  accent: {
    primary: 'blue',
    secondary: 'cyan',
    colors: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    }
  },
  cards: 'bg-white/80 backdrop-blur-sm border-blue-100',
  description: 'Team Manager Theme'
});

/**
 * Manager Dark Theme
 */
const getManagerDarkTheme = (organization) => ({
  background: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900',
  header: 'bg-gradient-to-r from-blue-700 via-cyan-700 to-blue-800',
  headerBorder: 'border-blue-600/30',
  accent: {
    primary: 'blue',
    secondary: 'cyan',
    colors: {
      50: '#172554',
      100: '#1e3a8a',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    }
  },
  cards: 'bg-slate-800/80 backdrop-blur-sm border-slate-700',
  description: 'Team Manager Dark Theme'
});

/**
 * Employee Theme - Green/Lime scheme for productivity
 */
const getEmployeeTheme = () => ({
  background: 'bg-gradient-to-br from-green-50 via-lime-50 to-emerald-50',
  header: 'bg-gradient-to-r from-green-600 via-lime-600 to-green-700',
  headerBorder: 'border-lime-400/30',
  accent: {
    primary: 'green',
    secondary: 'lime',
    colors: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    }
  },
  cards: 'bg-white/80 backdrop-blur-sm border-green-100',
  description: 'Employee Theme'
});

/**
 * Employee Dark Theme
 */
const getEmployeeDarkTheme = () => ({
  background: 'bg-gradient-to-br from-slate-900 via-green-950 to-slate-900',
  header: 'bg-gradient-to-r from-green-700 via-lime-700 to-green-800',
  headerBorder: 'border-green-600/30',
  accent: {
    primary: 'green',
    secondary: 'lime',
    colors: {
      50: '#052e16',
      100: '#14532d',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    }
  },
  cards: 'bg-slate-800/80 backdrop-blur-sm border-slate-700',
  description: 'Employee Dark Theme'
});

/**
 * Default Theme - Original teal scheme as fallback
 */
const getDefaultTheme = () => ({
  background: 'bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50',
  header: 'bg-gradient-to-r from-teal-600 via-purple-600 to-teal-700',
  headerBorder: 'border-purple-400/30',
  accent: {
    primary: 'teal',
    secondary: 'purple',
    colors: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e'
    }
  },
  cards: 'bg-white border-teal-100',
  description: 'Default Theme'
});

/**
 * Default Dark Theme
 */
const getDefaultDarkTheme = () => ({
  background: 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900',
  header: 'bg-gradient-to-r from-teal-700 via-purple-700 to-teal-800',
  headerBorder: 'border-purple-600/30',
  accent: {
    primary: 'teal',
    secondary: 'purple',
    colors: {
      50: '#1e1b4b',
      100: '#312e81',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e'
    }
  },
  cards: 'bg-slate-800 border-slate-700',
  description: 'Default Dark Theme'
});

/**
 * Custom Organization Theme - For organizations with custom branding
 */
const getCustomOrganizationTheme = (themeColors) => ({
  background: `bg-gradient-to-br from-${themeColors.primary}-50 via-${themeColors.secondary}-50 to-slate-50`,
  header: `bg-gradient-to-r from-${themeColors.primary}-600 via-${themeColors.secondary}-600 to-${themeColors.primary}-700`,
  headerBorder: `border-${themeColors.primary}-400/30`,
  accent: {
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    colors: themeColors.colors || {}
  },
  cards: `bg-white/80 backdrop-blur-sm border-${themeColors.primary}-100`,
  description: 'Custom Organization Theme'
});

/**
 * Custom Organization Dark Theme
 */
const getCustomOrganizationDarkTheme = (themeColors) => ({
  background: `bg-gradient-to-br from-slate-900 via-${themeColors.primary}-950 to-slate-900`,
  header: `bg-gradient-to-r from-${themeColors.primary}-700 via-${themeColors.secondary}-700 to-${themeColors.primary}-800`,
  headerBorder: `border-${themeColors.primary}-600/30`,
  accent: {
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    colors: themeColors.colors || {}
  },
  cards: `bg-slate-800/80 backdrop-blur-sm border-${themeColors.primary}-700`,
  description: 'Custom Organization Dark Theme'
});

/**
 * Get theme classes as CSS string for dynamic styling
 */
export const getThemeClasses = (user, isDarkMode = false) => {
  const theme = getRoleBasedTheme(user, isDarkMode);
  return {
    page: theme.background,
    header: `${theme.header} shadow-xl ${theme.headerBorder}`,
    cards: theme.cards,
    accent: theme.accent
  };
};

/**
 * Get role-specific color for status indicators
 */
export const getRoleColor = (roleName) => {
  switch (roleName?.toLowerCase()) {
    case 'super_admin':
      return 'indigo';
    case 'org_admin':
      return 'teal';
    case 'manager':
      return 'blue';
    case 'employee':
      return 'green';
    default:
      return 'gray';
  }
};

/**
 * Theme presets for quick reference
 */
export const THEME_PRESETS = {
  SUPER_ADMIN: 'super_admin_purple_indigo',
  ORG_ADMIN: 'org_admin_teal_emerald',
  MANAGER: 'manager_blue_cyan',
  EMPLOYEE: 'employee_green_lime',
  DEFAULT: 'default_teal_purple'
};

/**
 * Accessibility-compliant color contrast checker
 */
export const hasGoodContrast = (bgColor, textColor) => {
  // Implementation for color contrast validation
  // Returns true/false based on WCAG guidelines
  return true; // Placeholder - implement actual contrast checking
};

/**
 * Export individual theme functions for direct access
 */
export {
  getSuperAdminTheme,
  getSuperAdminDarkTheme,
  getOrgAdminTheme,
  getOrgAdminDarkTheme,
  getManagerTheme,
  getManagerDarkTheme,
  getEmployeeTheme,
  getEmployeeDarkTheme,
  getDefaultTheme,
  getDefaultDarkTheme
};