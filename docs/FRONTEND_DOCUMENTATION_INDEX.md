# Frontend Documentation Index

## Quick Links

### Getting Started

- [Frontend README](FRONTEND_README.md) - Project overview and setup
- [Frontend Quickstart](FRONTEND_QUICKSTART.md) - Quick start guide
- [Frontend Implementation](FRONTEND_IMPLEMENTATION.md) - Implementation details

### Styling & Tailwind

- [Tailwind Start Here](TAILWIND_START_HERE.md) - Begin here for Tailwind CSS
- [Tailwind Setup](TAILWIND_SETUP.md) - Initial Tailwind configuration
- [Tailwind Guide](TAILWIND_GUIDE.md) - Comprehensive Tailwind guide
- [Tailwind Implementation](TAILWIND_IMPLEMENTATION.md) - Implementation approach
- [Tailwind Implementation Complete](TAILWIND_IMPLEMENTATION_COMPLETE.md) - Completion summary
- [Tailwind Migration Guide](TAILWIND_MIGRATION_GUIDE.md) - Migrating to Tailwind
- [Tailwind Checklist](TAILWIND_CHECKLIST.md) - Implementation checklist
- [Tailwind Quick Reference](TAILWIND_QUICK_REFERENCE.md) - Quick reference guide
- [Tailwind Complete Summary](TAILWIND_COMPLETE_SUMMARY.md) - Summary of complete setup
- [Tailwind Migration Status](TAILWIND_MIGRATION_STATUS.md) - Migration status report
- [README Tailwind](README_TAILWIND.md) - Tailwind-specific documentation

### Features & Fixes

- [Organization Create Fix](ORGANIZATION_CREATE_FIX.md) - Organization creation fixes
- [LocalStorage Fix](LOCALSTORAGE_FIX.md) - LocalStorage implementation fixes
- [Super Admin Dashboard Update](SUPER_ADMIN_DASHBOARD_UPDATE.md) - Dashboard updates

### Reports

- [Frontend Implementation Report](FRONTEND_IMPLEMENTATION_REPORT.md) - Implementation report

---

## Frontend Structure

```
frontend/
├── src/
│   ├── components/           - React components
│   ├── features/             - Feature modules
│   ├── pages/                - Page components
│   ├── routes/               - Route definitions
│   ├── services/             - API services
│   ├── contexts/             - React contexts
│   ├── styles/               - Global styles
│   ├── utils/                - Utility functions
│   ├── images/               - Image assets
│   ├── App.js                - Main App component
│   ├── App.css               - App styles
│   ├── index.js              - React entry point
│   ├── index.css             - Global CSS
│   └── setupTests.js         - Test configuration
│
├── public/                   - Static assets
├── node_modules/             - Dependencies (npm)
├── .eslintrc.json            - ESLint configuration
├── postcss.config.js         - PostCSS configuration
├── tailwind.config.js        - Tailwind CSS configuration
├── package.json              - Dependencies definition
├── package-lock.json         - Locked dependencies
├── .env.example              - Environment template
├── .env.local                - Local development env
├── .gitignore                - Git ignore rules
├── eslint-autofix.js         - ESLint auto-fix script
└── .github/                  - GitHub workflows
```

---

## Available Scripts

In the `frontend` directory, you can run:

### Development

```bash
npm start
```

Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Testing

```bash
npm test
```

Launches the test runner in interactive watch mode.

### Build for Production

```bash
npm run build
```

Builds the app for production to the `build` folder.

### Eject Configuration (⚠️ one-way operation)

```bash
npm run eject
```

Exposes all build configuration and dependencies.

### Linting

```bash
npm run lint
```

Runs ESLint to check code quality.

### ESLint Auto-fix

```bash
node eslint-autofix.js
```

Automatically fixes ESLint issues where possible.

---

## Technology Stack

### Core

- **React** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management

### Styling

- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS transformations

### Development

- **Node.js & npm** - Package management
- **ESLint** - Code quality
- **Create React App** - Build system

### Testing

- **Jest** - Test runner
- **React Testing Library** - Component testing

---

## Getting Started

### 1. Prerequisites

- Node.js 14+ and npm
- Git

### 2. Installation

```bash
cd frontend
npm install
```

### 3. Create Environment File

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API endpoint:

```
REACT_APP_API_URL=http://localhost:5000
```

### 4. Start Development Server

```bash
npm start
```

Server will run at [http://localhost:3000](http://localhost:3000)

---

## Project Setup

### Initial Setup

- [Tailwind Setup](TAILWIND_SETUP.md) - Configure Tailwind CSS
- [Frontend Quickstart](FRONTEND_QUICKSTART.md) - Full setup walkthrough

### Configuration Files

| File                 | Purpose                        |
| -------------------- | ------------------------------ |
| `package.json`       | npm dependencies and scripts   |
| `tailwind.config.js` | Tailwind CSS configuration     |
| `postcss.config.js`  | PostCSS plugins configuration  |
| `.eslintrc.json`     | ESLint rules configuration     |
| `.env.example`       | Environment variables template |

---

## Styling & CSS

### Tailwind CSS

The project uses Tailwind CSS for styling. Key resources:

- [Tailwind Start Here](TAILWIND_START_HERE.md) - Getting started guide
- [Tailwind Implementation](TAILWIND_IMPLEMENTATION.md) - How we use Tailwind
- [Tailwind Guide](TAILWIND_GUIDE.md) - Comprehensive reference

### Custom Styles

- Global styles: `src/index.css`, `src/App.css`
- Component styles: Co-located with components
- Tailwind utilities: Used directly in JSX

### Colors & Design

Configured in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      // Custom colors defined here
    }
  }
}
```

---

## Features

### Dashboard

- Super Admin Dashboard with metrics and analytics
- See [Super Admin Dashboard Update](SUPER_ADMIN_DASHBOARD_UPDATE.md) for recent changes

### Organizations

- Create and manage organizations
- Fix reference: [Organization Create Fix](ORGANIZATION_CREATE_FIX.md)

### Authentication

- User login and authentication
- Token-based authorization

### Data Management

- LocalStorage for client-side data
- See [LocalStorage Fix](LOCALSTORAGE_FIX.md) for implementation details

---

## Development Workflow

### Code Structure

```
src/
├── components/        - Reusable React components
├── features/          - Feature-specific modules
├── pages/             - Full page components
├── routes/            - Route definitions
├── services/          - API communication
├── contexts/          - React Context providers
├── utils/             - Helper functions
└── styles/            - Global stylesheets
```

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.js`)
- **Files**: camelCase for utilities, PascalCase for components
- **CSS Classes**: Tailwind utilities, BEM if custom

### Component Example

```jsx
import React from "react";
import "./ComponentName.css";

const ComponentName = ({ prop }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

---

## Building & Deployment

### Production Build

```bash
npm run build
```

Creates optimized production build in the `build/` folder.

### Build Optimization

- Code splitting
- Minification
- CSS optimization
- Image optimization

### Deployment

Frontend is typically deployed to:

- **Development**: Local development, `npm start`
- **Staging**: To be configured
- **Production**: To be configured (S3, Vercel, Netlify, etc.)

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Node Modules Issues

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ESLint Errors

```bash
# Auto-fix ESLint issues
node eslint-autofix.js

# Or manually
npm run lint -- --fix
```

### Tailwind Classes Not Working

1. Check `tailwind.config.js` includes your file paths
2. Restart development server
3. Clear PostCSS cache: `npm start` with `--reset-cache`

---

## ESLint Configuration

ESLint rules are configured in `.eslintrc.json`:

### Running ESLint

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint -- --fix

# Using the auto-fix script
node eslint-autofix.js
```

### Common Rules

- Avoid console statements in production
- Require semicolons
- Consistent indentation
- No unused variables

---

## Dependencies

### Main Dependencies

See `package.json` for the complete list:

```bash
npm list
```

### Adding New Packages

```bash
npm install package-name
npm install --save-dev package-name  # For dev dependencies
```

### Updating Packages

```bash
npm update
npm outdated  # Check for updates
```

---

## Git Workflow

### Branching

```bash
git checkout -b feature/your-feature-name
```

### Committing

```bash
git add .
git commit -m "Descriptive commit message"
```

### Pushing

```bash
git push origin feature/your-feature-name
```

---

## Performance

### Code Splitting

React Router automatically splits code by routes.

### Lazy Loading

```jsx
import { lazy, Suspense } from "react";

const LazyComponent = lazy(() => import("./Component"));

// Usage
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>;
```

### Bundle Analysis

```bash
npm install --save-dev source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'
```

---

## Testing

### Running Tests

```bash
npm test
```

### Writing Tests

Place test files alongside components:

- `Component.js`
- `Component.test.js`

### Test Example

```javascript
import { render, screen } from "@testing-library/react";
import Component from "./Component";

test("renders correctly", () => {
  render(<Component />);
  expect(screen.getByText(/text/i)).toBeInTheDocument();
});
```

---

## Environment Variables

### Configuration

Create `.env.local` from `.env.example`:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_DEBUG=false
```

### Usage in Code

```javascript
const apiUrl = process.env.REACT_APP_API_URL;
```

### Important

- Prefix with `REACT_APP_` for client-side access
- Never commit `.env.local` to git
- Add secrets to `.env.example` as placeholders

---

## API Integration

### Services

API calls are in `src/services/`:

```javascript
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const getOrganizations = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/organizations`);
    return response.data;
  } catch (error) {
    console.error("Error fetching organizations:", error);
    throw error;
  }
};
```

### Authentication

JWT tokens stored in localStorage:

```javascript
// Save token
localStorage.setItem("token", response.data.token);

// Use token in requests
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
```

---

## Documentation Links

### Internal Docs

- [FRONTEND_IMPLEMENTATION.md](FRONTEND_IMPLEMENTATION.md) - Full implementation guide
- [TAILWIND_IMPLEMENTATION.md](TAILWIND_IMPLEMENTATION.md) - Tailwind usage
- See index above for all available docs

### External Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router Docs](https://reactrouter.com)

---

## Support

For issues:

1. Check [Tailwind Start Here](TAILWIND_START_HERE.md) for CSS issues
2. Review [Frontend Implementation](FRONTEND_IMPLEMENTATION.md) for structure
3. Check component-specific documentation
4. Review application logs in browser console

---

Last Updated: February 25, 2026
