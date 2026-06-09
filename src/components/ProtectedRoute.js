import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Protects routes while the auth state initializes and optionally enforces owner role
const ProtectedRoute = ({ children, role, requireOwner = false }) => {
    const { user, loadingAuth } = useAuth();

    // While we are determining auth state, don't render anything (could show a spinner)
    if (loadingAuth) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Support either a specific role string or the boolean requireOwner flag
    const userRole = (user.role || "").toLowerCase();
    if (requireOwner && !user.is_shop_owner && userRole !== "owner") {
        return <Navigate to="/" replace />;
    }

    if (role && userRole !== role.toLowerCase()) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
