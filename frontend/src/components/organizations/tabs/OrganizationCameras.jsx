import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch } from 'antd';
import {
  camerasService,
  locationsService,
  CAMERA_TYPES,
  CAMERA_SOURCE_TYPES,
  CAMERA_STATUS,
} from '../../../services/organizationsService';
import Loader from '../../common/Loader';
import { useToast } from '../../../contexts/ToastContext';

const { Option } = Select;
const { TextArea } = Input;

const OrganizationCameras = ({ organizationId, organization }) => {
  const { success, error: showError } = useToast();
  const [cameras, setCameras] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [hasCreatePermission, setHasCreatePermission] = useState(true);
  const [selectedManagementType, setSelectedManagementType] = useState('ATTENDANCE');


  useEffect(() => {
    fetchCameras();
    fetchLocations();
  }, [organizationId]);

  const fetchLocations = async () => {
    try {
      const response = await locationsService.list({
        organization_id: organizationId,
        per_page: 100,
        is_active: true,
      });
      setLocations(response.data?.items || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const { data } = await camerasService.list({
        organization_id: organizationId,
        per_page: 100,
      });
      setCameras(data?.items || []);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      showError(error.response?.data?.message || 'Failed to load cameras');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCamera = () => {
    setEditingCamera(null);
    form.resetFields();
    setSelectedManagementType('ATTENDANCE');
    form.setFieldsValue({
      fps: 10,
      resolution: '640x480',
      confidence_threshold: 0.6,
      liveness_check_enabled: true,
      // Attendance management defaults
      management_type: 'ATTENDANCE',
      attendance_enabled: false,
      visitor_tracking_enabled: false,
      people_logs_enabled: true,
      auto_check_out_hours: 12,
      require_manual_approval: false,
      notification_enabled: true,
    });
    setShowModal(true);
  };

  const handleEditCamera = (camera) => {
    setEditingCamera(camera);
    form.setFieldsValue(camera);
    setSelectedManagementType(camera.management_type || 'ATTENDANCE');
    setShowModal(true);
  };

  const handleDeleteCamera = async (cameraId, cameraName) => {
    if (!window.confirm(`Are you sure you want to delete camera "${cameraName}"?`)) {
      return;
    }

    try {
      await camerasService.delete(cameraId, false);
      success('Camera deleted successfully!');
      fetchCameras();
    } catch (error) {
      console.error('Error deleting camera:', error);
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message;

      if (statusCode === 403) {
        showError('Insufficient Permissions: You cannot delete cameras. Contact your administrator.');
      } else {
        showError(errorMessage || 'Failed to delete camera');
      }
    }
  };

  const handleToggleStatus = async (camera) => {
    try {
      await camerasService.update(camera.id, {
        is_active: !camera.is_active,
      });
      success(camera.is_active ? 'Camera disabled successfully' : 'Camera enabled successfully');
      fetchCameras();
    } catch (error) {
      console.error('Error updating camera status:', error);
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message;

      if (statusCode === 403) {
        showError('Insufficient Permissions: You cannot update camera status. Contact your administrator.');
      } else {
        showError(errorMessage || 'Failed to update camera status');
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCamera) {
        const payload = {
          name: values.name,
          camera_type: values.camera_type,
          source_type: values.source_type,
          location_id: values.location_id,
          source_url: values.source_url,
          resolution: values.resolution,
          fps: values.fps,
          confidence_threshold: values.confidence_threshold,
          liveness_check_enabled: values.liveness_check_enabled,
          is_active: values.is_active,
          // Attendance Management Fields
          attendance_enabled: values.attendance_enabled,
          visitor_tracking_enabled: values.visitor_tracking_enabled,
          people_logs_enabled: values.people_logs_enabled,
          management_type: values.management_type,
          auto_check_out_hours: values.auto_check_out_hours,
          require_manual_approval: values.require_manual_approval,
          notification_enabled: values.notification_enabled,
        };
        await camerasService.update(editingCamera.id, payload);
        success('Camera updated successfully!');
      } else {
        const payload = {
          organization_id: organizationId,
          name: values.name,
          camera_type: values.camera_type,
          source_type: values.source_type,
          location_id: values.location_id,
          source_url: values.source_url,
          resolution: values.resolution,
          fps: values.fps,
          confidence_threshold: values.confidence_threshold,
          liveness_check_enabled: values.liveness_check_enabled,
          // Attendance Management Fields
          attendance_enabled: values.attendance_enabled,
          visitor_tracking_enabled: values.visitor_tracking_enabled,
          people_logs_enabled: values.people_logs_enabled,
          management_type: values.management_type,
          auto_check_out_hours: values.auto_check_out_hours,
          require_manual_approval: values.require_manual_approval,
          notification_enabled: values.notification_enabled,
        };
        await camerasService.create(payload);
        success('Camera created successfully!');
        setHasCreatePermission(true);
      }

      setShowModal(false);
      form.resetFields();
      fetchCameras();
    } catch (error) {
      console.error('Error saving camera:', error);
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message;

      // Handle permission errors
      if (statusCode === 403) {
        if (!editingCamera) {
          setHasCreatePermission(false);
        }
        showError(`Insufficient Permissions: You cannot ${editingCamera ? 'update' : 'create'} cameras. Contact your administrator.`);
      } else {
        showError(errorMessage || `Failed to ${editingCamera ? 'update' : 'create'} camera`);
      }
    }
  };

  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch = cam.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && cam.is_active) ||
      (filterStatus === 'inactive' && !cam.is_active);
    const matchesType = filterType === 'all' || cam.camera_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      [CAMERA_STATUS.ONLINE]: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: '🟢 Online',
      },
      [CAMERA_STATUS.OFFLINE]: {
        bg: 'bg-teal-100',
        text: 'text-gray-700',
        label: '⚫ Offline',
      },
      [CAMERA_STATUS.ERROR]: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴 Error' },
    };
    const config = statusConfig[status] || statusConfig[CAMERA_STATUS.OFFLINE];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getCameraTypeIcon = (type) => {
    const iconProps = {
      className: "w-6 h-6 text-gray-600",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    };

    switch (type) {
      case CAMERA_TYPES.CHECK_IN:
        return (
          <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case CAMERA_TYPES.CHECK_OUT:
        return (
          <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        );
      case CAMERA_TYPES.CCTV:
      default:
        return (
          <svg {...iconProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
    }
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
      <div className="flex justify-between items-center flex-wrap gap-4 bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-200">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Camera Management
          </h2>
          <p className="text-gray-600 mt-1 text-sm">Manage cameras and devices for <span className="font-semibold">{organization?.name}</span></p>
        </div>
        <div className="group relative">
          <button
            onClick={handleCreateCamera}
            disabled={!hasCreatePermission}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${hasCreatePermission
              ? 'bg-gradient-to-r from-teal-600 to-teal-600 text-white hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
              }`}
          >
            ➕ Add Camera
          </button>
          {!hasCreatePermission && (
            <div className="absolute bottom-full right-0 mb-2 w-max bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              🔒 You don't have permission to create cameras
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Search by camera name..."
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
          onClick={() => setFilterType(CAMERA_TYPES.CHECK_IN)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === CAMERA_TYPES.CHECK_IN
            ? 'bg-blue-600 text-white'
            : 'bg-teal-50/95 border-2 border-gray-200 text-gray-700 hover:border-blue-300'
            }`}
        >
          ← Check-In
        </button>
        <button
          onClick={() => setFilterType(CAMERA_TYPES.CHECK_OUT)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === CAMERA_TYPES.CHECK_OUT
            ? 'bg-green-600 text-white'
            : 'bg-teal-50/95 border-2 border-gray-200 text-gray-700 hover:border-green-300'
            }`}
        >
          → Check-Out
        </button>
        <button
          onClick={() => setFilterType(CAMERA_TYPES.CCTV)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${filterType === CAMERA_TYPES.CCTV
            ? 'bg-teal-600 text-white'
            : 'bg-teal-50/95 border-2 border-gray-200 text-gray-700 hover:border-purple-300'
            }`}
        >
          ⦿ CCTV
        </button>
      </div>

      {/* Cameras Grid */}
      {filteredCameras.length === 0 ? (
        <div className="text-center py-12 bg-teal-50 rounded-xl">
          <div className="mb-4 flex justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No cameras found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first camera'}
          </p>
          {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
            <button
              onClick={handleCreateCamera}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Camera
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCameras.map((camera) => (
            <div
              key={camera.id}
              className="bg-teal-50/95 rounded-xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-teal-500/10 to-teal-500/10 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-teal-600">{getCameraTypeIcon(camera.camera_type)}</div>
                  <div>
                    <span className="font-bold text-gray-900 text-sm">
                      {camera.camera_type?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {getStatusBadge(camera.status)}
              </div>

              {/* Card Body */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{camera.name}</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Source:</span>
                    <span className="font-semibold text-gray-700">
                      {camera.source_type?.replace('_', ' ')}
                    </span>
                  </div>
                  {camera.source_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">URL:</span>
                      <span className="font-mono text-xs text-gray-700 truncate">
                        {camera.source_url}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Resolution:</span>
                    <span className="font-semibold text-gray-700">{camera.resolution || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">FPS:</span>
                    <span className="font-semibold text-gray-700">{camera.fps || 'N/A'}</span>
                  </div>
                </div>

                {/* Active Status Badge */}
                <div className="mb-4">
                  <button
                    onClick={() => handleToggleStatus(camera)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${camera.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                  >
                    {camera.is_active ? '● Enabled' : '○ Disabled'}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCamera(camera)}
                    className="flex-1 px-3 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-all text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCamera(camera.id, camera.name)}
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
            {editingCamera ? 'Edit Camera' : 'Create New Camera'}
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
              label="Camera Name"
              rules={[{ required: true, message: 'Please enter camera name' }]}
            >
              <Input placeholder="Main Gate Camera 1" />
            </Form.Item>

            <Form.Item
              name="camera_type"
              label="Camera Type"
              rules={[{ required: true, message: 'Please select camera type' }]}
            >
              <Select placeholder="Select camera type">
                <Option value={CAMERA_TYPES.CHECK_IN}>← Check-In</Option>
                <Option value={CAMERA_TYPES.CHECK_OUT}>→ Check-Out</Option>
                <Option value={CAMERA_TYPES.CCTV}>⦿ CCTV</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="source_type"
              label="Source Type"
              rules={[{ required: true, message: 'Please select source type' }]}
            >
              <Select placeholder="Select source type">
                <Option value={CAMERA_SOURCE_TYPES.IP_CAMERA}>IP Camera</Option>
                <Option value={CAMERA_SOURCE_TYPES.USB_CAMERA}>USB Camera</Option>
                <Option value={CAMERA_SOURCE_TYPES.RTSP_STREAM}>RTSP Stream</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="location_id"
              label="Location"
              rules={[{ required: true, message: 'Please select a location' }]}
            >
              <Select placeholder="Select location">
                {locations.map((loc) => (
                  <Option key={loc.id} value={loc.id}>
                    {loc.name} {loc.location_type ? `(${loc.location_type})` : ''}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="source_url" label="Source URL" className="md:col-span-2">
              <Input placeholder="rtsp://192.168.1.100:554/stream" />
            </Form.Item>

            <Form.Item name="resolution" label="Resolution">
              <Input placeholder="640x480" />
            </Form.Item>

            <Form.Item name="fps" label="FPS (Frames Per Second)">
              <InputNumber className="w-full" min={1} max={60} placeholder="10" />
            </Form.Item>

            <Form.Item name="confidence_threshold" label="Confidence Threshold">
              <InputNumber className="w-full" min={0} max={1} step={0.1} placeholder="0.6" />
            </Form.Item>

            <Form.Item name="liveness_check_enabled" label="Liveness Check" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          {/* Attendance Management Section */}
          <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-teal-50 rounded-lg border border-teal-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Attendance Management Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="management_type"
                label="Management Type"
                rules={[{ required: true, message: 'Please select management type' }]}
              >
                <Select
                  placeholder="Select management type"
                  defaultValue="ATTENDANCE"
                  onChange={(value) => {
                    setSelectedManagementType(value);
                    // Reset the related switches when management type changes
                    form.setFieldsValue({
                      attendance_enabled: false,
                      visitor_tracking_enabled: false
                    });
                  }}
                >
                  <Option value="ATTENDANCE">⚡ Attendance Only</Option>
                  <Option value="VISITORS">👤 Visitors Only</Option>
                  <Option value="PEOPLE_LOGS">📈 People Logs Only</Option>
                </Select>
              </Form.Item>

              <Form.Item name="auto_check_out_hours" label="Auto Check-out Hours">
                <InputNumber
                  className="w-full"
                  min={1}
                  max={24}
                  placeholder="12"
                  addonAfter="hours"
                />
              </Form.Item>

              {selectedManagementType === 'ATTENDANCE' && (
                <Form.Item name="attendance_enabled" label="Enable Attendance Tracking" valuePropName="checked">
                  <Switch />
                </Form.Item>
              )}

              {selectedManagementType === 'VISITORS' && (
                <Form.Item name="visitor_tracking_enabled" label="Enable Visitor Tracking" valuePropName="checked">
                  <Switch />
                </Form.Item>
              )}

              <Form.Item name="people_logs_enabled" label="Enable People Logs" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>

              <Form.Item name="require_manual_approval" label="Require Manual Approval" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item name="notification_enabled" label="Enable Notifications" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>

              {editingCamera && (
                <Form.Item name="is_active" label="Camera Enabled" valuePropName="checked">
                  <Switch />
                </Form.Item>
              )}
            </div>
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
              {editingCamera ? 'Update Camera' : 'Create Camera'}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default OrganizationCameras;
