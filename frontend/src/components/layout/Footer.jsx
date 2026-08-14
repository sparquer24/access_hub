import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const Footer = () => {
  const { isDarkMode } = useTheme();

  return (
    <footer className={`border-t ${
      isDarkMode
        ? 'bg-slate-900 border-slate-700'
        : 'bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 border-teal-500/30'
    }`}>
      <div className={`border-t pt-1 pb-1 flex justify-center items-center min-h-6 ${isDarkMode ? 'border-slate-700' : 'border-teal-500/30'}`}>
        <p className={`text-xs font-bold text-center w-full ${isDarkMode ? 'text-slate-400' : 'text-teal-100'}`}>
          © {new Date().getFullYear()} AccessHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
