import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const PresenceEventsList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setEvents([
        { id: 1, visitorName: 'John Doe', date: '2024-12-22', time: '09:30 AM', location: 'Gate A', status: 'entry', reviewStatus: 'pending' },
        { id: 2, visitorName: 'Jane Smith', date: '2024-12-22', time: '10:15 AM', location: 'Main Lobby', status: 'exit', reviewStatus: 'reviewed' },
        { id: 3, visitorName: 'Unknown Person', date: '2024-12-22', time: '11:00 AM', location: 'Parking', status: 'entry', reviewStatus: 'flagged' },
      ]);
    } catch (error) {
      message.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(evt => {
    const matchesFilter = filterStatus === 'all' || evt.reviewStatus === filterStatus;
    return matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24 pb-12">
      {/* Sticky Header */}
      <div className="sticky top-20 bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xl z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">📊 Presence Events</h1>
              <p className="text-orange-100">Track and review all visitor presence events</p>
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            >
              <option value="all">All Events</option>
              <option value="pending">Pending Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="flagged">Flagged</option>
            </select>
            <button
              onClick={fetchEvents}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-slate-600 font-semibold">Loading events...</p>
            </div>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map(evt => (
              <div
                key={evt.id}
                className="bg-teal-50/95 rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-2xl transition-all duration-300 flex flex-col md:flex-row md:items-center md:justify-between gap-4 group"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{evt.visitorName}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <p>📅 {evt.date}</p>
                    <p>⏰ {evt.time}</p>
                    <p>📍 {evt.location}</p>
                    <p>🚪 {evt.status === 'entry' ? 'Entry' : 'Exit'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    evt.reviewStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    evt.reviewStatus === 'reviewed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {evt.reviewStatus === 'pending' ? '⏱ Pending' :
                     evt.reviewStatus === 'reviewed' ? '✓ Reviewed' :
                     '⚠ Flagged'}
                  </span>
                  <button
                    onClick={() => message.info('Event detail view coming soon')}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all group-hover:translate-y-[-2px]"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-teal-50/95 rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <p className="text-slate-600 text-lg">No events found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresenceEventsList;
