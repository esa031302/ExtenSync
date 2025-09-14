import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PortalProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Only beneficiaries can access protected portal pages
  if (!user || user.role !== 'Beneficiary') {
    // Redirect to portal home and include intended path for potential future use
    const search = new URLSearchParams({
      message: 'Please log in as a beneficiary to continue',
      redirect: location.pathname
    }).toString();
    return <Navigate to={`/portal?${search}`} replace />;
  }

  return children;
};

export default PortalProtectedRoute;


