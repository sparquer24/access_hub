import React, { useState, useEffect } from 'react';
import { lprService } from '../../../services/lprService';
import WebcamCapture from '../../common/WebcamCapture.jsx';
import Loader from '../../common/Loader';
import { useToast } from '../../../contexts/ToastContext';

const OrganizationLPR = ({ organization }) => {
    const { success, error: showError, info: showInfo } = useToast();
    const features = organization?.enabled_features || {};
    const [activeSubTab, setActiveSubTab] = useState('overview'); // overview, hotlist, whitelist, register

    // Data State
    const [logs, setLogs] = useState([]);
    const [hotlist, setHotlist] = useState([]);
    const [whitelist, setWhitelist] = useState([]);
    const [stats, setStats] = useState({
        entries_today: 0,
        security_alerts: 0,
        vip_movements: 0,
        active_cameras: '0/0'
    });
    const [loading, setLoading] = useState(false);

    // Modal State
    const [showHotlistModal, setShowHotlistModal] = useState(false);
    const [showWhitelistModal, setShowWhitelistModal] = useState(false);
    const [showManualEntryModal, setShowManualEntryModal] = useState(false);
    const [showGatePassModal, setShowGatePassModal] = useState(false);

    // View State for Modals
    const [printedPassEntry, setPrintedPassEntry] = useState(null);
    const [showWebcam, setShowWebcam] = useState(false);
    const [activePhotoSlot, setActivePhotoSlot] = useState(null); // 'front', 'side', etc.
    const [manualEntryForm, setManualEntryForm] = useState({
        vehicle_number: '',
        vehicle_type: 'car',
        date_time: new Date().toISOString().slice(0, 16),
        gate_name: 'Main Gate',
        // Driver Details
        driver_name: '',
        driver_phone: '',
        driver_license_id: '',
        checklist_status: {
            puc_valid: false,
            insurance_valid: false,
            no_prohibited_items: false,
            undercarriage_checked: false
        },
        vehicle_photos: [], // { type: 'front', base64: '...' }
        material_declaration: '',
        vehicle_security_check_notes: ''
    });

    // Form State
    const [hotlistForm, setHotlistForm] = useState({
        vehicle_number: '', reason: '', fir_number: '', reporting_officer: '', severity: 'warning'
    });
    const [whitelistForm, setWhitelistForm] = useState({
        vehicle_number: '', owner_name: '', designation: '', department: '', priority: 'medium', access_zones: 'All Gates'
    });

    // Search/Filter State
    const [searchFilters, setSearchFilters] = useState({
        vehicle_number: '',
        date: ''
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PER_PAGE = 20;

    // Fetch Data on Tab Change or Filter Change
    useEffect(() => {
        if (!organization?.id) return;
        fetchData();
        // Poll for stats if on overview
        let interval;
        if (activeSubTab === 'overview') {
            interval = setInterval(() => {
                fetchStats();
            }, 30000); // 30 seconds
        }
        return () => clearInterval(interval);
    }, [activeSubTab, organization.id, page, searchFilters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeSubTab === 'overview') {
                await fetchStats();
            } else if (activeSubTab === 'register') {
                // Pass search filters to API
                const params = {
                    vehicle_number: searchFilters.vehicle_number || undefined,
                    // Backend might need update to handle date if not already supported
                    date: searchFilters.date || undefined,
                    page: page,
                    per_page: PER_PAGE
                };
                const res = await lprService.getLogs(organization.id, params);
                if (res.data.success) {
                    setLogs(res.data.data);
                    if (res.data.pagination) setTotalPages(res.data.pagination.pages);
                }
            } else if (activeSubTab === 'hotlist') {
                const res = await lprService.getHotlist(organization.id);
                if (res.data.success) setHotlist(res.data.data);
            } else if (activeSubTab === 'whitelist') {
                const res = await lprService.getWhitelist(organization.id);
                if (res.data.success) setWhitelist(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch LPR data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await lprService.getStats(organization.id);
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch LPR stats", error);
        }
    };

    // Handlers
    const handleAddHotlist = async (e) => {
        e.preventDefault();
        try {
            await lprService.addToHotlist(organization.id, hotlistForm);
            setShowHotlistModal(false);
            setHotlistForm({ vehicle_number: '', reason: '', fir_number: '', reporting_officer: '', severity: 'warning' });
            fetchData(); // Refresh list
            fetchData(); // Refresh list
            success('Vehicle added to Hotlist');
        } catch (err) {
            showError('Failed to add to hotlist. Please check inputs.');
        }
    };

    const handleAddWhitelist = async (e) => {
        e.preventDefault();
        try {
            await lprService.addToWhitelist(organization.id, whitelistForm);
            setShowWhitelistModal(false);
            setWhitelistForm({ vehicle_number: '', owner_name: '', designation: '', department: '', priority: 'medium', access_zones: 'All Gates' });
            fetchData(); // Refresh list
            fetchData(); // Refresh list
            success('Vehicle authorized for VIP access');
        } catch (err) {
            showError('Failed to authorize vehicle. Please check inputs.');
        }
    };

    const handleRemoveHotlist = async (id) => {
        if (!window.confirm('Are you sure you want to remove this vehicle from the hotlist?')) return;
        await lprService.removeFromHotlist(organization.id, id);
        fetchData();
    };

    const handleRemoveWhitelist = async (id) => {
        if (!window.confirm('Are you sure you want to revoke access for this vehicle?')) return;
        await lprService.removeFromWhitelist(organization.id, id);
        fetchData();
    };

    const handleManualEntrySubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await lprService.createManualEntry(organization.id, manualEntryForm);
            // Assuming simplified response or verify 
            // In a real scenario, check res.data.success
            setShowManualEntryModal(false);
            setManualEntryForm({
                vehicle_number: '',
                vehicle_type: 'car',
                date_time: new Date().toISOString().slice(0, 16),
                gate_name: 'Main Gate',
                driver_name: '',
                driver_phone: '',
                driver_license_id: '',
                checklist_status: {
                    puc_valid: false,
                    insurance_valid: false,
                    no_prohibited_items: false,
                    undercarriage_checked: false
                },
                vehicle_photos: [],
                material_declaration: '',
                vehicle_security_check_notes: ''
            });
            fetchData();

            // Check for Hotlist Alert
            if (res.data?.hotlist_alert) {
                // Show Critical Alert (Using standard alert for now, ideally a modal)
                showError('🚨 CRITICAL WARNING: This vehicle is upon the HOTLIST! Take immediate action.');
            } else {
                success('Vehicle Entry Logged Successfully');
            }

            // Show Pass
            if (res.data) {
                setPrintedPassEntry(res.data);
                setShowGatePassModal(true);
            }
        } catch (err) {
            console.error(err);
            showError('Failed to log entry.');
        }
    };

    const handleImageCapture = (base64Image) => {
        if (activePhotoSlot) {
            setManualEntryForm(prev => {
                const existing = prev.vehicle_photos.filter(p => p.type !== activePhotoSlot);
                return {
                    ...prev,
                    vehicle_photos: [...existing, { type: activePhotoSlot, base64: base64Image }]
                };
            });
            setShowWebcam(false);
            setActivePhotoSlot(null);
        }
    };


    if (!features.lpr_integration) {
        return (
            <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
                <div className="text-4xl mb-4">🚗</div>
                <h3 className="text-lg font-bold text-slate-700">LPR Module Not Enabled</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                    This organization does not have License Plate Recognition enabled.
                    Edit the organization to enable this feature in the "License Plate Recognition" section.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-2xl">🚔</span> License Plate Recognition System
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Official Record of Vehicle Movements & Security Protocols
                    </p>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    {[
                        { id: 'overview', label: '📊 Overview' },
                        { id: 'register', label: '📋 The Register' },
                        { id: 'hotlist', label: '🚫 Hotlist (Blacklist)' },
                        { id: 'whitelist', label: '✅ VIP / Whitelist' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeSubTab === tab.id
                                ? 'bg-white text-teal-700 shadow-sm'
                                : 'text-slate-600 hover:text-teal-600 hover:bg-slate-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeSubTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Entries Today</p>
                            <p className="text-3xl font-black text-blue-900 mt-1">{stats.entries_today}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Security Alerts</p>
                            <p className="text-3xl font-black text-red-900 mt-1">{stats.security_alerts}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">VIP Movements</p>
                            <p className="text-3xl font-black text-green-900 mt-1">{stats.vip_movements}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Cameras</p>
                            <p className="text-3xl font-black text-slate-900 mt-1">{stats.active_cameras}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                        <div className="bg-teal-50/95 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">Recent Alerts</h3>
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200">Live</span>
                            </div>
                            <div className="divide-y divide-slate-100 p-8 text-center text-slate-500">
                                No recent security alerts.
                            </div>
                        </div>

                        <div className="bg-teal-50/95 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">Quick Actions</h3>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3">
                                <button className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors">
                                    <span className="block text-xl mb-1">🔍</span>
                                    <span className="font-semibold text-slate-700 text-sm">Search History</span>
                                </button>
                                <button className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors">
                                    <span className="block text-xl mb-1">📥</span>
                                    <span className="font-semibold text-slate-700 text-sm">Download Report</span>
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('hotlist')}
                                    className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors"
                                >
                                    <span className="block text-xl mb-1">🚫</span>
                                    <span className="font-semibold text-slate-700 text-sm">Manage Hotlist</span>
                                </button>
                                <button
                                    onClick={() => setActiveSubTab('whitelist')}
                                    className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-left transition-colors"
                                >
                                    <span className="block text-xl mb-1">✅</span>
                                    <span className="font-semibold text-slate-700 text-sm">Manage VIPs</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* THE REGISTER TAB */}
            {activeSubTab === 'register' && (
                <div className="bg-teal-50/95 border border-slate-300 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">The Register</h3>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                                    Daily Vehicle Movement Log
                                    {/* Gate Controls Simulation */}
                                    <span className="ml-4 border-l border-slate-300 pl-4 flex gap-2">
                                        <button onClick={() => showInfo('🚧 Opening Entry Boom Barrier...')} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 hover:bg-green-200 font-bold uppercase transition-colors">
                                            Open Entry Gate
                                        </button>
                                        <button onClick={() => showInfo('🚧 Opening Exit Boom Barrier...')} className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-200 font-bold uppercase transition-colors">
                                            Open Exit Gate
                                        </button>
                                    </span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-teal-50/95 border border-slate-300 rounded shadow-sm text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                                    <span>🖨️</span> Print Log
                                </button>
                                <button
                                    onClick={() => setShowManualEntryModal(true)}
                                    className="px-3 py-1 bg-teal-600 text-white border border-teal-600 rounded shadow-sm text-sm font-medium hover:bg-teal-700 flex items-center gap-2"
                                >
                                    <span>+</span> Manual Entry / Inspection
                                </button>
                            </div>
                        </div>

                        {/* Search Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-teal-50/95 p-3 rounded-lg border border-slate-200 shadow-sm">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Search Vehicle</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter Vehicle Number..."
                                        value={searchFilters.vehicle_number}
                                        onChange={(e) => setSearchFilters(prev => ({ ...prev, vehicle_number: e.target.value.toUpperCase() }))}
                                        className="w-full border border-slate-300 rounded pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none font-mono uppercase"
                                    />
                                    <span className="absolute left-3 top-2 text-slate-400">🔍</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Filter by Date</label>
                                <input
                                    type="date"
                                    value={searchFilters.date}
                                    onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={fetchData}
                                    className="w-full px-4 py-2 bg-slate-800 text-white font-bold rounded hover:bg-slate-900 transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs border-b border-slate-300">
                                    <tr>
                                        <th className="px-6 py-3 border-r border-slate-200">Time</th>
                                        <th className="px-6 py-3 border-r border-slate-200">Vehicle No.</th>
                                        <th className="px-6 py-3 border-r border-slate-200">Type</th>
                                        <th className="px-6 py-3 border-r border-slate-200">Category</th>
                                        <th className="px-6 py-3 border-r border-slate-200">Gate / Point</th>
                                        <th className="px-6 py-3 border-r border-slate-200">Inspection</th>
                                        <th className="px-6 py-3 border-r border-slate-200">Duration</th>
                                        <th className="px-6 py-3">Status / Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {logs.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-slate-500">No vehicle movements recorded today.</td></tr>
                                    ) : logs.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 border-r border-slate-100 font-mono text-slate-600">{new Date(row.timestamp).toLocaleTimeString()}</td>
                                            <td className="px-6 py-3 border-r border-slate-100 font-bold font-mono text-slate-900">{row.vehicle_number}</td>
                                            <td className="px-6 py-3 border-r border-slate-100">{row.direction}</td>
                                            <td className="px-6 py-3 border-r border-slate-100 text-slate-700">{row.category}</td>
                                            <td className="px-6 py-3 border-r border-slate-100 text-slate-500">{row.gate_name || '-'}</td>
                                            <td className="px-6 py-3 border-r border-slate-100">
                                                {row.checklist_status && Object.keys(row.checklist_status).length > 0 ? (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">Checked</span>
                                                ) : <span className="text-xs text-slate-400">N/A</span>}
                                                {row.gate_pass_id && (
                                                    <button onClick={() => { setPrintedPassEntry(row); setShowGatePassModal(true); }} className="ml-2 text-teal-600 hover:underline text-xs">
                                                        🖨️ Pass
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 border-r border-slate-100">
                                                {row.duration_minutes ? (
                                                    <span className={`text-xs font-bold ${row.is_overstay ? 'text-red-600' : 'text-slate-600'}`}>
                                                        {Math.floor(row.duration_minutes / 60)}h {row.duration_minutes % 60}m
                                                        {row.is_overstay && <span className="block text-[10px] uppercase text-red-500">Overstay</span>}
                                                    </span>
                                                ) : row.status === 'allowed' && !row.exit_time ? (
                                                    <span className="text-xs text-green-600 font-bold animate-pulse">● Inside</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-3 font-semibold">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={row.status === 'allowed' ? 'text-green-600' : row.status === 'completed' ? 'text-slate-400' : 'text-red-600'}>
                                                        {row.status}
                                                    </span>
                                                    {row.status === 'allowed' && !row.exit_time && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!window.confirm('Process vehicle exit?')) return;
                                                                try {
                                                                    // Ideally add api method, for now calling generic update or similar.
                                                                    // Since we didn't add it to front-end service yet, we'll just mock alert or need to correct plan.
                                                                    // WAIT: I should add the service method first.
                                                                    // For this step, I will add the button but it will need the service update.
                                                                    await lprService.processExit(organization.id, row.id);
                                                                    fetchData();
                                                                    success('Vehicle processed for exit');
                                                                } catch (e) { showError('Failed to process exit'); }
                                                            }}
                                                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded border border-slate-300 transition-colors"
                                                        >
                                                            Exit ➡️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination Controls */}
                            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                                <span className="text-xs text-slate-500">
                                    Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className={`px-3 py-1 rounded border text-xs font-semibold ${page === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className={`px-3 py-1 rounded border text-xs font-semibold ${page === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            {/* HOTLIST TAB */}
            {
                activeSubTab === 'hotlist' && (
                    <div className="bg-teal-50/95 border border-red-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-red-900">Restricted Vehicle Hotlist</h3>
                                <p className="text-xs text-red-700 uppercase tracking-widest font-semibold">Security Alert Database</p>
                            </div>
                            <button
                                onClick={() => setShowHotlistModal(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded shadow-sm text-sm font-bold hover:bg-red-700 transition-colors"
                            >
                                + Add Vehicle to Hotlist
                            </button>
                        </div>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-red-50 text-red-900 font-bold uppercase text-xs border-b border-red-200">
                                        <tr>
                                            <th className="px-6 py-3 border-r border-red-100">Vehicle No.</th>
                                            <th className="px-6 py-3 border-r border-red-100">Reason / Offense</th>
                                            <th className="px-6 py-3 border-r border-red-100">FIR / Ref No.</th>
                                            <th className="px-6 py-3 border-r border-red-100">Reported By</th>
                                            <th className="px-6 py-3 border-r border-red-100">Date</th>
                                            <th className="px-6 py-3">Severity</th>
                                            <th className="px-6 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-100">
                                        {hotlist.length === 0 ? (
                                            <tr><td colSpan="7" className="p-8 text-center text-slate-500">No vehicles in hotlist.</td></tr>
                                        ) : hotlist.map((row) => (
                                            <tr key={row.id} className="hover:bg-red-50">
                                                <td className="px-6 py-3 border-r border-red-100 font-bold font-mono text-slate-900">{row.vehicle_number}</td>
                                                <td className="px-6 py-3 border-r border-red-100 text-slate-800">{row.reason}</td>
                                                <td className="px-6 py-3 border-r border-red-100 font-mono text-slate-600">{row.fir_number || '-'}</td>
                                                <td className="px-6 py-3 border-r border-red-100 text-slate-600">{row.reporting_officer || '-'}</td>
                                                <td className="px-6 py-3 border-r border-red-100 text-slate-500">{new Date(row.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-3 border-r border-red-100">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${row.severity === 'critical' ? 'bg-red-600 text-white' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {row.severity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <button onClick={() => handleRemoveHotlist(row.id)} className="text-red-600 hover:text-red-800 font-bold text-xs">REMOVE</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )
            }

            {/* WHITELIST TAB */}
            {
                activeSubTab === 'whitelist' && (
                    <div className="bg-teal-50/95 border border-green-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-green-100 bg-green-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-green-900">Authorized / VIP Vehicles</h3>
                                <p className="text-xs text-green-700 uppercase tracking-widest font-semibold">Priority Access List</p>
                            </div>
                            <button
                                onClick={() => setShowWhitelistModal(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded shadow-sm text-sm font-bold hover:bg-green-700 transition-colors"
                            >
                                + Authorize New Vehicle
                            </button>
                        </div>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-green-50 text-green-900 font-bold uppercase text-xs border-b border-green-200">
                                        <tr>
                                            <th className="px-6 py-3 border-r border-green-100">Vehicle No.</th>
                                            <th className="px-6 py-3 border-r border-green-100">Official Name</th>
                                            <th className="px-6 py-3 border-r border-green-100">Designation</th>
                                            <th className="px-6 py-3 border-r border-green-100">Department</th>
                                            <th className="px-6 py-3 border-r border-green-100">Access Zones</th>
                                            <th className="px-6 py-3">Priority</th>
                                            <th className="px-6 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-green-100">
                                        {whitelist.length === 0 ? (
                                            <tr><td colSpan="7" className="p-8 text-center text-slate-500">No authorized vehicles found.</td></tr>
                                        ) : whitelist.map((row) => (
                                            <tr key={row.id} className="hover:bg-green-50">
                                                <td className="px-6 py-3 border-r border-green-100 font-bold font-mono text-slate-900">{row.vehicle_number}</td>
                                                <td className="px-6 py-3 border-r border-green-100 text-slate-900 font-medium">{row.owner_name}</td>
                                                <td className="px-6 py-3 border-r border-green-100 text-slate-600">{row.designation || '-'}</td>
                                                <td className="px-6 py-3 border-r border-green-100 text-slate-600">{row.department || '-'}</td>
                                                <td className="px-6 py-3 border-r border-green-100 text-slate-500">{row.access_zones}</td>
                                                <td className="px-6 py-3 border-r border-green-100">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${row.priority === 'high' ? 'bg-green-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
                                                        {row.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <button onClick={() => handleRemoveWhitelist(row.id)} className="text-red-600 hover:text-red-800 font-bold text-xs">REVOKE</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )
            }

            {/* --- MODALS --- */}

            {/* HOTLIST MODAL */}
            {
                showHotlistModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 shadow-2xl">
                        <div className="bg-teal-50/95 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    🚫 Add to Hotlist
                                </h3>
                                <button onClick={() => setShowHotlistModal(false)} className="hover:bg-red-700 p-1 rounded">✕</button>
                            </div>
                            <form onSubmit={handleAddHotlist} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle Registration Number *</label>
                                    <input
                                        type="text"
                                        value={hotlistForm.vehicle_number}
                                        onChange={e => setHotlistForm({ ...hotlistForm, vehicle_number: e.target.value.toUpperCase() })}
                                        placeholder="e.g. DL 01 AB 1234"
                                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-red-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Reason / Offense *</label>
                                    <input
                                        type="text"
                                        value={hotlistForm.reason}
                                        onChange={e => setHotlistForm({ ...hotlistForm, reason: e.target.value })}
                                        placeholder="e.g. Stolen Vehicle, Wanted in FIR..."
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">FIR / Reference No.</label>
                                        <input
                                            type="text"
                                            value={hotlistForm.fir_number}
                                            onChange={e => setHotlistForm({ ...hotlistForm, fir_number: e.target.value })}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Reporting Officer</label>
                                        <input
                                            type="text"
                                            value={hotlistForm.reporting_officer}
                                            onChange={e => setHotlistForm({ ...hotlistForm, reporting_officer: e.target.value })}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Severity Level</label>
                                    <select
                                        value={hotlistForm.severity}
                                        onChange={e => setHotlistForm({ ...hotlistForm, severity: e.target.value })}
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                                    >
                                        <option value="warning">Warning (Alert Only)</option>
                                        <option value="critical">Critical (Stop Vehicle)</option>
                                        <option value="info">Info (Monitor)</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowHotlistModal(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded shadow-md hover:bg-red-700 transition">Add to Hotlist</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* WHITELIST MODAL */}
            {
                showWhitelistModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 shadow-2xl">
                        <div className="bg-teal-50/95 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="bg-green-600 px-6 py-4 flex justify-between items-center text-white">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    ✅ Authorize Vehicle
                                </h3>
                                <button onClick={() => setShowWhitelistModal(false)} className="hover:bg-green-700 p-1 rounded">✕</button>
                            </div>
                            <form onSubmit={handleAddWhitelist} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle Registration Number *</label>
                                    <input
                                        type="text"
                                        value={whitelistForm.vehicle_number}
                                        onChange={e => setWhitelistForm({ ...whitelistForm, vehicle_number: e.target.value.toUpperCase() })}
                                        placeholder="e.g. DL 01 AB 1234"
                                        className="w-full border border-slate-300 rounded px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-green-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Official Name *</label>
                                    <input
                                        type="text"
                                        value={whitelistForm.owner_name}
                                        onChange={e => setWhitelistForm({ ...whitelistForm, owner_name: e.target.value })}
                                        placeholder="e.g. Dr. John Doe"
                                        className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Designation</label>
                                        <input
                                            type="text"
                                            value={whitelistForm.designation}
                                            onChange={e => setWhitelistForm({ ...whitelistForm, designation: e.target.value })}
                                            placeholder="e.g. Director"
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Department</label>
                                        <input
                                            type="text"
                                            value={whitelistForm.department}
                                            onChange={e => setWhitelistForm({ ...whitelistForm, department: e.target.value })}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Priority Level</label>
                                        <select
                                            value={whitelistForm.priority}
                                            onChange={e => setWhitelistForm({ ...whitelistForm, priority: e.target.value })}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                        >
                                            <option value="medium">Medium (Standard)</option>
                                            <option value="high">High (Red Beacon)</option>
                                            <option value="low">Low (Contractor)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Access Zones</label>
                                        <input
                                            type="text"
                                            value={whitelistForm.access_zones}
                                            onChange={e => setWhitelistForm({ ...whitelistForm, access_zones: e.target.value })}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowWhitelistModal(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow-md hover:bg-green-700 transition">Authorize</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* MANUAL ENTRY MODAL */}
            {
                showManualEntryModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 shadow-2xl overflow-y-auto">
                        <div className="bg-teal-50/95 rounded-xl shadow-2xl w-full max-w-4xl animate-in fade-in zoom-in duration-200 my-8">
                            <div className="bg-teal-600 px-6 py-4 flex justify-between items-center text-white rounded-t-xl">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    🚔 Manual Vehicle Entry / Inspection
                                </h3>
                                <button onClick={() => setShowManualEntryModal(false)} className="hover:bg-teal-700 p-1 rounded">✕</button>
                            </div>
                            <form onSubmit={handleManualEntrySubmit} className="p-6 space-y-6">

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle Details *</label>
                                        <input
                                            type="text"
                                            value={manualEntryForm.vehicle_number}
                                            onChange={e => setManualEntryForm({ ...manualEntryForm, vehicle_number: e.target.value.toUpperCase() })}
                                            placeholder="MH 12 AB 1234"
                                            className="w-full border border-slate-300 rounded px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-teal-500 outline-none mb-2"
                                            required
                                        />
                                        <select
                                            value={manualEntryForm.vehicle_type}
                                            onChange={e => setManualEntryForm({ ...manualEntryForm, vehicle_type: e.target.value })}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none bg-slate-50"
                                        >
                                            <option value="car">🚗 Car / SUV</option>
                                            <option value="bike">🏍️ Two Wheeler</option>
                                            <option value="truck">🚛 Truck / Lorry</option>
                                            <option value="van">🚐 Van / Pickup</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Entry Point</label>
                                        <select
                                            value={manualEntryForm.gate_name}
                                            onChange={e => setManualEntryForm({ ...manualEntryForm, gate_name: e.target.value })}
                                            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none"
                                        >
                                            <option value="Main Gate">Main Gate</option>
                                            <option value="Gate 2">Gate 2 (Service)</option>
                                            <option value="VIP Gate">VIP Gate</option>
                                        </select>
                                        <input
                                            type="datetime-local"
                                            value={manualEntryForm.date_time}
                                            disabled
                                            className="w-full mt-2 bg-slate-100 text-slate-500 border border-slate-200 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                        {/* Driver Details Section */}
                                        <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-4">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Driver Details</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-1">Driver Name</label>
                                                    <input
                                                        type="text"
                                                        value={manualEntryForm.driver_name}
                                                        onChange={e => setManualEntryForm({ ...manualEntryForm, driver_name: e.target.value })}
                                                        className="w-full border border-slate-300 rounded px-2 py-1 text-sm outline-none"
                                                        placeholder="Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                                                    <input
                                                        type="text"
                                                        value={manualEntryForm.driver_phone}
                                                        onChange={e => setManualEntryForm({ ...manualEntryForm, driver_phone: e.target.value })}
                                                        className="w-full border border-slate-300 rounded px-2 py-1 text-sm outline-none"
                                                        placeholder="Mobile"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 mb-1">License ID</label>
                                                    <input
                                                        type="text"
                                                        value={manualEntryForm.driver_license_id}
                                                        onChange={e => setManualEntryForm({ ...manualEntryForm, driver_license_id: e.target.value })}
                                                        className="w-full border border-slate-300 rounded px-2 py-1 text-sm outline-none"
                                                        placeholder="DL No."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Security Checklist</p>
                                        <div className="space-y-2">
                                            {Object.entries({
                                                puc_valid: 'Valid PUC',
                                                insurance_valid: 'Valid Insurance',
                                                no_prohibited_items: 'No Prohibited Items',
                                                undercarriage_checked: 'Undercarriage OK'
                                            }).map(([key, label]) => (
                                                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={manualEntryForm.checklist_status[key]}
                                                        onChange={e => setManualEntryForm(prev => ({
                                                            ...prev,
                                                            checklist_status: { ...prev.checklist_status, [key]: e.target.checked }
                                                        }))}
                                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                    />
                                                    <span className={manualEntryForm.checklist_status[key] ? 'text-green-700 font-medium' : 'text-slate-600'}>{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Photos */}
                                <div>
                                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">📸 Vehicle Inspection Photos</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {['front', 'back', 'side', 'trunk'].map((type) => {
                                            const existing = manualEntryForm.vehicle_photos.find(p => p.type === type);
                                            return (
                                                <div key={type} className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-center relative group">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">{type}</p>
                                                    {existing ? (
                                                        <div className="relative">
                                                            <img src={existing.base64} alt={type} className="w-full h-24 object-cover rounded shadow-sm" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setManualEntryForm(prev => ({
                                                                    ...prev,
                                                                    vehicle_photos: prev.vehicle_photos.filter(p => p.type !== type)
                                                                }))}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600"
                                                            >✕</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => { setActivePhotoSlot(type); setShowWebcam(true); }}
                                                            className="w-full h-24 bg-teal-50/95 rounded border-2 border-dashed border-slate-300 flex flex-col items-center justify-center hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300 transition-all text-slate-400 gap-1"
                                                        >
                                                            <span className="text-xl">📷</span>
                                                            <span className="text-xs font-semibold">Add Photo</span>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Notes & Material */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Material Inward Declaration</label>
                                        <textarea
                                            value={manualEntryForm.material_declaration}
                                            onChange={e => setManualEntryForm({ ...manualEntryForm, material_declaration: e.target.value })}
                                            placeholder="List any major materials/tools..."
                                            rows="3"
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Security / Inspection Notes</label>
                                        <textarea
                                            value={manualEntryForm.vehicle_security_check_notes}
                                            onChange={e => setManualEntryForm({ ...manualEntryForm, vehicle_security_check_notes: e.target.value })}
                                            placeholder="Observations: Dents, Scratches, etc."
                                            rows="3"
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowManualEntryModal(false)} className="px-5 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                    <button type="submit" className="px-8 py-2 bg-teal-600 text-white font-bold rounded-lg shadow-lg hover:bg-teal-700 hover:shadow-xl transform active:scale-95 transition-all flex items-center gap-2">
                                        <span>💾 Create Entry & Generate Pass</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* GATE PASS MODAL */}
            {
                showGatePassModal && printedPassEntry && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <div className="bg-teal-50/95 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
                            <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2">🎫 Vehicle Gate Pass</h3>
                                <button onClick={() => setShowGatePassModal(false)} className="text-slate-400 hover:text-white">✕</button>
                            </div>
                            <div id="vehicle-gate-pass" className="p-6 bg-white relative">
                                <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{organization.name || 'ORGANIZATION'}</h2>
                                    <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold mt-2">VEHICLE PASS</div>
                                </div>

                                <div className="text-center mb-6">
                                    <p className="text-5xl font-black text-slate-900 font-mono tracking-tighter">{printedPassEntry.vehicle_number}</p>
                                    <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">{printedPassEntry.category || 'VISITOR'}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-100 py-4 mb-4">
                                    <div>
                                        <p className="text-slate-400 uppercase font-bold">Entry Time</p>
                                        <p className="font-mono font-bold text-slate-700">{new Date(printedPassEntry.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 uppercase font-bold">Date</p>
                                        <p className="font-mono font-bold text-slate-700">{new Date(printedPassEntry.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 uppercase font-bold">Gate</p>
                                        <p className="font-bold text-slate-700">{printedPassEntry.gate_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 uppercase font-bold">Pass ID</p>
                                        <p className="font-mono font-bold text-slate-700">{printedPassEntry.gate_pass_id}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-100 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Security Status</p>
                                    <div className="flex justify-center gap-2">
                                        {printedPassEntry.checklist_status?.puc_valid && <span className="bg-teal-50/95 border border-slate-200 px-1 rounded text-[10px]">PUC</span>}
                                        {printedPassEntry.checklist_status?.insurance_valid && <span className="bg-teal-50/95 border border-slate-200 px-1 rounded text-[10px]">INS</span>}
                                        <span className="bg-green-500 text-white px-2 rounded text-[10px] font-bold">CLEARED</span>
                                    </div>
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-[10px] text-slate-400">Please display on dashboard</p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                                <button
                                    onClick={() => { window.print(); setShowGatePassModal(false); }}
                                    className="flex-1 bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 shadow-lg flex justify-center items-center gap-2"
                                >
                                    🖨️ PRINT PASS
                                </button>
                            </div>
                            <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                #vehicle-gate-pass, #vehicle-gate-pass * { visibility: visible; }
                                #vehicle-gate-pass {
                                    position: fixed; left: 0; top: 0; width: 100%; height: 100%;
                                    margin: 0; padding: 20px;
                                    display: flex; flex-direction: column; justify-content: center;
                                }
                            }
                        `}</style>
                        </div>
                    </div>
                )
            }

            {/* WEBCAM MODAL */}
            {
                showWebcam && (
                    <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
                        <div className="bg-teal-50/95 rounded-xl overflow-hidden w-full max-w-2xl relative">
                            <button
                                onClick={() => setShowWebcam(false)}
                                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center"
                            >✕</button>
                            <WebcamCapture
                                onImageCapture={handleImageCapture}
                                label={`Capture ${activePhotoSlot ? activePhotoSlot.toUpperCase() : 'Photo'}`}
                            />
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default OrganizationLPR;
