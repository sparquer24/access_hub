import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const DEFAULT_SETTINGS = {
  appearance: {
    theme: 'light',
    language: 'en'
  },
  notifications: {
    email: true,
    push: true,
    attendance: true,
    leaves: true
  },
  privacy: {
    showProfile: true,
    showAttendance: false
  }
};

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('userSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old format if needed
        if (parsed.theme && !parsed.appearance) {
          return {
            appearance: {
              theme: parsed.theme,
              language: parsed.language || 'en'
            },
            notifications: parsed.notifications || DEFAULT_SETTINGS.notifications,
            privacy: parsed.privacy || DEFAULT_SETTINGS.privacy
          };
        }
        return parsed;
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Apply theme on initial load
  useEffect(() => {
    const theme = settings.appearance?.theme || settings.theme || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  }, []);

  // Save and apply theme when settings change
  useEffect(() => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      const theme = settings.appearance?.theme || settings.theme || 'light';
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark-mode');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  const updateSetting = (category, key, value) => {
    if (category && typeof category === 'string') {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      }));
    } else {
      // If no category, treat first param as key
      setSettings(prev => ({
        ...prev,
        [category]: key
      }));
    }
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const isDarkMode = (settings?.appearance?.theme || settings?.theme || 'light') === 'dark';

  const getDarkModeClasses = (classes) => {
    if (!classes || typeof classes !== 'object') return {};
    return {
      light: classes.light || '',
      dark: classes.dark || ''
    };
  };

  const getThemeClass = (lightClass, darkClass) => {
    return isDarkMode ? darkClass : lightClass;
  };

  const value = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    isDarkMode,
    getDarkModeClasses,
    getThemeClass
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;