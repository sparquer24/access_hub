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
  const [headerFilter, setHeaderFilter] = useState('all');
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
      case 'check_in':
        setFilterStatus('all');
        setFilterType(CAMERA_TYPES.CHECK_IN);
        break;
      case 'check_out':
        setFilterStatus('all');
        setFilterType(CAMERA_TYPES.CHECK_OUT);
        break;
      case 'cctv':
        setFilterStatus('all');
        setFilterType(CAMERA_TYPES.CCTV);
        break;
      case 'atypes':
      case 'all':
      default:
        setFilterStatus('all');
        setFilterType('all');
        break;
    }
  };

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
      <div className="rounded-xl border border-teal-100/70 bg-gradient-to-r from-white via-teal-50/60 to-cyan-50/60 shadow-sm overflow-visible relative">
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between relative z-30">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/10 ring-1 ring-teal-200">
                <svg className="w-4.5 h-4.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Camera Management
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Manage cameras and monitor live status efficiently.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 xl:justify-end w-full xl:w-auto">
            <div className="relative w-full sm:w-64 md:w-72">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16 10.5A5.5 5.5 0 115 10.5a5.5 5.5 0 0111 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by camera name..."
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
                  { value: 'check_in', label: 'Check-in' },
                  { value: 'check_out', label: 'Checkout' },
                  { value: 'cctv', label: 'CCTV' },
                ]}
              />
            </div>

            <div className="group relative shrink-0">
              <button
                onClick={handleCreateCamera}
                disabled={!hasCreatePermission}
                className={`px-4 py-2.5 text-sm rounded-lg font-semibold transition-all duration-200 ease-out border ${hasCreatePermission
                  ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 hover:border-teal-700 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  }`}
              >
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Camera
                </span>
              </button>
              {!hasCreatePermission && (
                <div className="absolute bottom-full right-0 mb-2 w-max bg-gray-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  🔒 You don't have permission to create cameras
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cameras Table */}
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg border border-teal-600 hover:bg-teal-700 hover:border-teal-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ease-out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Camera
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Resolution</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">FPS</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Enabled</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCameras.map((camera) => (
                  <tr key={camera.id} className="hover:bg-teal-500/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{camera.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="text-teal-600">{getCameraTypeIcon(camera.camera_type)}</div>
                        <span className="text-sm font-medium text-gray-700">{camera.camera_type?.replace('_', ' ') || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(camera.status)}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{camera.source_type?.replace('_', ' ') || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 max-w-xs truncate">{camera.source_url || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{camera.resolution || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{camera.fps || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(camera)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${camera.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                      >
                        {camera.is_active ? '● Enabled' : '○ Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCamera(camera)}
                          aria-label="Edit camera"
                          title="Edit"
                          className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCamera(camera.id, camera.name)}
                          aria-label="Delete camera"
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
