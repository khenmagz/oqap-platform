import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiTarget,
  FiMoreHorizontal,
  FiUsers,
  FiClock,
  FiActivity,
  FiCopy,
  FiEdit2,
  FiTrash2,
  FiPower,
  FiX,
  FiCheckCircle,
  FiFileText,
  FiPlusSquare,
  FiBarChart2,
  FiBook,
  FiCode,
  FiUserPlus,
} from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../config/supabase";

import { Toast } from "./ui/Toast";
import { ConfirmModal } from "./ui/ConfirmModal";

export const InstructorDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New state for Classes
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [activeTab, setActiveTab] = useState("quizzes");

  const [toast, setToast] = useState({ message: "", type: "" });
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    quizId: null,
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const [editTitle, setEditTitle] = useState("");
  const [editAttempts, setEditAttempts] = useState("1");
  const [editDeadline, setEditDeadline] = useState(null);
  const [editFeedbackMode, setEditFeedbackMode] = useState("score_only");

  const menuRef = useRef();
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userData?.id) return;

    const fetchMyQuizzes = async () => {
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*")
          .eq("instructor_id", userData.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setQuizzes(data || []);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchMyClasses = async () => {
      try {
        const { data, error } = await supabase
          .from("classes")
          .select("*, class_enrollments(count)")
          .eq("instructor_id", userData.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setClasses(data || []);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchMyQuizzes();
    fetchMyClasses();
  }, [userData?.id]);

  const handleCreateClass = async () => {
    if (!newClassName.trim())
      return showToast("Class name cannot be empty", "error");

    // Generate a random 6-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { data, error } = await supabase
        .from("classes")
        .insert([
          {
            name: newClassName,
            instructor_id: userData.id,
            class_code: code,
          },
        ])
        .select("*, class_enrollments(count)")
        .single();

      if (error) throw error;

      setClasses([data, ...classes]);
      setIsCreateClassModalOpen(false);
      setNewClassName("");
      showToast(`Class created! Code: ${code}`, "success");
    } catch (error) {
      showToast("Failed to create class", "error");
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

  const getQuizStatus = (quiz) => {
    if (quiz.is_active === false) return "Closed";
    if (quiz.due_date && new Date(quiz.due_date) < new Date()) return "Closed";
    return "Active";
  };

  const showToast = (message, type = "info") => setToast({ message, type });

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast(`Code ${code} copied to clipboard!`, "success");
    setOpenMenuId(null);
  };

  const toggleKillSwitch = async (quizId, currentActiveStatus) => {
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ is_active: !currentActiveStatus })
        .eq("id", quizId);
      if (error) throw error;
      setQuizzes(
        quizzes.map((q) =>
          q.id === quizId ? { ...q, is_active: !currentActiveStatus } : q,
        ),
      );
      showToast(
        currentActiveStatus
          ? "Quiz closed successfully."
          : "Quiz is now active.",
        "success",
      );
    } catch (error) {
      showToast("Failed to update quiz status.", "error");
    }
  };

  const initiateDelete = (quizId) => {
    setConfirmDelete({ isOpen: true, quizId });
    setOpenMenuId(null);
  };

  const executeDelete = async () => {
    try {
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", confirmDelete.quizId);
      if (error) throw error;
      setQuizzes(quizzes.filter((q) => q.id !== confirmDelete.quizId));
      showToast("Quiz permanently deleted.", "success");
    } catch (error) {
      showToast("Failed to delete quiz.", "error");
    } finally {
      setConfirmDelete({ isOpen: false, quizId: null });
    }
  };

  const openEditModal = (quiz) => {
    setEditingQuiz(quiz);
    setEditTitle(quiz.title);
    setEditAttempts(quiz.max_attempts.toString());
    setEditDeadline(quiz.due_date ? new Date(quiz.due_date) : null);

    if (quiz.release_grades && quiz.release_answers)
      setEditFeedbackMode("full");
    else if (quiz.release_grades && !quiz.release_answers)
      setEditFeedbackMode("score_only");
    else setEditFeedbackMode("hidden");

    setOpenMenuId(null);
  };

  const saveEditSettings = async () => {
    try {
      const releaseGrades =
        editFeedbackMode === "score_only" || editFeedbackMode === "full";
      const releaseAnswers = editFeedbackMode === "full";

      const updatedData = {
        title: editTitle,
        max_attempts: parseInt(editAttempts, 10),
        due_date: editDeadline ? editDeadline.toISOString() : null,
        release_grades: releaseGrades,
        release_answers: releaseAnswers,
      };

      const { error } = await supabase
        .from("quizzes")
        .update(updatedData)
        .eq("id", editingQuiz.id);
      if (error) throw error;

      setQuizzes(
        quizzes.map((q) =>
          q.id === editingQuiz.id ? { ...q, ...updatedData } : q,
        ),
      );
      setEditingQuiz(null);
      showToast("Settings updated successfully.", "success");
    } catch (error) {
      showToast("Failed to save changes.", "error");
    }
  };

  const activeCount = quizzes.filter(
    (q) => getQuizStatus(q) === "Active",
  ).length;
  const closedCount = quizzes.length - activeCount;

  return (
    <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] text-[#003B46] flex flex-col font-sans max-w-7xl mx-auto relative selection:bg-[#26C6DA] selection:text-[#003B46]">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Delete Assessment"
        message="This will permanently erase the quiz and all associated student data. This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, quizId: null })}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#003B46] tracking-tight">
            Welcome Back, {userData?.full_name?.split(" ")[0] || "Instructor"}!
          </h1>
          <p className="mt-2 text-sm md:text-base font-medium text-[#006064]/70">
            Manage your assessments and track student mastery.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white border border-[#006064]/10 text-[#006064] text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm">
            <FiClock className="text-[#00838F]" />
            {new Date().toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <Link
            to="/dashboard/manage"
            className="inline-flex items-center justify-center gap-2 bg-[#00838F] hover:bg-[#006064] text-white rounded-xl px-6 py-2.5 text-sm font-black tracking-widest uppercase transition-all shadow-md shrink-0"
          >
            <FiPlusSquare className="text-lg" /> Create Quiz
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Assessments",
            value: quizzes.length,
            icon: <FiFileText />,
            trend: "Lifetime",
          },
          {
            label: "Active Assessments",
            value: activeCount,
            icon: <FiActivity />,
            trend: "Currently running",
          },
          {
            label: "Closed Assessments",
            value: closedCount,
            icon: <FiCheckCircle />,
            trend: "Archived",
          },
          {
            label: "Total Students",
            value: "—",
            icon: <FiUsers />,
            trend: "Check Analytics tab",
          },
        ].map((metric, i) => (
          <div
            key={i}
            className="bg-white border border-[#006064]/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-[#26C6DA]/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-bold text-[#006064]/60 flex items-center gap-2 tracking-wide uppercase">
                <span className="text-[#00838F] text-lg">{metric.icon}</span>{" "}
                {metric.label}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black text-[#003B46]">
                {metric.value}
              </span>
              <span className="text-xs font-medium text-[#00838F] bg-[#E0F7FA] px-2 py-1 rounded-md">
                {metric.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("quizzes")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black tracking-widest uppercase transition-all shadow-sm ${activeTab === "quizzes" ? "bg-[#00838F] text-white" : "bg-white text-[#006064]/60 border border-[#006064]/10 hover:bg-[#F8FDFD]"}`}
        >
          Assessments
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black tracking-widest uppercase transition-all shadow-sm ${activeTab === "classes" ? "bg-[#00838F] text-white" : "bg-white text-[#006064]/60 border border-[#006064]/10 hover:bg-[#F8FDFD]"}`}
        >
          My Classes
        </button>
      </div>

      {/* QUIZ TABLE */}
      {activeTab === "quizzes" && (
        <div className="bg-white border border-[#006064]/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#006064]/10 flex items-center justify-between bg-[#F8FDFD]">
            <h2 className="text-lg font-black text-[#003B46] tracking-wide">
              Active Assessments
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[#006064]">
              <thead className="text-xs text-[#00838F] bg-white uppercase tracking-widest border-b border-[#006064]/10">
                <tr>
                  <th className="px-6 py-5 font-black">Assessment Name</th>
                  <th className="px-6 py-5 font-black">Access Code</th>
                  <th className="px-6 py-5 font-black">Max Attempts</th>
                  <th className="px-6 py-5 font-black">Deadline</th>
                  <th className="px-6 py-5 font-black">Status</th>
                  <th className="px-6 py-5 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-[#006064]/40 font-bold animate-pulse"
                    >
                      Loading secure data...
                    </td>
                  </tr>
                ) : quizzes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-16 text-center text-[#006064]/50 font-medium"
                    >
                      No assessments deployed yet.
                    </td>
                  </tr>
                ) : (
                  quizzes.map((quiz) => {
                    const status = getQuizStatus(quiz);
                    return (
                      <tr
                        key={quiz.id}
                        className="border-b border-[#006064]/5 hover:bg-[#F8FDFD] transition-colors last:border-0 group"
                      >
                        <td className="px-6 py-5 font-bold text-[#003B46]">
                          {quiz.title}
                        </td>
                        <td className="px-6 py-5">
                          <button
                            onClick={() => handleCopyCode(quiz.quiz_code)}
                            className="font-mono text-[#00838F] hover:text-[#006064] bg-[#E0F7FA]/50 px-3 py-1.5 rounded-lg transition-colors font-bold tracking-wider"
                            title="Copy code"
                          >
                            {quiz.quiz_code}
                          </button>
                        </td>
                        <td className="px-6 py-5 font-medium">
                          {quiz.max_attempts === 0
                            ? "Unlimited"
                            : quiz.max_attempts}
                        </td>
                        <td className="px-6 py-5 font-medium">
                          {formatDeadline(quiz.due_date)}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase ${status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right relative">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === quiz.id ? null : quiz.id,
                              )
                            }
                            className="text-[#006064]/40 hover:text-[#00838F] p-2 rounded-lg hover:bg-[#E0F7FA]/50 transition-colors"
                          >
                            <FiMoreHorizontal className="text-xl" />
                          </button>

                          {openMenuId === quiz.id && (
                            <div className="absolute right-8 top-12 mt-1 w-56 bg-white rounded-xl shadow-xl border border-[#006064]/10 py-2 z-20 text-left">
                              <button
                                onClick={() => {
                                  navigate("/dashboard/analytics");
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-5 py-3 text-sm font-bold text-[#003B46] hover:bg-[#F8FDFD] hover:text-[#00838F] flex items-center gap-3 transition-colors"
                              >
                                <FiBarChart2 className="text-lg text-[#006064]/50" />{" "}
                                View Analytics
                              </button>
                              <button
                                onClick={() => openEditModal(quiz)}
                                className="w-full px-5 py-3 text-sm font-bold text-[#003B46] hover:bg-[#F8FDFD] hover:text-[#00838F] flex items-center gap-3 transition-colors"
                              >
                                <FiEdit2 className="text-lg text-[#006064]/50" />{" "}
                                Quick Settings
                              </button>
                              <Link
                                to={`/dashboard/edit-quiz/${quiz.id}`}
                                className="w-full px-5 py-3 text-sm font-bold text-[#003B46] hover:bg-[#F8FDFD] hover:text-[#00838F] flex items-center gap-3 transition-colors"
                              >
                                <FiFileText className="text-lg text-[#006064]/50" />{" "}
                                Edit Questions
                              </Link>
                              <button
                                onClick={() =>
                                  toggleKillSwitch(quiz.id, quiz.is_active)
                                }
                                className="w-full px-5 py-3 text-sm font-bold text-[#003B46] hover:bg-[#F8FDFD] hover:text-[#00838F] flex items-center gap-3 transition-colors"
                              >
                                <FiPower className="text-lg text-[#006064]/50" />{" "}
                                {quiz.is_active ? "Force Close" : "Re-open"}
                              </button>
                              <hr className="my-2 border-[#006064]/5" />
                              <button
                                onClick={() => initiateDelete(quiz.id)}
                                className="w-full px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
                              >
                                <FiTrash2 className="text-lg" /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLASSES TABLE */}
      {activeTab === "classes" && (
        <div className="bg-white border border-[#006064]/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#006064]/10 flex items-center justify-between bg-[#F8FDFD]">
            <h2 className="text-lg font-black text-[#003B46] tracking-wide">
              Active Classes
            </h2>
            <button
              onClick={() => setIsCreateClassModalOpen(true)}
              className="bg-white border border-[#006064]/20 hover:bg-[#F8FDFD] hover:border-[#00838F] text-[#006064] hover:text-[#00838F] px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm"
            >
              <FiUserPlus className="text-base" /> Create Class
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-[#006064]">
              <thead className="text-xs text-[#00838F] bg-white uppercase tracking-widest border-b border-[#006064]/10">
                <tr>
                  <th className="px-6 py-5 font-black">Class Name</th>
                  <th className="px-6 py-5 font-black">Invite Code</th>
                  <th className="px-6 py-5 font-black">Students Enrolled</th>
                  <th className="px-6 py-5 font-black">Created</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-16 text-center text-[#006064]/50 font-medium"
                    >
                      You haven't created any classes yet.
                    </td>
                  </tr>
                ) : (
                  classes.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-[#006064]/5 hover:bg-[#F8FDFD] transition-colors last:border-0"
                    >
                      <td className="px-6 py-5 font-bold text-[#003B46]">
                        {c.name}
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={() => handleCopyCode(c.class_code)}
                          className="font-mono text-[#00838F] hover:text-[#006064] bg-[#E0F7FA]/50 px-3 py-1.5 rounded-lg transition-colors font-bold tracking-wider"
                          title="Copy code"
                        >
                          {c.class_code}
                        </button>
                      </td>
                      <td className="px-6 py-5 font-medium">
                        {c.class_enrollments?.[0]?.count || 0} Students
                      </td>
                      <td className="px-6 py-5 font-medium">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT SETTINGS MODAL */}
      {editingQuiz && (
        <div className="fixed inset-0 z-[100] bg-[#003B46]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-[#006064]/10">
            <button
              onClick={() => setEditingQuiz(null)}
              className="absolute top-6 right-6 text-[#006064]/40 hover:text-[#003B46] transition-colors"
            >
              <FiX className="text-2xl" />
            </button>
            <h2 className="text-2xl font-black text-[#003B46] mb-8 tracking-tight">
              Edit Quiz Settings
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#F8FDFD] border border-[#006064]/10 rounded-xl px-4 py-3 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#26C6DA] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-2">
                    Max Attempts
                  </label>
                  <select
                    value={editAttempts}
                    onChange={(e) => setEditAttempts(e.target.value)}
                    className="w-full bg-[#F8FDFD] border border-[#006064]/10 rounded-xl px-4 py-3 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#26C6DA] cursor-pointer"
                  >
                    <option value="0">Unlimited</option>
                    <option value="1">1 Attempt</option>
                    <option value="2">2 Attempts</option>
                    <option value="3">3 Attempts</option>
                    <option value="5">5 Attempts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-2">
                    Deadline
                  </label>
                  <DatePicker
                    selected={editDeadline}
                    onChange={(date) => setEditDeadline(date)}
                    showTimeSelect
                    timeFormat="h:mm aa"
                    timeIntervals={15}
                    dateFormat="MMM d, yyyy h:mm aa"
                    placeholderText="No deadline"
                    className="w-full bg-[#F8FDFD] border border-[#006064]/10 rounded-xl px-4 py-3 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#26C6DA] cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-2">
                  Feedback Visibility
                </label>
                <select
                  value={editFeedbackMode}
                  onChange={(e) => setEditFeedbackMode(e.target.value)}
                  className="w-full bg-[#F8FDFD] border border-[#006064]/10 rounded-xl px-4 py-3 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#26C6DA] cursor-pointer"
                >
                  <option value="hidden">Hidden (No Score)</option>
                  <option value="score_only">Show Score Only</option>
                  <option value="full">Score + Deep Dive Answers</option>
                </select>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => setEditingQuiz(null)}
                className="flex-1 bg-gray-50 border border-gray-200 text-[#006064] rounded-xl py-3.5 text-sm font-bold tracking-widest uppercase hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditSettings}
                className="flex-1 bg-[#00838F] hover:bg-[#006064] text-white rounded-xl py-3.5 text-sm font-black tracking-widest uppercase transition-colors shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {isCreateClassModalOpen && (
        <div className="fixed inset-0 z-[100] bg-[#003B46]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border border-[#006064]/10">
            <button
              onClick={() => setIsCreateClassModalOpen(false)}
              className="absolute top-6 right-6 text-[#006064]/40 hover:text-[#003B46] transition-colors"
            >
              <FiX className="text-2xl" />
            </button>
            <h2 className="text-2xl font-black text-[#003B46] mb-6 tracking-tight">
              Create New Class
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#00838F] uppercase tracking-widest mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. CS 101 Section A"
                  className="w-full bg-[#F8FDFD] border border-[#006064]/10 rounded-xl px-4 py-3 text-sm font-bold text-[#003B46] focus:outline-none focus:border-[#26C6DA] transition-all"
                />
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={handleCreateClass}
                className="w-full bg-[#00838F] hover:bg-[#006064] text-white rounded-xl py-3.5 text-sm font-black tracking-widest uppercase transition-colors shadow-md"
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
