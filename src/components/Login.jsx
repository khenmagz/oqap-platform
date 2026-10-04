import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAnchor,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiChevronRight,
  FiSun,
  FiTrendingUp,
  FiBarChart2,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
  };

  const brandDark = "#003B46";
  const brandMedium = "#006B7D";

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#E0F7FA] via-[#B2EBF2] to-[#80DEEA]">
      {/* ===== GLOBAL BACKGROUND ELEMENTS ===== */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-[#FFF4E6]/40 blur-[100px] -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#E0F7FA]/50 blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/30 backdrop-blur-sm"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 90 + 5}%`,
              animation: `bubble-float ${Math.random() * 12 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[45%] pointer-events-none z-0">
        <div className="absolute bottom-0 w-full overflow-hidden">
          <svg
            className="w-full h-auto animate-wave-slow"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ minWidth: "200%", height: "160px" }}
          >
            <defs>
              <linearGradient id="leftWave1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#26C6DA" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00838F" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d="M0,160 C360,240 480,80 720,140 C960,200 1080,240 1440,160 L1440,320 L0,320 Z"
              fill="url(#leftWave1)"
            />
          </svg>
        </div>
        <div className="absolute bottom-0 w-full overflow-hidden">
          <svg
            className="w-full h-auto animate-wave-medium"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ minWidth: "200%", height: "180px" }}
          >
            <defs>
              <linearGradient id="leftWave2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4DD0E1" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#26C6DA" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0097A7" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d="M0,200 C240,120 480,280 720,200 C960,120 1200,280 1440,200 L1440,320 L0,320 Z"
              fill="url(#leftWave2)"
            />
          </svg>
        </div>
        <div className="absolute bottom-0 w-full overflow-hidden">
          <svg
            className="w-full h-auto animate-wave-fast"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ minWidth: "200%", height: "200px" }}
          >
            <defs>
              <linearGradient id="leftWave3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#80DEEA" stopOpacity="0.8" />
                <stop offset="30%" stopColor="#4DD0E1" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#26C6DA" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              d="M0,240 C200,160 400,300 600,240 C800,180 1000,300 1200,240 C1300,210 1400,260 1440,220 L1440,320 L0,320 Z"
              fill="url(#leftWave3)"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-12 lg:gap-16 px-6 py-12">
        <div className="hidden lg:flex flex-col flex-1 max-w-lg">
          <div className="flex items-center gap-3 mb-8 group">
            <FiAnchor
              className="text-5xl group-hover:rotate-12 transition-transform duration-500"
              style={{ color: brandDark }}
            />
            <span
              className="text-5xl font-black tracking-[0.2em]"
              style={{ color: brandDark }}
            >
              DEPTH
            </span>
          </div>
          <h1
            className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            style={{ color: brandDark }}
          >
            Your score is
            <br />
            <span style={{ color: brandMedium }}>only the surface.</span>
          </h1>
          <p
            className="text-lg leading-relaxed mb-10 font-medium max-w-md"
            style={{ color: brandDark, opacity: 0.85 }}
          >
            Welcome back. Dive into your analytics dashboard and discover what
            lies beneath your quiz results.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/50 backdrop-blur-md rounded-full border border-white/60 shadow-sm hover:scale-105 transition-transform">
              <FiTrendingUp style={{ color: brandDark }} className="text-lg" />
              <span
                className="font-semibold text-sm"
                style={{ color: brandDark }}
              >
                Track Progress
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/50 backdrop-blur-md rounded-full border border-white/60 shadow-sm hover:scale-105 transition-transform">
              <FiBarChart2 style={{ color: brandDark }} className="text-lg" />
              <span
                className="font-semibold text-sm"
                style={{ color: brandDark }}
              >
                Deep Analytics
              </span>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white/50 backdrop-blur-md rounded-full border border-white/60 shadow-sm hover:scale-105 transition-transform">
              <FiSun style={{ color: brandDark }} className="text-lg" />
              <span
                className="font-semibold text-sm"
                style={{ color: brandDark }}
              >
                Learn Smarter
              </span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center items-center gap-2 mb-8">
            <FiAnchor className="text-3xl" style={{ color: brandDark }} />
            <span
              className="text-3xl font-black tracking-[0.2em]"
              style={{ color: brandDark }}
            >
              DEPTH
            </span>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 md:p-10 border border-white/60 shadow-[0_30px_80px_rgba(0,59,70,0.15)]">
            <div className="mb-8 text-center lg:text-left">
              <h2
                className="text-3xl font-extrabold mb-2"
                style={{ color: brandDark }}
              >
                Welcome Back
              </h2>
              <p
                className="font-medium"
                style={{ color: brandDark, opacity: 0.7 }}
              >
                Sign in to continue your journey
              </p>
            </div>

            {/* Google Authentication Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-[#003B46] font-bold py-3.5 px-4 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md mb-6"
            >
              <FcGoogle className="text-2xl" />
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#003B46]/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 font-bold tracking-widest text-[#003B46]/40 uppercase bg-transparent backdrop-blur-md rounded-full">
                  OR EMAIL
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-3 font-medium">
                  <span className="text-red-500 text-xl">⚠</span>
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label
                  className={`block text-sm font-bold transition-colors duration-300 ${isFocused.email || email ? "text-[#003B46]" : "text-[#003B46]/60"}`}
                >
                  Email Address
                </label>
                <div
                  className={`relative transition-all duration-300 ${isFocused.email ? "scale-[1.02]" : ""}`}
                >
                  <FiMail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-all duration-300 ${isFocused.email || email ? "text-[#003B46]" : "text-[#003B46]/40"}`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused({ ...isFocused, email: true })}
                    onBlur={() => setIsFocused({ ...isFocused, email: false })}
                    className="w-full bg-white/80 border rounded-2xl px-4 py-4 pl-12 font-medium text-[#003B46] placeholder-[#003B46]/30 focus:outline-none transition-all duration-300"
                    style={{
                      borderColor: isFocused.email
                        ? brandMedium
                        : "rgba(255,255,255,0.5)",
                      boxShadow: isFocused.email
                        ? `0 0 0 4px ${brandMedium}20`
                        : "none",
                    }}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`block text-sm font-bold transition-colors duration-300 ${isFocused.password || password ? "text-[#003B46]" : "text-[#003B46]/60"}`}
                >
                  Password
                </label>
                <div
                  className={`relative transition-all duration-300 ${isFocused.password ? "scale-[1.02]" : ""}`}
                >
                  <FiLock
                    className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-all duration-300 ${isFocused.password || password ? "text-[#003B46]" : "text-[#003B46]/40"}`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() =>
                      setIsFocused({ ...isFocused, password: true })
                    }
                    onBlur={() =>
                      setIsFocused({ ...isFocused, password: false })
                    }
                    className="w-full bg-white/80 border rounded-2xl px-4 py-4 pl-12 pr-12 font-medium text-[#003B46] placeholder-[#003B46]/30 focus:outline-none transition-all duration-300"
                    style={{
                      borderColor: isFocused.password
                        ? brandMedium
                        : "rgba(255,255,255,0.5)",
                      boxShadow: isFocused.password
                        ? `0 0 0 4px ${brandMedium}20`
                        : "none",
                    }}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[#003B46]/40 hover:text-[#003B46] transition-all duration-300"
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-xl" />
                    ) : (
                      <FiEye className="text-xl" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold hover:underline transition-colors duration-300"
                    style={{ color: brandMedium }}
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden rounded-2xl mt-4 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                style={{ backgroundColor: brandDark }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="flex items-center justify-center gap-3 px-6 py-4 text-white font-bold text-lg">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Dive In</span>
                      <FiArrowRight className="text-xl group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="text-center mt-8">
              <p className="font-medium text-[#003B46]/70">
                New to the depths?{" "}
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-1 font-bold transition-colors duration-300 hover:underline"
                  style={{ color: brandMedium }}
                >
                  <span>Create your account</span>
                  <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes wave-slow { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes wave-medium { 0% { transform: translateX(0); } 100% { transform: translateX(-45%); } }
        @keyframes wave-fast { 0% { transform: translateX(0); } 100% { transform: translateX(-40%); } }
        @keyframes bubble-float {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.1; }
          25% { transform: translateY(-40px) translateX(15px) scale(1.2); opacity: 0.4; }
          50% { transform: translateY(-80px) translateX(-10px) scale(0.8); opacity: 0.2; }
          75% { transform: translateY(-40px) translateX(20px) scale(1.4); opacity: 0.5; }
        }
        .animate-wave-slow { animation: wave-slow 35s linear infinite; }
        .animate-wave-medium { animation: wave-medium 25s linear infinite; }
        .animate-wave-fast { animation: wave-fast 18s linear infinite; }
      `}</style>
    </div>
  );
};
