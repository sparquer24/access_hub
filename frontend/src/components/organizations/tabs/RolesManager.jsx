import React, { useState, useEffect } from 'react';
import { Button, Table, Modal } from 'antd';
import RoleModal from './RoleModal';
import RoleMembersManager from './RoleMembersManager';

const RolesManager = ({ organizationId }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, [organizationId]);

  const fetchRoles = async () => {
    setLoading(true);
    // TODO: Replace with API call
    setRoles([
      { id: 1, name: 'Manager' },
      { id: 2, name: 'Team Lead' },
      { id: 3, name: 'Member' },
    ]);
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setShowRoleModal(true);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setShowRoleModal(true);
  };

  const handleDelete = (role) => {
    Modal.confirm({
      title: `Delete role "${role.name}"?`,
      onOk: () => {
        // TODO: API call to delete
        setRoles(roles.filter(r => r.id !== role.id));
      },
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Roles</h3>
        <Button type="primary" onClick={handleCreate}>Create Role</Button>
      </div>
      <Table
        dataSource={roles}
        rowKey="id"
        loading={loading}
        columns={[
          { title: 'Role', dataIndex: 'name' },
          {
            title: 'Actions',
            render: (_, role) => (
              <div className="flex gap-2">
                <Button size="small" onClick={() => handleEdit(role)}>Edit</Button>
                <Button size="small" danger onClick={() => handleDelete(role)}>Delete</Button>
                <Button size="small" onClick={() => setSelectedRole(role)}>Manage Members</Button>
              </div>
            ),
          },
        ]}
        pagination={false}
      />
      <RoleModal
        open={showRoleModal}
        onCancel={() => setShowRoleModal(false)}
        editingRole={editingRole}
        onSuccess={fetchRoles}
      />
      {selectedRole && (
        <RoleMembersManager
          role={selectedRole}
          organizationId={organizationId}
          onClose={() => setSelectedRole(null)}
        />
      )}
    </div>
  );
};

export default RolesManager;
