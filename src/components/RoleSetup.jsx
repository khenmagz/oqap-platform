import React, { useState } from "react";
import { FiBookOpen, FiPieChart, FiAnchor, FiArrowRight } from "react-icons/fi";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

export const RoleSetup = () => {
  const [loading, setLoading] = useState(false);
  // Removed checkUser from here
  const { userData } = useAuth();

  const handleSelectRole = async (selectedRole) => {
    setLoading(true);
    try {
      // 1. Guarantee we have the exact Auth ID directly from Supabase
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) throw new Error("Could not find your secure session token.");

      // 2. Perform the update AND force Supabase to return the row (.select)
      const { data, error } = await supabase
        .from("user_profiles")
        .update({ role: selectedRole })
        .eq("id", userId)
        .select();

      if (error) throw error;

      // 3. If data comes back empty, the database RLS blocked it
      if (!data || data.length === 0) {
        throw new Error(
          "Update blocked by database security (RLS). Please run the SQL policy.",
        );
      }

      // 4. Success! Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error setting role:", error);
      alert(error.message || "Failed to set role. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle background ambient glows to keep it premium but mostly white */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#E0F7FA]/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#E0F7FA]/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-5xl w-full z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-16">
          <FiAnchor className="text-4xl text-[#26C6DA]" />
          <span className="text-4xl font-black tracking-[0.2em] text-[#003B46]">
            DEPTH
          </span>
        </div>

        {/* Main Text */}
        <div className="text-center mb-16 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black text-[#003B46] mb-6 tracking-tight">
            How will you use DEPTH?
          </h1>
          <p className="text-lg text-[#006064]/60 font-medium">
            Personalize your experience. Choose your primary role to set up your
            dashboard and tailored tools.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Student Card */}
          <button
            onClick={() => handleSelectRole("student")}
            disabled={loading}
            className="group relative flex flex-col items-start p-10 bg-white rounded-[2rem] border-2 border-gray-100 transition-all duration-500 hover:border-[#26C6DA] hover:shadow-[0_20px_40px_-15px_rgba(38,198,218,0.2)] hover:-translate-y-1 text-left overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#E0F7FA]/50 rounded-bl-full -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-150" />

            <div className="w-16 h-16 bg-[#F8FDFD] border border-gray-100 rounded-2xl flex items-center justify-center mb-8 relative z-10 group-hover:bg-white group-hover:border-[#26C6DA]/30 transition-colors duration-500 shadow-sm">
              <FiBookOpen className="text-3xl text-[#00838F] group-hover:text-[#26C6DA] transition-colors duration-500" />
            </div>

            <h3 className="text-2xl font-black text-[#003B46] mb-3 relative z-10">
              I am a Student
            </h3>
            <p className="text-[#006064]/60 font-medium leading-relaxed relative z-10 mb-8">
              Access your Practice Arena, join classes, take quizzes, and track
              your learning progress over time.
            </p>

            <div className="mt-auto flex items-center gap-2 text-[#26C6DA] font-bold text-sm uppercase tracking-widest relative z-10 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
              Select Role <FiArrowRight className="text-lg" />
            </div>
          </button>

          {/* Instructor Card */}
          <button
            onClick={() => handleSelectRole("instructor")}
            disabled={loading}
            className="group relative flex flex-col items-start p-10 bg-white rounded-[2rem] border-2 border-gray-100 transition-all duration-500 hover:border-[#26C6DA] hover:shadow-[0_20px_40px_-15px_rgba(38,198,218,0.2)] hover:-translate-y-1 text-left overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#E0F7FA]/50 rounded-bl-full -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-150" />

            <div className="w-16 h-16 bg-[#F8FDFD] border border-gray-100 rounded-2xl flex items-center justify-center mb-8 relative z-10 group-hover:bg-white group-hover:border-[#26C6DA]/30 transition-colors duration-500 shadow-sm">
              <FiPieChart className="text-3xl text-[#00838F] group-hover:text-[#26C6DA] transition-colors duration-500" />
            </div>

            <h3 className="text-2xl font-black text-[#003B46] mb-3 relative z-10">
              I am an Instructor
            </h3>
            <p className="text-[#006064]/60 font-medium leading-relaxed relative z-10 mb-8">
              Create AI-powered assessments, manage student rosters, and dive
              deep into performance analytics.
            </p>

            <div className="mt-auto flex items-center gap-2 text-[#26C6DA] font-bold text-sm uppercase tracking-widest relative z-10 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
              Select Role <FiArrowRight className="text-lg" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
