import React from 'react';
import { Modal, Form, Input } from 'antd';

const CreateDepartmentModal = ({
  open,
  onCancel,
  onFinish,
  form,
  editing
}) => (
  <Modal
    title={<div className="text-lg font-bold">{editing ? 'Edit Department' : 'Create Department'}</div>}
    open={open}
    onCancel={onCancel}
    footer={null}
  >
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="name" label="Department Name" rules={[{ required: true, message: 'Please enter department name' }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="code" label="Department Code (optional)">
        <Input placeholder="Auto-generated if not provided" />
      </Form.Item>
      <Form.Item name="description" label="Description (optional)">
        <Input.TextArea placeholder="Enter department description" />
      </Form.Item>
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-teal-100 rounded">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded">Save</button>
      </div>
    </Form>
  </Modal>
);

export default CreateDepartmentModal;
