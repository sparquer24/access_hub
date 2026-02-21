import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PrivateRoute from './PrivateRoute';

const RoleBasedRoute = ({ children, roles }) => {
  const { user, hasRole } = useAuth();

  return (
    <PrivateRoute>
      {hasRole(roles) ? (
        children
      ) : (
        <Navigate to="/unauthorized" replace />
      )}
    </PrivateRoute>
  );
};

export default RoleBasedRoute;
