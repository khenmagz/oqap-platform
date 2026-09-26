import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiAnchor, FiMail, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error);
    } else {
      setSent(true);
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
          <p className="text-[#006064]/70 text-sm">Reset your password</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#64FFDA]/10 flex items-center justify-center">
                <FiMail className="text-3xl text-[#64FFDA]" />
              </div>
              <h3 className="text-xl font-bold text-[#FFF4E6] mb-2">
                Check your email
              </h3>
              <p className="text-[#E0F7FA]/60 text-sm mb-6">
                We've sent a password reset link to{" "}
                <strong className="text-[#64FFDA]">{email}</strong>
              </p>
              <Link
                to="/login"
                className="text-[#64FFDA] hover:underline font-medium transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-[#E0F7FA]/60 text-sm">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[#E0F7FA]/80 text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#006064]/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0D1B2A]/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-[#FFF4E6] placeholder-[#E0F7FA]/30 focus:outline-none focus:border-[#64FFDA]/50 transition-colors"
                    placeholder="you@example.com"
                    required
                  />
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
                  "Send Reset Link"
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-[#006064]/70 hover:text-[#64FFDA] transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <FiArrowLeft className="text-xs" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
