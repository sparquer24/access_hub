import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const VisitorsList = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setVisitors([
        { id: 1, name: 'Raj Kumar', email: 'raj@example.com', phone: '+91-9876543210', company: 'Tech Corp', status: 'active', registeredDate: '2024-12-20' },
        { id: 2, name: 'Priya Singh', email: 'priya@example.com', phone: '+91-9123456789', company: 'Design Studio', status: 'active', registeredDate: '2024-12-21' },
        { id: 3, name: 'Amit Patel', email: 'amit@example.com', phone: '+91-9999999999', company: 'Consulting Inc', status: 'inactive', registeredDate: '2024-11-15' },
      ]);
    } catch (error) {
      message.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visitor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || visitor.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24 pb-12">
      {/* Sticky Header */}
      <div className="sticky top-20 bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-xl z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">👤 Visitors Management</h1>
              <p className="text-teal-100">Manage and track all registered visitors</p>
            </div>
            <button
              onClick={() => navigate('/super-admin/dashboard')}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-lg font-semibold transition-all duration-300"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="bg-teal-50/95 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">🔍 Search</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">⚙️ Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              >
                <option value="all">All Visitors</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchVisitors}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Visitors Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-slate-600 font-semibold">Loading visitors...</p>
            </div>
          </div>
        ) : filteredVisitors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVisitors.map(visitor => (
              <div
                key={visitor.id}
                className="bg-teal-50/95 rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-2xl hover:border-teal-300 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">👤</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    visitor.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {visitor.status === 'active' ? '✓ Active' : '⊘ Inactive'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{visitor.name}</h3>
                <div className="space-y-2 mb-4 text-sm text-slate-600">
                  <p>📧 {visitor.email}</p>
                  <p>📱 {visitor.phone}</p>
                  <p>🏢 {visitor.company}</p>
                  <p>📅 Registered: {visitor.registeredDate}</p>
                </div>
                <button
                  onClick={() => message.info('Visitor detail view coming soon')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all group-hover:translate-y-[-2px]"
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-teal-50/95 rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <p className="text-slate-600 text-lg">No visitors found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorsList;
