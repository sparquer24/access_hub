import React, { useState, useEffect } from 'react';
import { visitorService } from '../../../services/visitorService';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../common/Loader';

const BlacklistManagement = ({ organizationId }) => {
    const { success, error: showError } = useToast();
    const [blacklist, setBlacklist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        email: '',
        reason: '',
        severity: 'medium', // low, medium, high
        notes: ''
    });

    useEffect(() => {
        fetchBlacklist();
    }, [organizationId]);

    const fetchBlacklist = async () => {
        setLoading(true);
        try {
            const res = await visitorService.getBlacklist(organizationId);
            if (res.success) {
                setBlacklist(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch blacklist", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await visitorService.addToBlacklist(organizationId, formData);
            if (res.success) {
                fetchBlacklist();
                setShowForm(false);
                setFormData({
                    name: '',
                    phone_number: '',
                    email: '',
                    reason: '',
                    severity: 'medium',
                    notes: ''
                });
            }
        } catch (error) {
            console.error("Failed to add to blacklist", error);
            showError("Failed to add to blacklist: " + (error.response?.data?.message || error.message));
        }
    };

    const handleRemove = async (id) => {
        if (!window.confirm("Are you sure you want to remove this person from the blacklist?")) return;
        try {
            await visitorService.removeFromBlacklist(organizationId, id);
            fetchBlacklist();
        } catch (error) {
            console.error("Failed to remove from blacklist", error);
        }
    };

    return (
        <div className="bg-teal-50/95 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-red-50">
                <div>
                    <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
                        🚫 Visitor Blacklist
                    </h3>
                    <p className="text-red-700 text-sm mt-1">Manage blocked visitors and security risks</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 transition-colors"
                >
                    {showForm ? 'Cancel' : '➕ Add to Blacklist'}
                </button>
            </div>

            {showForm && (
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-4">Add Entry to Watchlist</h4>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                placeholder="e.g. 9876543210"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                            <select
                                name="severity"
                                value={formData.severity}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            >
                                <option value="low">Low - Watchlist</option>
                                <option value="medium">Medium - Warning</option>
                                <option value="high">High - Block Entry</option>
                                <option value="critical">Critical - Security Threat</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
                            <input
                                type="text"
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                placeholder="Why is this person blacklisted?"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
                            >
                                Save to Blacklist
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                            <th className="px-6 py-4">Name/Identity</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">Severity</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                    <div className="flex justify-center">
                                        <Loader size="medium" />
                                    </div>
                                    <p className="mt-2">Loading blacklist...</p>
                                </td>
                            </tr>
                        ) : blacklist.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <span className="text-4xl block mb-2">🛡️</span>
                                    <p className="text-slate-500 font-medium">No one is currently blacklisted</p>
                                    <p className="text-slate-400 text-sm">Use the "Add" button to block specific visitors.</p>
                                </td>
                            </tr>
                        ) : (
                            blacklist.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900">{item.name || 'Unknown'}</p>
                                        <div className="text-xs text-slate-500 flex flex-col gap-1 mt-1">
                                            {item.phone_number && <span>📱 {item.phone_number}</span>}
                                            {item.email && <span>📧 {item.email}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{item.reason}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                            item.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                                item.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {item.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                            Active Block
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BlacklistManagement;
