import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowRight,
  FiUser,
  FiChevronLeft,
  FiLoader,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import { supabase } from "../config/supabase";

export const GuestJoin = () => {
  const { quizCode } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState(null);

  const [guestName, setGuestName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const validateCode = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("quizzes")
          .select("id, title, is_active, due_date")
          .eq("quiz_code", quizCode)
          .maybeSingle();

        if (fetchError || !data) throw new Error("Invalid access code.");
        if (!data.is_active)
          throw new Error("This assessment is currently closed.");
        if (data.due_date && new Date(data.due_date) < new Date())
          throw new Error("The deadline has passed.");

        setQuiz(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    validateCode();
  }, [quizCode]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    setIsJoining(true);

    try {
      // Create the guest attempt in the database
      const { data: newAttempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert([
          {
            quiz_id: quiz.id,
            student_name: guestName.trim(),
            status: "in_progress",
          },
        ])
        .select("id")
        .single();

      if (attemptError) throw attemptError;

      // Save the attempt ID to local storage so the QuizPlayer knows who they are
      localStorage.setItem(`guest_attempt_${quiz.id}`, newAttempt.id);

      // Force Fullscreen & Enter Quiz
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (e) {
        console.log("Fullscreen blocked");
      }

      navigate(`/voyage/${quiz.id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to join. Please try again.");
      setIsJoining(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FDFD] flex items-center justify-center">
        <FiLoader className="text-4xl text-[#00838F] animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FDFD] flex flex-col items-center justify-center p-6 selection:bg-[#26C6DA] selection:text-[#003B46]">
      <div className="w-full max-w-md animate-fade-in-up">
        <Link
          to="/"
          className="flex items-center gap-2 text-[#006064]/60 hover:text-[#00838F] font-bold text-sm tracking-widest uppercase mb-8 transition-colors"
        >
          <FiChevronLeft className="text-xl" /> Back to Home
        </Link>

        {error ? (
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-red-100 shadow-xl text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertTriangle className="text-3xl text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-[#003B46] mb-3">
              Access Denied
            </h2>
            <p className="text-[#006064]/70 font-medium mb-8">{error}</p>
            <Link
              to="/"
              className="inline-block bg-[#00838F] hover:bg-[#006064] text-white px-8 py-3.5 rounded-xl text-sm font-black tracking-widest uppercase transition-colors shadow-md"
            >
              Try Another Code
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#006064]/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E0F7FA]/50 rounded-bl-full pointer-events-none" />

            <div className="relative z-10">
              <span className="bg-[#E0F7FA] text-[#00838F] font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#00838F]/10 mb-6 inline-block">
                Code: {quizCode}
              </span>
              <h1 className="text-3xl font-black text-[#003B46] tracking-tight mb-2">
                {quiz.title}
              </h1>
              <p className="text-sm font-medium text-[#006064]/70 mb-8">
                Please enter your full name to join the assessment.
              </p>

              <form onSubmit={handleJoin} className="space-y-6">
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#006064]/40" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={isJoining}
                    className="w-full bg-[#F8FDFD] border border-[#006064]/20 rounded-xl px-4 py-4 pl-12 text-[#003B46] font-bold focus:outline-none focus:border-[#00838F] focus:ring-4 focus:ring-[#E0F7FA] transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isJoining || !guestName.trim()}
                  className="w-full bg-[#00838F] hover:bg-[#006064] text-white py-4 rounded-xl text-sm font-black tracking-widest uppercase transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isJoining ? (
                    <FiLoader className="animate-spin text-lg" />
                  ) : (
                    <FiCheckCircle className="text-lg" />
                  )}
                  {isJoining ? "Joining..." : "Join Assessment"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
