// App.js
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ToastProvider } from './contexts/ToastContext';
import RoutesV2 from './routes/RoutesV2';
import Layout from './components/layout/Layout';
import './App.css';

// Brand the Ant Design components (Table, Modal, Form, DatePicker, etc.)
// with the same teal used across the Tailwind side of the app, so pages
// built on AntD (Employee area, org tabs) stop looking like default AntD.
const antdTheme = {
  token: {
    colorPrimary: '#0d9488',
    colorInfo: '#0d9488',
    borderRadius: 10,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

function App() {
  return (
    <ConfigProvider theme={antdTheme}>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <SubscriptionProvider>
              <ToastProvider>
                <div className="App">
                  <Layout>
                    <RoutesV2 />
                  </Layout>
                </div>
              </ToastProvider>
            </SubscriptionProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </ConfigProvider>
  );
}

export default App;
