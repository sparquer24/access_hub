import React, { useState } from 'react';
import DashboardHeader from '../../common/dashboard/DashboardHeader';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LPRSearch = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <DashboardHeader
                title="Smart Video Search"
                user={user}
                onLogout={handleLogout}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/org-admin/lpr/dashboard')}
                        className="mb-4 text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900">Smart Video Search</h1>
                    <p className="text-slate-600">Find vehicles by plate number or time range with 3-second context clips</p>
                </div>

                {/* Search Bar */}
                <div className="bg-teal-50/95 p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">License Plate / Vehicle</label>
                            <input
                                type="text"
                                placeholder="e.g., KA 01 AB 1234"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Date Range</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                        <div className="flex items-end">
                            <button className="w-full md:w-auto px-8 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors">
                                Search Footage
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Mock Result 1 */}
                    <div className="bg-teal-50/95 rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-lg transition-all">
                        <div className="aspect-video bg-slate-200 relative">
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400">Video Placeholder</div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">00:15</div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-900">KA 05 MN 9876</h3>
                                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">Gate 1</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Today, 10:42 AM</p>
                            <button className="w-full py-2 bg-teal-50 text-teal-600 font-semibold rounded-lg hover:bg-teal-100 transition-colors">
                                Play Clip
                            </button>
                        </div>
                    </div>

                    {/* Mock Result 2 */}
                    <div className="bg-teal-50/95 rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-lg transition-all">
                        <div className="aspect-video bg-slate-200 relative">
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400">Video Placeholder</div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">00:22</div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-900">KA 53 Z 1001</h3>
                                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">Gate 2</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">Yesterday, 06:15 PM</p>
                            <button className="w-full py-2 bg-teal-50 text-teal-600 font-semibold rounded-lg hover:bg-teal-100 transition-colors">
                                Play Clip
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-slate-500 text-sm">
                    Showing latest results. Use filters to find old records.
                </div>
            </div>
        </div>
    );
};

export default LPRSearch;
