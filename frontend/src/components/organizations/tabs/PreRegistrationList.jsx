import React, { useState, useEffect } from 'react';
import { visitorService } from '../../../services/visitorService';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../common/Loader';

const PreRegistrationList = ({ organizationId }) => {
    const { success, error: showError } = useToast();
    const [preRegistrations, setPreRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected

    // Form State
    const [formData, setFormData] = useState({
        visitor_name: '',
        visitor_email: '',
        visitor_phone: '',
        expected_arrival: '',
        purpose: '',
        host_name: '',
        visitor_type: 'guest'
    });

    useEffect(() => {
        fetchPreRegistrations();
    }, [organizationId, filterStatus]);

    const fetchPreRegistrations = async () => {
        setLoading(true);
        try {
            const status = filterStatus === 'all' ? null : filterStatus;
            const res = await visitorService.getPreRegistrations(organizationId, status);
            if (res.success) {
                setPreRegistrations(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch pre-registrations", error);
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
            const res = await visitorService.createPreRegistration(organizationId, formData);
            if (res.success) {
                fetchPreRegistrations();
                setShowForm(false);
                setFormData({
                    visitor_name: '',
                    visitor_email: '',
                    visitor_phone: '',
                    expected_arrival: '',
                    purpose: '',
                    host_name: '',
                    visitor_type: 'guest'
                });
                success("Pre-registration created successfully. QR code sent to email.");
            }
        } catch (error) {
            console.error("Failed to create pre-registration", error);
            showError("Error: " + (error.response?.data?.message || error.message));
        }
    };

    const handleApprove = async (id) => {
        try {
            await visitorService.approvePreRegistration(organizationId, id);
            fetchPreRegistrations();
        } catch (error) {
            showError("Failed to approve request");
        }
    };

    const handleReject = async (id) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;
        try {
            await visitorService.rejectPreRegistration(organizationId, id, reason);
            fetchPreRegistrations();
        } catch (error) {
            showError("Failed to reject request");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-teal-100 text-gray-700';
        }
    };

    return (
        <div className="bg-teal-50/95 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-teal-50">
                <div>
                    <h3 className="text-xl font-bold text-teal-900 flex items-center gap-2">
                        📅 Pre-Registrations
                    </h3>
                    <p className="text-teal-700 text-sm mt-1">Manage upcoming visits and approvals</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="approved">✅ Approved</option>
                        <option value="rejected">❌ Rejected</option>
                    </select>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center gap-2 transition-colors"
                    >
                        {showForm ? 'Cancel' : '➕ New Pre-Reg'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="p-6 bg-slate-50 border-b border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h4 className="font-semibold text-slate-800 mb-4">Create New Pre-Registration</h4>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Visitor Name *</label>
                            <input
                                type="text"
                                name="visitor_name"
                                value={formData.visitor_name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                            <input
                                type="tel"
                                name="visitor_phone"
                                value={formData.visitor_phone}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email (for QR Code)</label>
                            <input
                                type="email"
                                name="visitor_email"
                                value={formData.visitor_email}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Expected Arrival *</label>
                            <input
                                type="datetime-local"
                                name="expected_arrival"
                                value={formData.expected_arrival}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Host Name</label>
                            <input
                                type="text"
                                name="host_name"
                                value={formData.host_name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
                            <input
                                type="text"
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            />
                        </div>
                        <div className="md:col-span-2 mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                            >
                                Create Invitation
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                            <th className="px-6 py-4">Visitor Details</th>
                            <th className="px-6 py-4">Expected Arrival</th>
                            <th className="px-6 py-4">Purpose/Host</th>
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
                                    <p className="mt-2">Loading requests...</p>
                                </td>
                            </tr>
                        ) : preRegistrations.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <span className="text-4xl block mb-2">📅</span>
                                    <p className="text-slate-500 font-medium">No pre-registrations found</p>
                                </td>
                            </tr>
                        ) : (
                            preRegistrations.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900">{item.visitor_name}</p>
                                        <div className="text-xs text-slate-500 flex flex-col gap-1 mt-1">
                                            {item.visitor_phone && <span>📱 {item.visitor_phone}</span>}
                                            {item.visitor_email && <span>📧 {item.visitor_email}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-700 font-medium">
                                            {new Date(item.expected_arrival).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(item.expected_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-900">{item.purpose || '-'}</p>
                                        {item.host_name && <p className="text-xs text-slate-500">Host: {item.host_name}</p>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {item.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleApprove(item.id)}
                                                    className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-bold transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(item.id)}
                                                    className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-bold transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                        {item.status === 'approved' && (
                                            <span className="text-xs text-green-600 font-semibold">Ready for Check-in</span>
                                        )}
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

export default PreRegistrationList;
