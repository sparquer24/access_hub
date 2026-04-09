
import React, { useEffect, useState } from 'react';
import { Table, Tag } from 'antd';
import axios from 'axios';
import PropTypes from 'prop-types';

const statusColors = {
  active: 'green',
  inactive: 'red',
};

const roleTabLabels = [
  { key: 'all', label: 'All' },
  { key: 'Manager', label: 'Managers' },
  { key: 'Team Lead', label: 'Team Leads' },
  { key: 'Member', label: 'Members' },
];

const OrganizationUsersByRole = ({ organizationId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get('/api/users');
        const filtered = data.filter(u => String(u.organization_id) === String(organizationId));
        setUsers(filtered);
      } catch (err) {
        // Optionally handle/log error here
        setUsers([]);
      }
      setLoading(false);
    };
    if (organizationId) fetchUsers();
  }, [organizationId]);

  const getFilteredUsers = () => {
    if (activeTab === 'all') return users;
    return users.filter(u => {
      const role = u.role?.name || u.role || '';
      return role.toLowerCase() === activeTab.toLowerCase();
    });
  };

  const columns = [
    {
      title: <span className="font-semibold">Full Name</span>,
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text) => <span className="text-gray-900">{text}</span>,
    },
    {
      title: <span className="font-semibold">Email</span>,
      dataIndex: 'email',
      key: 'email',
      render: (text) => <span className="text-gray-900">{text}</span>,
    },
    {
      title: <span className="font-semibold">Employee ID</span>,
      dataIndex: 'employee_id',
      key: 'employee_id',
      render: (text) => <span className="text-gray-900">{text}</span>,
    },
    {
      title: <span className="font-semibold">Login ID</span>,
      dataIndex: 'login_id',
      key: 'login_id',
      render: (text) => <span className="text-gray-900">{text}</span>,
    },
    {
      title: <span className="font-semibold">Status</span>,
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <span className={`px-3 py-1 rounded-md text-sm font-medium ${active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          style={{ display: 'inline-block', minWidth: 60, textAlign: 'center' }}>
          {active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: <span className="font-semibold">Created At</span>,
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '',
    },
  ];

  return (
    <div className="bg-[#f4feff] rounded-xl shadow p-4" style={{ minHeight: 200 }}>
      <div className="flex gap-2 mb-4">
        {roleTabLabels.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded font-medium border transition-colors duration-150 ${
              activeTab === tab.key
                ? 'bg-teal-500 text-white border-teal-500 shadow'
                : 'bg-white text-gray-700 border-slate-200 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab(tab.key)}
            style={{ minWidth: 110 }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-sm p-2">
        <Table
          dataSource={getFilteredUsers()}
          rowKey="id"
          columns={columns}
          pagination={false}
          locale={{ emptyText: loading ? 'Loading users...' : 'No users found.' }}
          showHeader={true}
          bordered={false}
        />
      </div>
    </div>
  );
};


OrganizationUsersByRole.propTypes = {
  organizationId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
};

export default OrganizationUsersByRole;
