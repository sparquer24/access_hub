import React from "react";

const QuickActions = ({ onRegisterClick }) => {
  return (
    <div className="quick-actions-panel">
      <h2 className="panel-title">Quick Actions</h2>
      <button className="register-btn" onClick={onRegisterClick}>
        <span className="btn-icon">👤</span>
        Register New Visitor
      </button>
      <button className="register-btn-existing">
        <span className="btn-icon">👤</span>
        Existing Users
      </button>
    </div>
  );
};

export default QuickActions;
