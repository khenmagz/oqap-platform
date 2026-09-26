import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loading } from "./skeletal_loading/Loading";

// We will create these two files next!
import { StudentDashboard } from "./StudentDashboard";
import { InstructorDashboard } from "./InstructorDashboard";

export const Dashboard = () => {
  const { userData, loading } = useAuth();

  // 1. Show the skeletal loading screen while Supabase fetches the secure role
  if (loading || !userData) {
    return <Loading />;
  }

  // 2. Traffic Cop Logic: Route to the correct dashboard based on database role
  if (userData.role === "instructor") {
    return <InstructorDashboard />;
  }

  if (userData.role === "student") {
    return <StudentDashboard />;
  }

  if (userData.role === "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050A12] text-white">
        <h1 className="text-2xl font-bold">
          Superadmin Dashboard Coming Soon...
        </h1>
      </div>
    );
  }

  // 3. Fallback: If their role is missing or broken, send them back to login
  return <Navigate to="/login" replace />;
};
