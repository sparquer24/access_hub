import React, { useState } from 'react';
import DashboardHeader from '../../common/dashboard/DashboardHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LPRAlerts = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('alerts'); // alerts, blacklist, whitelist

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <DashboardHeader
                title="Security Alerts & Lists"
                user={user}
                onLogout={handleLogout}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/org-admin/lpr/dashboard')}
                        className="mb-4 text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                        ← Back to Dashboard
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Security & Lists</h1>
                            <p className="text-slate-600">Manage blacklists, whitelists, and view security alerts</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 shadow-sm">
                                + Add to Blacklist
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors ${activeTab === 'alerts' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Recent Alerts
                    </button>
                    <button
                        onClick={() => setActiveTab('blacklist')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors ${activeTab === 'blacklist' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Blacklist
                    </button>
                    <button
                        onClick={() => setActiveTab('whitelist')}
                        className={`pb-3 px-4 font-semibold text-sm transition-colors ${activeTab === 'whitelist' ? 'text-green-600 border-b-2 border-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Whitelist
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-teal-50/95 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {activeTab === 'alerts' && (
                        <div className="divide-y divide-slate-100">
                            <div className="p-4 bg-red-50 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    ⚠️
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-red-900">Blacklisted Vehicle Detected</h3>
                                    <p className="text-red-700 text-sm mt-1">Vehicle <span className="font-mono font-bold">KA 04 XX 0000</span> attempted entry at Gate 1.</p>
                                    <p className="text-red-500 text-xs mt-2">2 minutes ago</p>
                                </div>
                                <button className="px-3 py-1 bg-teal-50/95 border border-red-200 text-red-600 rounded text-sm font-medium hover:bg-red-50">View Clip</button>
                            </div>
                            <div className="p-4 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    🚫
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900">Unauthorized Access Attempt</h3>
                                    <p className="text-slate-600 text-sm mt-1">Unknown vehicle loitering near Back Gate.</p>
                                    <p className="text-slate-400 text-xs mt-2">2 hours ago</p>
                                </div>
                                <button className="px-3 py-1 bg-teal-50/95 border border-slate-200 text-slate-600 rounded text-sm font-medium hover:bg-slate-50">View Clip</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'blacklist' && (
                        <div className="p-8 text-center text-slate-500">
                            <p className="text-4xl mb-4">🛡️</p>
                            <h3 className="text-lg font-semibold text-slate-900">Blacklist Management</h3>
                            <p>Coming soon: Add lists of restricted vehicles here.</p>
                        </div>
                    )}

                    {activeTab === 'whitelist' && (
                        <div className="p-8 text-center text-slate-500">
                            <p className="text-4xl mb-4">✅</p>
                            <h3 className="text-lg font-semibold text-slate-900">Whitelist Management</h3>
                            <p>Coming soon: Manage VIP and authorized vehicles here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LPRAlerts;
