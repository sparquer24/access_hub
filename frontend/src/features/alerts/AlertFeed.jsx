import React, { useContext, useState } from 'react';
import './alerts.css';
import { resolveImageUrl } from './alerts.api';
import AlertCard from './AlertCard';
import AlertModal from './AlertModal';
import { AlertsContext } from './alerts.context';

export default function AlertFeed() {
  const { alerts, markHandled } = useContext(AlertsContext);
  const [modal, setModal] = useState({ open: false, imageUrl: null });

  const handleViewImage = (url) => setModal({ open: true, imageUrl: url });
  const handleClose = () => setModal({ open: false, imageUrl: null });

  const handleMarkHandled = (alert) => {
    markHandled(alert);
  };

  return (
    <div className="alerts-feed">
      <div className="alerts-header">
        <h3>Security Alerts <span className="alerts-badge">{alerts.length}</span></h3>
      </div>

      <div className="alerts-list">
        {alerts.length === 0 && <div className="alerts-empty">No alerts</div>}
        {alerts.map((a) => (
          <AlertCard key={`${a.image_id}-${a.timestamp}`} alert={a} onMarkHandled={handleMarkHandled} onViewImage={handleViewImage} />
        ))}
      </div>

      <AlertModal open={modal.open} imageUrl={modal.imageUrl} onClose={handleClose} />
    </div>
  );
}
