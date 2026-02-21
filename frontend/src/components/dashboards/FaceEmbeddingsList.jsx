import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const FaceEmbeddingsList = () => {
  const navigate = useNavigate();
  const [embeddings, setEmbeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuality, setFilterQuality] = useState('all');

  useEffect(() => {
    fetchEmbeddings();
  }, []);

  const fetchEmbeddings = async () => {
    try {
      setLoading(true);
      setEmbeddings([
        { id: 1, personName: 'John Doe', quality: 0.95, count: 45, lastSeen: '2024-12-22 10:30 AM', status: 'primary' },
        { id: 2, personName: 'Jane Smith', quality: 0.87, count: 32, lastSeen: '2024-12-22 09:15 AM', status: 'backup' },
        { id: 3, personName: 'Bob Johnson', quality: 0.72, count: 18, lastSeen: '2024-12-21 03:45 PM', status: 'primary' },
      ]);
    } catch (error) {
      message.error('Failed to load embeddings');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmbeddings = embeddings.filter(emb => {
    if (filterQuality === 'all') return true;
    if (filterQuality === 'high') return emb.quality >= 0.85;
    if (filterQuality === 'medium') return emb.quality >= 0.70 && emb.quality < 0.85;
    if (filterQuality === 'low') return emb.quality < 0.70;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24 pb-12">
      {/* Sticky Header */}
      <div className="sticky top-20 bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xl z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🎯 Face Embeddings</h1>
              <p className="text-pink-100">Manage face recognition database</p>
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
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
              className="px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
            >
              <option value="all">All Quality Levels</option>
              <option value="high">High Quality (≥0.85)</option>
              <option value="medium">Medium Quality (0.70-0.85)</option>
              <option value="low">Low Quality (&lt;0.70)</option>
            </select>
            <button
              onClick={fetchEmbeddings}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Embeddings Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-slate-600 font-semibold">Loading embeddings...</p>
            </div>
          </div>
        ) : filteredEmbeddings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmbeddings.map(emb => (
              <div
                key={emb.id}
                className="bg-teal-50/95 rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-2xl hover:border-pink-300 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">🎯</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    emb.quality >= 0.85 ? 'bg-green-100 text-green-700' :
                    emb.quality >= 0.70 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {(emb.quality * 100).toFixed(0)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{emb.personName}</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Recognition Count</span>
                    <span className="font-semibold text-slate-900">{emb.count}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full"
                      style={{ width: `${emb.quality * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500">Last seen: {emb.lastSeen}</p>
                </div>
                <button
                  onClick={() => message.info('Embedding detail view coming soon')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all group-hover:translate-y-[-2px]"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-teal-50/95 rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <p className="text-slate-600 text-lg">No embeddings found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceEmbeddingsList;
