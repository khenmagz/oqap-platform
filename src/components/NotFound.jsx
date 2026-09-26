import { Link } from "react-router-dom";
import { FiAnchor, FiHome } from "react-icons/fi";

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050A12] px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <FiAnchor className="text-6xl text-[#64FFDA]/30" />
        </div>
        <h1 className="text-7xl font-black text-[#FFF4E6] tracking-tight">
          404
        </h1>
        <p className="text-xl text-[#E0F7FA]/60 mt-2">Page not found</p>
        <p className="text-[#E0F7FA]/40 text-sm mt-1">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-[#006064] text-white hover:bg-[#00838F] transition-all duration-300 font-medium"
        >
          <FiHome /> Back to Home
        </Link>
      </div>
    </div>
  );
};
