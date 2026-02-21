import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const AnomaliesList = () => {
  const navigate = useNavigate();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      setAnomalies([
        { id: 1, type: 'Unknown Face', location: 'Gate A', time: '2024-12-22 09:30 AM', severity: 'medium', status: 'pending' },
        { id: 2, type: 'Loitering', location: 'Parking', time: '2024-12-22 10:45 AM', severity: 'low', status: 'resolved' },
        { id: 3, type: 'Crowd Detection', location: 'Main Lobby', time: '2024-12-22 11:15 AM', severity: 'high', status: 'pending' },
        { id: 4, type: 'Unauthorized Access', location: 'Restricted Area', time: '2024-12-21 03:30 PM', severity: 'high', status: 'flagged' },
      ]);
    } catch (error) {
      message.error('Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnomalies = anomalies.filter(anom => {
    const matchesFilter = filterSeverity === 'all' || anom.severity === filterSeverity;
    return matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24 pb-12">
      {/* Sticky Header */}
      <div className="sticky top-20 bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-xl z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🚨 Anomalies Detection</h1>
              <p className="text-red-100">Monitor and respond to system anomalies</p>
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
        {/* Filter */}
        <div className="bg-teal-50/95 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
          <div className="flex gap-4 flex-wrap">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
            >
              <option value="all">All Severities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <button
              onClick={fetchAnomalies}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Anomalies List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-slate-600 font-semibold">Loading anomalies...</p>
            </div>
          </div>
        ) : filteredAnomalies.length > 0 ? (
          <div className="space-y-4">
            {filteredAnomalies.map(anom => (
              <div
                key={anom.id}
                className={`rounded-2xl shadow-lg p-6 border transition-all duration-300 flex flex-col md:flex-row md:items-center md:justify-between gap-4 group ${
                  anom.severity === 'high' ? 'bg-red-50 border-red-200' :
                  anom.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {anom.severity === 'high' ? '🔴' : anom.severity === 'medium' ? '🟡' : '🔵'} {anom.type}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <p>📍 {anom.location}</p>
                    <p>⏰ {anom.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    anom.severity === 'high' ? 'bg-red-100 text-red-700' :
                    anom.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {anom.severity === 'high' ? '🔴 High' :
                     anom.severity === 'medium' ? '🟡 Medium' :
                     '🔵 Low'}
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    anom.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    anom.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {anom.status === 'pending' ? '⏱ Pending' :
                     anom.status === 'resolved' ? '✓ Resolved' :
                     '⚠ Flagged'}
                  </span>
                  <button
                    onClick={() => message.info('Anomaly detail view coming soon')}
                    className={`px-4 py-2 text-white rounded-lg font-semibold hover:shadow-lg transition-all group-hover:translate-y-[-2px] ${
                      anom.severity === 'high' ? 'bg-gradient-to-r from-red-600 to-orange-600' :
                      anom.severity === 'medium' ? 'bg-gradient-to-r from-yellow-600 to-orange-600' :
                      'bg-gradient-to-r from-blue-600 to-cyan-600'
                    }`}
                  >
                    Investigate
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-teal-50/95 rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <p className="text-slate-600 text-lg">No anomalies detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomaliesList;
