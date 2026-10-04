import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Loading } from "../skeletal_loading/Loading";
import { Navbar } from "../Navbar";

export const ProtectedLayout = () => {
  // Destructure userData to check their profile
  const { session, userData, loading } = useAuth();

  // 1. Wait for Supabase to confirm the auth state securely
  if (loading) return <Loading />;

  // 2. Strict Check: If there is no active session, kick them back to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 3. The Intercept: If they used Google and don't have a role yet, force them to setup
  if (userData && !userData.role) {
    return <Navigate to="/role-setup" replace />;
  }

  // 4. Clean Layout: Standard block layout with a left margin.
  return (
    <div className="min-h-screen bg-[#F8FDFD]">
      <Navbar />
      <main className="md:ml-64 min-h-screen p-6">
        <Outlet />
      </main>
    </div>
  );
};
