import React from 'react';
import { RotateCw, LogOut } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const DashboardHeader = ({
    title,
    subtitle,
    user,
    onLogout,
    onRefresh,
    refreshing = false
}) => {
    const { isDarkMode } = useTheme();
    
    return (
        <div className={`backdrop-blur-sm border-b sticky top-0 z-30 shadow-sm transition-all duration-300 ${isDarkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-teal-50/90 border-slate-200/60'}`}>
            <div className="w-full px-4 sm:px-6 lg:px-8 py-1.5">
                <div className="flex items-center justify-between gap-3">

                    {/* Title Section */}
                    <div>
                        <h1 className={`text-xl font-bold bg-gradient-to-r leading-tight ${isDarkMode ? 'from-teal-400 to-cyan-400 bg-clip-text text-transparent' : 'from-teal-600 to-teal-600 bg-clip-text text-transparent'}`}>
                            {title}
                        </h1>
                        {subtitle ? (
                            <p className={`mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
                        ) : (
                            user && (
                                <p className={`mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Welcome back, <span className={`font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>{user.username || 'Admin'}</span>
                                </p>
                            )
                        )}
                    </div>

                    {/* Actions Section */}
                    <div className="flex items-center gap-3">
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                disabled={refreshing}
                                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500' : 'bg-teal-50/95 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                            >
                                {refreshing ? (
                                    <>
                                        <RotateCw className="w-4 h-4 animate-spin" />
                                        <span className="hidden sm:inline text-sm">Refreshing...</span>
                                    </>
                                ) : (
                                    <>
                                        <RotateCw className="w-4 h-4" />
                                        <span className="hidden sm:inline text-sm">Refresh</span>
                                    </>
                                )}
                            </button>
                        )}

                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50 hover:text-red-300' : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-200'}`}
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm">Logout</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
