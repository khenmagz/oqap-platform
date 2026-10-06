import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUserPlus,
  FiCopy,
  FiX,
  FiUsers,
  FiChevronRight,
  FiTrash2,
  FiBook
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../config/supabase";
import { Toast } from "./ui/Toast";
import { ConfirmModal } from "./ui/ConfirmModal";

export const InstructorClasses = () => {
  const { userData } = useAuth();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });

  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    classId: null,
  });

  const showToast = (message, type = "info") => setToast({ message, type });

  const fetchMyClasses = async () => {
    setIsLoading(true);
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
      showToast("Failed to load classes.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.id) {
      fetchMyClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.id]);

  const handleCreateClass = async () => {
    if (!newClassName.trim())
      return showToast("Class name cannot be empty", "error");

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { error } = await supabase
        .from("classes")
        .insert([
          {
            name: newClassName,
            instructor_id: userData.id,
            class_code: code,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setIsCreateClassModalOpen(false);
      setNewClassName("");
      showToast(`Class created! Code: ${code}`, "success");

      fetchMyClasses();
    } catch (error) {
      showToast("Failed to create class", "error");
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast(`Code ${code} copied to clipboard!`, "success");
  };



  const executeDeleteClass = async () => {
    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", confirmDelete.classId);

      if (error) throw error;

      setClasses(classes.filter((c) => c.id !== confirmDelete.classId));
      showToast("Class permanently deleted.", "success");
    } catch (error) {
      showToast("Failed to delete class.", "error");
    } finally {
      setConfirmDelete({ isOpen: false, classId: null });
    }
  };

  return (
    <div className="pt-20 md:pt-10 px-6 lg:px-10 pb-24 min-h-screen bg-[#F8FDFD] text-[#003B46] flex flex-col font-sans max-w-7xl mx-auto relative selection:bg-[#26C6DA] selection:text-[#003B46]">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Delete Class"
        message="This will permanently delete the class and all enrollments. Associated quizzes will also be deleted. This cannot be undone."
        onConfirm={executeDeleteClass}
        onCancel={() => setConfirmDelete({ isOpen: false, classId: null })}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#003B46] tracking-tight">
            Class Management
          </h1>
          <p className="mt-2 text-sm md:text-base font-medium text-[#006064]/70">
            Organize your students and generate invite codes.
          </p>
        </div>
        <button
          onClick={() => setIsCreateClassModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#00838F] hover:bg-[#006064] text-white rounded-xl px-6 py-2.5 text-sm font-black tracking-widest uppercase transition-all shadow-md shrink-0"
        >
          <FiUserPlus className="text-lg" /> Create Class
        </button>
      </div>

      {/* CLASSES TABLE */}
      <div className="bg-white border border-[#006064]/10 rounded-2xl shadow-sm overflow-hidden flex-1">
        <div className="px-6 py-5 border-b border-[#006064]/10 flex items-center justify-between bg-[#F8FDFD]">
          <h2 className="text-lg font-black text-[#003B46] tracking-wide flex items-center gap-2">
            <FiBook className="text-[#00838F]" /> Active Classes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-[#006064]">
            <thead className="text-xs text-[#00838F] bg-white uppercase tracking-widest border-b border-[#006064]/10">
              <tr>
                <th className="px-6 py-5 font-black">Class Name</th>
                <th className="px-6 py-5 font-black">Invite Code</th>
                <th className="px-6 py-5 font-black">Students Enrolled</th>
                <th className="px-6 py-5 font-black">Created</th>
                <th className="px-6 py-5 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-[#006064]/40 font-bold animate-pulse"
                  >
                    Loading classes...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-16 text-center text-[#006064]/50 font-medium"
                  >
                    You haven't created any classes yet.
                  </td>
                </tr>
              ) : (
                classes.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#006064]/5 hover:bg-[#F8FDFD] transition-colors last:border-0 group"
                  >
                    <td className="px-6 py-5 font-bold text-[#003B46]">
                      {c.name}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => handleCopyCode(c.class_code)}
                        className="font-mono text-[#00838F] hover:text-[#006064] bg-[#E0F7FA]/50 px-3 py-1.5 rounded-lg transition-colors font-bold tracking-wider flex items-center gap-2"
                        title="Copy code"
                      >
                        {c.class_code} <FiCopy />
                      </button>
                    </td>
                    <td className="px-6 py-5 font-medium flex items-center gap-2">
                      <FiUsers className="text-[#00838F]/50" />
                      {c.class_enrollments?.[0]?.count || 0} Students
                    </td>
                    <td className="px-6 py-5 font-medium">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                      <Link
                        to={`/dashboard/classes/${c.id}`}
                        className="text-[#00838F] hover:bg-[#E0F7FA]/50 hover:text-[#006064] px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-1 transition-colors"
                      >
                        Dashboard <FiChevronRight className="text-lg" />
                      </Link>
                      <button
                        onClick={() =>
                          setConfirmDelete({ isOpen: true, classId: c.id })
                        }
                        className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Class"
                      >
                        <FiTrash2 className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



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
