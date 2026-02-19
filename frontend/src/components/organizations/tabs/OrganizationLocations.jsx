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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Location Management</h2>
          <p className="text-gray-600 mt-1">Manage entry/exit points and locations for {organization?.name}</p>
        </div>
        <button
          onClick={handleCreateLocation}
          className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
        >
          ➕ Add Location
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="🔍 Search by location name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterStatus === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-teal-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterStatus === 'inactive'
                ? 'bg-orange-600 text-white'
                : 'bg-teal-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-teal-50/95 border-2 border-gray-200 text-gray-700 hover:border-teal-300'
            }`}
        >
          All Types
        </button>
        <button
          onClick={() => setFilterType(LOCATION_TYPES.ENTRY)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === LOCATION_TYPES.ENTRY
              ? 'bg-green-600 text-white'
              : 'bg-teal-50/95 border-2 border-gray-200 text-gray-700 hover:border-green-300'
            }`}
        >
          🚪 Entry
        </button>
        <button
          onClick={() => setFilterType(LOCATION_TYPES.EXIT)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === LOCATION_TYPES.EXIT
              ? 'bg-orange-600 text-white'
              : 'bg-teal-50/95 border-2 border-gray-200 text-gray-700 hover:border-orange-300'
            }`}
        >
          🚶 Exit
        </button>
        <button
          onClick={() => setFilterType(LOCATION_TYPES.BOTH)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === LOCATION_TYPES.BOTH
              ? 'bg-blue-600 text-white'
              : 'bg-teal-50/95 border-2 border-gray-200 text-gray-700 hover:border-blue-300'
            }`}
        >
          🔄 Both
        </button>
      </div>

      {/* Locations Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              className="bg-teal-50/95 rounded-xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-teal-500/10 to-teal-500/10 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{getLocationTypeIcon(location.location_type)}</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {location.building || 'Location'}
                  </span>
                </div>
                {getLocationTypeBadge(location.location_type)}
              </div>

              {/* Card Body */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{location.name}</h3>
                {location.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{location.description}</p>
                )}
                <div className="space-y-2 text-sm mb-4">
                  {location.building && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Building:</span>
                      <span className="font-semibold text-gray-700">{location.building}</span>
                    </div>
                  )}
                  {location.floor && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Floor:</span>
                      <span className="font-semibold text-gray-700">{location.floor}</span>
                    </div>
                  )}
                  {location.area && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Area:</span>
                      <span className="font-semibold text-gray-700">{location.area}</span>
                    </div>
                  )}
                  {location.camera_count !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Cameras:</span>
                      <span className="font-semibold text-teal-600">{location.camera_count || 0}</span>
                    </div>
                  )}
                </div>

                {/* Active Status Badge */}
                <div className="mb-4">
                  <button
                    onClick={() => handleToggleStatus(location)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${location.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                  >
                    {location.is_active ? '✓ Enabled' : '⊘ Disabled'}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditLocation(location)}
                    className="flex-1 px-3 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-all text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(location.id, location.name)}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
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
