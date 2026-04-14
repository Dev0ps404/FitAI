import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "../common/PageLoader";
import { getDashboardPathForRole, normalizeRole } from "../../utils/roleRoutes";

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { authUser, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <PageLoader label="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const currentRole = normalizeRole(authUser?.role);
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      normalizeRole(role),
    );

    if (!normalizedAllowedRoles.includes(currentRole)) {
      return <Navigate to={getDashboardPathForRole(currentRole)} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
