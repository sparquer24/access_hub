import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicRoute from '../components/auth/PublicRoute';
import PrivateRoute from '../components/auth/PrivateRoute';
import RoleBasedRoute from '../components/auth/RoleBasedRoute';

// Eagerly loaded: first paint for most visitors
import LandingPage from '../components/landing/LandingPage';
import LoginV2 from '../components/auth/LoginV2';

// Auth Components
const ForgotPassword = lazy(() => import('../components/auth/ForgotPassword'));
const Unauthorized = lazy(() => import('../components/Unauthorized'));

// Dashboard Components
const SuperAdminDashboard = lazy(() => import('../components/dashboards/SuperAdminDashboard'));
const OrgAdminDashboard = lazy(() => import('../components/dashboards/OrgAdminDashboard'));
const OrgAdminAnalytics = lazy(() => import('../components/dashboards/OrgAdminAnalytics'));
const OrgAdminEmployees = lazy(() => import('../components/dashboards/OrgAdminEmployees'));
const OrgAdminVisitors = lazy(() => import('../components/dashboards/OrgAdminVisitors'));
const OrgAdminDepartments = lazy(() => import('../components/dashboards/OrgAdminDepartments'));
const OrgAdminAttendance = lazy(() => import('../components/dashboards/OrgAdminAttendance'));
const OrgAdminLeaves = lazy(() => import('../components/dashboards/OrgAdminLeaves'));
const OrgAdminCameras = lazy(() => import('../components/dashboards/OrgAdminCameras'));
const OrgAdminLocations = lazy(() => import('../components/dashboards/OrgAdminLocations'));
const OrgAdminEmployeeForm = lazy(() => import('../components/dashboards/OrgAdminEmployeeForm'));
const ManagerDashboard = lazy(() => import('../pages/ManagerDashboard'));
const ManagerTeam = lazy(() => import('../pages/ManagerTeam'));
const ManagerLeaves = lazy(() => import('../pages/ManagerLeaves'));
const ManagerReports = lazy(() => import('../pages/ManagerReports'));
const EmployeeDashboard = lazy(() => import('../pages/EmployeeDashboard'));
const EmployeeAttendance = lazy(() => import('../pages/EmployeeAttendance'));
const AttendanceMarking = lazy(() => import('../pages/AttendanceMarking'));
const EmployeeLeaves = lazy(() => import('../pages/EmployeeLeaves'));
const EmployeeProfile = lazy(() => import('../pages/EmployeeProfile'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const AdminPanelDashboard = lazy(() => import('../components/admin/AdminPanelDashboard'));

// Organization Components
const OrganizationList = lazy(() => import('../components/organizations/OrganizationList'));
const OrganizationForm = lazy(() => import('../components/organizations/OrganizationForm'));
const OrganizationDetail = lazy(() => import('../components/organizations/OrganizationDetail'));

// Management Components
const EmployeesList = lazy(() => import('../components/dashboards/EmployeesList'));
const CamerasList = lazy(() => import('../components/dashboards/CamerasList'));
const PresenceEventsList = lazy(() => import('../components/dashboards/PresenceEventsList'));
const FaceEmbeddingsList = lazy(() => import('../components/dashboards/FaceEmbeddingsList'));
const AnomaliesList = lazy(() => import('../components/dashboards/AnomaliesList'));

const VisitorsList = lazy(() => import('../components/dashboards/VisitorsList'));

// LPR Components
const LPRDashboard = lazy(() => import('../components/dashboards/lpr/LPRDashboard'));
const LPRSearch = lazy(() => import('../components/dashboards/lpr/LPRSearch'));
const LPRAlerts = lazy(() => import('../components/dashboards/lpr/LPRAlerts'));

// Legacy Components (for backward compatibility)
const VisitorRegistration = lazy(() => import('../components/VisitorRegistration'));
const UserDashboard = lazy(() => import('../components/UserDashboard'));
const AdminDashboard = lazy(() => import('../components/AdminDashboard'));
const ExistingUsersTable = lazy(() => import('../components/common/ExistingUsersTable'));
const VisitorPreview = lazy(() => import('../components/VisitorPreview'));

// Test Components
const WebcamTest = lazy(() => import('../components/WebcamTest'));

const RouteFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    Loading...
  </div>
);

const RoutesV2 = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
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

      {/* Forgot password (UI only) */}
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      {/* Unauthorized page */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Generic Profile and Settings routes for all authenticated users */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />

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
        path="/super-admin/organizations/:id/*"
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
        path="/admin-panel/organizations/:id/*"
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
    </Suspense>
  );
};

export default RoutesV2;
