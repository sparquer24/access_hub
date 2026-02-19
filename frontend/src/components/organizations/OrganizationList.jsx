import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { organizationsService } from '../../services/organizationsService';
import Loader from '../common/Loader';
import '../../styles/OrganizationList.css';

const OrganizationList = ({ showCreateButton = true, basePath = '/super-admin/organizations' }) => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      // v2 API returns: { success: true, data: { items: [...], pagination: {...} }, message: "Success" }
      const response = await organizationsService.list();
      setOrganizations(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      message.error(error.response?.data?.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = () => {
    navigate(`${basePath}/create`);
  };

  const handleViewOrganization = (orgId) => {
    navigate(`${basePath}/${orgId}`);
  };

  const handleDeleteOrganization = async (orgId, orgName) => {
    // Soft delete by default
    if (!window.confirm(`Are you sure you want to delete "${orgName}"?`)) {
      return;
    }

    try {
      await organizationsService.delete(orgId, false);
      message.success('Successfully deleted');
      fetchOrganizations();
    } catch (error) {
      console.error('Error deleting organization:', error);
      message.error(error.response?.data?.message || 'Failed to delete organization');
    }
  };

  // Filter organizations based on search and status
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && org.is_active) ||
      (filterStatus === 'inactive' && !org.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-gradient-to-br from-slate-50 to-teal-50 rounded-2xl shadow-inner">
        <Loader size="large" text="Loading organizations..." />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-teal-50 to-teal-50 min-h-full">
      {/* Page Header */}
      <div className="bg-teal-50/90 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto lg:px-8 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-600 bg-clip-text text-transparent">
                Organizations
              </h1>
              <p className="text-slate-600 mt-1">Manage all organizations in the system</p>
            </div>
            {showCreateButton && (
              <button
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-400/30 transition-all duration-300"
                onClick={handleCreateOrganization}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Organization
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      {/* <div className="bg-teal-50/95 border-b border-gray-200 sticky top-20 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 py-4 items-center justify-between">
            <p className="text-gray-600 font-medium">Total Organizations: {organizations.length}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 ">
          {/* Search Box */}
          <div className="md:col-span-2 justify-end">
            <input
              type="text"
              placeholder="🔍 Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 bg-teal-50/95 shadow-sm hover:shadow-md transition-all text-lg"
            />
          </div>

          {/* Filter Tabs */}
          <div className="md:col-span-2 flex gap-3 flex-wrap justify-end">
            <button
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${filterStatus === 'all'
                ? 'bg-gradient-to-r from-teal-600 to-teal-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-teal-300'
                }`}
              onClick={() => setFilterStatus('all')}
            >
              All ({organizations.length})
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${filterStatus === 'active'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-green-300'
                }`}
              onClick={() => setFilterStatus('active')}
            >
              Active ({organizations.filter(o => o.is_active).length})
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${filterStatus === 'inactive'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-orange-300'
                }`}
              onClick={() => setFilterStatus('inactive')}
            >
              Inactive ({organizations.filter(o => !o.is_active).length})
            </button>
          </div>
        </div>

        {/* Organizations Grid */}
        {filteredOrganizations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🏢</div>
            <h3 className="text-3xl font-bold text-slate-900 mb-3">No organizations found</h3>
            <p className="text-lg text-slate-600 mb-8">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first organization'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                className="px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 text-lg"
                onClick={handleCreateOrganization}
              >
                ➕ Create Organization
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Cameras</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Locations</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-lg">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-900">{org.name}</div>
                            {org.description && <div className="text-xs text-slate-500 max-w-[200px] truncate">{org.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono font-bold">
                          {org.code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${org.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                          }`}>
                          {org.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-600">
                        {org.cameras_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-600">
                        {org.locations_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewOrganization(org.id)}
                            className="text-teal-600 hover:text-teal-900 font-semibold hover:underline"
                          >
                            View
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => handleDeleteOrganization(org.id, org.name)}
                            className="text-red-600 hover:text-red-900 font-semibold hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationList;
