import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { camerasService } from '../../services/organizationsService';

const CamerasList = () => {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchCameras();
  }, [currentPage, filterStatus]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchCameras();
      } else {
        setCurrentPage(1);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchCameras = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        per_page: 20,
        status: filterStatus === 'all' ? undefined : filterStatus
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      const response = await camerasService.list(params);
      
      if (response.success) {
        setCameras(response.data.items || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
        setTotalItems(response.data.pagination?.total_items || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch cameras');
      }
    } catch (error) {
      console.error('Error fetching cameras:', error);
      message.error('Failed to load cameras');
      setCameras([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCameras = cameras; // No need to filter here since API handles filtering

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24 pb-12">
      {/* Sticky Header */}
      <div className="sticky top-20 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xl z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">📹 Cameras Management</h1>
              <p className="text-blue-100">Monitor and manage all surveillance cameras ({totalItems} total)</p>
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
                placeholder="Search by camera name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">⚙️ Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="all">All Cameras</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchCameras}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Cameras Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-slate-600 font-semibold">Loading cameras...</p>
            </div>
          </div>
        ) : filteredCameras.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCameras.map(cam => (
              <div
                key={cam.id}
                className="bg-teal-50/95 rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">📹</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    cam.status === 'online' 
                      ? 'bg-green-100 text-green-700' 
                      : cam.status === 'offline'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    ● {cam.status || 'Unknown'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{cam.name}</h3>
                <div className="space-y-2 mb-4 text-sm text-slate-600">
                  <p>📍 {cam.location?.name || 'N/A'}</p>
                  <p>📊 {cam.resolution || 'N/A'}</p>
                  <p>🎥 {cam.camera_type || 'N/A'}</p>
                  <p>📶 {cam.source_type || 'N/A'}</p>
                </div>
                <button
                  onClick={() => message.info('Camera detail view coming soon')}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all group-hover:translate-y-[-2px]"
                >
                  View Stream
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-teal-50/95 rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <p className="text-slate-600 text-lg">No cameras found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              ← Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CamerasList;
