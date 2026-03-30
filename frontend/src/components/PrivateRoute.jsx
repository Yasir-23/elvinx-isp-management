import React from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && allowedRoles.length > 0) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!allowedRoles.includes(payload.role)) {
        return <Navigate to="/" replace />;
      }
    } catch (err) {
      console.error("Token decode error:", err);
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
