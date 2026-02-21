
import React, { useEffect, useRef, useState } from "react";
import '../styles/UserDashboard.css';
import { useNavigate } from "react-router-dom";
import { statsAPI } from "../services/api";
import AlertFeed from "../features/alerts/AlertFeed";
import { AlertsProvider, AlertsContext } from "../features/alerts/alerts.context";
import Loader from './common/Loader';

const UserDashboard = () => {
  const navigate = useNavigate();

  // visitor count state
  const [visitorCount, setVisitorCount] = useState(0);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const mounted = useRef(true);

  // initial fetch
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const resp = await statsAPI.visitorCount();
        const val = resp.data?.count ?? resp.data?.total ?? 0;
        if (mounted.current) setVisitorCount(val);
      } catch {
        if (mounted.current) setVisitorCount(0);
      } finally {
        if (mounted.current) setLoadingVisitors(false);
      }
    })();
    return () => { mounted.current = false; };
  }, []);

  // polling every 5s
  useEffect(() => {
    let timer;
    const tick = async () => {
      try {
        const resp = await statsAPI.visitorCount();
        const val = resp.data?.count ?? resp.data?.total ?? 0;
        setVisitorCount(val);
      } catch { }
      timer = setTimeout(tick, 5000);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  const handleRegisterClick = () => {
    navigate("/visitor_registration");
  };

  return (
    <AlertsProvider>
      <div className="visitor-user-dashboard">
        <div className="dashboard-container">
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
              <div className="stat-number">{loadingVisitors ? <Loader size="small" type="pulse" /> : visitorCount}</div>
            </div>
          </div>

          <div className="content-row">
            <div className="quick-actions-panel">
              <h2 className="panel-title">Quick Actions</h2>
              <button className="register-btn" onClick={handleRegisterClick}>
                <span className="btn-icon">👤</span>
                Register New Visitor
              </button>

            </div>

            <div className="security-alert-panel">
              <AlertFeed />
            </div>
          </div>
        </div>
      </div>
    </AlertsProvider>
  );
};

export default UserDashboard;
