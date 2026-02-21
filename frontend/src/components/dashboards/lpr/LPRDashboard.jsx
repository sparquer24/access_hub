import React from 'react';
import DashboardHeader from '../../common/dashboard/DashboardHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LPRDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <DashboardHeader
                title="LPR Dashboard"
                user={user}
                onLogout={handleLogout}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">License Plate Recognition</h1>
                        <p className="text-slate-600">Live monitoring and vehicle entry logs</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/org-admin/lpr/search')}
                            className="px-4 py-2 bg-teal-50/95 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                        >
                            🔍 Smart Search
                        </button>
                        <button
                            onClick={() => navigate('/org-admin/lpr/alerts')}
                            className="px-4 py-2 bg-teal-50/95 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                        >
                            🛡️ Security Alerts
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Feed Placeholder */}
                    <div className="lg:col-span-2 bg-black rounded-2xl overflow-hidden shadow-lg aspect-video relative group">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📹</div>
                                <h3 className="text-white text-xl font-medium">Live Camera Feed</h3>
                                <p className="text-slate-400">Gate 1 - Main Entrance</p>
                            </div>
                        </div>
                        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            LIVE
                        </div>
                    </div>

                    {/* Recent Entries */}
                    <div className="bg-teal-50/95 rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Recent Entries</h3>
                            <span className="text-xs text-teal-600 font-medium cursor-pointer">View All</span>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div key={item} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                    <div className="w-12 h-12 bg-slate-200 rounded-lg mr-3 flex-shrink-0 overflow-hidden relative">
                                        {/* Placeholder car image */}
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">IMG</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-mono font-bold text-slate-900">KA 0{item} AB 123{item}</h4>
                                            <span className="text-xs text-slate-500">10:0{item} AM</span>
                                        </div>
                                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                            <span>✔ Allowed</span>
                                            <span className="text-slate-400">•</span>
                                            <span className="text-slate-500">Employee</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    {[
                        { label: 'Total Entries Today', value: '142', color: 'blue' },
                        { label: 'Unique Vehicles', value: '89', color: 'purple' },
                        { label: 'Security Alerts', value: '0', color: 'green' },
                        { label: 'Blacklisted Attempts', value: '0', color: 'red' },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-teal-50/95 p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                            <p className={`text-2xl font-black text-${stat.color}-600`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LPRDashboard;
