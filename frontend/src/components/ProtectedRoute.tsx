import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../api/auth";

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
