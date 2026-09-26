import { Outlet } from "react-router-dom";

export const PublicLayout = () => {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
};
