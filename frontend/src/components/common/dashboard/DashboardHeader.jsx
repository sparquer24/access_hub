import React from 'react';

const DashboardHeader = ({
    title,
    subtitle,
    user,
    onLogout,
    onRefresh,
    refreshing = false
}) => {
    return (
        <div className="bg-teal-50/90 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-30 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                    {/* Title Section */}
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-600 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        {subtitle ? (
                            <p className="text-slate-600 mt-1">{subtitle}</p>
                        ) : (
                            user && (
                                <p className="text-slate-600 mt-1">
                                    Welcome back, <span className="font-bold text-teal-600">{user.username || 'Admin'}</span>! 👋
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
                                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50/95 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {refreshing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                                        <span className="hidden sm:inline">Refreshing...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span className="hidden sm:inline">Refresh</span>
                                    </>
                                )}
                            </button>
                        )}

                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-200 transition-all duration-300"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
