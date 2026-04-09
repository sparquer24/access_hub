import React from 'react';
import { Modal, Form, Input, Select } from 'antd';

const RoleMemberModal = ({ open, onCancel, editingMember, onSuccess }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (editingMember) {
      form.setFieldsValue(editingMember);
    } else {
      form.resetFields();
    }
  }, [editingMember, form]);

  const handleFinish = (values) => {
    // TODO: API call to add/update member
    onSuccess();
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={editingMember ? 'Update Member' : 'Add Member'}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={editingMember ? 'Update' : 'Add'}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="name" label="Member Name" rules={[{ required: true, message: 'Enter member name' }]}> 
          <Input />
        </Form.Item>
        <Form.Item name="position" label="Position" rules={[{ required: true, message: 'Enter position' }]}> 
          <Input />
        </Form.Item>
        {/* You can add a Select for user assignment if you have a user list */}
      </Form>
    </Modal>
  );
};

export default RoleMemberModal;
