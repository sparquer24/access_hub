import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, TimePicker, Checkbox, Switch } from 'antd';
import { organizationsService } from '../../../services/organizationsService';
import { useToast } from '../../../contexts/ToastContext';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const OrganizationRules = ({ organizationId, organization, onUpdate }) => {
  const { success, error: showError } = useToast();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (organization) {
      // Populate form with organization's working hours and settings
      const workingHours = organization.working_hours || {};
      form.setFieldsValue({
        timezone: organization.timezone || 'Asia/Kolkata',
        working_hours_start: workingHours.start ? moment(workingHours.start, 'HH:mm') : null,
        working_hours_end: workingHours.end ? moment(workingHours.end, 'HH:mm') : null,
        working_days: workingHours.days || [1, 2, 3, 4, 5],
        // Settings from organization.settings JSON field
        attendance_mode: organization.settings?.attendance_mode || 'both',
        grace_time_minutes: organization.settings?.grace_time_minutes || 15,
        late_mark_threshold_minutes: organization.settings?.late_mark_threshold_minutes || 30,
        half_day_threshold_minutes: organization.settings?.half_day_threshold_minutes || 240,
        auto_checkout_enabled: organization.settings?.auto_checkout_enabled || false,
        auto_checkout_time: organization.settings?.auto_checkout_time
          ? moment(organization.settings.auto_checkout_time, 'HH:mm')
          : null,
        face_recognition_threshold: organization.settings?.face_recognition_threshold || 0.6,
        liveness_check_required: organization.settings?.liveness_check_required || true,
        allow_manual_attendance: organization.settings?.allow_manual_attendance || false,
        notification_enabled: organization.settings?.notification_enabled || true,
      });
    }
  }, [organization, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Prepare working hours object
      const working_hours = {
        start: values.working_hours_start ? values.working_hours_start.format('HH:mm') : '09:00',
        end: values.working_hours_end ? values.working_hours_end.format('HH:mm') : '18:00',
        days: values.working_days || [1, 2, 3, 4, 5],
      };

      // Prepare settings object
      const settings = {
        attendance_mode: values.attendance_mode,
        grace_time_minutes: values.grace_time_minutes,
        late_mark_threshold_minutes: values.late_mark_threshold_minutes,
        half_day_threshold_minutes: values.half_day_threshold_minutes,
        auto_checkout_enabled: values.auto_checkout_enabled,
        auto_checkout_time: values.auto_checkout_time
          ? values.auto_checkout_time.format('HH:mm')
          : null,
        face_recognition_threshold: values.face_recognition_threshold,
        liveness_check_required: values.liveness_check_required,
        allow_manual_attendance: values.allow_manual_attendance,
        notification_enabled: values.notification_enabled,
      };

      // Update organization
      await organizationsService.update(organizationId, {
        timezone: values.timezone,
        working_hours,
        settings,
      });

      success('Organization rules updated successfully!');
      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating organization rules:', error);
      showError(error.response?.data?.message || 'Failed to update organization rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to organization data
    const workingHours = organization.working_hours || {};
    form.setFieldsValue({
      timezone: organization.timezone || 'Asia/Kolkata',
      working_hours_start: workingHours.start ? moment(workingHours.start, 'HH:mm') : null,
      working_hours_end: workingHours.end ? moment(workingHours.end, 'HH:mm') : null,
      working_days: workingHours.days || [1, 2, 3, 4, 5],
      attendance_mode: organization.settings?.attendance_mode || 'both',
      grace_time_minutes: organization.settings?.grace_time_minutes || 15,
      late_mark_threshold_minutes: organization.settings?.late_mark_threshold_minutes || 30,
      half_day_threshold_minutes: organization.settings?.half_day_threshold_minutes || 240,
      auto_checkout_enabled: organization.settings?.auto_checkout_enabled || false,
      auto_checkout_time: organization.settings?.auto_checkout_time
        ? moment(organization.settings.auto_checkout_time, 'HH:mm')
        : null,
      face_recognition_threshold: organization.settings?.face_recognition_threshold || 0.6,
      liveness_check_required: organization.settings?.liveness_check_required || true,
      allow_manual_attendance: organization.settings?.allow_manual_attendance || false,
      notification_enabled: organization.settings?.notification_enabled || true,
    });
    setIsEditing(false);
  };

  const weekDayOptions = [
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 },
    { label: 'Sunday', value: 7 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organization Rules & Settings</h2>
          <p className="text-gray-600 mt-1">
            Configure attendance rules and working hours for {organization?.name}
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            ✏️ Edit Rules
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-teal-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => form.submit()}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Saving...' : '💾 Save Rules'}
            </button>
          </div>
        )}
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={!isEditing}>
        {/* Working Hours Section */}
        <div className="bg-teal-50/95 rounded-xl p-6 shadow-md border border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200 flex items-center gap-2">
            🕐 Working Hours Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              name="timezone"
              label="Timezone"
              rules={[{ required: true, message: 'Please select timezone' }]}
            >
              <Select placeholder="Select timezone">
                <Option value="Asia/Kolkata">Asia/Kolkata (IST)</Option>
                <Option value="America/New_York">America/New_York (EST)</Option>
                <Option value="America/Los_Angeles">America/Los_Angeles (PST)</Option>
                <Option value="Europe/London">Europe/London (GMT)</Option>
                <Option value="Asia/Dubai">Asia/Dubai (GST)</Option>
                <Option value="Asia/Singapore">Asia/Singapore (SGT)</Option>
              </Select>
            </Form.Item>

            <div></div>

            <Form.Item
              name="working_hours_start"
              label="Work Start Time"
              rules={[{ required: true, message: 'Please select start time' }]}
            >
              <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>

            <Form.Item
              name="working_hours_end"
              label="Work End Time"
              rules={[{ required: true, message: 'Please select end time' }]}
            >
              <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>

            <Form.Item
              name="working_days"
              label="Working Days"
              rules={[{ required: true, message: 'Please select working days' }]}
              className="md:col-span-2"
            >
              <Checkbox.Group options={weekDayOptions} />
            </Form.Item>
          </div>
        </div>

        {/* Attendance Rules Section */}
        <div className="bg-teal-50/95 rounded-xl p-6 shadow-md border border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200 flex items-center gap-2">
            📋 Attendance Rules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              name="attendance_mode"
              label="Attendance Mode"
              rules={[{ required: true, message: 'Please select attendance mode' }]}
            >
              <Select placeholder="Select attendance mode">
                <Option value="camera">📹 Camera Only</Option>
                <Option value="biometric">👆 Biometric Only</Option>
                <Option value="both">🔄 Both (Camera + Biometric)</Option>
                <Option value="manual">✍️ Manual Entry</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="late_mark_threshold_minutes"
              label="Late Mark Threshold (minutes)"
              rules={[{ required: true, message: 'Please enter late mark threshold' }]}
            >
              <InputNumber className="w-full" min={0} max={120} placeholder="30" />
            </Form.Item>

            <Form.Item
              name="half_day_threshold_minutes"
              label="Half Day Threshold (minutes)"
              rules={[{ required: true, message: 'Please enter half day threshold' }]}
            >
              <InputNumber className="w-full" min={0} max={480} placeholder="240" />
            </Form.Item>

            <Form.Item
              name="auto_checkout_enabled"
              label="Enable Auto Checkout"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="auto_checkout_time"
              label="Auto Checkout Time"
              dependencies={['auto_checkout_enabled']}
            >
              <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>

            <Form.Item
              name="allow_manual_attendance"
              label="Allow Manual Attendance"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="notification_enabled"
              label="Enable Notifications"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        </div>

        {/* Face Recognition Settings Section */}
        <div className="bg-teal-50/95 rounded-xl p-6 shadow-md border border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-200 flex items-center gap-2">
            😊 Face Recognition Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              name="face_recognition_threshold"
              label="Face Recognition Confidence Threshold"
              rules={[{ required: true, message: 'Please enter threshold' }]}
              help="Value between 0 and 1. Higher value = more strict matching"
            >
              <InputNumber className="w-full" min={0} max={1} step={0.05} placeholder="0.6" />
            </Form.Item>

            <Form.Item
              name="liveness_check_required"
              label="Require Liveness Check"
              valuePropName="checked"
              help="Prevents spoofing with photos"
            >
              <Switch />
            </Form.Item>
          </div>
        </div>

        {/* Info Box */}
        {!isEditing && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <h4 className="font-bold text-blue-900 mb-2">How Rules Work</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Grace Time:</strong> Employees can check-in this many minutes late
                    without penalty
                  </li>
                  <li>
                    <strong>Late Mark Threshold:</strong> Employees arriving after this time are
                    marked late
                  </li>
                  <li>
                    <strong>Half Day Threshold:</strong> If total work time is less than this,
                    mark as half day
                  </li>
                  <li>
                    <strong>Auto Checkout:</strong> Automatically check out employees at specified
                    time if enabled
                  </li>
                  <li>
                    <strong>Face Recognition Threshold:</strong> Higher values require closer
                    matches (more strict)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
};

export default OrganizationRules;
