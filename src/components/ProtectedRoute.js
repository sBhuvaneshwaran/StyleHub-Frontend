import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
    const { user } = useAuth();

    if (!user) {
        console.warn("[ProtectedRoute] No user found, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    const userRole = (user.role || "").toLowerCase();
    const requiredRole = (role || "").toLowerCase();

    if (role && userRole !== requiredRole) {
        console.warn(`[ProtectedRoute] Role mismatch: expected ${requiredRole}, got ${userRole}. Redirecting to home.`);
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
