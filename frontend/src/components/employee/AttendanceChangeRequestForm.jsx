import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, TimePicker, Input, Button, Card, Tag } from 'antd';
import { attendanceChangeRequestAPI, attendanceAPI } from '../../services/employeeServices';
import { useToast } from '../../contexts/ToastContext';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

const AttendanceChangeRequestForm = ({ isOpen, onClose, onSuccess }) => {
    const { success, error: showError } = useToast();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [requestType, setRequestType] = useState('manual_checkin');
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentAttendance, setCurrentAttendance] = useState(null);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const requestTypes = [
        { value: 'manual_checkin', label: 'Manual Check-In', description: 'Request to add check-in/out for a missed day' },
        { value: 'time_correction', label: 'Time Correction', description: 'Correct check-in or check-out times' },
        { value: 'status_change', label: 'Status Change', description: 'Change attendance status (e.g., marked absent but was present)' }
    ];

    const attendanceStatuses = [
        { value: 'present', label: 'Present' },
        { value: 'absent', label: 'Absent' },
        { value: 'half_day', label: 'Half Day' },
        { value: 'on_leave', label: 'On Leave' }
    ];

    useEffect(() => {
        if (selectedDate) {
            fetchAttendanceForDate(selectedDate);
        }
    }, [selectedDate]);

    const fetchAttendanceHistory = async () => {
        setLoadingHistory(true);
        try {
            const endDate = moment();
            const startDate = moment().subtract(1, 'month');

            const response = await attendanceAPI.getMyHistory({
                start_date: startDate.format('YYYY-MM-DD'),
                end_date: endDate.format('YYYY-MM-DD'),
                per_page: 50
            });

            if (response.success && response.data) {
                setAttendanceHistory(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch attendance history:', error);
            showError('Failed to load attendance history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchAttendanceForDate = async (date) => {
        setLoadingAttendance(true);
        try {
            const dateStr = date.format('YYYY-MM-DD');
            const response = await attendanceAPI.getMyHistory({
                date: dateStr
            });

            if (response.success && response.data && response.data.length > 0) {
                setCurrentAttendance(response.data[0]);
            } else {
                setCurrentAttendance(null);
            }
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
            setCurrentAttendance(null);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const handleRequestTypeChange = (value) => {
        setRequestType(value);
        form.setFieldsValue({
            check_in_time: null,
            check_out_time: null,
            status: null
        });
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        form.setFieldsValue({ request_date: date });
    };

    const handleSubmit = async (values) => {
        if (!selectedDate) {
            showError('Please select a date');
            return;
        }

        setLoading(true);
        try {
            const requestedChanges = {};

            if (requestType === 'manual_checkin') {
                if (values.check_in_time) {
                    const checkInDateTime = selectedDate.clone()
                        .hour(values.check_in_time.hour())
                        .minute(values.check_in_time.minute())
                        .second(0);
                    requestedChanges.check_in_time = checkInDateTime.toISOString();
                }
                if (values.check_out_time) {
                    const checkOutDateTime = selectedDate.clone()
                        .hour(values.check_out_time.hour())
                        .minute(values.check_out_time.minute())
                        .second(0);
                    requestedChanges.check_out_time = checkOutDateTime.toISOString();
                }
                requestedChanges.status = 'present';
            } else if (requestType === 'time_correction') {
                if (values.check_in_time) {
                    const checkInDateTime = selectedDate.clone()
                        .hour(values.check_in_time.hour())
                        .minute(values.check_in_time.minute())
                        .second(0);
                    requestedChanges.check_in_time = checkInDateTime.toISOString();
                }
                if (values.check_out_time) {
                    const checkOutDateTime = selectedDate.clone()
                        .hour(values.check_out_time.hour())
                        .minute(values.check_out_time.minute())
                        .second(0);
                    requestedChanges.check_out_time = checkOutDateTime.toISOString();
                }
            } else if (requestType === 'status_change') {
                requestedChanges.status = values.status;
            }

            const data = {
                request_date: selectedDate.format('YYYY-MM-DD'),
                request_type: requestType,
                requested_changes: requestedChanges,
                reason: values.reason,
                attendance_record_id: currentAttendance?.id || null
            };

            const response = await attendanceChangeRequestAPI.create(data);

            if (response.success) {
                success('Attendance change request submitted successfully');
                form.resetFields();
                setSelectedDate(null);
                setCurrentAttendance(null);
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to submit request';
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedDate(null);
        setCurrentAttendance(null);
        setShowHistory(false);
        setAttendanceHistory([]);
        onClose();
    };

    return (
        <Modal
            title="Request Attendance Correction"
            open={isOpen}
            onCancel={handleCancel}
            footer={null}
            width={750}
            destroyOnClose
        >
            {/* History Toggle */}
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button
                    onClick={() => {
                        setShowHistory(!showHistory);
                        if (!showHistory && attendanceHistory.length === 0) {
                            fetchAttendanceHistory();
                        }
                    }}
                    loading={loadingHistory}
                >
                    {showHistory ? '✕ Hide' : '📅 View'} Last Month's Attendance
                </Button>
            </div>

            {showHistory && (
                <Card size="small" style={{ marginBottom: 16, maxHeight: 250, overflow: 'auto' }}>
                    <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Last Month's Attendance</div>
                    {attendanceHistory.length > 0 ? (
                        <div>
                            {attendanceHistory.map((record, idx) => (
                                <div key={idx} style={{
                                    padding: '8px',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '4px',
                                    marginBottom: '6px',
                                    backgroundColor: record.status === 'present' ? '#f6ffed' : '#fff1f0'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 500 }}>
                                            {moment(record.date).format('MMM DD, YYYY')}
                                            {record.is_modified && (
                                                <Tag color="purple" style={{ marginLeft: 8, fontSize: 10 }}>Modified</Tag>
                                            )}
                                        </span>
                                        <Tag color={record.status === 'present' ? 'green' : record.status === 'absent' ? 'red' : 'orange'}>
                                            {record.status}
                                        </Tag>
                                    </div>
                                    {record.check_in_time && (
                                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                            In: {moment(record.check_in_time).format('hh:mm A')}
                                            {record.check_out_time && ` | Out: ${moment(record.check_out_time).format('hh:mm A')}`}
                                            {record.work_hours && ` | Hours: ${record.work_hours.toFixed(1)}h`}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                            No attendance records found for the last month
                        </div>
                    )}
                </Card>
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="request_date"
                    label="Date"
                    rules={[{ required: true, message: 'Please select a date' }]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        size="large"
                        format="YYYY-MM-DD"
                        onChange={handleDateChange}
                        disabledDate={(current) => {
                            // Disable future dates
                            return current && current > moment().endOf('day');
                        }}
                    />
                </Form.Item>

                {selectedDate && (
                    <Card
                        size="small"
                        style={{ marginBottom: 16, background: '#f0f2f5' }}
                        loading={loadingAttendance}
                    >
                        <div>
                            <strong>Current Attendance:</strong> {currentAttendance ? (
                                <>
                                    <Tag color={currentAttendance.status === 'present' ? 'green' : 'red'}>
                                        {currentAttendance.status}
                                    </Tag>
                                    {currentAttendance.check_in_time && (
                                        <span style={{ marginLeft: 8 }}>
                                            In: {moment(currentAttendance.check_in_time).format('hh:mm A')}
                                        </span>
                                    )}
                                    {currentAttendance.check_out_time && (
                                        <span style={{ marginLeft: 8 }}>
                                            Out: {moment(currentAttendance.check_out_time).format('hh:mm A')}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <Tag color="orange">No Record</Tag>
                            )}
                        </div>
                    </Card>
                )}

                <Form.Item
                    name="request_type"
                    label="Request Type"
                    rules={[{ required: true, message: 'Please select request type' }]}
                    initialValue="manual_checkin"
                >
                    <Select
                        placeholder="Select request type"
                        size="large"
                        onChange={handleRequestTypeChange}
                    >
                        {requestTypes.map(type => (
                            <Option key={type.value} value={type.value}>
                                <div>
                                    <div>{type.label}</div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{type.description}</div>
                                </div>
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {(requestType === 'manual_checkin' || requestType === 'time_correction') && (
                    <>
                        <Form.Item
                            name="check_in_time"
                            label="Check-In Time"
                            rules={requestType === 'manual_checkin' ? [{ required: true, message: 'Please select check-in time' }] : []}
                        >
                            <TimePicker
                                style={{ width: '100%' }}
                                size="large"
                                format="hh:mm A"
                                use12Hours
                            />
                        </Form.Item>

                        <Form.Item
                            name="check_out_time"
                            label="Check-Out Time"
                        >
                            <TimePicker
                                style={{ width: '100%' }}
                                size="large"
                                format="hh:mm A"
                                use12Hours
                            />
                        </Form.Item>
                    </>
                )}

                {requestType === 'status_change' && (
                    <Form.Item
                        name="status"
                        label="Requested Status"
                        rules={[{ required: true, message: 'Please select status' }]}
                    >
                        <Select placeholder="Select status" size="large">
                            {attendanceStatuses.map(status => (
                                <Option key={status.value} value={status.value}>
                                    {status.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

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
                        placeholder="Please provide detailed reason for this request..."
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

export default AttendanceChangeRequestForm;
