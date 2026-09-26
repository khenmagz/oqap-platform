import React from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-[#003B46]/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border border-[#006064]/10">
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors"
        >
          <FiX className="text-2xl" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="bg-red-50 p-4 rounded-full mb-6 border border-red-100">
            <FiAlertTriangle className="text-3xl text-red-600" />
          </div>
          <h3 className="text-2xl font-black text-[#003B46] mb-3 tracking-tight">
            {title}
          </h3>
          <p className="text-sm font-medium text-[#006064]/70 mb-10 leading-relaxed">
            {message}
          </p>

          <div className="flex w-full gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold tracking-widest uppercase text-[#006064] bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 rounded-xl text-sm font-black tracking-widest uppercase text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
