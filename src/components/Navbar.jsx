import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  FiMenu,
  FiX,
  FiLogOut,
  FiAnchor,
  FiHome,
  FiFileText,
  FiPlusSquare,
  FiBarChart2,
  FiZap,
  FiBox,
} from "react-icons/fi";

export const Navbar = () => {
  const { userData, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const studentLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <FiHome /> },
    { name: "Quiz History", path: "/dashboard/logbook", icon: <FiFileText /> },
    { name: "Practice Arena", path: "/dashboard/practice", icon: <FiZap /> },
  ];

  const instructorLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <FiHome /> },
    { name: "Create Quiz", path: "/dashboard/manage", icon: <FiPlusSquare /> },
    {
      name: "Class Analytics",
      path: "/dashboard/analytics",
      icon: <FiBarChart2 />,
    },
  ];

  const navLinks =
    userData?.role === "instructor" ? instructorLinks : studentLinks;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#006064]/10 flex items-center justify-between px-6 z-40">
        <Link to="/" className="flex items-center gap-2">
          <FiAnchor className="text-[#00838F] text-xl" />
          <span className="font-black tracking-widest text-[#003B46] text-xl">
            DEPTH
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#006064] text-2xl"
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-[#003B46]/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-[#006064]/10 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col`}
      >
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 mb-10 group">
            <div className="bg-[#E0F7FA] p-2 rounded-lg group-hover:bg-[#26C6DA]/20 transition-colors">
              <FiAnchor className="text-[#00838F] text-xl group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <span className="text-2xl font-black tracking-widest text-[#003B46]">
              DEPTH
            </span>
          </Link>

          <p className="text-xs font-bold text-[#006064]/40 uppercase tracking-widest mb-4 px-3">
            Workspaces
          </p>

          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-[#E0F7FA]/50 text-[#00838F] border-l-4 border-[#00838F]"
                      : "text-[#006064]/60 hover:bg-[#F8FDFD] hover:text-[#003B46] border-l-4 border-transparent"
                  }`}
                >
                  <span
                    className={`text-lg ${isActive ? "text-[#00838F]" : "text-[#006064]/40"}`}
                  >
                    {link.icon}
                  </span>
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-[#006064]/5">
          <div className="mb-4 px-3">
            <p className="text-[10px] font-black text-[#00838F] uppercase tracking-widest mb-1">
              {userData?.role === "instructor" ? "Instructor" : "Student"}
            </p>
            <p className="text-sm font-bold text-[#003B46] truncate">
              {userData?.full_name || "User"}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-bold text-[#006064]/60 hover:bg-[#F8FDFD] hover:text-[#003B46] transition-colors"
          >
            <FiLogOut className="text-lg text-[#006064]/40" /> Sign Out
          </button>
        </div>
      </nav>
    </>
  );
};
