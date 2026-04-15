import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "../common/PageLoader";

function AuthRedirectRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <PageLoader label="Loading authentication..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AuthRedirectRoute;
