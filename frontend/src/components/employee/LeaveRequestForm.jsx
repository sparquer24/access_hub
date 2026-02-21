import React, { useState } from 'react';
import { Modal, Form, Select, DatePicker, Input, Button, InputNumber } from 'antd';
import { leaveRequestsAPI } from '../../services/employeeServices';
import { useToast } from '../../contexts/ToastContext';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const LeaveRequestForm = ({ isOpen, onClose, onSuccess }) => {
    const { success, error: showError } = useToast();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState([null, null]);
    const [totalDays, setTotalDays] = useState(0);
    const [durationType, setDurationType] = useState('full_day');

    const leaveTypes = [
        { value: 'sick', label: 'Sick Leave' },
        { value: 'casual', label: 'Casual Leave' },
        { value: 'earned', label: 'Earned Leave' },
        { value: 'unpaid', label: 'Unpaid Leave' }
    ];

    const durationTypes = [
        { value: 'full_day', label: 'Full Day' },
        { value: 'half_day', label: 'Half Day (0.5 days)' }
    ];

    const handleDateChange = (dates) => {
        if (dates && dates[0] && dates[1]) {
            // Validate that start date is before or equal to end date
            if (dates[0].isAfter(dates[1])) {
                showError('Start date must be before or equal to end date');
                return;
            }
        }
        setDateRange(dates);
        calculateTotalDays(dates, durationType);
    };

    const handleDurationTypeChange = (value) => {
        setDurationType(value);
        calculateTotalDays(dateRange, value);
    };

    const calculateTotalDays = (dates, duration) => {
        if (dates && dates.length === 2 && dates[0] && dates[1]) {
            const start = moment(dates[0]);
            const end = moment(dates[1]);
            let days = end.diff(start, 'days') + 1; // Include both start and end date

            // If half day and single day, make it 0.5
            if (duration === 'half_day' && days === 1) {
                days = 0.5;
            }

            setTotalDays(days);
            form.setFieldsValue({ total_days: days });
        } else {
            setTotalDays(0);
            form.setFieldsValue({ total_days: 0 });
        }
    };

    const handleSubmit = async (values) => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) {
            showError('Please select start and end dates');
            return;
        }

        setLoading(true);
        try {
            const data = {
                leave_type: values.leave_type,
                start_date: dateRange[0].format('YYYY-MM-DD'),
                end_date: dateRange[1].format('YYYY-MM-DD'),
                total_days: totalDays,
                duration_type: durationType,
                reason: values.reason
            };

            const response = await leaveRequestsAPI.create(data);

            if (response.success) {
                success('Leave request submitted successfully');
                form.resetFields();
                setDateRange([null, null]);
                setTotalDays(0);
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to submit leave request';
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setDateRange([null, null]);
        setTotalDays(0);
        setDurationType('full_day');
        onClose();
    };

    return (
        <Modal
            title="Apply for Leave"
            open={isOpen}
            onCancel={handleCancel}
            footer={null}
            width={600}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    total_days: 0
                }}
            >
                <Form.Item
                    name="leave_type"
                    label="Leave Type"
                    rules={[{ required: true, message: 'Please select leave type' }]}
                >
                    <Select placeholder="Select leave type" size="large">
                        {leaveTypes.map(type => (
                            <Option key={type.value} value={type.value}>
                                {type.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="duration_type"
                    label="Duration Type"
                    initialValue="full_day"
                >
                    <Select
                        placeholder="Select duration type"
                        size="large"
                        onChange={handleDurationTypeChange}
                        disabled={durationType === 'half_day' && totalDays > 1}
                    >
                        {durationTypes.map(type => (
                            <Option key={type.value} value={type.value}>
                                {type.label}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Leave Period"
                    required
                >
                    <RangePicker
                        style={{ width: '100%' }}
                        size="large"
                        format="YYYY-MM-DD"
                        onChange={handleDateChange}
                        value={dateRange}
                        disabledDate={(current) => {
                            // Disable dates before today
                            return current && current < moment().startOf('day');
                        }}
                    />
                    {durationType === 'half_day' && totalDays > 1 && (
                        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
                            Half-day leave can only be applied for a single day
                        </div>
                    )}
                </Form.Item>

                <Form.Item
                    name="total_days"
                    label="Total Days"
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        size="large"
                        disabled
                        value={totalDays}
                        min={0}
                    />
                </Form.Item>

                <Form.Item
                    name="reason"
                    label="Reason"
                    rules={[
                        { required: true, message: 'Please provide a reason' },
                        { min: 10, message: 'Reason must be at least 10 characters' }
                    ]}
                >
                    <TextArea
                        rows={4}
                        placeholder="Please provide detailed reason for leave..."
                        maxLength={500}
                        showCount
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Button onClick={handleCancel} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                    >
                        Submit Request
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default LeaveRequestForm;
