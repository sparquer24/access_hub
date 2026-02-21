import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, TimePicker, Switch } from 'antd';
import moment from 'moment';
import { shiftsService } from '../../../services/organizationsService';
import Loader from '../../common/Loader';
import { useToast } from '../../../contexts/ToastContext';

const OrganizationShifts = ({ organizationId, organization }) => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchShifts();
  }, [organizationId]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const resp = await shiftsService.list({ organization_id: organizationId, per_page: 200 });
      setShifts(resp.data?.items || resp.data || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      showError(err.response?.data?.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    form.setFieldsValue({
      name: s.name,
      start_time: s.start_time ? moment(s.start_time, 'HH:mm') : null,
      end_time: s.end_time ? moment(s.end_time, 'HH:mm') : null,
      grace_period_minutes: s.grace_period_minutes || 15,
      is_active: s.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete shift "${s.name}"?`)) return;
    try {
      await shiftsService.delete(s.id, false);
      success('Shift deleted successfully!');
      fetchShifts();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || 'Failed to delete shift');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        const payload = {
          name: values.name,
          start_time: values.start_time ? values.start_time.format('HH:mm') : null,
          end_time: values.end_time ? values.end_time.format('HH:mm') : null,
          grace_period_minutes: values.grace_period_minutes,
          is_active: values.is_active,
        };
        await shiftsService.update(editing.id, payload);
        success('Shift updated successfully!');
      } else {
        const payload = {
          organization_id: organizationId,
          name: values.name,
          start_time: values.start_time ? values.start_time.format('HH:mm') : null,
          end_time: values.end_time ? values.end_time.format('HH:mm') : null,
          grace_period_minutes: values.grace_period_minutes,
        };
        await shiftsService.create(payload);
        success('Shift created successfully!');
      }
      setShowModal(false);
      form.resetFields();
      fetchShifts();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || 'Failed to save shift');
    }
  };

  const toggleStatus = async (s) => {
    try {
      await shiftsService.update(s.id, { is_active: !s.is_active });
      success(s.is_active ? 'Shift disabled successfully' : 'Shift enabled successfully');
      fetchShifts();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Shifts</h2>
          <p className="text-gray-600 mt-1">Manage shifts for {organization?.name}</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-teal-600 text-white rounded-lg">➕ Create Shift</button>
      </div>

      {shifts.length === 0 ? (
        <div className="text-center py-12 bg-teal-50 rounded-xl">
          <div className="text-6xl mb-4">⏱️</div>
          <h3 className="text-xl font-bold">No shifts</h3>
          <p className="text-gray-600">Create a shift to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-teal-50/95 rounded-xl shadow-md">
          <table className="w-full">
            <thead className="bg-teal-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Start</th>
                <th className="px-6 py-3 text-left">End</th>
                <th className="px-6 py-3 text-left">Grace (min)</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shifts.map((s) => (
                <tr key={s.id} className="hover:bg-teal-50">
                  <td className="px-6 py-4">{s.name}</td>
                  <td className="px-6 py-4">{s.start_time || '-'}</td>
                  <td className="px-6 py-4">{s.end_time || '-'}</td>
                  <td className="px-6 py-4">{s.grace_time ?? 0}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleStatus(s)} className={`px-3 py-1 rounded-full text-sm ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="px-3 py-1 bg-teal-50 text-teal-600 rounded">Edit</button>
                      <button onClick={() => handleDelete(s)} className="px-3 py-1 bg-red-50 text-red-600 rounded">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={<div className="text-lg font-bold">{editing ? 'Edit Shift' : 'Create Shift'}</div>}
        open={showModal}
        onCancel={() => { setShowModal(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Shift Name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="start_time" label="Start Time">
              <TimePicker format="HH:mm" className="w-full" />
            </Form.Item>
            <Form.Item name="end_time" label="End Time">
              <TimePicker format="HH:mm" className="w-full" />
            </Form.Item>
          </div>

          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => { setShowModal(false); form.resetFields(); }} className="px-4 py-2 bg-teal-100 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded">Save</button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default OrganizationShifts;
