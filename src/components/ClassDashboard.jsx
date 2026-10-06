import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiBook,
  FiUsers,
  FiArrowLeft,
  FiPlusSquare,
  FiClock,
  FiTarget,
  FiUserMinus,
  FiCheckCircle,
  FiActivity,
  FiFileText,
  FiEdit2,
  FiCopy
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../config/supabase";
import { Toast } from "./ui/Toast";
import { ConfirmModal } from "./ui/ConfirmModal";

export const ClassDashboard = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [activeTab, setActiveTab] = useState("quizzes");
  const [classData, setClassData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    studentId: null,
    studentName: "",
  });

  const showToast = (message, type = "info") => setToast({ message, type });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Class Info
      const { data: cData, error: cError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();
      if (cError) throw cError;
      setClassData(cData);

      // 2. Fetch Quizzes for this class
      const { data: qData, error: qError } = await supabase
        .from("quizzes")
        .select(`
          *,
          quiz_attempts (count),
          questions (count)
        `)
        .eq("class_id", classId)
        .order("created_at", { ascending: false });
      if (qError) throw qError;
      setQuizzes(qData || []);

      // 3. Fetch Roster
      const { data: rData, error: rError } = await supabase
        .from("class_enrollments")
        .select(`
          joined_at,
          student_id,
          user_profiles!class_enrollments_student_id_fkey (
            full_name
          )
        `)
        .eq("class_id", classId)
        .order("joined_at", { ascending: false });
      
      if (rError) {
        console.error("Roster error", rError);
      } else {
        setRoster(rData || []);
      }

    } catch (error) {
      console.error(error);
      showToast("Failed to load class dashboard.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.id && classId) fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.id, classId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classData.class_code);
    showToast("Invite code copied!", "success");
  };

  const handleRemoveStudent = async () => {
    try {
      const { error } = await supabase
        .from("class_enrollments")
        .delete()
        .eq("class_id", classId)
        .eq("student_id", confirmDelete.studentId);

      if (error) throw error;
      setRoster(roster.filter((s) => s.student_id !== confirmDelete.studentId));
      showToast(`${confirmDelete.studentName} removed from class.`, "success");
    } catch (error) {
      showToast("Failed to remove student.", "error");
    } finally {
      setConfirmDelete({ isOpen: false, studentId: null, studentName: "" });
    }
  };

  if (isLoading) {
    return (
      <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] flex items-center justify-center">
        <div className="text-[#00838F] font-black uppercase tracking-widest animate-pulse">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-black text-[#003B46] mb-4">Class Not Found</h2>
        <Link to="/dashboard/classes" className="text-[#00838F] font-bold uppercase tracking-widest">
          Return to Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] text-[#003B46] flex flex-col font-sans max-w-7xl mx-auto relative selection:bg-[#26C6DA] selection:text-[#003B46]">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Remove Student"
        message={`Are you sure you want to remove ${confirmDelete.studentName} from this class?`}
        onConfirm={handleRemoveStudent}
        onCancel={() => setConfirmDelete({ isOpen: false, studentId: null, studentName: "" })}
      />

      {/* Header */}
      <div className="mb-8 mt-4 animate-fade-in-up">
        <Link
          to="/dashboard/classes"
          className="inline-flex items-center gap-2 text-[#006064]/60 hover:text-[#00838F] font-bold text-xs uppercase tracking-widest transition-colors mb-6"
        >
          <FiArrowLeft className="text-lg" /> Back to Classes
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#E0F7FA] text-[#00838F] font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#00838F]/10 flex items-center gap-2">
                Class Code: <span className="font-mono">{classData.class_code}</span>
                <button onClick={handleCopyCode} className="hover:text-[#006064] transition-colors"><FiCopy /></button>
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-[#003B46] tracking-tight">
              {classData.name}
            </h1>
          </div>
          
          <button
            onClick={() => navigate(`/dashboard/manage?classId=${classId}`)}
            className="inline-flex items-center justify-center gap-2 bg-[#00838F] hover:bg-[#006064] text-white rounded-xl px-6 py-3 text-sm font-black tracking-widest uppercase transition-all shadow-md shrink-0"
          >
            <FiPlusSquare className="text-lg" /> Create Quiz Here
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#006064]/10 mb-8 animate-fade-in-up">
        <button
          onClick={() => setActiveTab("quizzes")}
          className={`pb-4 px-2 font-bold text-sm tracking-widest uppercase transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "quizzes"
              ? "text-[#00838F] border-[#00838F]"
              : "text-[#006064]/50 border-transparent hover:text-[#003B46]"
          }`}
        >
          <FiBook className="text-lg" /> Class Quizzes
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`pb-4 px-2 font-bold text-sm tracking-widest uppercase transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "students"
              ? "text-[#00838F] border-[#00838F]"
              : "text-[#006064]/50 border-transparent hover:text-[#003B46]"
          }`}
        >
          <FiUsers className="text-lg" /> Roster ({roster.length})
        </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in-up animation-delay-100">
        {activeTab === "quizzes" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-[#006064]/10 shadow-sm">
                <div className="bg-[#E0F7FA]/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiTarget className="text-2xl text-[#00838F]" />
                </div>
                <h3 className="text-xl font-black text-[#003B46] mb-2">No Quizzes Yet</h3>
                <p className="text-[#006064]/70 font-medium mb-6">You haven't deployed any quizzes to this class.</p>
                <button
                  onClick={() => navigate(`/dashboard/manage?classId=${classId}`)}
                  className="bg-[#00838F] hover:bg-[#006064] text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-colors shadow-md inline-flex items-center gap-2"
                >
                  <FiPlusSquare /> Create One Now
                </button>
              </div>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white rounded-2xl p-6 border border-[#006064]/10 shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#E0F7FA]/30 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform"></div>
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${quiz.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {quiz.is_active ? "Active" : "Closed"}
                    </span>
                    <button
                      onClick={() => navigate(`/dashboard/edit-quiz/${quiz.id}`)}
                      className="text-[#00838F]/50 hover:text-[#00838F] p-2 bg-[#F8FDFD] rounded-lg transition-colors border border-transparent hover:border-[#00838F]/20"
                      title="Edit Quiz"
                    >
                      <FiEdit2 />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-black text-[#003B46] mb-1 line-clamp-1 relative z-10">{quiz.title}</h3>
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <span className="text-[10px] font-black text-[#00838F] uppercase tracking-widest bg-[#E0F7FA]/50 px-2 py-0.5 rounded">
                      Code: {quiz.quiz_code}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(quiz.quiz_code);
                        showToast("Quiz code copied!", "success");
                      }}
                      className="text-[#00838F]/50 hover:text-[#00838F] transition-colors"
                      title="Copy Quiz Code"
                    >
                      <FiCopy className="text-sm" />
                    </button>
                  </div>
                  
                  <p className="text-xs font-bold text-[#00838F] mb-6 flex items-center gap-1.5 uppercase tracking-widest relative z-10">
                    <FiClock /> {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : "No Deadline"}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-auto border-t border-[#006064]/5 pt-4 relative z-10">
                    <div>
                      <p className="text-[10px] font-bold text-[#006064]/50 uppercase tracking-widest mb-1">Questions</p>
                      <p className="font-black text-[#003B46] flex items-center gap-1.5"><FiFileText className="text-[#00838F]" /> {quiz.questions?.[0]?.count || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#006064]/50 uppercase tracking-widest mb-1">Attempts</p>
                      <p className="font-black text-[#003B46] flex items-center gap-1.5"><FiActivity className="text-[#00838F]" /> {quiz.quiz_attempts?.[0]?.count || 0}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "students" && (
          <div className="bg-white border border-[#006064]/10 rounded-2xl shadow-sm overflow-hidden flex-1">
            <div className="px-6 py-5 border-b border-[#006064]/10 flex items-center justify-between bg-[#F8FDFD]">
              <h2 className="text-lg font-black text-[#003B46] tracking-wide flex items-center gap-2">
                <FiUsers className="text-[#00838F]" /> Enrolled Students
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-[#006064]">
                <thead className="text-xs text-[#00838F] bg-white uppercase tracking-widest border-b border-[#006064]/10">
                  <tr>
                    <th className="px-6 py-5 font-black">Student Name</th>
                    <th className="px-6 py-5 font-black">Joined Date</th>
                    <th className="px-6 py-5 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center text-[#006064]/50 font-medium">
                        No students have joined this class yet.
                      </td>
                    </tr>
                  ) : (
                    roster.map((s) => (
                      <tr key={s.student_id} className="border-b border-[#006064]/5 hover:bg-[#F8FDFD] transition-colors last:border-0">
                        <td className="px-6 py-5 font-bold text-[#003B46]">
                          <Link 
                            to={`/dashboard/classes/${classId}/student/${s.student_id}`}
                            className="hover:text-[#00838F] hover:underline transition-colors flex items-center gap-2"
                          >
                            {s.user_profiles?.full_name || "Unknown Student"}
                          </Link>
                        </td>
                        <td className="px-6 py-5 font-medium">
                          {new Date(s.joined_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              to={`/dashboard/classes/${classId}/student/${s.student_id}`}
                              className="text-[#00838F] hover:text-[#006064] hover:bg-[#E0F7FA]/50 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                            >
                              <FiActivity className="text-lg" /> Analytics
                            </Link>
                            <button
                              onClick={() =>
                                setConfirmDelete({
                                  isOpen: true,
                                  studentId: s.student_id,
                                  studentName: s.user_profiles?.full_name || "Unknown Student",
                                })
                              }
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                            >
                              <FiUserMinus className="text-lg" /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
