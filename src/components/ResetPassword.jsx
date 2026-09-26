import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiAnchor, FiLock, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";

export const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(newPassword);

    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#80DEEA]/20 to-[#050A12] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FiAnchor className="text-3xl text-[#006064]" />
            <span className="text-3xl font-bold text-[#006064] tracking-widest">
              DEPTH
            </span>
          </div>
          <p className="text-[#006064]/70 text-sm">Set a new password</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#64FFDA]/10 flex items-center justify-center">
                <FiCheck className="text-3xl text-[#64FFDA]" />
              </div>
              <h3 className="text-xl font-bold text-[#FFF4E6] mb-2">
                Password Updated!
              </h3>
              <p className="text-[#E0F7FA]/60 text-sm">
                Your password has been successfully reset. Redirecting to
                login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-[#E0F7FA]/80 text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#006064]/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#0D1B2A]/50 border border-white/10 rounded-xl px-4 py-3 pl-11 pr-12 text-[#FFF4E6] placeholder-[#E0F7FA]/30 focus:outline-none focus:border-[#64FFDA]/50 transition-colors"
                    placeholder="Min 6 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#006064]/50 hover:text-[#64FFDA] transition-colors"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[#E0F7FA]/80 text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#006064]/50" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0D1B2A]/50 border border-white/10 rounded-xl px-4 py-3 pl-11 pr-12 text-[#FFF4E6] placeholder-[#E0F7FA]/30 focus:outline-none focus:border-[#64FFDA]/50 transition-colors"
                    placeholder="Confirm your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#006064]/50 hover:text-[#64FFDA] transition-colors"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#006064] hover:bg-[#00838F] text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(0,96,100,0.3)] hover:shadow-[0_0_50px_rgba(0,96,100,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  "Reset Password"
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-[#006064]/70 hover:text-[#64FFDA] transition-colors text-sm"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
