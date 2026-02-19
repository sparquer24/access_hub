import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import "../styles/AdminDashboard.css";
import RegisterVisitorPopup from "./common/RegisterVisitorPopup";
import Loader from './common/Loader';
import AlertFeed from "../features/alerts/AlertFeed";
import { AlertsProvider, AlertsContext } from "../features/alerts/alerts.context";
import { statsAPI } from "../services/api";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // visitor count state
  const [visitorCount, setVisitorCount] = useState(0);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const mounted = useRef(true);

  // initial fetch with organization context
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const token = authService.getAccessToken();
        if (!token || !user?.organization_id) {
          if (mounted.current) setVisitorCount(0);
          if (mounted.current) setLoadingVisitors(false);
          return;
        }

        // Use organization-specific visitor count
        const response = await fetch(`${API_BASE_URL}/api/v2/organizations/${user.organization_id}/visitors/count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const val = result.data?.count ?? result.data?.total ?? 0;
          if (mounted.current) setVisitorCount(val);
        } else {
          // Fallback to statsAPI
          const resp = await statsAPI.visitorCount();
          const val = resp.data?.count ?? resp.data?.total ?? 0;
          if (mounted.current) setVisitorCount(val);
        }
      } catch {
        if (mounted.current) setVisitorCount(0);
      } finally {
        if (mounted.current) setLoadingVisitors(false);
      }
    })();
    return () => { mounted.current = false; };
  }, [user]);

  // simple polling every 30s (reduced frequency)
  useEffect(() => {
    if (!user?.organization_id) return;

    const tick = async () => {
      try {
        const token = authService.getAccessToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/v2/organizations/${user.organization_id}/visitors/count`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const val = result.data?.count ?? result.data?.total ?? 0;
          setVisitorCount(val);
        }
      } catch {
        // ignore errors in polling
      }
      setTimeout(tick, 30000); // 30 seconds instead of 5
    };

    const pollTimer = setTimeout(tick, 30000);
    return () => clearTimeout(pollTimer);
  }, [user]);

  const handleExistingUsersClick = () => {
    // Navigate based on user role
    if (user?.role?.name === 'org_admin') {
      navigate("/org-admin/employees");
    } else if (user?.role?.name === 'super_admin') {
      navigate("/super-admin/employees");
    } else {
      navigate("/admin/existing-users");
    }
  };

  // Registered visitors card is intentionally static now (no navigation)

  useEffect(() => {
    const onDeleted = () => {
      setVisitorCount((c) => Math.max(0, c - 1));
    };
    window.addEventListener('visitors:deleted', onDeleted);
    return () => window.removeEventListener('visitors:deleted', onDeleted);
  }, []);

  return (
    <AlertsProvider>
      <div className="admin-user-dashboard">
        <div className="dashboard-container">
          {/* Stats Cards */}
          <div className="stats-row">
            <AlertsContext.Consumer>
              {({ alerts }) => (
                <div className="stat-card alert-card">
                  <h3 className="stat-title">Active Security Alerts</h3>
                  <div className="stat-number">{alerts.length}</div>
                </div>
              )}
            </AlertsContext.Consumer>

            <div className="stat-card visitor-card">
              <h3 className="stat-title">Total Registered Visitors</h3>
              <div className="stat-number">
                {loadingVisitors ? <Loader size="small" type="pulse" /> : visitorCount}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="content-row">
            {/* Quick Actions */}
            <div className="quick-actions-panel">
              <h2 className="panel-title">Quick Actions</h2>

              <button
                onClick={() => setIsPopupOpen(true)}
                className="register-btn"
              >
                <span className="btn-icon">👤</span>
                Register New User
              </button>

              <button
                onClick={handleExistingUsersClick}
                className="register-btn-existing"
              >
                <span className="btn-icon">👤</span>
                Existing Users
              </button>
            </div>

            {/* Security Alert Panel (live feed) */}
            <div className="security-alert-panel">
              <AlertFeed />
            </div>
          </div>
        </div>

        {/* Popup */}
        <RegisterVisitorPopup
          visible={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
        />
      </div>
    </AlertsProvider>
  );
};

export default AdminDashboard;
