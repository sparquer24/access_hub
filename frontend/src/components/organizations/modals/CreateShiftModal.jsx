import React from 'react';
import { Modal, Form, Input, TimePicker, Switch } from 'antd';

const CreateShiftModal = ({
  open,
  onCancel,
  onFinish,
  form,
  editing
}) => (
  <Modal
    title={<div className="text-lg font-bold">{editing ? 'Edit Shift' : 'Create Shift'}</div>}
    open={open}
    onCancel={onCancel}
    footer={null}
  >
    <Form form={form} layout="vertical" onFinish={onFinish}>
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
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-teal-100 rounded">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded">Save</button>
      </div>
    </Form>
  </Modal>
);

export default CreateShiftModal;
