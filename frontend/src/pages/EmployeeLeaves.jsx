import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Card, Row, Col, Statistic, message, Modal, Tooltip, Input, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { leaveRequestsAPI } from '../services/employeeServices';
import LeaveRequestForm from '../components/employee/LeaveRequestForm';
import moment from 'moment';

const { Option } = Select;

const EmployeeLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [summary, setSummary] = useState({
    annual_leave: { total: 0, used: 0, remaining: 0 },
    sick_leave: { total: 0, used: 0, remaining: 0 }
  });
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  const fetchLeaves = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pagination.pageSize,
        ...filters
      };
      if (params.status === 'all') delete params.status;
      if (!params.search) delete params.search;

      const response = await leaveRequestsAPI.getMyRequests(params);

      if (response.success) {
        setLeaves(response.data.items || []);
        // Summary might need a separate endpoint or be part of a different response structure
        // For now, let's just make sure the table loads
        if (response.data.leave_balance) {
          setSummary(response.data.leave_balance);
        }
        setPagination({
          ...pagination,
          current: response.data.pagination.page,
          total: response.data.pagination.total_items
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves(pagination.current);
  }, [filters]);

  const handleDelete = async (id) => {
    try {
      await leaveRequestsAPI.delete(id);
      message.success('Leave request deleted successfully');
      fetchLeaves(pagination.current);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete leave request');
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'leave_type',
      key: 'leave_type',
      render: (type) => {
        const colors = {
          'sick': 'volcano',
          'casual': 'blue',
          'earned': 'green',
          'unpaid': 'default'
        };
        return <Tag color={colors[type?.toLowerCase()] || 'default'}>{type?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => (
        <span>
          {moment(record.start_date).format('MMM DD, YYYY')} - {moment(record.end_date).format('MMM DD, YYYY')}
        </span>
      )
    },
    {
      title: 'Days',
      dataIndex: 'total_days',
      key: 'total_days',
      align: 'center'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'pending': 'orange',
          'approved': 'green',
          'rejected': 'red'
        };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Applied On',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <span>
          {record.status === 'pending' && (
            <Tooltip title="Delete Request">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => Modal.confirm({
                  title: 'Delete Leave Request',
                  content: 'Are you sure you want to delete this request?',
                  okText: 'Yes',
                  okType: 'danger',
                  cancelText: 'No',
                  onOk: () => handleDelete(record.id)
                })}
              />
            </Tooltip>
          )}
        </span>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Leave Requests</h1>
            <p className="text-gray-500">Manage and track your leave applications</p>
          </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} size="large">
          Apply for Leave
        </Button>
      </div>

      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="shadow-sm bg-teal-50 border border-teal-200">
            <Statistic
              title="Annual Leave"
              value={summary.annual_leave.remaining}
              suffix={`/ ${summary.annual_leave.total}`}
              valueStyle={{ color: '#14b8a6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="shadow-sm bg-teal-50 border border-teal-200">
            <Statistic
              title="Sick Leave"
              value={summary.sick_leave.remaining}
              suffix={`/ ${summary.sick_leave.total}`}
              valueStyle={{ color: '#14b8a6' }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="shadow-md bg-teal-50 border border-teal-200">
        <div className="flex justify-end mb-4 gap-4">
          <Input
            placeholder="Search..."
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={leaves}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page) => fetchLeaves(page)
          }}
        />
      </Card>

      <LeaveRequestForm
        isOpen={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSuccess={() => fetchLeaves(1)}
      />
      </div>
    </div>
  );
};

export default EmployeeLeaves;
