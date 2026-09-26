import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiLock,
  FiX,
  FiRotateCcw,
  FiTarget,
  FiClock,
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

export const Logbook = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [toast, setToast] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(true);

  // Data States
  const [groupedHistory, setGroupedHistory] = useState([]);
  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const [reviewAttempt, setReviewAttempt] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All"); // All, Passed, Failed, Perfect

  const showToast = (message, type = "info") => setToast({ message, type });

  useEffect(() => {
    const fetchFullLogbook = async () => {
      try {
        const { data: attempts, error } = await supabase
          .from("quiz_attempts")
          .select(
            `
            *,
            quizzes (id, title, max_attempts, due_date, is_active, release_grades, release_answers),
            student_answers (
              is_correct, points_awarded, given_answer,
              questions (content, correct_answer, points, options_data, question_type)
            )
          `,
          )
          .eq("student_id", userData.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false });

        if (error) throw error;

        // Group attempts by Quiz ID
        const groups = {};

        attempts.forEach((attempt) => {
          const qId = attempt.quiz_id;
          if (!groups[qId]) {
            groups[qId] = {
              quiz: attempt.quizzes,
              attempts: [],
              bestScore: 0,
              bestPercentage: 0,
              maxPossible: 0,
              latestDate: attempt.completed_at,
            };
          }

          let attemptMax = 0;
          attempt.student_answers.forEach((ans) => {
            attemptMax += ans.questions.points;
          });
          const percentage =
            attemptMax > 0 ? Math.round((attempt.score / attemptMax) * 100) : 0;

          groups[qId].attempts.push({
            ...attempt,
            maxScore: attemptMax,
            percentage,
            date: new Date(attempt.completed_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
          });

          // Track Best Score for the summary row
          if (percentage >= groups[qId].bestPercentage) {
            groups[qId].bestPercentage = percentage;
            groups[qId].bestScore = attempt.score;
            groups[qId].maxPossible = attemptMax;
          }
        });

        setGroupedHistory(Object.values(groups));
      } catch (error) {
        console.error("Error loading logbook:", error);
        showToast("Failed to load history.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (userData?.id) fetchFullLogbook();
  }, [userData?.id]);

  const toggleExpand = (quizId) => {
    setExpandedQuizId(expandedQuizId === quizId ? null : quizId);
  };

  const handleRetake = (quizId) => {
    navigate(`/voyage/${quizId}`);
  };

  // Filter & Search Logic
  const filteredHistory = groupedHistory.filter((group) => {
    const matchesSearch = group.quiz.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === "Passed") return group.bestPercentage >= 60;
    if (filter === "Failed") return group.bestPercentage < 60;
    if (filter === "Perfect") return group.bestPercentage === 100;

    return true;
  });

  return (
    <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] text-[#003B46] flex flex-col font-sans max-w-7xl mx-auto relative selection:bg-[#26C6DA] selection:text-[#003B46]">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      {/* Header & Controls */}
      <div className="mb-10 mt-4">
        <h1 className="text-3xl md:text-4xl font-black text-[#003B46] tracking-tight mb-2">
          My Logbook
        </h1>
        <p className="text-sm font-medium text-[#006064]/70 mb-8">
          Review your past assessments, track your scores, and view feedback.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-[#006064]/10 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#006064]/40 text-lg" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F8FDFD] border border-[#006064]/20 rounded-xl focus:outline-none focus:border-[#00838F] text-[#003B46] text-sm font-bold transition-colors"
            />
          </div>
          <div className="relative w-full md:w-56 shrink-0">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00838F] text-lg pointer-events-none" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F8FDFD] border border-[#006064]/20 rounded-xl focus:outline-none focus:border-[#00838F] text-[#003B46] text-sm font-bold appearance-none cursor-pointer"
            >
              <option value="All">All Results</option>
              <option value="Passed">Passed (≥60%)</option>
              <option value="Failed">Failed (&lt;60%)</option>
              <option value="Perfect">Perfect Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* The History List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-white border border-[#006064]/5 rounded-2xl shadow-sm"
            />
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#006064]/10 shadow-sm">
          <div className="w-16 h-16 bg-[#E0F7FA] rounded-full flex items-center justify-center mx-auto mb-4">
            <FiTarget className="text-3xl text-[#00838F]/50" />
          </div>
          <h3 className="text-xl font-black text-[#003B46] mb-2">
            No Records Found
          </h3>
          <p className="text-sm font-medium text-[#006064]/60">
            You haven't completed any assessments matching these filters.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredHistory.map((group) => {
            const isExpanded = expandedQuizId === group.quiz.id;

            // Retake Security Checks
            const isQuizActive = group.quiz.is_active;
            const hasTimeLeft =
              !group.quiz.due_date ||
              new Date(group.quiz.due_date) > new Date();
            const hasAttemptsLeft =
              group.quiz.max_attempts === 0 ||
              group.attempts.length < group.quiz.max_attempts;
            const canRetake = isQuizActive && hasTimeLeft && hasAttemptsLeft;

            return (
              <div
                key={group.quiz.id}
                className="bg-white rounded-2xl border border-[#006064]/10 shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* Group Summary Row (Clickable) */}
                <div
                  onClick={() => toggleExpand(group.quiz.id)}
                  className="p-5 cursor-pointer hover:bg-[#F8FDFD] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#003B46] mb-1">
                      {group.quiz.title}
                    </h3>
                    <p className="text-xs font-bold text-[#006064]/50">
                      Completed {group.attempts.length}{" "}
                      {group.attempts.length === 1 ? "time" : "times"}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-[#00838F] uppercase tracking-widest mb-0.5">
                        Best Score
                      </p>
                      {group.quiz.release_grades ? (
                        <p
                          className={`font-black text-xl ${group.bestPercentage >= 60 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {group.bestScore}{" "}
                          <span className="text-sm text-[#00838F]">
                            / {group.maxPossible}
                          </span>
                        </p>
                      ) : (
                        <p className="font-bold text-gray-400 flex items-center justify-end gap-1.5 text-sm mt-1">
                          <FiLock /> Hidden
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#F8FDFD] border border-[#006064]/10 flex items-center justify-center shrink-0">
                      {isExpanded ? (
                        <FiChevronUp className="text-[#00838F] text-lg" />
                      ) : (
                        <FiChevronDown className="text-[#00838F] text-lg" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Attempts List */}
                {isExpanded && (
                  <div className="bg-[#F8FDFD] border-t border-[#006064]/5 p-5 space-y-3">
                    <h4 className="text-[10px] font-black text-[#00838F] uppercase tracking-widest mb-3">
                      Attempt History
                    </h4>

                    {group.attempts.map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className="bg-white p-4 rounded-xl border border-[#006064]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-[#E0F7FA] text-[#00838F] font-black text-sm flex items-center justify-center shrink-0">
                            #{group.attempts.length - index}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#003B46] flex items-center gap-2">
                              <FiClock className="text-[#006064]/40" />{" "}
                              {attempt.date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          {group.quiz.release_grades && (
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-black tracking-wider ${attempt.percentage >= 60 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}
                            >
                              {attempt.score} / {attempt.maxScore}
                            </span>
                          )}

                          {group.quiz.release_answers ? (
                            <button
                              onClick={() => setReviewAttempt(attempt)}
                              className="text-[#00838F] hover:text-[#006064] font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-colors bg-[#E0F7FA]/50 hover:bg-[#E0F7FA] px-3 py-1.5 rounded-lg"
                            >
                              <FiEye className="text-sm" /> Review
                            </button>
                          ) : (
                            <span className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                              <FiLock className="text-sm" /> Locked
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Security-Checked Retake Button */}
                    {canRetake ? (
                      <div className="pt-3 flex justify-end">
                        <button
                          onClick={() => handleRetake(group.quiz.id)}
                          className="bg-[#00838F] hover:bg-[#006064] text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-colors shadow-sm hover:-translate-y-0.5"
                        >
                          <FiRotateCcw className="text-base" /> Retake
                          Assessment
                        </button>
                      </div>
                    ) : (
                      <div className="pt-3 text-right">
                        <p className="text-[10px] font-bold text-[#006064]/50 uppercase tracking-widest">
                          {group.quiz.max_attempts > 0 &&
                          group.attempts.length >= group.quiz.max_attempts
                            ? "Max attempts reached"
                            : "Assessment Closed"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* POST-DIVE REVIEW MODAL */}
      {reviewAttempt && (
        <div className="fixed inset-0 z-[100] bg-[#003B46]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden border border-[#006064]/10 animate-fade-in-up">
            <div className="bg-[#F8FDFD] p-6 border-b border-[#006064]/10 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs font-black text-[#00838F] uppercase tracking-widest mb-1">
                  Feedback Report
                </p>
                <h2 className="text-2xl font-black text-[#003B46] tracking-tight">
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
