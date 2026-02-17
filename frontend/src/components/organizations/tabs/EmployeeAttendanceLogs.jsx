import React, { useState, useEffect } from 'react';
import { DatePicker, Input, Select, Table, Tag, Button, TimePicker } from 'antd';
import { useToast } from '../../../contexts/ToastContext';
import moment from 'moment';
import { attendanceService } from '../../../services/organizationsService';

const { RangePicker } = DatePicker;
const { Option } = Select;

const EmployeeAttendanceLogs = ({ employees = [], onEmployeeClick, organizationId }) => {
    const { success, error: showError } = useToast();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState([moment(), moment()]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchLogs();
    }, [pagination.current, pagination.pageSize, statusFilter, dateRange, searchText]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {
                organization_id: organizationId,
                page: pagination.current,
                per_page: pagination.pageSize,
            };

            if (statusFilter !== 'all') {
                if (statusFilter === 'active') {
                    params.status = 'present';
                } else if (statusFilter === 'late') {
                    params.status = 'present';
                } else {
                    params.status = statusFilter;
                }
            }

            if (searchText) {
                params.search = searchText;
            }

            if (dateRange && dateRange[0] && dateRange[1]) {
                params.start_date = dateRange[0].format('YYYY-MM-DD');
                params.end_date = dateRange[1].format('YYYY-MM-DD');
            }

            const response = await attendanceService.list(params);

            if (response.success) {
                let items = response.data.items || [];

                if (statusFilter === 'active') {
                    items = items.filter(i => !i.check_out_time);
                } else if (statusFilter === 'late') {
                    items = items.filter(i => {
                        if (!i.check_in_time) return false;
                        const checkIn = moment(i.check_in_time);
                        return checkIn.hour() > 9 || (checkIn.hour() === 9 && checkIn.minute() > 15);
                    });
                }

                setLogs(items);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total_items
                }));
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            showError('Failed to load attendance logs');
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (newPagination) => {
        setPagination(prev => ({
            ...prev,
            current: newPagination.current,
            pageSize: newPagination.pageSize
        }));
    };

    const isEditing = (record) => record.id === editingId;

    const startEditing = (record) => {
        setEditingId(record.id);
        setEditForm({
            ...record,
            check_in_time: record.check_in_time ? moment(record.check_in_time) : null,
            check_out_time: record.check_out_time ? moment(record.check_out_time) : null,
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEditing = async (id) => {
        try {
            setLoading(true);
            const payload = {
                status: editForm.status,
                check_in_time: editForm.check_in_time ? editForm.check_in_time.toISOString() : null,
                check_out_time: editForm.check_out_time ? editForm.check_out_time.toISOString() : null,
            };

            const response = await attendanceService.update(id, payload);
            if (response.success) {
                success('Attendance updated successfully');
                setEditingId(null);
                fetchLogs();
            }
        } catch (error) {
            console.error('Error saving attendance:', error);
            showError('Failed to update attendance');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Employee',
            dataIndex: 'employee',
            key: 'employee',
            render: (employee) => (
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => onEmployeeClick && onEmployeeClick(employee.id)}
                >
                    <div className="w-8 h-8 bg-teal-100 group-hover:bg-teal-200 transition-colors rounded-full flex items-center justify-center text-teal-600 font-bold text-xs">
                        {employee?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 group-hover:text-teal-600 transition-colors">
                            {employee?.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">{employee?.employee_code || 'N/A'}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (text) => <span className="text-gray-600">{moment(text).format('MMM DD, YYYY')}</span>
        },
        {
            title: 'Check In',
            dataIndex: 'check_in_time',
            key: 'check_in_time',
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <TimePicker
                            value={editForm.check_in_time}
                            onChange={(time) => setEditForm({ ...editForm, check_in_time: time })}
                            format="HH:mm:ss"
                            size="small"
                        />
                    );
                }
                return text ? (
                    <span className="font-mono text-gray-700 bg-teal-50 px-2 py-0.5 rounded border border-gray-200 text-xs">
                        {moment(text).format('HH:mm:ss')}
                    </span>
                ) : '-'
            }
        },
        {
            title: 'Check Out',
            dataIndex: 'check_out_time',
            key: 'check_out_time',
            render: (text, record) => {
                if (isEditing(record)) {
                    return (
                        <TimePicker
                            value={editForm.check_out_time}
                            onChange={(time) => setEditForm({ ...editForm, check_out_time: time })}
                            format="HH:mm:ss"
                            size="small"
                        />
                    );
                }
                return text ? (
                    <span className="font-mono text-gray-700 bg-teal-50 px-2 py-0.5 rounded border border-gray-200 text-xs">
                        {moment(text).format('HH:mm:ss')}
                    </span>
                ) : (
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        Active
                    </span>
                )
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
                if (isEditing(record)) {
                    return (
                        <Select
                            value={editForm.status}
                            onChange={(value) => setEditForm({ ...editForm, status: value })}
                            size="small"
                            className="w-24"
                        >
                            <Option value="present">PRESENT</Option>
                            <Option value="absent">ABSENT</Option>
                            <Option value="late">LATE</Option>
                            <Option value="half_day">HALF DAY</Option>
                            <Option value="on_leave">ON LEAVE</Option>
                            <Option value="holiday">HOLIDAY</Option>
                        </Select>
                    );
                }
                let color = 'green';
                let text = status ? status.toUpperCase() : 'PRESENT';

                if (record.check_in_time) {
                    const checkIn = moment(record.check_in_time);
                    if (checkIn.hour() > 9 || (checkIn.hour() === 9 && checkIn.minute() > 15)) {
                        text = 'LATE';
                        color = 'orange';
                    }
                }

                if (status === 'absent') color = 'red';
                if (status === 'on_leave') color = 'blue';

                return <Tag color={color} style={{ fontSize: '10px', lineHeight: '18px' }}>{text}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
                if (isEditing(record)) {
                    return (
                        <div className="flex gap-2">
                            <Button
                                type="primary"
                                size="small"
                                onClick={() => saveEditing(record.id)}
                                className="bg-teal-600 hover:bg-teal-700"
                            >
                                Save
                            </Button>
                            <Button
                                size="small"
                                onClick={cancelEditing}
                            >
                                Cancel
                            </Button>
                        </div>
                    );
                }
                return (
                    <Button
                        size="small"
                        onClick={() => startEditing(record)}
                        className="text-teal-600 border-teal-600 hover:text-teal-700 hover:border-teal-700"
                    >
                        Edit
                    </Button>
                );
            }
        }
    ];

    return (
        <div className="space-y-3">
            {/* Filters */}
            <div className="bg-teal-50/95 p-3 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 flex-1 min-w-[300px]">
                    <Input
                        prefix={<span>🔍</span>}
                        placeholder="Search..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="max-w-xs text-sm"
                        size="small"
                    />
                    <RangePicker
                        value={dateRange}
                        onChange={(dates) => {
                            if (!dates || !dates[0] || !dates[1]) {
                                // Clear the date range if dates are cleared
                                setDateRange(null);
                                return;
                            }
                            // Validate that start date is before or equal to end date
                            if (dates[0].isAfter(dates[1])) {
                                showError('Start date must be before or equal to end date');
                                return;
                            }
                            setDateRange(dates);
                        }}
                        size="small"
                        className="w-64"
                    />
                    <Select
                        defaultValue="all"
                        onSelect={setStatusFilter}
                        className="min-w-[120px]"
                        size="small"
                    >
                        <Option value="all">All Status</Option>
                        <Option value="late">Late Arrivals</Option>
                        <Option value="active">Currently Active</Option>
                        <Option value="absent">Absent</Option>
                        <Option value="on_leave">On Leave</Option>
                    </Select>
                </div>
                <button
                    onClick={fetchLogs}
                    className="text-teal-600 hover:text-teal-800 font-medium text-xs flex items-center gap-1"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Table */}
            <div className="bg-teal-50/95 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <Table
                    dataSource={logs}
                    columns={columns}
                    rowKey="id"
                    pagination={pagination}
                    loading={loading}
                    onChange={handleTableChange}
                    size="small"
                />
            </div>
        </div>
    );
};

export default EmployeeAttendanceLogs;
