import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiTarget,
  FiClock,
  FiActivity,
  FiAlertTriangle,
  FiChevronLeft,
  FiCheckCircle,
  FiX,
  FiLock,
  FiEye,
  FiAlertCircle,
  FiKey,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../config/supabase";
import { Toast } from "./ui/Toast";

// TRANSLATOR HELPER FUNCTION
const translateAnswer = (rawAnswer, questionData) => {
  if (rawAnswer === null || rawAnswer === undefined || rawAnswer === "")
    return "No Answer Provided";

  try {
    const qType = questionData.question_type;
    const options = questionData.options_data || [];

    if (qType === "mcq") {
      const idx = parseInt(rawAnswer, 10);
      return options[idx] || "Unknown Option";
    }

    if (qType === "multiple_response") {
      const parsedArr =
        typeof rawAnswer === "string" ? JSON.parse(rawAnswer) : rawAnswer;
      if (Array.isArray(parsedArr)) {
        return parsedArr
          .map((idx) => options[idx])
          .filter(Boolean)
          .join("  •  ");
      }
    }

    return String(rawAnswer).replace(/"/g, "");
  } catch (e) {
    return String(rawAnswer).replace(/"/g, "");
  }
};

export const StudentDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [toast, setToast] = useState({ message: "", type: "" });
  const [quizCode, setQuizCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState(null);
  const [attemptData, setAttemptData] = useState({ used: 0, max: 1 });

  const [history, setHistory] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const [reviewAttempt, setReviewAttempt] = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: attempts, error } = await supabase
          .from("quiz_attempts")
          .select(
            `*, quizzes (title, release_grades, release_answers),
            student_answers (is_correct, points_awarded, given_answer, questions (content, correct_answer, points, options_data, question_type))`,
          )
          .eq("student_id", userData.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false });

        if (error) throw error;

        let totalEarned = 0;
        let totalPossible = 0;

        const processedHistory = (attempts || []).map((attempt) => {
          let attemptMax = 0;
          attempt.student_answers.forEach((ans) => {
            attemptMax += ans.questions.points;
          });

          totalEarned += attempt.score;
          totalPossible += attemptMax;

          return {
            ...attempt,
            maxScore: attemptMax,
            percentage:
              attemptMax > 0
                ? Math.round((attempt.score / attemptMax) * 100)
                : 0,
            date: new Date(attempt.completed_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          };
        });

        setHistory(processedHistory);
        setAverageScore(
          totalPossible > 0
            ? Math.round((totalEarned / totalPossible) * 100)
            : 0,
        );
      } catch (error) {
        console.error("Error loading quiz history:", error);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    if (userData?.id) fetchHistory();
  }, [userData?.id]);

  const handleJoinQuiz = async (e) => {
    e.preventDefault();
    if (!quizCode.trim())
      return showToast("Please enter a valid access code.", "error");
    setIsValidating(true);

    try {
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("*, questions(count)")
        .eq("quiz_code", quizCode)
        .maybeSingle();

      if (quizError || !quiz) {
        showToast("Invalid code. Assessment not found.", "error");
        setIsValidating(false);
        return;
      }

      if (!quiz.is_active) {
        showToast(
          "This assessment is currently closed by the instructor.",
          "error",
        );
        setIsValidating(false);
        return;
      }

      if (quiz.due_date && new Date(quiz.due_date) < new Date()) {
        showToast("The deadline for this assessment has passed.", "error");
        setIsValidating(false);
        return;
      }

      const { count: attemptsCount, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("quiz_id", quiz.id)
        .eq("student_id", userData.id);

      if (attemptsError) throw attemptsError;

      if (quiz.max_attempts > 0 && attemptsCount >= quiz.max_attempts) {
        showToast(
          `You have exhausted all ${quiz.max_attempts} attempts.`,
          "error",
        );
        setIsValidating(false);
        return;
      }

      setAttemptData({ used: attemptsCount || 0, max: quiz.max_attempts });
      setPendingQuiz({ ...quiz, questionCount: quiz.questions[0].count });
    } catch (error) {
      showToast("Failed to connect to the server.", "error");
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartQuiz = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem
          .requestFullscreen()
          .catch((err) => console.warn("Fullscreen blocked:", err));
      }
      navigate(`/voyage/${pendingQuiz.id}`);
    } catch (error) {
      showToast("Failed to initialize assessment.", "error");
    }
  };

  const formatDeadline = (dateString) => {
    if (!dateString) return "No Deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] text-[#003B46] flex flex-col font-sans max-w-7xl mx-auto relative selection:bg-[#26C6DA] selection:text-[#003B46]">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      {!pendingQuiz ? (
        <>
          <div className="relative mb-16 max-w-4xl mt-4">
            <div className="flex items-center gap-2 mb-4 opacity-70">
              <FiKey className="text-[#00838F]" />
              <span className="text-xs font-black uppercase tracking-widest text-[#006064]">
                Join Assessment
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#003B46] tracking-tight mb-8 leading-tight">
              Enter your access code.
            </h1>
            <form onSubmit={handleJoinQuiz} className="relative group max-w-xl">
              <input
                type="text"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                placeholder="E.G. SWU-8472"
                disabled={isValidating}
                className="w-full bg-white border border-[#006064]/20 rounded-2xl shadow-sm text-2xl md:text-3xl font-black text-[#00838F] placeholder-[#006064]/20 px-8 py-6 focus:outline-none focus:border-[#00838F] focus:ring-4 focus:ring-[#E0F7FA] transition-all uppercase tracking-widest disabled:opacity-50"
                maxLength={8}
                required
              />
              <button
                type="submit"
                disabled={isValidating}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${isValidating ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#00838F] hover:bg-[#006064] text-white shadow-md hover:-translate-y-0.5"}`}
              >
                <FiArrowRight
                  className={`text-2xl ${isValidating ? "animate-pulse" : ""}`}
                />
              </button>
            </form>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 border-t border-[#006064]/10 pt-12 flex-1">
            <div className="lg:col-span-7">
              <h2 className="text-xl font-black text-[#003B46] mb-6 tracking-wide">
                Assessment History
              </h2>
              <div className="space-y-4">
                {isHistoryLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-24 bg-white border border-[#006064]/5 rounded-2xl shadow-sm" />
                    <div className="h-24 bg-white border border-[#006064]/5 rounded-2xl shadow-sm" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#006064]/10 p-10 text-center shadow-sm">
                    <FiTarget className="text-4xl text-[#00838F]/30 mx-auto mb-3" />
                    <p className="font-bold text-[#003B46] text-lg">
                      No assessments completed yet.
                    </p>
                    <p className="text-sm font-medium text-[#006064]/60 mt-1">
                      Your past results will appear here.
                    </p>
                  </div>
                ) : (
                  history.map((attempt) => (
                    <div
                      key={attempt.id}
                      onClick={() =>
                        attempt.quizzes.release_answers &&
                        setReviewAttempt(attempt)
                      }
                      className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${attempt.quizzes.release_answers ? "bg-white border-[#006064]/10 hover:border-[#00838F]/50 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div>
                        <h3 className="font-bold text-[#003B46] text-lg leading-tight mb-1">
                          {attempt.quizzes.title}
                        </h3>
                        <p className="text-xs font-bold text-[#006064]/50">
                          {attempt.date}
                        </p>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-[#00838F] uppercase tracking-widest mb-0.5">
                            Score
                          </p>
                          {attempt.quizzes.release_grades ? (
                            <p
                              className={`font-black text-lg ${attempt.percentage >= 60 ? "text-emerald-600" : "text-red-500"}`}
                            >
                              {attempt.score}{" "}
                              <span className="text-sm text-gray-400">
                                / {attempt.maxScore}
                              </span>
                            </p>
                          ) : (
                            <p className="font-bold text-gray-400 flex items-center justify-end gap-1.5 text-sm mt-1">
                              <FiLock /> Hidden
                            </p>
                          )}
                        </div>
                        {attempt.quizzes.release_answers && (
                          <div className="w-8 h-8 rounded-full bg-[#E0F7FA] text-[#00838F] flex items-center justify-center">
                            <FiEye className="text-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <h2 className="text-xl font-black text-[#003B46] mb-6 tracking-wide">
                Performance Overview
              </h2>
              <div className="bg-white p-8 rounded-3xl border border-[#006064]/10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E0F7FA]/50 rounded-bl-full pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-5xl font-black text-[#003B46] tracking-tighter mb-2">
                    {averageScore}
                    <span className="text-2xl text-[#00838F]">%</span>
                  </p>
                  <p className="font-bold text-[#006064]/50 uppercase tracking-widest text-xs mb-8">
                    Overall Average
                  </p>

                  <div className="space-y-4">
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00838F] transition-all duration-1000 rounded-full"
                        style={{ width: `${averageScore}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-[#006064]/60 leading-relaxed">
                      {history.length === 0
                        ? "Complete your first assessment to begin tracking your overall performance."
                        : "Based on your total points earned across all completed assessments."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-3xl mx-auto w-full animate-fade-in-up mt-8">
          <button
            onClick={() => setPendingQuiz(null)}
            className="flex items-center gap-2 text-[#006064]/60 hover:text-[#00838F] font-bold text-sm tracking-widest uppercase mb-8 transition-colors"
          >
            <FiChevronLeft className="text-xl" /> Cancel
          </button>

          <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#006064]/10 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-[#E0F7FA] text-[#00838F] font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#00838F]/10">
                  CODE: {pendingQuiz.quiz_code}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#003B46] tracking-tight mb-8">
                {pendingQuiz.title}
              </h1>

              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FDFD] border border-[#006064]/5">
                  <div className="p-3 bg-white shadow-sm border border-[#006064]/5 rounded-xl text-[#00838F]">
                    <FiTarget className="text-lg" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#006064]/50 uppercase tracking-widest mb-0.5">
                      Volume
                    </p>
                    <p className="font-bold text-[#003B46]">
                      {pendingQuiz.questionCount} Questions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FDFD] border border-[#006064]/5">
                  <div className="p-3 bg-white shadow-sm border border-[#006064]/5 rounded-xl text-[#00838F]">
                    <FiActivity className="text-lg" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#006064]/50 uppercase tracking-widest mb-0.5">
                      Attempts
                    </p>
                    <p className="font-bold text-[#003B46]">
                      {pendingQuiz.max_attempts === 0
                        ? "Unlimited"
                        : `Attempt ${attemptData.used + 1} of ${attemptData.max}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FDFD] border border-[#006064]/5 sm:col-span-2">
                  <div className="p-3 bg-white shadow-sm border border-[#006064]/5 rounded-xl text-[#00838F]">
                    <FiClock className="text-lg" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#006064]/50 uppercase tracking-widest mb-0.5">
                      Deadline
                    </p>
                    <p className="font-bold text-[#003B46]">
                      {formatDeadline(pendingQuiz.due_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-200 mb-8">
                <FiAlertTriangle className="text-amber-500 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 text-sm mb-1">
                    Secure Environment Warning
                  </p>
                  <p className="text-xs font-medium text-amber-700/80 leading-relaxed">
                    Once you begin, your screen will be locked. Do not refresh,
                    minimize the window, or switch tabs, as this will trigger a
                    security violation and auto-submit your attempt.
                  </p>
                </div>
              </div>

              <button
                onClick={handleStartQuiz}
                className="w-full bg-[#00838F] hover:bg-[#006064] text-white rounded-2xl py-4 font-black tracking-widest uppercase transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
              >
                <FiCheckCircle className="text-lg" /> Begin Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewAttempt && (
        <div className="fixed inset-0 z-[100] bg-[#003B46]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden border border-[#006064]/10 animate-fade-in-up">
            <div className="bg-[#F8FDFD] p-6 border-b border-[#006064]/10 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs font-black text-[#00838F] uppercase tracking-widest mb-1">
                  Feedback Report
                </p>
                <h2 className="text-2xl font-black text-[#003B46]">
                  {reviewAttempt.quizzes.title}
                </h2>
              </div>
              <div className="flex items-center gap-6">
                {reviewAttempt.quizzes.release_grades && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-[#006064]/50 uppercase tracking-widest mb-0.5">
                      Final Score
                    </p>
                    <p
                      className={`font-black text-xl ${reviewAttempt.percentage >= 60 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {reviewAttempt.score}{" "}
                      <span className="text-sm text-gray-400">
                        / {reviewAttempt.maxScore}
                      </span>
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setReviewAttempt(null)}
                  className="p-2 bg-gray-50 text-gray-400 hover:text-[#003B46] rounded-xl transition-colors border border-gray-100 hover:bg-gray-100"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 flex-1 bg-white">
              {reviewAttempt.student_answers.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border ${ans.is_correct ? "border-emerald-100 bg-emerald-50/30" : "border-red-100 bg-red-50/30"}`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="mt-0.5 shrink-0">
                      {ans.is_correct ? (
                        <FiCheckCircle className="text-emerald-500 text-lg" />
                      ) : (
                        <FiAlertCircle className="text-red-500 text-lg" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#003B46] leading-relaxed">
                        <span
                          className={`mr-1 ${ans.is_correct ? "text-emerald-600" : "text-red-500"}`}
                        >
                          Q{idx + 1}.
                        </span>{" "}
                        {ans.questions.content}
                      </p>
                      <p className="text-[10px] font-black tracking-widest uppercase text-[#00838F] mt-1.5">
                        {ans.points_awarded} / {ans.questions.points} Points
                      </p>
                    </div>
                  </div>

                  <div className="ml-8 grid sm:grid-cols-2 gap-3 text-sm font-medium">
                    <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-black text-[#006064]/40 uppercase tracking-widest mb-1.5">
                        Your Answer
                      </p>
                      <p
                        className={`font-bold ${ans.is_correct ? "text-emerald-700" : "text-red-600"}`}
                      >
                        {translateAnswer(ans.given_answer, ans.questions)}
                      </p>
                    </div>
                    {!ans.is_correct && (
                      <div className="bg-[#F8FDFD] p-3.5 rounded-xl border border-[#006064]/5">
                        <p className="text-[10px] font-black text-[#00838F] uppercase tracking-widest mb-1.5">
                          Correct Answer
                        </p>
                        <p className="text-[#003B46] font-bold">
                          {translateAnswer(
                            ans.questions.correct_answer,
                            ans.questions,
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
