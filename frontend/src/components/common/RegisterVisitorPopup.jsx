
import React, { useState } from "react";
import { Modal, Form, Input, Radio, Button, message, Row, Col } from "antd";
import "../../styles/RegisterVisitorPopup.css";
import csrfAPI from "../../services/api";
import usersAPI from "../../services/api";

const RegisterVisitorPopup = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // const handleSubmit = (values) => {
  //   console.log("Form Data:", values);
  //   message.success("Visitor registered successfully!");
  //   onClose();
  // };

  const validateFullName = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Please enter full name'));
    }
    if (!/^[A-Za-z\s]+$/.test(value)) {
      return Promise.reject(new Error('Full name should contain only letters and spaces'));
    }
    if (value.trim().length < 2) {
      return Promise.reject(new Error('Full name should be at least 2 characters long'));
    }
    return Promise.resolve();
  };

  const validatePhoneNumber = (_, value) => {
    if (value && !/^\d{10}$/.test(value)) {
      return Promise.reject(new Error("Please enter a valid 10-digit phone number"));
    }
    return Promise.resolve();
  };

  const validateEmail = (_, value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return Promise.reject(new Error("Please enter a valid email address"));
    }
    return Promise.resolve();
  };

  const validatePassword = (_, value) => {
    if (value && value.length < 6) {
      return Promise.reject(new Error("Password must be at least 6 characters long"));
    }
    return Promise.resolve();
  };

  const validateConfirmPassword = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue("password") === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error("Passwords do not match"));
    },
  });

  // ✅ This is where we call the backend
  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      // Map AntD field names -> backend API keys
      const payload = {
        full_name: values.fullName?.trim(),
        gender: values.gender || "",
        phone_number: values.phone || "",
        email: values.email || "",
        employee_id: values.employeeId || "",
        tower: values.tower || "",
        building_name: values["Building Name"] || "", // handles the space in the field name
        login_id: values.userName?.trim(),
        password: values.password,
        confirm_password: values.confirmPassword,
      };

      // Basic client guard (server also validates)
      if (!payload.full_name || !payload.login_id || !payload.password || !payload.confirm_password) {
        message.error("Please fill Full Name, User Name, Password and Confirm Password.");
        return;
      }

      // 1) Ensure CSRF cookie is set
      await csrfAPI.fetchToken();

      // 2) Create user (server forces role="User")
      const resp = await usersAPI.create(payload);
      if (resp.status === 201) {
        message.success("User created successfully.");
        form.resetFields();
        onClose?.();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create user.";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={visible}
      title="Register New User"
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Full Name" name="fullName">
              <Input placeholder="Enter full name (letters only)" />
            </Form.Item>
            <Form.Item label="Gender" name="gender" rules={[{ required: true, message: 'Please select gender' }]}> 
              <Radio.Group>
                <Radio value="male">Male</Radio>
                <Radio value="female">Female</Radio>
                <Radio value="other">Other</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="Phone Number" name="phone" rules={[{ validator: validatePhoneNumber }]}> 
              <Input placeholder="Enter 10-digit phone number" maxLength={10} />
            </Form.Item>
            <Form.Item label="Email ID" name="email" rules={[{ validator: validateEmail }]}> 
              <Input placeholder="Enter email address" />
            </Form.Item>
            <Form.Item label="Employee ID" name="employeeId" rules={[{ required: true, message: 'Please enter employee ID' }]}> 
              <Input placeholder="Enter employee ID" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Tower" name="tower" rules={[{ required: true, message: 'Please enter tower' }]}> 
              <Input placeholder="Enter tower" />
            </Form.Item>
            <Form.Item label="Building Name" name="Building Name" rules={[{ required: true, message: 'Please enter building name' }]}> 
              <Input placeholder="Enter building name" />
            </Form.Item>
            <Form.Item label="User Name" name="userName" rules={[{ required: true, message: 'Please enter username' }, { min: 3, message: 'Username must be at least 3 characters' }]}> 
              <Input placeholder="Enter username" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter password' }, { validator: validatePassword }]}> 
              <Input.Password placeholder="Enter password (min 6 characters)" />
            </Form.Item>
            <Form.Item label="Confirm Password" name="confirmPassword" dependencies={['password']} rules={[{ required: true, message: 'Please confirm password' }, validateConfirmPassword]}> 
              <Input.Password placeholder="Confirm your password" />
            </Form.Item>
          </Col>
        </Row>
        <div className="popup-footer">
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Create User
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default RegisterVisitorPopup;
