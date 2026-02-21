import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import Loader from '../../common/Loader';
import { visitorService } from '../../../services/visitorService';

const SecurityGateEntry = ({ organizationId, organization }) => {
  const { success, error: showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entryMode, setEntryMode] = useState('search'); // 'search' or 'manual'

  const fetchVisitors = async () => {
    if (!searchQuery.trim()) {
      setVisitors([]);
      return;
    }

    try {
      setLoading(true);
      const response = await visitorService.searchVisitors(organizationId, {
        query: searchQuery,
        status: 'checked_in'
      });

      if (response.success) {
        setVisitors(response.data || []);
      }
    } catch (error) {
      console.error('Error searching visitors:', error);
      showError('Failed to search visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchVisitors();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handlePhysicalEntry = async (visitor, action) => {
    try {
      const response = await visitorService.recordPhysicalMovement(organizationId, visitor.id, {
        action: action, // 'building_entry' or 'building_exit'
        location: 'main_gate',
        recorded_by: 'security_gate',
        notes: `${action === 'building_entry' ? 'Entered' : 'Exited'} building with visitor pass`
      });

      success(`Visitor ${action === 'building_entry' ? 'entry' : 'exit'} recorded successfully`);
      setSelectedVisitor(null);
      setSearchQuery('');
      fetchVisitors();
    } catch (error) {
      console.error(`Error recording ${action}:`, error);
      showError(`Failed to record visitor ${action}`);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-teal-50/95 rounded-xl shadow-md p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🚪 Security Gate Entry/Exit
        </h3>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 bg-teal-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setEntryMode('search')}
            className={`px-6 py-2.5 font-semibold rounded-md transition-all duration-300 ${entryMode === 'search'
                ? 'bg-white text-teal-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            🔍 Search Visitor
          </button>
          <button
            onClick={() => setEntryMode('manual')}
            className={`px-6 py-2.5 font-semibold rounded-md transition-all duration-300 ${entryMode === 'manual'
                ? 'bg-white text-teal-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            ✍️ Manual Entry
          </button>
        </div>

        {/* Search Mode */}
        {entryMode === 'search' && (
          <div className="space-y-6">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Visitor (Name, Mobile, or Visitor ID)
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
              />
            </div>

            {/* Search Results */}
            {loading && (
              <div className="flex justify-center py-8">
                <Loader size="large" />
              </div>
            )}

            {visitors.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Found Visitors:</h4>
                {visitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-teal-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {visitor.visitor_image && (
                          <img
                            src={visitor.visitor_image}
                            alt="Visitor"
                            className="w-12 h-12 rounded-lg object-cover border border-gray-300"
                          />
                        )}
                        <div>
                          <h5 className="font-semibold text-gray-900">{visitor.name}</h5>
                          <p className="text-sm text-gray-600">{visitor.mobile_number}</p>
                          <p className="text-xs text-gray-500">
                            Purpose: {visitor.purpose_of_visit} | Floor: {visitor.allowed_floor}
                          </p>
                          <p className="text-xs text-gray-500">
                            Checked in: {formatDateTime(visitor.check_in_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePhysicalEntry(visitor, 'building_entry')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 text-sm flex items-center gap-2"
                        >
                          🏢 Enter Building
                        </button>
                        <button
                          onClick={() => handlePhysicalEntry(visitor, 'building_exit')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300 text-sm flex items-center gap-2"
                        >
                          🚪 Exit Building
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.trim() && !loading && visitors.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No visitors found matching your search.</p>
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Mode */}
        {entryMode === 'manual' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-semibold">⚠️ Manual Entry Mode</p>
              <p className="text-sm text-yellow-700">
                Use this mode for visitors who have paper slips but are not found in the digital system.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Visitor Name (from slip)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="Mobile Number (from slip)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select Action</option>
                <option value="building_entry">Building Entry</option>
                <option value="building_exit">Building Exit</option>
              </select>
              <textarea
                placeholder="Additional notes (optional)"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-all duration-300">
                Record Manual Entry
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Instructions for Security Guards:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Check visitor's paper slip before allowing entry</li>
            <li>• Verify photo matches the person</li>
            <li>• Ensure visitor is accessing only allowed floors</li>
            <li>• Record both entry and exit for accurate tracking</li>
            <li>• Collect visitor slip on exit</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SecurityGateEntry;
