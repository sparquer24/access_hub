import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch } from 'antd';
import {
  locationsService,
  LOCATION_TYPES,
} from '../../../services/organizationsService';
import Loader from '../../common/Loader';
import { useToast } from '../../../contexts/ToastContext';

const { Option } = Select;
const { TextArea } = Input;

const OrganizationLocations = ({ organizationId, organization }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form] = Form.useForm();
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [headerFilter, setHeaderFilter] = useState('all');

  useEffect(() => {
    fetchLocations();
  }, [organizationId]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationsService.list({
        organization_id: organizationId,
        per_page: 100,
      });
      setLocations(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      showError(error.response?.data?.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = () => {
    setEditingLocation(null);
    form.resetFields();
    form.setFieldsValue({
      location_type: LOCATION_TYPES.BOTH,
    });
    setShowModal(true);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    form.setFieldsValue(location);
    setShowModal(true);
  };

  const handleDeleteLocation = async (locationId, locationName) => {
    if (!window.confirm(`Are you sure you want to delete location "${locationName}"?`)) {
      return;
    }

    try {
      await locationsService.delete(locationId, false);
      success('Location deleted successfully');
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      showError(error.response?.data?.message || 'Failed to delete location');
    }
  };

  const handleToggleStatus = async (location) => {
    try {
      await locationsService.update(location.id, {
        is_active: !location.is_active,
      });
      await locationsService.update(location.id, {
        is_active: !location.is_active,
      });
      success(`Location ${location.is_active ? 'disabled' : 'enabled'} successfully`);
      fetchLocations();
    } catch (error) {
      console.error('Error updating location status:', error);
      showError(error.response?.data?.message || 'Failed to update location status');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        organization_id: organizationId,
      };

      if (editingLocation) {
        await locationsService.update(editingLocation.id, payload);
        success('Location updated successfully');
      } else {
        await locationsService.create(payload);
        success('Location created successfully');
      }

      setShowModal(false);
      form.resetFields();
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      showError(error.response?.data?.message || 'Failed to save location');
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch = loc.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && loc.is_active) ||
      (filterStatus === 'inactive' && !loc.is_active);
    const matchesType = filterType === 'all' || loc.location_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleHeaderFilterChange = (value) => {
    setHeaderFilter(value);

    switch (value) {
      case 'active':
        setFilterStatus('active');
        setFilterType('all');
        break;
      case 'inactive':
        setFilterStatus('inactive');
        setFilterType('all');
        break;
      case 'entry':
        setFilterStatus('all');
        setFilterType(LOCATION_TYPES.ENTRY);
        break;
      case 'exit':
        setFilterStatus('all');
        setFilterType(LOCATION_TYPES.EXIT);
        break;
      case 'both':
        setFilterStatus('all');
        setFilterType(LOCATION_TYPES.BOTH);
        break;
      case 'all_types':
      case 'all':
      default:
        setFilterStatus('all');
        setFilterType('all');
        break;
    }
  };

  const getLocationTypeIcon = (type) => {
    const icons = {
      [LOCATION_TYPES.ENTRY]: '🚪',
      [LOCATION_TYPES.EXIT]: '🚶',
      [LOCATION_TYPES.BOTH]: '🔄',
    };
    return icons[type] || '📍';
  };

  const getLocationTypeBadge = (type) => {
    const config = {
      [LOCATION_TYPES.ENTRY]: { bg: 'bg-green-100', text: 'text-green-700', label: 'Entry' },
      [LOCATION_TYPES.EXIT]: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Exit' },
      [LOCATION_TYPES.BOTH]: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Both' },
    };
    const typeConfig = config[type] || config[LOCATION_TYPES.BOTH];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeConfig.bg} ${typeConfig.text}`}>
        {typeConfig.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-teal-100/70 bg-gradient-to-r from-white via-teal-50/60 to-cyan-50/60 shadow-sm overflow-visible relative">
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between relative z-30">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/10 ring-1 ring-teal-200">
                <svg className="w-4.5 h-4.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2z" />
                </svg>
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Location Management
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Manage entry and exit points with real-time location status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 xl:justify-end w-full xl:w-auto">
            <div className="relative w-full sm:w-64 md:w-72">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16 10.5A5.5 5.5 0 115 10.5a5.5 5.5 0 0111 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by location name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-sm border border-slate-300 rounded-lg bg-white hover:border-teal-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 ease-out"
              />
            </div>

            <div className="relative min-w-[180px]">
              <svg className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 10h12M10 16h4" />
              </svg>
              <Select
                value={headerFilter}
                onChange={handleHeaderFilterChange}
                className="camera-filter-ant-select w-[190px]"
                dropdownClassName="camera-filter-ant-dropdown"
                suffixIcon={(
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'all_types', label: 'All Types' },
                  { value: 'entry', label: 'Entry' },
                  { value: 'exit', label: 'Exit' },
                  { value: 'both', label: 'Both' },
                ]}
              />
            </div>

            <button
              onClick={handleCreateLocation}
              className="px-4 py-2.5 text-sm rounded-lg font-semibold transition-all duration-200 ease-out border bg-teal-600 text-white border-teal-600 hover:bg-teal-700 hover:border-teal-700 hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Location
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Locations Table */}
      {filteredLocations.length === 0 ? (
        <div className="text-center py-12 bg-teal-50 rounded-xl">
          <div className="text-6xl mb-4">📍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first location'}
          </p>
          {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
            <button
              onClick={handleCreateLocation}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              ➕ Add Location
            </button>
          )}
        </div>
      ) : (
        <div className="bg-teal-50/95 rounded-xl border border-gray-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-teal-500/10 to-teal-500/10 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Building</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Floor</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Area</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Cameras</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLocations.map((location) => (
                  <tr key={location.id} className="hover:bg-teal-500/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{location.name}</div>
                      {location.description && (
                        <div className="text-sm text-gray-600 truncate max-w-xs">{location.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{getLocationTypeIcon(location.location_type)}</span>
                        {getLocationTypeBadge(location.location_type)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{location.building || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{location.floor || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{location.area || '-'}</td>
                    <td className="px-4 py-3 text-teal-600 font-semibold">{location.camera_count || 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(location)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${location.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                      >
                        {location.is_active ? '✓ Enabled' : '⊘ Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditLocation(location)}
                          aria-label="Edit location"
                          title="Edit"
                          className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location.id, location.name)}
                          aria-label="Delete location"
                          title="Delete"
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" />
                          </svg>
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

      {/* Create/Edit Modal */}
      <Modal
        title={
          <div className="text-xl font-bold text-gray-900">
            {editingLocation ? 'Edit Location' : 'Create New Location'}
          </div>
        }
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Location Name"
              rules={[{ required: true, message: 'Please enter location name' }]}
            >
              <Input placeholder="Main Gate" />
            </Form.Item>

            <Form.Item
              name="location_type"
              label="Location Type"
              rules={[{ required: true, message: 'Please select location type' }]}
            >
              <Select placeholder="Select location type">
                <Option value={LOCATION_TYPES.ENTRY}>🚪 Entry</Option>
                <Option value={LOCATION_TYPES.EXIT}>🚶 Exit</Option>
                <Option value={LOCATION_TYPES.BOTH}>🔄 Both</Option>
              </Select>
            </Form.Item>

            <Form.Item name="building" label="Building">
              <Input placeholder="Building A" />
            </Form.Item>

            <Form.Item name="floor" label="Floor">
              <Input placeholder="Ground Floor" />
            </Form.Item>

            <Form.Item name="area" label="Area/Zone">
              <Input placeholder="Reception" />
            </Form.Item>

            <Form.Item name="description" label="Description" className="md:col-span-2">
              <TextArea rows={3} placeholder="Enter location description" />
            </Form.Item>

            <Form.Item name="latitude" label="Latitude">
              <InputNumber className="w-full" placeholder="12.9716" step={0.000001} />
            </Form.Item>

            <Form.Item name="longitude" label="Longitude">
              <InputNumber className="w-full" placeholder="77.5946" step={0.000001} />
            </Form.Item>

            {editingLocation && (
              <Form.Item name="is_active" label="Location Enabled" valuePropName="checked" className="md:col-span-2">
                <Switch />
              </Form.Item>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                form.resetFields();
              }}
              className="px-6 py-2 bg-teal-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              {editingLocation ? 'Update Location' : 'Create Location'}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default OrganizationLocations;
