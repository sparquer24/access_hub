import React, { useState } from 'react';
import RolesManager from './RolesManager';
import OrganizationUsersByRole from './OrganizationUsersByRole';

const OrganizationSettings = ({ organizationId, organization }) => {
  const [activeTab, setActiveTab] = useState('roles');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-2">
        <button
          className={`px-4 py-2 rounded-t font-semibold ${activeTab === 'roles' ? 'bg-teal-100 text-teal-700' : 'text-gray-700'}`}
          onClick={() => setActiveTab('roles')}
        >
          Roles & Permissions
        </button>
        <button
          className={`px-4 py-2 rounded-t font-semibold ${activeTab === 'users' ? 'bg-teal-100 text-teal-700' : 'text-gray-700'}`}
          onClick={() => setActiveTab('users')}
        >
          Users by Role
        </button>
      </div>
      <div>
        {activeTab === 'roles' && (
          <RolesManager organizationId={organizationId} />
        )}
        {activeTab === 'users' && (
          <OrganizationUsersByRole organizationId={organizationId} />
        )}
      </div>
    </div>
  );
};

export default OrganizationSettings;
