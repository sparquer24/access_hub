import React from 'react';
import { Modal, Form, Input } from 'antd';

const RoleModal = ({ open, onCancel, editingRole, onSuccess }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (editingRole) {
      form.setFieldsValue({ name: editingRole.name });
    } else {
      form.resetFields();
    }
  }, [editingRole, form]);

  const handleFinish = (values) => {
    // TODO: API call to create/update role
    onSuccess();
    onCancel();
  };

  return (
    <Modal
      open={open}
      title={editingRole ? 'Edit Role' : 'Create Role'}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={editingRole ? 'Update' : 'Create'}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="name" label="Role Name" rules={[{ required: true, message: 'Enter role name' }]}> 
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoleModal;
