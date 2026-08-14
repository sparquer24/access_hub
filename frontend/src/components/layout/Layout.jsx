import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = ({ children }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-slate-900' : ''}`}>
      <Header />
      <main className={`relative flex-1 flex flex-col ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : ''}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
