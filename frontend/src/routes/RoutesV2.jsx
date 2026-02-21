import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicRoute from '../components/auth/PublicRoute';
import PrivateRoute from '../components/auth/PrivateRoute';
import RoleBasedRoute from '../components/auth/RoleBasedRoute';

// Auth Components
import LoginV2 from '../components/auth/LoginV2';
import Unauthorized from '../components/Unauthorized';
import LandingPage from '../components/landing/LandingPage';

// Dashboard Components
import SuperAdminDashboard from '../components/dashboards/SuperAdminDashboard';
import OrgAdminDashboard from '../components/dashboards/OrgAdminDashboard';
import OrgAdminAnalytics from '../components/dashboards/OrgAdminAnalytics';
import OrgAdminEmployees from '../components/dashboards/OrgAdminEmployees';
import OrgAdminVisitors from '../components/dashboards/OrgAdminVisitors';
import OrgAdminDepartments from '../components/dashboards/OrgAdminDepartments';
import OrgAdminAttendance from '../components/dashboards/OrgAdminAttendance';
import OrgAdminLeaves from '../components/dashboards/OrgAdminLeaves';
import OrgAdminCameras from '../components/dashboards/OrgAdminCameras';
import OrgAdminLocations from '../components/dashboards/OrgAdminLocations';
import OrgAdminEmployeeForm from '../components/dashboards/OrgAdminEmployeeForm';
import ManagerDashboard from '../pages/ManagerDashboard';
import ManagerTeam from '../pages/ManagerTeam';
import ManagerLeaves from '../pages/ManagerLeaves';
import ManagerReports from '../pages/ManagerReports';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import EmployeeAttendance from '../pages/EmployeeAttendance';
import AttendanceMarking from '../pages/AttendanceMarking';
import EmployeeLeaves from '../pages/EmployeeLeaves';
import EmployeeProfile from '../pages/EmployeeProfile';
import AdminPanelDashboard from '../components/admin/AdminPanelDashboard';


// Organization Components
import OrganizationList from '../components/organizations/OrganizationList';
import OrganizationForm from '../components/organizations/OrganizationForm';
import OrganizationDetail from '../components/organizations/OrganizationDetail';
import OrganizationStatistics from '../components/organizations/tabs/OrganizationStatistics';

// Management Components
import EmployeesList from '../components/dashboards/EmployeesList';
import CamerasList from '../components/dashboards/CamerasList';
import PresenceEventsList from '../components/dashboards/PresenceEventsList';
import FaceEmbeddingsList from '../components/dashboards/FaceEmbeddingsList';
import AnomaliesList from '../components/dashboards/AnomaliesList';

import VisitorsList from '../components/dashboards/VisitorsList';

// LPR Components
import LPRDashboard from '../components/dashboards/lpr/LPRDashboard';
import LPRSearch from '../components/dashboards/lpr/LPRSearch';
import LPRAlerts from '../components/dashboards/lpr/LPRAlerts';

// Legacy Components (for backward compatibility)
import Login from '../components/Login';
import VisitorRegistration from '../components/VisitorRegistration';
import UserDashboard from '../components/UserDashboard';
import AdminDashboard from '../components/AdminDashboard';
import ExistingUsersTable from '../components/common/ExistingUsersTable';
import VisitorPreview from '../components/VisitorPreview';

// Test Components
import WebcamTest from '../components/WebcamTest';

const RoutesV2 = () => {
  return (
    <Routes>
      {/* Landing Page - Public route for homepage */}
      <Route path="/" element={<LandingPage />} />

      {/* Webcam Test Route */}
      <Route path="/webcam-test" element={<WebcamTest />} />

      {/* Public Routes - Accessible only when NOT authenticated */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginV2 />
          </PublicRoute>
        }
      />

      {/* Legacy login route */}
      <Route
        path="/login-old"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Unauthorized page */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Super Admin Routes */}
      <Route
        path="/super-admin/dashboard"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <SuperAdminDashboard />
          </RoleBasedRoute>
        }
      />

      {/* Super Admin - Organization Management Routes */}
      <Route
        path="/super-admin/organizations"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <OrganizationList />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/super-admin/organizations/create"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <OrganizationForm />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/super-admin/organizations/:id"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <OrganizationDetail />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/super-admin/organizations/:id/edit"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <OrganizationForm />
          </RoleBasedRoute>
        }
      />

      {/* Super Admin - Employee Management Route */}
      <Route
        path="/super-admin/employees"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <EmployeesList />
          </RoleBasedRoute>
        }
      />

      {/* Super Admin - Camera Management Route */}
      <Route
        path="/super-admin/cameras"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <CamerasList />
          </RoleBasedRoute>
        }
      />

      {/* Super Admin - Presence Events Route */}
      <Route
        path="/super-admin/presence-events"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <PresenceEventsList />
          </RoleBasedRoute>
        }
      />

      {/* Super Admin - Face Embeddings Route */}
      <Route
        path="/super-admin/face-embeddings"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <FaceEmbeddingsList />
          </RoleBasedRoute>
        }
      />

      {/* Super Admin - Anomalies Route */}
      <Route
        path="/super-admin/anomalies"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <AnomaliesList />
          </RoleBasedRoute>
        }
      />

      {/* Super Admin - Visitors Route */}
      <Route
        path="/super-admin/visitors"
        element={
          <RoleBasedRoute roles={['super_admin']}>
            <VisitorsList />
          </RoleBasedRoute>
        }
      />

      {/* Admin Panel Routes */}
      <Route
        path="/admin-panel/dashboard"
        element={
          <RoleBasedRoute roles={['super_admin', 'org_admin']}>
            <AdminPanelDashboard />
          </RoleBasedRoute>
        }
      />

      <Route
        path="/admin-panel/organizations"
        element={
          <RoleBasedRoute roles={['super_admin', 'org_admin']}>
            <OrganizationList
              showCreateButton={false}
              basePath="/admin-panel/organizations"
            />
          </RoleBasedRoute>
        }
      />

      {/* Admin Panel - Organization Detail Routes */}
      <Route
        path="/admin-panel/organizations/:id"
        element={
          <RoleBasedRoute roles={['super_admin', 'org_admin']}>
            <OrganizationDetail
              backPath="/admin-panel/dashboard"
              dashboardPath="/admin-panel/dashboard"
            />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin-panel/organizations/:id/edit"
        element={
          <RoleBasedRoute roles={['super_admin', 'org_admin']}>
            <OrganizationForm />
          </RoleBasedRoute>
        }
      />

      {/* Organization Admin Routes */}
      <Route
        path="/org-admin/dashboard"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <OrgAdminDashboard />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/employees"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <OrgAdminEmployees />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/visitors"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <OrgAdminVisitors />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/analytics"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <OrgAdminAnalytics />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/departments"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <OrgAdminDepartments />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/attendance"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <OrgAdminAttendance />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/leaves"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <OrgAdminLeaves />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/cameras"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <OrgAdminCameras />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/locations"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <OrgAdminLocations />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/lpr/dashboard"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <LPRDashboard />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/lpr/search"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <LPRSearch />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/lpr/alerts"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <LPRAlerts />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/org-admin/employees/create"
        element={
          <RoleBasedRoute roles={['org_admin', 'super_admin']}>
            <OrgAdminEmployeeForm />
          </RoleBasedRoute>
        }
      />

      {/* Manager Routes */}
      <Route
        path="/manager/dashboard"
        element={
          <RoleBasedRoute roles={['manager', 'org_admin', 'super_admin']}>
            <ManagerDashboard />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/manager/team"
        element={
          <RoleBasedRoute roles={['manager', 'org_admin', 'super_admin']}>
            <ManagerTeam />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/manager/leaves"
        element={
          <RoleBasedRoute roles={['manager', 'org_admin', 'super_admin']}>
            <ManagerLeaves />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <RoleBasedRoute roles={['manager', 'org_admin', 'super_admin']}>
            <ManagerReports />
          </RoleBasedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <RoleBasedRoute roles={['employee', 'manager', 'org_admin', 'super_admin']}>
            <EmployeeDashboard />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/employee/attendance"
        element={
          <RoleBasedRoute roles={['employee', 'manager', 'org_admin', 'super_admin']}>
            <EmployeeAttendance />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/employee/mark-attendance"
        element={
          <RoleBasedRoute roles={['employee', 'manager', 'org_admin', 'super_admin']}>
            <AttendanceMarking />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/employee/leaves"
        element={
          <RoleBasedRoute roles={['employee', 'manager', 'org_admin', 'super_admin']}>
            <EmployeeLeaves />
          </RoleBasedRoute>
        }
      />
      <Route
        path="/employee/profile"
        element={
          <RoleBasedRoute roles={['employee', 'manager', 'org_admin', 'super_admin']}>
            <EmployeeProfile />
          </RoleBasedRoute>
        }
      />

      {/* Legacy Routes - Protected but no role restriction */}
      <Route
        path="/visitor_registration"
        element={
          <PrivateRoute>
            <VisitorRegistration />
          </PrivateRoute>
        }
      />

      <Route
        path="/user_dashboard"
        element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin_dashboard"
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/admin/existing-users"
        element={
          <PrivateRoute>
            <ExistingUsersTable />
          </PrivateRoute>
        }
      />

      <Route
        path="/visitor_preview/:aadhaar"
        element={
          <PrivateRoute>
            <VisitorPreview />
          </PrivateRoute>
        }
      />


      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default RoutesV2;
