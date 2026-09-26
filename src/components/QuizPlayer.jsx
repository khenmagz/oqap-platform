import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronRight,
  FiChevronLeft,
  FiLock,
  FiShield,
  FiMaximize,
  FiFileText,
} from "react-icons/fi";
import { supabase } from "../config/supabase";
import { useAuth } from "../hooks/useAuth";
import { Toast } from "./ui/Toast";

export const QuizPlayer = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [toast, setToast] = useState({ message: "", type: "" });
  const showToast = (message, type = "info") => setToast({ message, type });

  // Core Quiz State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security State
  const [quizStarted, setQuizStarted] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [modal, setModal] = useState({ show: false, type: "", data: null });

  // --- INITIALIZATION ---
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("shuffle_questions, max_attempts")
          .eq("id", quizId)
          .single();
        if (quizError) throw quizError;

        const { data: qData, error: qError } = await supabase
          .from("secure_questions_view")
          .select("*")
          .eq("quiz_id", quizId)
          .order("order_index", { ascending: true });
        if (qError) throw qError;

        let finalQuestions = [...qData];
        if (quizData.shuffle_questions) {
          for (let i = finalQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [finalQuestions[i], finalQuestions[j]] = [
              finalQuestions[j],
              finalQuestions[i],
            ];
          }
        }
        setQuestions(finalQuestions);

        const guestAttemptId = localStorage.getItem(`guest_attempt_${quizId}`);

        if (guestAttemptId) {
          setAttemptId(guestAttemptId);
        } else if (userData) {
          const { data: existingAttempt } = await supabase
            .from("quiz_attempts")
            .select("id")
            .eq("quiz_id", quizId)
            .eq("student_id", userData.id)
            .eq("status", "in_progress")
            .maybeSingle();

          if (existingAttempt) {
            setAttemptId(existingAttempt.id);
          } else {
            const { count: attemptsCount } = await supabase
              .from("quiz_attempts")
              .select("*", { count: "exact", head: true })
              .eq("quiz_id", quizId)
              .eq("student_id", userData.id);

            if (
              quizData.max_attempts > 0 &&
              attemptsCount >= quizData.max_attempts
            ) {
              setModal({ show: true, type: "exhausted", data: null });
              setLoading(false);
              return;
            }

            const { data: newAttempt, error: attemptError } = await supabase
              .from("quiz_attempts")
              .insert([
                {
                  quiz_id: quizId,
                  student_id: userData.id,
                  status: "in_progress",
                },
              ])
              .select("id")
              .single();

            if (attemptError) throw attemptError;
            setAttemptId(newAttempt.id);
          }
        } else {
          navigate("/", { replace: true });
          return;
        }

        const savedDraft = localStorage.getItem(`quiz_draft_${quizId}`);
        if (savedDraft) setAnswers(JSON.parse(savedDraft));
      } catch (error) {
        console.error("Initialization error:", error);
        navigate("/", { replace: true });
      } finally {
        if (modal.type !== "exhausted") {
          setLoading(false);
          setModal({ show: true, type: "start", data: null });
        }
      }
    };

    if (userData || localStorage.getItem(`guest_attempt_${quizId}`)) {
      initializeQuiz();
    }
  }, [quizId, userData, navigate]);

  // --- SECURITY: THE 3-STRIKE ENGINE ---
  const handleSecurityViolation = useCallback(() => {
    if (
      !quizStarted ||
      isSubmitting ||
      modal.type === "strike" ||
      modal.type === "terminated"
    )
      return;

    const newStrikes = strikes + 1;
    setStrikes(newStrikes);

    if (newStrikes >= 3) {
      setModal({ show: true, type: "terminated", data: null });
      setTimeout(() => executeSubmit(), 3000);
    } else {
      setModal({ show: true, type: "strike", data: newStrikes });
    }
  }, [quizStarted, isSubmitting, modal.type, strikes]);

  useEffect(() => {
    if (!quizStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) handleSecurityViolation();
    };
    const handleBlur = () => handleSecurityViolation();
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) handleSecurityViolation();
    };

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setModal({ show: true, type: "confirmExit", data: null });
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [quizStarted, handleSecurityViolation]);

  // --- QUIZ LOGIC ---
  const startQuiz = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.log("Fullscreen blocked by browser");
    }
    setModal({ show: false, type: "", data: null });
    setQuizStarted(true);
  };

  const handleAnswer = (questionId, answerData) => {
    const newAnswers = { ...answers, [questionId]: answerData };
    setAnswers(newAnswers);
    localStorage.setItem(`quiz_draft_${quizId}`, JSON.stringify(newAnswers));
  };

  const attemptSubmit = () => {
    const missing = [];
    questions.forEach((q, index) => {
      const ans = answers[q.id];
      if (
        ans === undefined ||
        ans === null ||
        ans === "" ||
        (Array.isArray(ans) && ans.length === 0)
      ) {
        missing.push(index + 1);
      }
    });

    if (missing.length > 0) {
      setModal({ show: true, type: "incomplete", data: missing });
    } else {
      setModal({ show: true, type: "confirmSubmit", data: null });
    }
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);
    setModal({ show: false, type: "", data: null });

    try {
      const payload = questions.map((q) => {
        let given = answers[q.id];
        if (q.question_type === "multiple_response" && Array.isArray(given))
          given = given.sort();
        return {
          question_id: q.id,
          given_answer: given !== undefined ? given : null,
        };
      });

      const { error: rpcError } = await supabase.rpc("grade_assessment", {
        p_attempt_id: attemptId,
        p_answers: payload,
      });
      if (rpcError) throw rpcError;

      localStorage.removeItem(`quiz_draft_${quizId}`);
      if (document.fullscreenElement)
        document.exitFullscreen?.().catch(() => {});

      // Conditional Routing applied here
      navigate(userData ? "/dashboard" : "/", { replace: true });
    } catch (error) {
      console.error("Submission failed:", error);
      showToast(
        "Failed to submit results. Please verify your internet connection.",
        "error",
      );
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FDFD] flex-col gap-4">
        <FiShield className="text-5xl text-[#00838F] animate-pulse" />
        <span className="text-sm font-black tracking-widest text-[#003B46] uppercase">
          SECURING ENVIRONMENT...
        </span>
      </div>
    );

  const currentQ = questions[currentIndex];
  const missingQuestions = modal.type === "incomplete" ? modal.data : [];

  return (
    <div
      className="min-h-screen bg-[#F8FDFD] flex flex-col font-sans selection:bg-[#26C6DA] selection:text-[#003B46]"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      {modal.show && (
        <div className="fixed inset-0 z-[999] bg-[#003B46]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl text-center border border-[#006064]/10 animate-fade-in-up">
            {modal.type === "exhausted" && (
              <>
                <div className="bg-red-50 p-4 rounded-full inline-block mb-6 border border-red-100">
                  <FiLock className="text-4xl text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-[#003B46] mb-3">
                  Access Denied
                </h2>
                <p className="text-sm font-medium text-[#006064]/70 mb-8 leading-relaxed">
                  You have exhausted all allowed attempts for this assessment.
                </p>
                <button
                  // Conditional Routing applied here
                  onClick={() =>
                    navigate(userData ? "/dashboard" : "/", { replace: true })
                  }
                  className="w-full bg-[#00838F] hover:bg-[#006064] text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-colors shadow-md"
                >
                  Return
                </button>
              </>
            )}

            {modal.type === "start" && (
              <>
                <div className="bg-[#E0F7FA] p-4 rounded-full inline-block mb-6 border border-[#00838F]/10">
                  <FiMaximize className="text-4xl text-[#00838F]" />
                </div>
                <h2 className="text-2xl font-black text-[#003B46] mb-3">
                  Assessment Ready
                </h2>
                <p className="text-sm font-medium text-[#006064]/70 mb-8 leading-relaxed">
                  This is a secure testing environment. Clicking start will
                  enter fullscreen mode. Exiting fullscreen or switching windows
                  will result in a security strike.
                </p>
                <button
                  onClick={startQuiz}
                  className="w-full bg-[#00838F] hover:bg-[#006064] text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <FiLock className="text-lg" /> Begin Securely
                </button>
              </>
            )}

            {modal.type === "incomplete" && (
              <>
                <div className="bg-amber-50 p-4 rounded-full inline-block mb-6 border border-amber-100">
                  <FiAlertTriangle className="text-4xl text-amber-500" />
                </div>
                <h2 className="text-2xl font-black text-[#003B46] mb-3">
                  Unanswered Questions
                </h2>
                <p className="text-sm font-medium text-[#006064]/70 mb-6">
                  You cannot submit yet. Please provide an answer for the
                  following questions:
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-8">
                  {missingQuestions.map((num) => (
                    <span
                      key={num}
                      className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-lg text-sm font-black"
                    >
                      {num}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setModal({ show: false, type: "", data: null })
                  }
                  className="w-full bg-[#00838F] hover:bg-[#006064] text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-colors shadow-md"
                >
                  Return to Assessment
                </button>
              </>
            )}

            {modal.type === "strike" && (
              <>
                <div className="bg-red-50 p-4 rounded-full inline-block mb-6 border border-red-100">
                  <FiShield className="text-4xl text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-red-600 mb-3">
                  Security Violation
                </h2>
                <p className="text-sm font-medium text-[#006064]/70 mb-6">
                  Focus lost! You exited fullscreen, switched tabs, or opened
                  another application.
                </p>
                <div className="bg-white border border-red-200 text-red-600 p-3 rounded-xl font-black text-lg mb-8 shadow-sm">
                  Strike {modal.data} of 3
                </div>
                <button
                  onClick={async () => {
                    try {
                      if (!document.fullscreenElement)
                        await document.documentElement.requestFullscreen();
                    } catch (e) {}
                    setModal({ show: false, type: "", data: null });
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-colors shadow-md shadow-red-600/20"
                >
                  I Understand
                </button>
              </>
            )}

            {modal.type === "terminated" && (
              <>
                <div className="bg-red-50 p-4 rounded-full inline-block mb-6 border border-red-100">
                  <FiLock className="text-4xl text-red-600" />
                </div>
                <h2 className="text-2xl font-black text-red-600 mb-3">
                  Assessment Terminated
                </h2>
                <p className="text-sm font-medium text-[#006064]/70 mb-8">
                  You have reached 3 security strikes. Your assessment is being
                  automatically submitted with your current answers.
                </p>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-red-600 h-full animate-[progress_3s_linear_forwards]"></div>
                </div>
              </>
            )}

            {modal.type === "confirmSubmit" && (
              <>
                <div className="bg-emerald-50 p-4 rounded-full inline-block mb-6 border border-emerald-100">
                  <FiCheckCircle className="text-4xl text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-[#003B46] mb-3">
                  Submit Assessment?
                </h2>
                <p className="text-sm font-medium text-[#006064]/70 mb-8">
                  You have answered all questions. You cannot return or change
                  your answers after this point.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setModal({ show: false, type: "", data: null })
                    }
                    className="flex-1 bg-gray-50 border border-gray-200 text-[#006064] py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#00838F] hover:bg-[#006064] text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-colors shadow-md"
                  >
                    Submit
                  </button>
                </div>
              </>
            )}

            {modal.type === "confirmExit" && (
              <>
                <div className="bg-red-50 p-4 rounded-full inline-block mb-6 border border-red-100">
                  <FiAlertTriangle className="text-4xl text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-[#003B46] mb-3">
                  Emergency Exit?
                </h2>
                <p className="text-sm font-medium text-[#006064]/70 mb-8">
                  Exiting now will end your assessment. Your current progress
                  will NOT be graded.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setModal({ show: false, type: "", data: null })
                    }
                    className="flex-1 bg-gray-50 border border-gray-200 text-[#006064] py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      document.exitFullscreen?.().catch(() => {});
                      // Conditional Routing applied here
                      navigate(userData ? "/dashboard" : "/", {
                        replace: true,
                      });
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-colors shadow-md shadow-red-600/20"
                  >
                    Exit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- THE ACTUAL QUIZ UI --- */}
      <div className="h-16 bg-white border-b border-[#006064]/10 flex items-center justify-between px-6 shrink-0 z-10 relative shadow-sm">
        <div className="flex items-center gap-2 opacity-70">
          <FiShield className="text-[#00838F]" />
          <span className="font-black tracking-widest text-[#003B46] text-xs uppercase">
            Secure Assessment
          </span>
        </div>
        <button
          onClick={() =>
            setModal({ show: true, type: "confirmExit", data: null })
          }
          className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors"
        >
          <FiAlertTriangle /> Exit
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto px-6 pt-8 pb-4 relative z-10">
        <div className="flex flex-wrap gap-2 justify-center">
          {questions.map((q, i) => {
            const isMissing = missingQuestions.includes(i + 1);
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all border ${
                  currentIndex === i
                    ? "bg-[#00838F] text-white border-[#00838F] shadow-md scale-110"
                    : isMissing
                      ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                      : answers[q.id] !== undefined &&
                          (!Array.isArray(answers[q.id]) ||
                            answers[q.id].length > 0)
                        ? "bg-[#E0F7FA]/50 text-[#00838F] border-[#26C6DA]/50"
                        : "bg-white text-[#006064]/50 border-[#006064]/10 hover:border-[#00838F]/50"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-6 pb-24 flex flex-col justify-center relative z-10">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#006064]/10">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[#00838F] font-black tracking-widest uppercase text-xs">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="bg-gray-50 border border-gray-100 text-[#006064]/70 px-3 py-1 rounded-lg font-bold text-xs">
              {currentQ?.points} Points
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-[#003B46] mb-10 leading-relaxed select-none">
            {currentQ?.content}
          </h2>

          <div className="space-y-3">
            {currentQ?.question_type === "mcq" &&
              currentQ.options_data.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${answers[currentQ.id] === i ? "border-[#00838F] bg-[#E0F7FA]/20 shadow-sm" : "border-[#006064]/10 hover:border-[#26C6DA]/50 hover:bg-[#F8FDFD]"}`}
                >
                  <input
                    type="radio"
                    checked={answers[currentQ.id] === i}
                    onChange={() => handleAnswer(currentQ.id, i)}
                    className="w-4 h-4 accent-[#00838F]"
                  />
                  <span className="font-bold text-[#003B46] text-sm md:text-base select-none">
                    {opt}
                  </span>
                </label>
              ))}

            {currentQ?.question_type === "multiple_response" &&
              currentQ.options_data.map((opt, i) => {
                const currentAnswers = answers[currentQ.id] || [];
                const isChecked = currentAnswers.includes(i);
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${isChecked ? "border-[#00838F] bg-[#E0F7FA]/20 shadow-sm" : "border-[#006064]/10 hover:border-[#26C6DA]/50 hover:bg-[#F8FDFD]"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        handleAnswer(
                          currentQ.id,
                          isChecked
                            ? currentAnswers.filter((idx) => idx !== i)
                            : [...currentAnswers, i],
                        )
                      }
                      className="w-4 h-4 accent-[#00838F] rounded"
                    />
                    <span className="font-bold text-[#003B46] text-sm md:text-base select-none">
                      {opt}
                    </span>
                  </label>
                );
              })}

            {currentQ?.question_type === "true_false" && (
              <div className="flex gap-4">
                {["True", "False"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(currentQ.id, opt)}
                    className={`flex-1 py-5 rounded-xl border-2 text-sm font-black uppercase tracking-widest transition-all ${answers[currentQ.id] === opt ? "bg-[#00838F] border-[#00838F] text-white shadow-md scale-[1.02]" : "bg-white border-[#006064]/10 text-[#003B46] hover:border-[#26C6DA]/50"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentQ?.question_type === "identification" && (
              <div className="relative">
                <FiFileText className="absolute left-6 top-1/2 -translate-y-1/2 text-[#006064]/30 text-lg" />
                <input
                  type="text"
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  placeholder="Type your answer here..."
                  autoComplete="off"
                  spellCheck="false"
                  className="w-full bg-white border-2 border-[#006064]/10 rounded-xl pl-14 pr-6 py-5 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#00838F] focus:ring-4 focus:ring-[#E0F7FA] transition-all"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-[#006064]/40 font-bold text-xs uppercase tracking-widest hover:text-[#00838F] disabled:opacity-30 transition-colors"
          >
            <FiChevronLeft className="text-lg" /> Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={attemptSubmit}
              className="bg-[#00838F] hover:bg-[#006064] text-white px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-md flex items-center gap-2 transition-transform hover:-translate-y-0.5"
            >
              <FiCheckCircle className="text-lg" /> Submit
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1),
                )
              }
              className="flex items-center gap-2 text-[#003B46] font-bold text-xs uppercase tracking-widest hover:text-[#00838F] transition-colors"
            >
              Next <FiChevronRight className="text-lg" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
