import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboardPathForRole, normalizeRole } from "../../utils/roleRoutes";
import PageLoader from "../common/PageLoader";

function AuthRedirectRoute({ children }) {
  const { authUser, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <PageLoader label="Loading authentication..." />;
  }

  if (isAuthenticated) {
    const redirectPath = getDashboardPathForRole(normalizeRole(authUser?.role));
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default AuthRedirectRoute;
