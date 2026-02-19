// src/components/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading, initialized, hasAnyRole, logout, isAuthenticated } = useAuth();
  const location = useLocation();


  // Side effect: logout when not authenticated
  useEffect(() => {
    if (initialized && !loading && (!isAuthenticated() || !user)) {
      logout();
    }
  }, [initialized, loading, isAuthenticated, user, logout]);

  // Wait until auth is initialized
  if (!initialized || loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #2563eb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: "#6b7280" }}>Loading...</p>
      </div>
    );
  }

  // Not authenticated → redirect to login (Navigate handles the redirect)
  if (!isAuthenticated() || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      
      <Navigate
        to="/unauthorized"
        state={{
          from: location,
          message: "You do not have permission to view this page.",
        }}
        replace
      />
    );
  }

  // Authenticated & authorized
  return children;
};

export default ProtectedRoute;