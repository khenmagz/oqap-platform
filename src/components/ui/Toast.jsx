import React, { useEffect } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

export const Toast = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto-hides after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const isError = type === "error";
  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-8 right-8 z-[200] animate-fade-in-up">
      <div
        className={`flex items-center gap-4 px-5 py-4 rounded-2xl shadow-xl border ${
          isError
            ? "bg-white border-red-100"
            : isSuccess
              ? "bg-white border-emerald-100"
              : "bg-white border-[#006064]/10"
        }`}
      >
        {/* Modern SaaS Icon Container */}
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            isError
              ? "bg-red-50 text-red-600"
              : isSuccess
                ? "bg-emerald-50 text-emerald-600"
                : "bg-[#E0F7FA]/50 text-[#00838F]"
          }`}
        >
          {isError ? (
            <FiAlertCircle className="text-xl" />
          ) : isSuccess ? (
            <FiCheckCircle className="text-xl" />
          ) : (
            <FiInfo className="text-xl" />
          )}
        </div>

        <p className="font-bold text-sm text-[#003B46] tracking-wide max-w-sm">
          {message}
        </p>

        <button
          onClick={onClose}
          className="ml-2 p-2 rounded-xl transition-colors text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0"
        >
          <FiX className="text-lg" />
        </button>
      </div>
    </div>
  );
};
