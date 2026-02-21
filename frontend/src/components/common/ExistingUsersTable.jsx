// components/common/ExistingUsersTable.jsx
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import "../../styles/ExistingUsersTable.css";
import { csrfAPI, usersAPI } from "../../services/api";  // ✅ import API helpers

const ExistingUsersTable = () => {
  const [users, setUsers] = useState([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const navigate = useNavigate();

  // ✅ Fetch users from Flask on load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        await csrfAPI.fetchToken();
        const resp = await usersAPI.list();
        setUsers(resp.data);
      } catch (err) {
        console.error("Error fetching users:", err);
        message.error("Failed to load users");
      }
    };
    fetchUsers();
  }, []);

  // ✅ Handle Edit button click (user name)
  const handleEditUser = (record) => {
    setSelectedUser(record);
    form.setFieldsValue({
      full_name: record.full_name,
      gender: record.gender,
      phone_number: record.phone_number,
      email: record.email,
      employee_id: record.employee_id,
      building_name: record.building_name,
      tower: record.tower,
    });
    setIsEditModalVisible(true);
  };

  // ✅ Handle Password Reset click
  const handleChangePassword = (record) => {
    setSelectedUser(record);
    setIsPasswordModalVisible(true);
  };

  // ✅ Submit updated details
  const handleEditSubmit = async (values) => {
    try {
      await csrfAPI.fetchToken();
      await usersAPI.update(selectedUser.id, values);
      message.success("User details updated successfully!");
      setIsEditModalVisible(false);
      // Refresh table
      const resp = await usersAPI.list();
      setUsers(resp.data);
    } catch (err) {
      console.error("Error updating user:", err);
      message.error("Failed to update user");
    }
  };

  // ✅ Submit new password
  const handlePasswordSubmit = async (values) => {
    if (values.new_password !== values.confirm_password) {
      message.error("Passwords do not match");
      return;
    }
    try {
      await csrfAPI.fetchToken();
      await usersAPI.changePassword(selectedUser.id, {
        password: values.new_password,
      });
      message.success("Password updated successfully!");
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (err) {
      console.error("Error updating password:", err);
      message.error("Failed to reset password");
    }
  };

  const handleBackToDashboard = () => {
    navigate("/admin_dashboard");
  };

  const columns = [
    { title: "S.No", render: (_, __, index) => index + 1, width: "8%", align: "center" },
    {
      title: "Name",
      dataIndex: "full_name",
      key: "full_name",
      width: "18%",
      render: (text, record) => (
        <Button type="link" onClick={() => handleEditUser(record)}>
          {text}
        </Button>
      ),
    },
    { title: "EMP ID", dataIndex: "employee_id", key: "employee_id", width: "15%" },
    { title: "Username", dataIndex: "login_id", key: "login_id", width: "20%" },
    { title: "Tower", dataIndex: "tower", key: "tower", width: "15%" },
    {
      title: "Action",
      key: "action",
      width: "24%",
      align: "center",
      render: (_, record) => (
        <Button className="change-password-btn" onClick={() => handleChangePassword(record)}>
          Change Password
        </Button>
      ),
    },
  ];

  return (
    <div className="user-dashboard">
      <div className="dashboard-container">
        <div className="back-button-wrapper">
          <button className="back-button-dashboard" onClick={handleBackToDashboard}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Table */}
        <div className="existing-users-table-container">
          <Table
            dataSource={users}
            columns={columns}
            pagination={false}
            rowKey="id"
            className="existing-users-table"
          />
        </div>

        {/* ✏️ Edit Modal */}
        <Modal
          title="Edit User Details"
          open={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          onOk={() => form.submit()}
          okText="Save Changes"
        >
          <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
            <Form.Item label="Full Name" name="full_name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Gender" name="gender">
              <Input />
            </Form.Item>
            <Form.Item label="Phone Number" name="phone_number">
              <Input />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input />
            </Form.Item>
            <Form.Item label="Employee ID" name="employee_id">
              <Input />
            </Form.Item>
            <Form.Item label="Building Name" name="building_name">
              <Input />
            </Form.Item>
            <Form.Item label="Tower" name="tower">
              <Input />
            </Form.Item>
          </Form>
        </Modal>

        {/* 🔒 Password Modal */}
        <Modal
          title="Reset Password"
          open={isPasswordModalVisible}
          onCancel={() => setIsPasswordModalVisible(false)}
          onOk={() => passwordForm.submit()}
          okText="Reset Password"
        >
          <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
            <Form.Item label="New Password" name="new_password" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
            <Form.Item label="Confirm Password" name="confirm_password" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default ExistingUsersTable;
