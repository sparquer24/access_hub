import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EmployeesList from './EmployeesList';
import { getThemeClasses } from '../../utils/roleBasedTheme';
import PageHeader from '../ui/PageHeader';

const OrgAdminEmployees = () => {
  const { user } = useAuth();
  const themeClasses = getThemeClasses(user);

  return (
    <div className={`min-h-screen ${themeClasses.page}`}>
      <PageHeader
        icon="👥"
        title="Employees"
        subtitle={<>Manage employees for <span className="font-bold text-white">{user?.organization?.name || 'your organization'}</span></>}
        themeClasses={themeClasses}
      />

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <EmployeesList />
      </div>
    </div>
  );
};

export default OrgAdminEmployees;
