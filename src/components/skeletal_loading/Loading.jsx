export const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050A12]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#64FFDA] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#E0F7FA]/60 text-sm">Loading...</p>
      </div>
    </div>
  );
};
