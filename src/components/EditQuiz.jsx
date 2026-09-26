import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiAlignLeft,
  FiX,
  FiCheckCircle,
  FiArrowLeft,
  FiLoader,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../config/supabase";
import { Toast } from "./ui/Toast";

export const EditQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [toast, setToast] = useState({ message: "", type: "" });
  const showToast = (message, type = "info") => setToast({ message, type });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [originalQuestionIds, setOriginalQuestionIds] = useState([]);

  const [questions, setQuestions] = useState([]);

  // Fetch the quiz and its existing questions
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        // Fetch Title
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select("title, instructor_id")
          .eq("id", quizId)
          .single();

        if (quizError) throw quizError;

        // Security check
        if (quizData.instructor_id !== userData.id) {
          navigate("/dashboard");
          return;
        }

        setQuizTitle(quizData.title);

        // Fetch Questions
        const { data: qData, error: qError } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("order_index", { ascending: true });

        if (qError) throw qError;

        // Map database schema back to our UI state format
        const formattedQuestions = qData.map((q) => ({
          id: q.id, // Real UUID from database
          type: q.question_type,
          text: q.content,
          options: q.options_data || [],
          correctAnswer: q.correct_answer,
          points: q.points,
        }));

        setQuestions(formattedQuestions);
        setOriginalQuestionIds(formattedQuestions.map((q) => q.id));
      } catch (error) {
        console.error("Error fetching quiz:", error);
        showToast("Failed to load questions.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (userData?.id) fetchQuizData();
  }, [quizId, userData, navigate]);

  // --- Question Manipulation Logic ---
  const addQuestion = () =>
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        type: "mcq",
        text: "",
        options: ["", ""],
        correctAnswer: null,
        points: 1,
      },
    ]);

  const deleteQuestion = (id) =>
    setQuestions(questions.filter((q) => q.id !== id));

  const changeQuestionType = (id, newType) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            type: newType,
            options: newType === "true_false" ? ["True", "False"] : ["", ""],
            correctAnswer: newType === "multiple_response" ? [] : null,
          };
        }
        return q;
      }),
    );
  };

  const updateOptionText = (qId, optIndex, value) =>
    setQuestions(
      questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((opt, i) =>
                i === optIndex ? value : opt,
              ),
            }
          : q,
      ),
    );

  const addOption = (qId) =>
    setQuestions(
      questions.map((q) =>
        q.id === qId ? { ...q, options: [...q.options, ""] } : q,
      ),
    );

  const removeOption = (qId, optIndex) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newOptions = q.options.filter((_, i) => i !== optIndex);
          let newCorrectAnswer = q.correctAnswer;
          if (q.type === "mcq" && q.correctAnswer === optIndex)
            newCorrectAnswer = null;
          if (
            q.type === "multiple_response" &&
            Array.isArray(q.correctAnswer)
          ) {
            newCorrectAnswer = q.correctAnswer.filter(
              (idx) => idx !== optIndex,
            );
          }
          return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
        }
        return q;
      }),
    );
  };

  const setSingleCorrectAnswer = (qId, answerData) =>
    setQuestions(
      questions.map((q) =>
        q.id === qId ? { ...q, correctAnswer: answerData } : q,
      ),
    );

  const toggleMultipleResponseAnswer = (qId, optIndex) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const currentAnswers = Array.isArray(q.correctAnswer)
            ? q.correctAnswer
            : [];
          const newAnswers = currentAnswers.includes(optIndex)
            ? currentAnswers.filter((idx) => idx !== optIndex)
            : [...currentAnswers, optIndex];
          return { ...q, correctAnswer: newAnswers };
        }
        return q;
      }),
    );
  };

  // --- Save Logic ---
  const handleSaveChanges = async () => {
    if (questions.some((q) => !q.text.trim())) {
      return showToast(
        "You have blank questions. Please fill them out or delete them.",
        "error",
      );
    }

    setIsSaving(true);

    try {
      // 1. Figure out which questions were deleted
      const currentIds = questions
        .filter((q) => typeof q.id === "string")
        .map((q) => q.id);
      const deletedIds = originalQuestionIds.filter(
        (id) => !currentIds.includes(id),
      );

      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("questions")
          .delete()
          .in("id", deletedIds);
        if (deleteError) throw deleteError;
      }

      // 2. Format questions for database
      const formattedQuestions = questions.map((q, index) => {
        const dbQuestion = {
          quiz_id: quizId,
          question_type: q.type,
          content: q.text,
          options_data: q.type !== "identification" ? q.options : [],
          correct_answer: q.correctAnswer,
          points: q.points,
          order_index: index + 1,
        };
        // If it's an existing question (UUID string), include the ID for upsert
        if (typeof q.id === "string") {
          dbQuestion.id = q.id;
        }
        return dbQuestion;
      });

      // 3. Upsert (Update existing, Insert new)
      const { error: upsertError } = await supabase
        .from("questions")
        .upsert(formattedQuestions);
      if (upsertError) throw upsertError;

      showToast("Questions successfully updated!", "success");

      // Update our tracker for next time they click save
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save changes. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="pt-24 min-h-screen bg-[#F8FDFD] flex items-center justify-center">
        <div className="flex flex-col items-center text-[#006064]/50 animate-pulse">
          <FiLoader className="text-4xl animate-spin mb-4" />
          <span className="font-bold tracking-widest uppercase text-sm">
            Loading Editor...
          </span>
        </div>
      </div>
    );

  return (
    <div className="pt-24 md:pt-12 px-6 lg:px-12 pb-32 font-sans max-w-5xl mx-auto relative bg-[#F8FDFD] min-h-screen">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      <div className="mb-12 border-b-2 border-[#006064]/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 mt-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[#006064]/60 hover:text-[#00838F] font-bold text-sm uppercase tracking-widest mb-4 transition-colors"
          >
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-[#003B46] tracking-tight">
            Editing: {quizTitle}
          </h1>
          <p className="mt-2 text-sm font-medium text-[#006064]/70">
            Modify question content, adjust options, and update answer keys.
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="bg-white p-8 rounded-3xl border border-[#006064]/10 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#006064]/5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-sm font-black text-[#00838F] tracking-widest uppercase bg-[#E0F7FA]/50 px-3 py-1 rounded-md">
                  Question {index + 1}
                </span>
                <select
                  value={q.type}
                  onChange={(e) => changeQuestionType(q.id, e.target.value)}
                  className="bg-white border border-[#006064]/10 text-[#003B46] font-bold rounded-xl px-4 py-2 focus:outline-none focus:border-[#26C6DA]"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="multiple_response">Multiple Response</option>
                  <option value="true_false">True / False</option>
                  <option value="identification">
                    Identification (Fill in)
                  </option>
                </select>
              </div>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="text-[#006064]/30 hover:text-red-500 p-2 rounded-lg transition-colors flex items-center gap-2 hover:bg-red-50"
              >
                <FiTrash2 className="text-xl" />
              </button>
            </div>

            <textarea
              value={q.text}
              onChange={(e) =>
                setQuestions(
                  questions.map((quest) =>
                    quest.id === q.id
                      ? { ...quest, text: e.target.value }
                      : quest,
                  ),
                )
              }
              placeholder="What is your question?"
              className="w-full bg-transparent text-xl font-bold text-[#003B46] placeholder-[#006064]/20 focus:outline-none resize-none mb-8"
              rows={2}
            />

            <div className="pl-0 sm:pl-4 border-l-2 border-[#006064]/10 space-y-3">
              {q.type === "mcq" && (
                <>
                  {q.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={q.correctAnswer === i}
                        onChange={() => setSingleCorrectAnswer(q.id, i)}
                        className="w-5 h-5 accent-[#00838F] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          updateOptionText(q.id, i, e.target.value)
                        }
                        placeholder={`Option ${i + 1}`}
                        className={`flex-1 bg-white border rounded-xl px-4 py-3 font-medium text-[#003B46] focus:outline-none focus:border-[#26C6DA] ${q.correctAnswer === i ? "border-[#00838F] bg-[#E0F7FA]/30" : "border-[#006064]/10"}`}
                      />
                      {q.options.length > 2 && (
                        <button
                          onClick={() => removeOption(q.id, i)}
                          className="p-2 text-[#006064]/30 hover:text-red-500"
                        >
                          <FiX className="text-xl" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(q.id)}
                    className="mt-2 text-sm font-bold text-[#00838F] hover:text-[#006064] flex items-center gap-2 px-2 py-1"
                  >
                    <FiPlus /> Add Option
                  </button>
                </>
              )}

              {q.type === "multiple_response" && (
                <>
                  {q.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(q.correctAnswer) &&
                          q.correctAnswer.includes(i)
                        }
                        onChange={() => toggleMultipleResponseAnswer(q.id, i)}
                        className="w-5 h-5 accent-[#00838F] cursor-pointer rounded"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          updateOptionText(q.id, i, e.target.value)
                        }
                        placeholder={`Option ${i + 1}`}
                        className={`flex-1 bg-white border rounded-xl px-4 py-3 font-medium text-[#003B46] focus:outline-none focus:border-[#26C6DA] ${Array.isArray(q.correctAnswer) && q.correctAnswer.includes(i) ? "border-[#00838F] bg-[#E0F7FA]/30" : "border-[#006064]/10"}`}
                      />
                      {q.options.length > 2 && (
                        <button
                          onClick={() => removeOption(q.id, i)}
                          className="p-2 text-[#006064]/30 hover:text-red-500"
                        >
                          <FiX className="text-xl" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(q.id)}
                    className="mt-2 text-sm font-bold text-[#00838F] hover:text-[#006064] flex items-center gap-2 px-2 py-1"
                  >
                    <FiPlus /> Add Option
                  </button>
                </>
              )}

              {q.type === "true_false" && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setSingleCorrectAnswer(q.id, "True")}
                    className={`flex-1 border-2 rounded-xl py-4 font-bold transition-colors ${q.correctAnswer === "True" ? "bg-[#00838F] text-white border-[#00838F]" : "border-[#006064]/10 text-[#003B46] hover:bg-[#F8FDFD]"}`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => setSingleCorrectAnswer(q.id, "False")}
                    className={`flex-1 border-2 rounded-xl py-4 font-bold transition-colors ${q.correctAnswer === "False" ? "bg-[#00838F] text-white border-[#00838F]" : "border-[#006064]/10 text-[#003B46] hover:bg-[#F8FDFD]"}`}
                  >
                    False
                  </button>
                </div>
              )}

              {q.type === "identification" && (
                <div className="flex items-center gap-4">
                  <FiAlignLeft className="text-[#006064]/30 text-xl shrink-0" />
                  <input
                    type="text"
                    value={q.correctAnswer || ""}
                    onChange={(e) =>
                      setSingleCorrectAnswer(q.id, e.target.value)
                    }
                    placeholder="Type the exact correct answer here..."
                    className="flex-1 bg-[#F8FDFD] border-2 border-[#006064]/10 rounded-xl px-4 py-3 font-bold text-[#00838F] focus:outline-none focus:border-[#26C6DA]"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-[#006064]/20 rounded-3xl py-8 flex flex-col items-center justify-center gap-2 text-[#00838F] hover:bg-white hover:border-[#26C6DA]/50 transition-all duration-300"
        >
          <FiPlus className="text-2xl" />
          <span className="font-bold tracking-widest uppercase text-sm">
            Add New Question
          </span>
        </button>
      </div>

      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className={`rounded-xl px-8 py-4 font-black tracking-widest uppercase transition-all shadow-lg flex items-center gap-3 ${isSaving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#00838F] hover:bg-[#006064] text-white hover:shadow-xl hover:-translate-y-1"}`}
        >
          {isSaving ? (
            <FiLoader className="animate-spin text-xl" />
          ) : (
            <FiCheckCircle className="text-xl" />
          )}
          {isSaving ? "SAVING..." : "SAVE CHANGES"}
        </button>
      </div>
    </div>
  );
};
