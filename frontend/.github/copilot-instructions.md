# AI Coding Agent Instructions - VMS Frontend

## Project Overview
**VMS (Visitor Management System) Frontend** - A multi-tenant React application for managing visitors, attendance, organizations, and role-based dashboards. Built with React 19, Ant Design, Axios, and Socket.io for real-time alerts.

## Architecture Patterns

### 1. Authentication & Authorization
- **Context-based**: `AuthContext` (in [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx)) manages global auth state via React hooks
- **JWT tokens**: Stored in localStorage as `accesshub_access_token` (legacy `access_token` also supported)
- **Axios interceptors**: Auto-inject tokens in request headers, handle 401s with refresh token flow
- **Role-based access**: Users have `user.role.name` (e.g., "super_admin", "org_admin", "employee")
- **Permission model**: `hasPermission(resource, action)` checks both role and resource-level permissions

**Key hook**: `useAuth()` - provides `user`, `isAuthenticated`, `hasRole()`, `hasPermission()`, `login()`, `logout()`

### 2. Route Protection
Three wrapper components in [src/components/auth/](src/components/auth/):
- **PrivateRoute**: Blocks unauthenticated users, redirects to login with return URL
- **RoleBasedRoute**: Accepts `roles` prop (array or string), redirects unauthorized to `/unauthorized`
- **PublicRoute**: For login pages; redirects authenticated users based on their role to appropriate dashboard

**Route config**: [src/routes/RoutesV2.jsx](src/routes/RoutesV2.jsx) - defines all app routes with role guards

### 3. API Service Layer
Single source of truth: [src/services/apiServices.js](src/services/apiServices.js)
- Organized into **domain-specific API objects**: `authAPI`, `usersAPI`, `organizationsAPI`, `applicationsAPI`, etc.
- Each object is a collection of arrow functions that return `api.get()`, `api.post()`, etc.
- Base API instance at [src/services/api.jsx](src/services/api.jsx) - handles token injection and refresh

**Pattern**: 
```javascript
export const organizationsAPI = {
  list: (params) => api.get('/api/v2/organizations', { params }),
  getById: (orgId) => api.get(`/api/v2/organizations/${orgId}`),
  create: (payload) => api.post('/api/v2/organizations', payload),
  update: (orgId, payload) => api.put(`/api/v2/organizations/${orgId}`, payload),
};
```

### 4. Component Organization
- **Feature-based structure**: Components grouped by domain (auth, dashboards, organizations, etc.)
- **Common components**: Reusable UI in [src/components/common/](src/components/common/) (Header, forms, tables)
- **Feature contexts**: Self-contained logic, e.g., [src/features/alerts/](src/features/alerts/) has alerts API, context, socket hook, and CSS together

### 5. State Management
- **AuthContext**: Global user/auth state (in [src/contexts/](src/contexts/))
- **Feature-specific contexts**: E.g., alerts context in [src/features/alerts/alerts.context.js](src/features/alerts/alerts.context.js)
- **Component local state**: Use `useState` for UI state (forms, modals, pagination)
- **No Redux**: Keep it simple with Context API + hooks

### 6. Real-time Features
- **Socket.io integration**: [src/features/alerts/useAlertSocket.js](src/features/alerts/useAlertSocket.js) - custom hook for alert subscriptions
- **Pattern**: Custom hooks manage socket connections and re-subscriptions

## Development Workflows

### Build & Run
```bash
npm start          # Dev server on http://localhost:3000
npm run build      # Production bundle to /build
npm test           # Jest tests (watch mode)
```

### Environment Setup
- **Base API URL**: Set `REACT_APP_API_BASE_URL` env var (defaults to "" for same-origin)
- **Token keys**: Code supports both `accesshub_access_token` and legacy `access_token` keys
- **Dependencies**: React 19, Ant Design 5, Tailwind CSS 4, Socket.io-client 4

### CSS Strategy
- **Tailwind CSS**: Configured via [tailwind.config.js](tailwind.config.js) with custom theme colors (primary: #1890ff, success, warning, error) matching Ant Design palette
- **Ant Design**: Primary component library (antd v5.27+) - use for complex components (Form, Table, Modal, etc.)
- **Component-scoped CSS**: [src/styles/](src/styles/) folder for feature-specific styles when Tailwind isn't sufficient (e.g., LoginV2.css, Dashboard.css)
- **Naming**: CSS files match component names (LoginV2.jsx → LoginV2.css)
- **Tailwind setup**: 
  - Directives in [src/index.css](src/index.css) (@tailwind base, components, utilities)
  - PostCSS configured in [postcss.config.js](postcss.config.js)
  - Content paths configured in tailwind.config.js for all JSX files

## Key Development Patterns

### Adding a New Feature
1. Create folder in [src/components/](src/components/) or [src/features/](src/features/) by domain
2. Add API methods to appropriate section in [src/services/apiServices.js](src/services/apiServices.js)
3. Create context if shared state needed (see [src/features/alerts/alerts.context.js](src/features/alerts/alerts.context.js) as example)
4. Build component using Ant Design components (Button, Form, Table, Modal, etc.)
5. Add route to [src/routes/RoutesV2.jsx](src/routes/RoutesV2.jsx) with appropriate role guard
6. Add CSS file in [src/styles/](src/styles/) if custom styling needed

### Accessing Current User
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, hasRole, hasPermission } = useAuth();
  
  if (hasRole('super_admin')) {
    // show admin-only content
  }
}
```

### Making API Calls
```javascript
import apiServices from '../services/apiServices';

// Direct usage
const users = await apiServices.users.list({ page: 1, per_page: 20 });

// In components with error handling
useEffect(() => {
  apiServices.organizations.getById(orgId)
    .then(setOrg)
    .catch(error => console.error('Failed to load org', error));
}, [orgId]);
```

### Protected Routes (RoutesV2.jsx)
```jsx
<Route
  path="/admin/dashboard"
  element={
    <RoleBasedRoute roles={['super_admin', 'org_admin']}>
      <AdminDashboard />
    </RoleBasedRoute>
  }
/>
```

## Cross-File Patterns to Watch

- **Avoid**: Direct axios calls outside of [src/services/apiServices.js](src/services/apiServices.js) - always use service layer
- **localStorage keys**: Auth tokens use `accesshub_access_token` (preferred) or `access_token` (legacy)
- **User object structure**: Has `user.role.name`, `user.permissions` array - check both before operations
- **API v2 endpoints**: Most new features use `/api/v2/` prefix (organizations, applications, etc.)
- **Ant Design Form pattern**: Use `Form.useForm()` hook, attach to Form component, call `form.validateFields()` before submit

## File Structure Reference

```
src/
├── components/auth/          # Route guards & login
├── components/dashboards/    # Role-specific dashboards
├── components/organizations/ # Org management UI
├── components/common/        # Shared UI (Header, forms, tables)
├── contexts/                 # Global state (AuthContext)
├── features/                 # Self-contained features (alerts)
├── routes/RoutesV2.jsx      # Route definitions with guards
├── services/
│   ├── api.jsx              # Axios instance + interceptors
│   └── apiServices.js       # All API endpoints organized by domain
└── styles/                  # Component-scoped CSS files
```

## Critical Integration Points

1. **App.jsx** → Routes setup with AuthProvider wrapper
2. **AuthContext** ↔ api.jsx → Auto token refresh on 401
3. **RoutesV2.jsx** → Uses PrivateRoute/RoleBasedRoute guards
4. **apiServices.js** → All backend API contracts defined here
5. **Socket.io** → useAlertSocket hook in features/alerts for real-time updates

## Conventions to Follow

- Function components with hooks (no class components)
- Destructure props in function signatures
- Explicit error handling (catch blocks, error messages)
- CSS files colocated with components (same name)
- API methods grouped by domain object (users, orgs, etc.)
- Comment multi-line JSX with emoji headers (e.g., // 🔐 Authentication)
