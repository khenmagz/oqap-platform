import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiBook,
  FiActivity,
  FiCheckCircle,
  FiTarget,
  FiClock,
  FiAlertCircle,
  FiX
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

export const StudentClassDashboard = () => {
  const { classId } = useParams();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const [activeTab, setActiveTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [reviewAttempt, setReviewAttempt] = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });

  useEffect(() => {
    if (!userData?.id || !classId) return;

    const fetchClassDashboardData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Class
        const { data: cData, error: cError } = await supabase
          .from("classes")
          .select("id, name")
          .eq("id", classId)
          .single();
        if (cError) throw cError;
        setClassData(cData);

        // 2. Fetch Quizzes
        const { data: quizzesData, error: qError } = await supabase
          .from("quizzes")
          .select("*, questions(count)")
          .eq("class_id", classId)
          .order("created_at", { ascending: false });
        if (qError) throw qError;

        if (!quizzesData || quizzesData.length === 0) {
          setPendingQuizzes([]);
          setHistory([]);
          setAverageScore(0);
          setIsLoading(false);
          return;
        }

        // 3. Fetch Student's Attempts
        const { data: attemptsData, error: aError } = await supabase
          .from("quiz_attempts")
          .select(`
            *,
            quizzes (title, release_grades, release_answers),
            student_answers (is_correct, points_awarded, given_answer, questions (content, correct_answer, points, options_data, question_type))
          `)
          .eq("student_id", userData.id)
          .in(
            "quiz_id",
            quizzesData.map((q) => q.id)
          );
        if (aError) throw aError;

        // Process History
        let totalEarned = 0;
        let totalPossible = 0;
        const processedHistory = (attemptsData || [])
          .filter((a) => a.status === "completed")
          .map((attempt) => {
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
                attemptMax > 0 ? Math.round((attempt.score / attemptMax) * 100) : 0,
              date: new Date(attempt.completed_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            };
          })
          .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

        setHistory(processedHistory);
        setAverageScore(
          totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0
        );

        // Process Pending Quizzes
        // A quiz is pending ONLY if the student has 0 completed attempts for it.
        const pending = quizzesData.filter((quiz) => {
          if (!quiz.is_active) return false;
          if (quiz.due_date && new Date(quiz.due_date) < new Date()) return false;

          const completedAttempts = (attemptsData || []).filter(
            (a) => a.quiz_id === quiz.id && a.status === "completed"
          );
          
          // If they have completed it at least once, it moves out of "To Do"
          return completedAttempts.length === 0;
        });

        setPendingQuizzes(pending);
      } catch (err) {
        console.error("Dashboard error:", err);
        showToast("Failed to load dashboard data.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassDashboardData();
  }, [userData?.id, classId]);

  if (isLoading) {
    return (
      <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] flex items-center justify-center">
        <div className="text-[#00838F] font-black uppercase tracking-widest animate-pulse">
          Loading Class Dashboard...
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-black text-[#003B46] mb-4">Class Not Found</h2>
        <Link to="/dashboard" className="text-[#00838F] font-bold uppercase tracking-widest">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] text-[#003B46] flex flex-col font-sans max-w-7xl mx-auto relative selection:bg-[#26C6DA] selection:text-[#003B46]">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />

      {/* Header */}
      <div className="mb-8 mt-4 animate-fade-in-up">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-[#006064]/60 hover:text-[#00838F] font-bold text-xs uppercase tracking-widest transition-colors mb-6"
        >
          <FiArrowLeft className="text-lg" /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-[#003B46] tracking-tight mb-2">
              {classData.name}
            </h1>
            <p className="text-sm md:text-base font-medium text-[#006064]/70">
              Welcome to your private student view for this class.
            </p>
          </div>
          
          <div className="bg-white px-8 py-4 rounded-2xl shadow-sm border border-[#006064]/10 shrink-0 text-center">
            <p className="text-[10px] font-black text-[#00838F] uppercase tracking-widest mb-1">
              Class Average
            </p>
            <div className="flex items-end justify-center gap-1">
              <span className={`text-4xl font-black ${averageScore >= 60 ? "text-emerald-500" : averageScore > 0 ? "text-amber-500" : "text-[#003B46]"}`}>
                {averageScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#006064]/10 mb-8 animate-fade-in-up">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-4 px-2 font-bold text-sm tracking-widest uppercase transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "pending"
              ? "text-[#00838F] border-[#00838F]"
              : "text-[#006064]/50 border-transparent hover:text-[#003B46]"
          }`}
        >
          <FiTarget className="text-lg" /> To Do ({pendingQuizzes.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-4 px-2 font-bold text-sm tracking-widest uppercase transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "history"
              ? "text-[#00838F] border-[#00838F]"
              : "text-[#006064]/50 border-transparent hover:text-[#003B46]"
          }`}
        >
          <FiActivity className="text-lg" /> Completed ({history.length})
        </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in-up animation-delay-100">
        {activeTab === "pending" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingQuizzes.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-[#006064]/10 shadow-sm">
                <div className="bg-[#E0F7FA]/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle className="text-2xl text-[#00838F]" />
                </div>
                <h3 className="text-xl font-black text-[#003B46] mb-2">You're All Caught Up!</h3>
                <p className="text-[#006064]/70 font-medium">No pending assessments for this class.</p>
              </div>
            ) : (
              pendingQuizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white rounded-2xl p-6 border border-[#006064]/10 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#E0F7FA]/30 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
                  
                  <div className="relative z-10 flex-1">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 mb-4 inline-block">
                      Action Required
                    </span>
                    <h3 className="text-xl font-black text-[#003B46] mb-2 line-clamp-2">{quiz.title}</h3>
                    
                    <div className="space-y-2 mt-4 mb-6">
                      <p className="text-xs font-bold text-[#006064]/70 flex items-center gap-2">
                        <FiClock className="text-[#00838F]" /> 
                        Due: {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : "No Deadline"}
                      </p>
                      <p className="text-xs font-bold text-[#006064]/70 flex items-center gap-2">
                        <FiTarget className="text-[#00838F]" />
                        Questions: {quiz.questions?.[0]?.count || 0}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/voyage/${quiz.id}`)}
                    className="w-full bg-[#00838F] hover:bg-[#006064] text-white rounded-xl py-3 text-sm font-black tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 relative z-10"
                  >
                    Start Now <FiArrowLeft className="text-lg rotate-180" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#006064]/10 shadow-sm">
                <div className="bg-[#E0F7FA]/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiActivity className="text-2xl text-[#00838F]" />
                </div>
                <h3 className="text-xl font-black text-[#003B46] mb-2">No Completed Quizzes</h3>
                <p className="text-[#006064]/70 font-medium">Your completed attempts for this class will appear here.</p>
              </div>
            ) : (
              history.map((attempt) => {
                const quiz = attempt.quizzes;
                const canRetake =
                  quiz.is_active &&
                  (!quiz.due_date || new Date(quiz.due_date) >= new Date()) &&
                  (quiz.max_attempts === 0 ||
                    history.filter((a) => a.quiz_id === attempt.quiz_id).length <
                      quiz.max_attempts);

                return (
                  <div key={attempt.id} className="bg-white rounded-2xl p-6 border border-[#006064]/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                    <div>
                      <h3 className="text-xl font-black text-[#003B46] mb-1">{quiz.title}</h3>
                      <p className="text-xs font-bold text-[#006064]/60 uppercase tracking-widest flex items-center gap-1.5">
                        <FiClock /> Completed on {attempt.date}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {quiz.release_grades ? (
                        <div className="text-right">
                          <p className="text-[10px] font-black text-[#00838F] uppercase tracking-widest mb-0.5">Score</p>
                          <p className={`font-black text-2xl ${attempt.percentage >= 60 ? "text-emerald-500" : "text-amber-500"}`}>
                            {attempt.score} <span className="text-sm text-gray-400">/ {attempt.maxScore}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Score</p>
                          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending Release</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2 border-l border-[#006064]/10 pl-4">
                        <button
                          onClick={() => setReviewAttempt(attempt)}
                          className="bg-[#F8FDFD] hover:bg-[#E0F7FA] text-[#00838F] border border-[#00838F]/10 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors w-full"
                        >
                          Review
                        </button>
                        {canRetake && (
                          <button
                            onClick={() => navigate(`/voyage/${attempt.quiz_id}`)}
                            className="bg-[#00838F] hover:bg-[#006064] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors w-full shadow-sm"
                          >
                            Retake
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* REVIEW MODAL */}
      {reviewAttempt && (
        <div className="fixed inset-0 z-[100] bg-[#003B46]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden border border-[#006064]/10 animate-fade-in-up">
            <div className="bg-[#F8FDFD] p-6 border-b border-[#006064]/10 flex items-center justify-between shrink-0">
              <div>
                <p className="text-xs font-black text-[#00838F] uppercase tracking-widest mb-1">Feedback Report</p>
                <h2 className="text-2xl font-black text-[#003B46]">{reviewAttempt.quizzes.title}</h2>
              </div>
              <div className="flex items-center gap-6">
                {reviewAttempt.quizzes.release_grades && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-[#006064]/50 uppercase tracking-widest mb-0.5">Final Score</p>
                    <p className={`font-black text-xl ${reviewAttempt.percentage >= 60 ? "text-emerald-600" : "text-red-500"}`}>
                      {reviewAttempt.score} <span className="text-sm text-gray-400">/ {reviewAttempt.maxScore}</span>
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
                <div key={idx} className={`p-5 rounded-2xl border ${ans.is_correct ? "border-emerald-100 bg-emerald-50/30" : "border-red-100 bg-red-50/30"}`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="mt-0.5 shrink-0">
                      {ans.is_correct ? <FiCheckCircle className="text-emerald-500 text-lg" /> : <FiAlertCircle className="text-red-500 text-lg" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#003B46] leading-relaxed">
                        <span className={`mr-1 ${ans.is_correct ? "text-emerald-600" : "text-red-500"}`}>Q{idx + 1}.</span> {ans.questions.content}
                      </p>
                      <p className="text-[10px] font-black tracking-widest uppercase text-[#00838F] mt-1.5">
                        {ans.points_awarded} / {ans.questions.points} Points
                      </p>
                    </div>
                  </div>

                  <div className="ml-8 grid sm:grid-cols-2 gap-3 text-sm font-medium">
                    <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-black text-[#006064]/40 uppercase tracking-widest mb-1.5">Your Answer</p>
                      <p className={`font-bold ${ans.is_correct ? "text-emerald-700" : "text-red-600"}`}>
                        {translateAnswer(ans.given_answer, ans.questions)}
                      </p>
                    </div>
                    {!ans.is_correct && (
                      <div className="bg-[#F8FDFD] p-3.5 rounded-xl border border-[#006064]/5">
                        <p className="text-[10px] font-black text-[#00838F] uppercase tracking-widest mb-1.5">Correct Answer</p>
                        <p className="text-[#003B46] font-bold">
                          {translateAnswer(ans.questions.correct_answer, ans.questions)}
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
