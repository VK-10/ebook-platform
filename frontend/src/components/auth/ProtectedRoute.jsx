import React, { Children } from 'react'
import { Navigate, useLocation } from 'react-router-dom';


const ProtectedRoute = ({children}) => {
    const isAuthentication  = false;
    const loading = false;
    const location = useLocation();

    if (loading) {
        return <div> Loading...</div>
    }

    if (!isAuthentication) {
        return <Navigate to ="/login" state = {{ from: location }} replace />;
    }
  return (
    children
  )
}

export default ProtectedRoute