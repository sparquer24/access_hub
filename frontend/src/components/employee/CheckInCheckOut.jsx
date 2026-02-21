import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Row, Col, Statistic } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import Loader from '../common/Loader';
import { useToast } from '../../contexts/ToastContext';
import { attendanceAPI } from '../../services/employeeServices';
import moment from 'moment';

const CheckInCheckOut = ({ isOpen, onClose, onSuccess }) => {
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [fetchingStatus, setFetchingStatus] = useState(false);
    const [workHours, setWorkHours] = useState('0h 0m');

    useEffect(() => {
        if (isOpen) {
            fetchTodayAttendance();
        }
    }, [isOpen]);

    useEffect(() => {
        if (todayAttendance?.check_in_time && todayAttendance?.check_out_time) {
            calculateWorkHours();
        } else if (todayAttendance?.check_in_time) {
            // Calculate running work hours
            const interval = setInterval(() => {
                calculateWorkHours();
            }, 60000); // Update every minute

            calculateWorkHours(); // Initial calculation

            return () => clearInterval(interval);
        }
    }, [todayAttendance]);

    const fetchTodayAttendance = async () => {
        setFetchingStatus(true);
        try {
            const response = await attendanceAPI.getToday();

            if (response.success && response.data && response.data.length > 0) {
                setTodayAttendance(response.data[0]);
            } else {
                setTodayAttendance(null);
            }
        } catch (error) {
            console.error('Failed to fetch today attendance:', error);
            setTodayAttendance(null);
        } finally {
            setFetchingStatus(false);
        }
    };

    const calculateWorkHours = () => {
        if (!todayAttendance?.check_in_time) {
            setWorkHours('0h 0m');
            return;
        }

        const checkIn = moment(todayAttendance.check_in_time);
        const checkOut = todayAttendance.check_out_time
            ? moment(todayAttendance.check_out_time)
            : moment(); // Use current time if not checked out

        const duration = moment.duration(checkOut.diff(checkIn));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();

        setWorkHours(`${hours}h ${minutes}m`);
    };

    const handleCheckIn = async () => {
        setLoading(true);
        try {
            // Get location if available
            let location = null;
            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                } catch (error) {
                    console.log('Location access denied or unavailable');
                }
            }

            const data = {
                location_check_in: location,
                device_info: {
                    type: 'web',
                    userAgent: navigator.userAgent
                }
            };

            const response = await attendanceAPI.checkIn(data);

            if (response.success) {
                success('Checked in successfully');
                await fetchTodayAttendance();
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to check in';
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        try {
            // Get location if available
            let location = null;
            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                } catch (error) {
                    console.log('Location access denied or unavailable');
                }
            }

            const data = {
                location_check_out: location
            };

            const response = await attendanceAPI.checkOut(data);

            if (response.success) {
                success('Checked out successfully');
                await fetchTodayAttendance();
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to check out';
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const isCheckedIn = todayAttendance?.check_in_time && !todayAttendance?.check_out_time;
    const isCheckedOut = todayAttendance?.check_in_time && todayAttendance?.check_out_time;

    return (
        <Modal
            title="Today's Attendance"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={600}
            destroyOnClose
        >
            {fetchingStatus ? (
                <div className="flex justify-center p-8">
                    <Loader size="large" />
                </div>
            ) : (
                <div>
                    {/* Status Card */}
                    <Card style={{ marginBottom: 16, background: '#f0f2f5' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, marginBottom: 8 }}>
                                Status:
                                <span style={{
                                    marginLeft: 8,
                                    fontWeight: 'bold',
                                    color: isCheckedOut ? '#52c41a' : isCheckedIn ? '#1890ff' : '#8c8c8c'
                                }}>
                                    {isCheckedOut ? '✓ Checked Out' : isCheckedIn ? '○ Checked In' : '○ Not Checked In'}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Time Cards */}
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title="Check In"
                                    value={todayAttendance?.check_in_time ? moment(todayAttendance.check_in_time).format('hh:mm A') : '-- : --'}
                                    prefix={<ClockCircleOutlined style={{ color: isCheckedIn || isCheckedOut ? '#1890ff' : '#d9d9d9' }} />}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card>
                                <Statistic
                                    title="Check Out"
                                    value={todayAttendance?.check_out_time ? moment(todayAttendance.check_out_time).format('hh:mm A') : '-- : --'}
                                    prefix={<ClockCircleOutlined style={{ color: isCheckedOut ? '#52c41a' : '#d9d9d9' }} />}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Work Hours */}
                    <Card style={{ marginBottom: 16 }}>
                        <Statistic
                            title="Work Hours"
                            value={workHours}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>

                    {/* Location Status */}
                    <div style={{ marginBottom: 16, color: '#8c8c8c', fontSize: 12 }}>
                        <EnvironmentOutlined /> Location tracking enabled
                    </div>

                    {/* Action Buttons */}
                    <div style={{ textAlign: 'center' }}>
                        {!isCheckedIn && !isCheckedOut && (
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleCheckIn}
                                loading={loading}
                                style={{ width: '100%', height: 50, fontSize: 16 }}
                            >
                                ⚡ Check In Now
                            </Button>
                        )}

                        {isCheckedIn && !isCheckedOut && (
                            <Button
                                type="primary"
                                danger
                                size="large"
                                onClick={handleCheckOut}
                                loading={loading}
                                style={{ width: '100%', height: 50, fontSize: 16 }}
                            >
                                ✓ Check Out
                            </Button>
                        )}

                        {isCheckedOut && (
                            <Button
                                type="default"
                                size="large"
                                onClick={onClose}
                                style={{ width: '100%', height: 50, fontSize: 16 }}
                            >
                                Done
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default CheckInCheckOut;
