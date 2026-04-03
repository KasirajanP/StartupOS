import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-medium text-slate-600 shadow-panel">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
