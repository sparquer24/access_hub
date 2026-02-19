// App.js
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ToastProvider } from './contexts/ToastContext';
import RoutesV2 from './routes/RoutesV2';
import Layout from './components/layout/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SubscriptionProvider>
          <ToastProvider>
            <div className="App">
              <Layout>
                <RoutesV2 />
              </Layout>
            </div>
          </ToastProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
