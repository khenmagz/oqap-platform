import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiAlignLeft,
  FiX,
  FiActivity,
  FiCalendar,
  FiShuffle,
  FiMessageSquare,
  FiArrowLeft,
  FiUsers,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../config/supabase";
import { Toast } from "./ui/Toast";
import AiQuizGenerator from "./AiQuizGenerator";

export const QuizStudio = () => {
  const { userData } = useAuth();
  const [toast, setToast] = useState({ message: "", type: "" });
  const showToast = (message, type = "info") => setToast({ message, type });

  const [quizTitle, setQuizTitle] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [deadline, setDeadline] = useState(null);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState("score_only");

  // NEW: State for Classes
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  const [questions, setQuestions] = useState([
    {
      id: 1,
      type: "mcq",
      text: "",
      options: ["", ""],
      correctAnswer: null,
      points: 1,
    },
  ]);

  // NEW: Fetch available classes when the component loads
  useEffect(() => {
    if (!userData?.id) return;
    const fetchClasses = async () => {
      try {
        const { data, error } = await supabase
          .from("classes")
          .select("id, name")
          .eq("instructor_id", userData.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setClasses(data || []);
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };
    fetchClasses();
  }, [userData?.id]);

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
          if (q.type === "multiple_response")
            newCorrectAnswer = q.correctAnswer.filter(
              (idx) => idx !== optIndex,
            );
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

  const handleDeployQuiz = async () => {
    if (!quizTitle.trim())
      return showToast("Please enter a quiz title before deploying.", "error");
    if (questions.some((q) => !q.text.trim()))
      return showToast(
        "You have blank questions. Please fill them out or delete them.",
        "error",
      );

    setIsDeploying(true);

    try {
      const generatedCode = `SWU-${Math.floor(1000 + Math.random() * 9000)}`;
      const releaseGrades =
        feedbackMode === "score_only" || feedbackMode === "full";
      const releaseAnswers = feedbackMode === "full";

      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .insert([
          {
            instructor_id: userData.id,
            class_id: selectedClassId || null, // NEW: Attach the class ID to the quiz
            title: quizTitle,
            quiz_code: generatedCode,
            max_attempts: parseInt(maxAttempts, 10),
            due_date: deadline ? deadline.toISOString() : null,
            shuffle_questions: shuffleQuestions,
            release_grades: releaseGrades,
            release_answers: releaseAnswers,
          },
        ])
        .select()
        .single();

      if (quizError) throw quizError;

      const formattedQuestions = questions.map((q, index) => ({
        quiz_id: quizData.id,
        question_type: q.type,
        content: q.text,
        options_data:
          q.type === "mcq" ||
          q.type === "multiple_response" ||
          q.type === "true_false"
            ? q.options
            : [],
        correct_answer: q.correctAnswer,
        points: q.points,
        order_index: index + 1,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(formattedQuestions);
      if (questionsError) throw questionsError;

      setQuizTitle("");
      setSelectedClassId("");
      setQuestions([
        {
          id: 1,
          type: "mcq",
          text: "",
          options: ["", ""],
          correctAnswer: null,
          points: 1,
        },
      ]);
      setFeedbackMode("score_only");
      showToast(
        `Quiz deployed successfully! Your code is ${generatedCode}`,
        "success",
      );
    } catch (error) {
      console.error("Error deploying quiz:", error);
      showToast(
        "Something went wrong while deploying. Please try again.",
        "error",
      );
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-32 min-h-screen bg-[#F8FDFD] text-[#003B46] flex flex-col font-sans max-w-6xl mx-auto relative selection:bg-[#26C6DA] selection:text-[#003B46]">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      {/* Header & Configuration */}
      <div className="mb-12 border-b border-[#006064]/10 pb-8 mt-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-[#006064]/60 hover:text-[#00838F] font-bold text-sm uppercase tracking-widest mb-4 transition-colors"
        >
          <FiArrowLeft /> Back to Dashboard
        </Link>

        <input
          type="text"
          value={quizTitle}
          onChange={(e) => setQuizTitle(e.target.value)}
          placeholder="Enter Assessment Title..."
          className="w-full bg-transparent text-3xl md:text-4xl font-black text-[#003B46] placeholder-[#006064]/20 py-2 focus:outline-none mb-8 tracking-tight leading-none border-b-2 border-transparent focus:border-[#26C6DA] transition-colors"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* NEW: Class Selection Dropdown */}
          <div className="bg-white px-5 py-4 rounded-xl border border-[#006064]/10 flex flex-col gap-2 shadow-sm">
            <span className="text-xs font-bold text-[#00838F] uppercase tracking-widest flex items-center gap-2">
              <FiUsers /> Assign Class
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent text-sm font-bold text-[#003B46] focus:outline-none cursor-pointer"
            >
              <option value="">No Class (Open Access)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white px-5 py-4 rounded-xl border border-[#006064]/10 flex flex-col gap-2 shadow-sm">
            <span className="text-xs font-bold text-[#00838F] uppercase tracking-widest flex items-center gap-2">
              <FiActivity /> Attempts
            </span>
            <select
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              className="bg-transparent text-sm font-bold text-[#003B46] focus:outline-none cursor-pointer"
            >
              <option value="0">Unlimited</option>
              <option value="1">1 Attempt</option>
              <option value="2">2 Attempts</option>
              <option value="3">3 Attempts</option>
              <option value="5">5 Attempts</option>
            </select>
          </div>

          <div className="bg-white px-5 py-4 rounded-xl border border-[#006064]/10 flex flex-col gap-2 shadow-sm z-50">
            <span className="text-xs font-bold text-[#00838F] uppercase tracking-widest flex items-center gap-2">
              <FiCalendar /> Deadline
            </span>
            <DatePicker
              selected={deadline}
              onChange={(date) => setDeadline(date)}
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={15}
              dateFormat="MMM d, yyyy h:mm aa"
              placeholderText="No deadline"
              className="w-full bg-transparent text-sm font-bold text-[#003B46] focus:outline-none placeholder-[#006064]/30 cursor-pointer"
            />
          </div>

          <button
            onClick={() => setShuffleQuestions(!shuffleQuestions)}
            className="bg-white px-5 py-4 rounded-xl border border-[#006064]/10 flex flex-col justify-between shadow-sm transition-colors hover:bg-gray-50 cursor-pointer text-left"
          >
            <span className="text-xs font-bold text-[#00838F] uppercase tracking-widest flex items-center gap-2">
              <FiShuffle
                className={
                  shuffleQuestions ? "text-[#00838F]" : "text-gray-400"
                }
              />{" "}
              Shuffle Options
            </span>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${shuffleQuestions ? "bg-[#00838F]" : "bg-gray-200"}`}
              >
                <div
                  className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${shuffleQuestions ? "translate-x-5" : ""}`}
                />
              </div>
              <span className="text-sm font-bold text-[#003B46]">
                {shuffleQuestions ? "Enabled" : "Disabled"}
              </span>
            </div>
          </button>

          <div className="bg-white px-5 py-4 rounded-xl border border-[#006064]/10 flex flex-col gap-2 shadow-sm">
            <span className="text-xs font-bold text-[#00838F] uppercase tracking-widest flex items-center gap-2">
              <FiMessageSquare /> Feedback
            </span>
            <select
              value={feedbackMode}
              onChange={(e) => setFeedbackMode(e.target.value)}
              className="bg-transparent text-sm font-bold text-[#003B46] focus:outline-none cursor-pointer"
            >
              <option value="hidden">Hidden (No Score)</option>
              <option value="score_only">Show Score Only</option>
              <option value="full">Score + Deep Dive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-8">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="bg-white p-8 rounded-2xl border border-[#006064]/10 shadow-sm relative"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-[#00838F] tracking-widest uppercase bg-[#E0F7FA]/50 px-3 py-1.5 rounded-lg border border-[#006064]/5">
                  Question {index + 1}
                </span>
                <select
                  value={q.type}
                  onChange={(e) => changeQuestionType(q.id, e.target.value)}
                  className="bg-white border border-[#006064]/10 text-sm text-[#003B46] font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#26C6DA]"
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
                className="text-gray-400 hover:text-red-500 transition-colors p-2 absolute top-6 right-6 sm:static sm:p-0"
              >
                <FiTrash2 className="text-lg" />
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
              placeholder="Enter your question text here..."
              className="w-full bg-transparent text-lg font-bold text-[#003B46] placeholder-[#006064]/30 focus:outline-none resize-none mb-6 border-b border-transparent focus:border-[#006064]/10 pb-2 transition-colors"
              rows={2}
            />

            <div className="space-y-3 pl-1">
              {q.type === "mcq" && (
                <>
                  {q.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`mcq-${q.id}`}
                        checked={q.correctAnswer === i}
                        onChange={() => setSingleCorrectAnswer(q.id, i)}
                        className="w-4 h-4 accent-[#00838F] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          updateOptionText(q.id, i, e.target.value)
                        }
                        placeholder={`Option ${i + 1}`}
                        className={`flex-1 bg-white border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none transition-colors ${q.correctAnswer === i ? "border-[#00838F] bg-[#E0F7FA]/20 text-[#00838F]" : "border-[#006064]/10 text-[#003B46] focus:border-[#26C6DA]"}`}
                      />
                      {q.options.length > 2 && (
                        <button
                          onClick={() => removeOption(q.id, i)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(q.id)}
                    className="mt-2 text-xs font-bold tracking-wider uppercase text-[#00838F] hover:text-[#006064] flex items-center gap-1.5 px-1 py-1"
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
                        className="w-4 h-4 accent-[#00838F] cursor-pointer rounded"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          updateOptionText(q.id, i, e.target.value)
                        }
                        placeholder={`Option ${i + 1}`}
                        className={`flex-1 bg-white border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none transition-colors ${Array.isArray(q.correctAnswer) && q.correctAnswer.includes(i) ? "border-[#00838F] bg-[#E0F7FA]/20 text-[#00838F]" : "border-[#006064]/10 text-[#003B46] focus:border-[#26C6DA]"}`}
                      />
                      {q.options.length > 2 && (
                        <button
                          onClick={() => removeOption(q.id, i)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(q.id)}
                    className="mt-2 text-xs font-bold tracking-wider uppercase text-[#00838F] hover:text-[#006064] flex items-center gap-1.5 px-1 py-1"
                  >
                    <FiPlus /> Add Option
                  </button>
                </>
              )}

              {q.type === "true_false" && (
                <div className="flex gap-4 max-w-md">
                  <button
                    onClick={() => setSingleCorrectAnswer(q.id, "True")}
                    className={`flex-1 border rounded-xl py-3 text-sm font-bold transition-colors ${q.correctAnswer === "True" ? "bg-[#00838F] text-white border-[#00838F] shadow-md" : "bg-white border-[#006064]/10 text-[#006064] hover:border-[#26C6DA]"}`}
                  >
                    True
                  </button>
                  <button
                    onClick={() => setSingleCorrectAnswer(q.id, "False")}
                    className={`flex-1 border rounded-xl py-3 text-sm font-bold transition-colors ${q.correctAnswer === "False" ? "bg-[#00838F] text-white border-[#00838F] shadow-md" : "bg-white border-[#006064]/10 text-[#006064] hover:border-[#26C6DA]"}`}
                  >
                    False
                  </button>
                </div>
              )}

              {q.type === "identification" && (
                <div className="flex items-center gap-3">
                  <FiAlignLeft className="text-[#006064]/40 text-lg shrink-0" />
                  <input
                    type="text"
                    value={q.correctAnswer || ""}
                    onChange={(e) =>
                      setSingleCorrectAnswer(q.id, e.target.value)
                    }
                    placeholder="Type the exact correct answer here..."
                    className="flex-1 bg-white border border-[#006064]/10 rounded-xl px-4 py-2.5 text-sm font-bold text-[#00838F] focus:outline-none focus:border-[#26C6DA]"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-[#006064]/20 bg-white rounded-2xl py-8 flex flex-col items-center justify-center gap-3 text-[#00838F] hover:bg-[#F8FDFD] hover:border-[#26C6DA]/50 transition-all duration-300 shadow-sm"
        >
          <div className="bg-[#E0F7FA]/50 p-3 rounded-xl border border-[#006064]/5">
            <FiPlus className="text-3xl" />
          </div>
          <span className="font-bold tracking-widest uppercase text-sm">
            Manual Question
          </span>
        </button>

        <AiQuizGenerator
          onGenerate={(newQs) => {
            if (questions.length === 1 && !questions[0].text.trim()) {
              setQuestions(newQs);
            } else {
              setQuestions([...questions, ...newQs]);
            }
            showToast(`${newQs.length} AI questions imported!`, "success");
          }}
        />
      </div>

      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleDeployQuiz}
          disabled={isDeploying}
          className={`rounded-xl px-8 py-3.5 text-sm font-black tracking-widest uppercase transition-all shadow-lg flex items-center gap-3 ${isDeploying ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#00838F] hover:bg-[#006064] text-white hover:shadow-xl hover:-translate-y-1"}`}
        >
          <FiCheckCircle className="text-lg" />
          {isDeploying ? "DEPLOYING..." : "DEPLOY ASSESSMENT"}
        </button>
      </div>
    </div>
  );
};
