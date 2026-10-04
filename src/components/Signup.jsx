import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAnchor,
  FiMail,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiBookOpen,
  FiPieChart,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

export const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ password: false });
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const brandTeal = "#26C6DA";

  const passwordCriteria = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPasswordValid) {
      setError("Please ensure your password meets all requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, "student");

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate("/login");
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0A0F14] text-white">
      <Link
        to="/"
        className="absolute top-8 left-6 md:left-12 z-50 flex items-center gap-2 text-gray-400 hover:text-[#26C6DA] transition-colors font-bold text-xs uppercase tracking-widest"
      >
        <FiChevronLeft className="text-lg" /> Back to Home
      </Link>

      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#003B46]/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#006B7D]/20 blur-[150px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-16 px-6 py-12 mt-12 lg:mt-0">
        <div className="hidden lg:flex flex-col flex-1 max-w-lg">
          <div className="flex items-center gap-3 mb-8 group">
            <FiAnchor className="text-5xl text-[#26C6DA] group-hover:rotate-12 transition-transform duration-500" />
            <span className="text-5xl font-black tracking-[0.2em] text-white">
              DEPTH
            </span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Begin your <br />
            <span style={{ color: brandTeal }}>learning voyage.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-10 font-medium max-w-md text-gray-300">
            Create a student account to access your personal Practice Arena,
            generate AI flashcards, and track your mastery over time.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
              <FiBookOpen className="text-lg text-[#26C6DA]" />
              <span className="font-semibold text-sm">Practice Arena</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
              <FiPieChart className="text-lg text-[#26C6DA]" />
              <span className="font-semibold text-sm">Track Progress</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md lg:max-w-lg mt-8 lg:mt-0">
          <div className="lg:hidden flex justify-center items-center gap-2 mb-8">
            <FiAnchor className="text-3xl text-[#26C6DA]" />
            <span className="text-3xl font-black tracking-[0.2em] text-white">
              DEPTH
            </span>
          </div>

          <div className="bg-[#121A21]/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-10 border border-white/10 shadow-2xl">
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold mb-2 text-white">
                Student Portal
              </h2>
              <p className="font-medium text-gray-400">
                Register for student access
              </p>
            </div>

            <button
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-[#003B46] font-bold py-3.5 px-4 rounded-2xl transition-colors mb-6"
            >
              <FcGoogle className="text-2xl" />
              Sign up with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 font-bold tracking-widest text-gray-500 uppercase bg-[#121A21] rounded-full">
                  OR EMAIL
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-3 font-medium">
                  <span className="text-xl">⚠</span>
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#0A0F14] border border-gray-700 rounded-2xl px-4 py-3.5 pl-12 font-medium text-white placeholder-gray-600 focus:border-[#26C6DA] focus:ring-1 focus:ring-[#26C6DA] focus:outline-none transition-all"
                    placeholder="Jane Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0A0F14] border border-gray-700 rounded-2xl px-4 py-3.5 pl-12 font-medium text-white placeholder-gray-600 focus:border-[#26C6DA] focus:ring-1 focus:ring-[#26C6DA] focus:outline-none transition-all"
                    placeholder="student@university.edu"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onFocus={() =>
                      setIsFocused({ ...isFocused, password: true })
                    }
                    onBlur={() =>
                      setIsFocused({ ...isFocused, password: false })
                    }
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0A0F14] border border-gray-700 rounded-2xl px-4 py-3.5 pl-12 pr-12 font-medium text-white placeholder-gray-600 focus:border-[#26C6DA] focus:ring-1 focus:ring-[#26C6DA] focus:outline-none transition-all"
                    placeholder="Secure password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-xl" />
                    ) : (
                      <FiEye className="text-xl" />
                    )}
                  </button>
                </div>
              </div>

              {(isFocused.password || password.length > 0) && (
                <div className="bg-[#0A0F14] border border-gray-800 rounded-xl p-4 mt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                    Password Requirements
                  </p>
                  <ul className="space-y-1.5 text-xs font-bold">
                    <li
                      className={`flex items-center gap-2 transition-colors ${passwordCriteria.length ? "text-[#26C6DA]" : "text-gray-500"}`}
                    >
                      {passwordCriteria.length ? (
                        <FiCheckCircle />
                      ) : (
                        <FiXCircle />
                      )}{" "}
                      At least 8 characters
                    </li>
                    <li
                      className={`flex items-center gap-2 transition-colors ${passwordCriteria.uppercase ? "text-[#26C6DA]" : "text-gray-500"}`}
                    >
                      {passwordCriteria.uppercase ? (
                        <FiCheckCircle />
                      ) : (
                        <FiXCircle />
                      )}{" "}
                      One uppercase letter
                    </li>
                    <li
                      className={`flex items-center gap-2 transition-colors ${passwordCriteria.lowercase ? "text-[#26C6DA]" : "text-gray-500"}`}
                    >
                      {passwordCriteria.lowercase ? (
                        <FiCheckCircle />
                      ) : (
                        <FiXCircle />
                      )}{" "}
                      One lowercase letter
                    </li>
                    <li
                      className={`flex items-center gap-2 transition-colors ${passwordCriteria.number ? "text-[#26C6DA]" : "text-gray-500"}`}
                    >
                      {passwordCriteria.number ? (
                        <FiCheckCircle />
                      ) : (
                        <FiXCircle />
                      )}{" "}
                      One number
                    </li>
                    <li
                      className={`flex items-center gap-2 transition-colors ${passwordCriteria.special ? "text-[#26C6DA]" : "text-gray-500"}`}
                    >
                      {passwordCriteria.special ? (
                        <FiCheckCircle />
                      ) : (
                        <FiXCircle />
                      )}{" "}
                      One special character
                    </li>
                  </ul>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0A0F14] border border-gray-700 rounded-2xl px-4 py-3.5 pl-12 pr-12 font-medium text-white placeholder-gray-600 focus:border-[#26C6DA] focus:ring-1 focus:ring-[#26C6DA] focus:outline-none transition-all"
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading || !isPasswordValid || password !== confirmPassword
                }
                className="w-full bg-[#26C6DA] hover:bg-[#4DD0E1] text-[#003B46] rounded-2xl mt-6 px-6 py-4 font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Registering..." : "Create Student Account"}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="font-medium text-gray-400 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-[#26C6DA] hover:text-white font-bold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
