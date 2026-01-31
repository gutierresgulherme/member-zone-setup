
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getLoggedUser } from '../../supabaseStore';
import { UserRole } from '../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
    const user = getLoggedUser();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && user.role !== UserRole.ADMIN) {
        return <Navigate to="/student/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
