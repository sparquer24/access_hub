import React from 'react';
import { resolveImageUrl } from './alerts.api';

export default function AlertCard({ alert, onMarkHandled, onViewImage }) {
  const imageUrl = resolveImageUrl(alert);
  const time = alert.timestamp ? new Date(alert.timestamp).toLocaleString() : '-';

  return (
    <div className="alerts-card">
      <div className="alerts-card-left">
        <div className="alerts-visitor">{alert.visitor_id}</div>
        <div className="alerts-meta">Cam: {alert.cam_id} · {alert.status}</div>
      </div>
      <div className="alerts-card-right">
        <div className="alerts-time">{time}</div>
        <div className="alerts-actions">
          {imageUrl && (
            <button className="alerts-btn" onClick={() => onViewImage(imageUrl)}>View Image</button>
          )}
          <button className="alerts-btn mute" onClick={() => onMarkHandled(alert)}>Mark Handled</button>
        </div>
      </div>
    </div>
  );
}
