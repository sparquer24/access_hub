import React from 'react';

export default function AlertModal({ imageUrl, open, onClose }) {
  if (!open) return null;
  return (
    <div className="alerts-modal-overlay" onClick={onClose}>
      <div className="alerts-modal" onClick={(e) => e.stopPropagation()}>
        <button className="alerts-modal-close" onClick={onClose}>✕</button>
        {imageUrl ? (
          <img src={imageUrl} alt="alert" className="alerts-modal-image" />
        ) : (
          <div className="alerts-no-image">No image available</div>
        )}
      </div>
    </div>
  );
}
