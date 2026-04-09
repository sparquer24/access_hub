import React, { useState } from 'react';
import { Modal, Table, Button } from 'antd';
import RoleMemberModal from './RoleMemberModal';

const RoleMembersManager = ({ role, organizationId, onClose }) => {
  const [members, setMembers] = useState([
    { id: 1, name: 'Alice', position: 'Team Lead' },
    { id: 2, name: 'Bob', position: 'Member' },
  ]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const handleAdd = () => {
    setEditingMember(null);
    setShowMemberModal(true);
  };
  const handleEdit = (member) => {
    setEditingMember(member);
    setShowMemberModal(true);
  };
  const handleDelete = (member) => {
    // TODO: API call to remove member
    setMembers(members.filter(m => m.id !== member.id));
  };

  return (
    <Modal open={true} title={`Manage Members for ${role.name}`} onCancel={onClose} footer={null}>
      <Button type="primary" onClick={handleAdd} className="mb-3">Add Member</Button>
      <Table
        dataSource={members}
        rowKey="id"
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Position', dataIndex: 'position' },
          {
            title: 'Actions',
            render: (_, member) => (
              <div className="flex gap-2">
                <Button size="small" onClick={() => handleEdit(member)}>Edit</Button>
                <Button size="small" danger onClick={() => handleDelete(member)}>Remove</Button>
              </div>
            ),
          },
        ]}
        pagination={false}
      />
      <RoleMemberModal
        open={showMemberModal}
        onCancel={() => setShowMemberModal(false)}
        editingMember={editingMember}
        onSuccess={() => setShowMemberModal(false)}
      />
    </Modal>
  );
};

export default RoleMembersManager;
