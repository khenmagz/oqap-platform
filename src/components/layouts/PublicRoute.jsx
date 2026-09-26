import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Loading } from "../skeletal_loading/Loading";

export const PublicRoute = () => {
  const { session, loading } = useAuth();

  if (loading) return <Loading />;

  // If a session exists, redirect them to the dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
